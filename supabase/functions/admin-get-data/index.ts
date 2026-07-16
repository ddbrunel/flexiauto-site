import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, forbidden, jsonResponse, requireAdmin } from "../_shared/adminAuth.ts";

// service_role : seule façon de lire partner_applications / prospects_auto_ecole,
// dont RLS bloque toute lecture hors service_role (aucune policy SELECT).
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const PRICE_BY_DUREE: Record<string, number> = {
  trimestre: 49.99,
  semestre: 46.99,
  annuel: 44.99,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = await requireAdmin(req, supabaseAdmin);
  if (!admin) return forbidden();

  try {
    const { resource } = await req.json();

    if (resource === "metrics") {
      const { data: convertiRows, error: convertiError } = await supabaseAdmin
        .from("partner_applications")
        .select("duree_engagement")
        .eq("statut", "converti");
      if (convertiError) throw convertiError;

      const partenaires_actifs = convertiRows.length;
      const mrr = convertiRows.reduce(
        (sum, row) => sum + (PRICE_BY_DUREE[row.duree_engagement as string] || 0),
        0,
      );

      const { count: candidatures_attente, error: attenteError } = await supabaseAdmin
        .from("partner_applications")
        .select("id", { count: "exact", head: true })
        .eq("statut", "nouveau");
      if (attenteError) throw attenteError;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: nouveaux_prospects_mois, error: prospectsError } = await supabaseAdmin
        .from("prospects_auto_ecole")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfMonth);
      if (prospectsError) throw prospectsError;

      const { count: eleves_inscrits, error: elevesError } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "eleve");
      if (elevesError) throw elevesError;

      return jsonResponse({
        partenaires_actifs,
        mrr: Math.round(mrr * 100) / 100,
        nouveaux_prospects_mois: nouveaux_prospects_mois || 0,
        candidatures_attente: candidatures_attente || 0,
        eleves_inscrits: eleves_inscrits || 0,
      });
    }

    if (resource === "partner_applications") {
      const { data, error } = await supabaseAdmin
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse(data);
    }

    if (resource === "prospects_auto_ecole") {
      const { data, error } = await supabaseAdmin
        .from("prospects_auto_ecole")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse(data);
    }

    return jsonResponse({ error: "Ressource inconnue" }, 400);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Erreur serveur" }, 500);
  }
});
