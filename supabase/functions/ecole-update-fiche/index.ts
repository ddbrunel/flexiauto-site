import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/adminAuth.ts";
import { requireAutoEcole } from "../_shared/ecoleAuth.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Liste blanche stricte : seuls les champs "vitrine" affichés sur la carte
// sont modifiables par le gérant — jamais siret/lat/lng/qualite_donnees/
// flexi_score/business_status, qui viennent de sources externes (Sirene,
// Google, l'audit qualité) et ne doivent pas pouvoir être écrasés depuis
// le dashboard.
const EDITABLE_FICHE_FIELDS = [
  "description", "hours", "phone", "email", "website",
  "founded_year", "instructors", "slots", "delay_days",
] as const;

const EDITABLE_FORMULE_FIELDS = ["name", "price", "hours", "description", "permit_type", "is_popular"] as const;

function pickFields<T extends Record<string, unknown>>(source: T, fields: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f in source) out[f] = source[f];
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAutoEcole(req, supabaseAdmin);
  if (!auth) return jsonResponse({ error: "Non autorisé" }, 403);
  if (!auth.ecoleId) {
    return jsonResponse({ error: "Aucune fiche rattachée à ce compte" }, 400);
  }
  const ecoleId = auth.ecoleId;

  try {
    const body = await req.json();
    const fiche = pickFields(body.fiche || {}, EDITABLE_FICHE_FIELDS);

    if (Object.keys(fiche).length > 0) {
      const { error: ficheError } = await supabaseAdmin.from("schools").update(fiche).eq("id", ecoleId);
      if (ficheError) throw ficheError;
    }

    // Remplacement complet des formules : plus simple et plus sûr qu'un
    // diff insert/update/delete pour une poignée de lignes par école, et
    // évite qu'un id de formule forgé pointe vers l'école d'un autre.
    if (Array.isArray(body.formules)) {
      const { error: deleteError } = await supabaseAdmin.from("formules").delete().eq("school_id", ecoleId);
      if (deleteError) throw deleteError;

      const rows = body.formules.map((f: Record<string, unknown>) => ({
        ...pickFields(f, EDITABLE_FORMULE_FIELDS),
        school_id: ecoleId,
      }));

      if (rows.length > 0) {
        const { error: insertError } = await supabaseAdmin.from("formules").insert(rows);
        if (insertError) throw insertError;
      }
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Erreur serveur" }, 500);
  }
});
