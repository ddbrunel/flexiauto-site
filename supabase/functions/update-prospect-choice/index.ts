import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// service_role : même contrainte que les autres fonctions d'écriture de ce
// projet (anon bloqué en écriture quelle que soit la policy RLS).
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ALLOWED_CHOICES = ["paiement", "decouverte"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id, choix } = await req.json();

    if (!id || !ALLOWED_CHOICES.includes(choix)) {
      return new Response(JSON.stringify({ error: "Paramètres invalides" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("prospects_auto_ecole")
      .update({ choix })
      .eq("id", id);

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Requête invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
