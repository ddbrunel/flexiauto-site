import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, forbidden, jsonResponse, requireAdmin } from "../_shared/adminAuth.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Liste blanche stricte : jamais interpoler un nom de table venant du
// client sans le valider contre cette liste, et les statuts autorisés
// diffèrent réellement d'une table à l'autre.
const ALLOWED_STATUTS: Record<string, string[]> = {
  partner_applications: ["nouveau", "contacté", "converti", "refusé"],
  prospects_auto_ecole: ["nouveau", "contacté", "converti", "perdu"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = await requireAdmin(req, supabaseAdmin);
  if (!admin) return forbidden();

  try {
    const { table, id, statut } = await req.json();

    const allowedStatuts = ALLOWED_STATUTS[table];
    if (!allowedStatuts || !id || !allowedStatuts.includes(statut)) {
      return jsonResponse({ error: "Paramètres invalides" }, 400);
    }

    const { error } = await supabaseAdmin.from(table).update({ statut }).eq("id", id);
    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Erreur serveur" }, 500);
  }
});
