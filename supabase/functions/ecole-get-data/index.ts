import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/adminAuth.ts";
import { requireAutoEcole } from "../_shared/ecoleAuth.ts";

// service_role : lit profiles/schools/formules/partner_applications sans
// contrainte RLS — la portée par école est appliquée ici, pas par RLS.
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAutoEcole(req, supabaseAdmin);
  if (!auth) return jsonResponse({ error: "Non autorisé" }, 403);
  const { ecoleId, partnerApplicationId } = auth;

  try {
    const { resource } = await req.json();

    if (resource === "overview") {
      if (!ecoleId) {
        return jsonResponse({
          prospects_count: 0, eleves_count: 0, revenus_affiliation: 0,
          subscription_status: null, rattachement_manquant: true,
        });
      }

      const { count: prospects_count } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("ecole_id", ecoleId).eq("role", "eleve").eq("statut_eleve", "prospect");

      const { count: eleves_count } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("ecole_id", ecoleId).eq("role", "eleve").eq("statut_eleve", "eleve");

      let subscription_status = null;
      if (partnerApplicationId) {
        const { data: application } = await supabaseAdmin
          .from("partner_applications")
          .select("subscription_status")
          .eq("id", partnerApplicationId)
          .single();
        subscription_status = application?.subscription_status ?? null;
      }

      return jsonResponse({
        prospects_count: prospects_count || 0,
        eleves_count: eleves_count || 0,
        revenus_affiliation: 0, // placeholder tant que le code de la route n'existe pas
        subscription_status,
        rattachement_manquant: false,
      });
    }

    if (resource === "prospects" || resource === "eleves") {
      if (!ecoleId) return jsonResponse([]);
      const statut = resource === "prospects" ? "prospect" : "eleve";
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, prenom, nom, email, telephone, created_at")
        .eq("ecole_id", ecoleId).eq("role", "eleve").eq("statut_eleve", statut)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse(data);
    }

    if (resource === "facture") {
      if (!partnerApplicationId) return jsonResponse(null);
      const { data, error } = await supabaseAdmin
        .from("partner_applications")
        .select("duree_engagement, subscription_status, partner_since, engagement_end_date, statut")
        .eq("id", partnerApplicationId)
        .single();
      if (error) throw error;
      return jsonResponse(data);
    }

    if (resource === "fiche") {
      if (!ecoleId) return jsonResponse(null);
      const { data: fiche, error: ficheError } = await supabaseAdmin
        .from("schools")
        .select("id, name, description, hours, phone, email, website, founded_year, instructors, slots, delay_days")
        .eq("id", ecoleId)
        .single();
      if (ficheError) throw ficheError;

      const { data: formules, error: formulesError } = await supabaseAdmin
        .from("formules")
        .select("id, name, price, hours, description, permit_type, is_popular")
        .eq("school_id", ecoleId);
      if (formulesError) throw formulesError;

      return jsonResponse({ ...fiche, formules: formules || [] });
    }

    return jsonResponse({ error: "Ressource inconnue" }, 400);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Erreur serveur" }, 500);
  }
});
