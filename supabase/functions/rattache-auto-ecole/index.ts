import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, requireServiceOrAdmin } from "../_shared/adminAuth.ts";

// service_role : lit/écrit profiles + partner_applications + schools sans
// contrainte RLS, comme les autres Edge Functions internes de ce projet.
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const INSEE_URL = "https://api.insee.fr/api-sirene/3.11/siret";
const INSEE_HEADER = "X-INSEE-Api-Key-Integration";

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Deux noms se correspondent s'ils sont égaux une fois normalisés, ou si
// l'un contient l'autre (évite les faux positifs sur des chaînes trop
// courtes type sigles de 2-3 lettres).
function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  return a.includes(b) || b.includes(a);
}

async function fetchSireneEtablissement(siret: string) {
  const res = await fetch(`${INSEE_URL}/${siret}`, {
    headers: { [INSEE_HEADER]: Deno.env.get("INSEE_KEY")!, Accept: "application/json" },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const etab = data?.etablissement;
  if (!etab) return null;

  const periode = etab.periodesEtablissement?.[0] || {};
  const uniteLegale = etab.uniteLegale || {};
  const adresse = etab.adresseEtablissement || {};

  const noms = [
    uniteLegale.denominationUniteLegale,
    uniteLegale.sigleUniteLegale,
    periode.enseigne1Etablissement,
    periode.enseigne2Etablissement,
    periode.enseigne3Etablissement,
    periode.denominationUsuelleEtablissement,
  ].filter((n): n is string => Boolean(n));

  return {
    noms,
    codePostal: adresse.codePostalEtablissement as string | undefined,
  };
}

async function findEcoleId(
  siret: string,
): Promise<{ ecoleId: string | null; via: "siret" | "sirene" | "aucun" }> {
  // 1) Correspondance directe par SIRET — le cas le plus fréquent (5915
  //    écoles ont déjà un SIRET matché depuis le batch Sirene).
  const { data: bySiret } = await supabaseAdmin
    .from("schools")
    .select("id")
    .eq("siret", siret)
    .maybeSingle();
  if (bySiret) return { ecoleId: bySiret.id, via: "siret" };

  // 2) Interroge Sirene en direct pour ce SIRET précis, puis cherche une
  //    fiche schools dans la même commune dont le nom correspond à l'une
  //    des dénominations/enseignes officielles.
  const etab = await fetchSireneEtablissement(siret);
  if (!etab || !etab.codePostal || etab.noms.length === 0) {
    return { ecoleId: null, via: "aucun" };
  }

  const { data: candidates } = await supabaseAdmin
    .from("schools")
    .select("id, name")
    .eq("zip", etab.codePostal);

  if (!candidates || candidates.length === 0) return { ecoleId: null, via: "aucun" };

  const normalizedNoms = etab.noms.map(normalize);
  const matches = candidates.filter((c) => {
    const normName = normalize(c.name);
    return normalizedNoms.some((n) => namesMatch(normName, n));
  });

  // Pas de correspondance, ou ambiguë (plusieurs écoles matchent) : on ne
  // devine pas, on laisse au traitement manuel plutôt que de rattacher au
  // mauvais établissement.
  if (matches.length !== 1) return { ecoleId: null, via: "aucun" };

  return { ecoleId: matches[0].id, via: "sirene" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const caller = await requireServiceOrAdmin(req, supabaseAdmin);
  if (!caller) return jsonResponse({ error: "Non autorisé" }, 403);

  try {
    const { user_id } = await req.json();
    if (!user_id) return jsonResponse({ error: "user_id manquant" }, 400);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, partner_application_id")
      .eq("id", user_id)
      .single();
    if (profileError || !profile) return jsonResponse({ error: "Profil introuvable" }, 404);

    if (!profile.partner_application_id) {
      return jsonResponse({ error: "Ce profil n'est lié à aucune candidature partenaire" }, 400);
    }

    const { data: application, error: applicationError } = await supabaseAdmin
      .from("partner_applications")
      .select("siret")
      .eq("id", profile.partner_application_id)
      .single();
    if (applicationError || !application) {
      return jsonResponse({ error: "Candidature partenaire introuvable" }, 404);
    }

    const { ecoleId, via } = await findEcoleId(application.siret);

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        ecole_id: ecoleId,
        statut_rattachement: ecoleId ? "auto" : "a_faire_manuellement",
      })
      .eq("id", user_id);
    if (updateError) throw updateError;

    return jsonResponse({ ecole_id: ecoleId, via, statut_rattachement: ecoleId ? "auto" : "a_faire_manuellement" });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Erreur serveur" }, 500);
  }
});
