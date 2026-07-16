import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function forbidden(message = "Non autorisé") {
  return jsonResponse({ error: message }, 403);
}

// Vérifie que la requête porte un JWT Supabase valide (session utilisateur
// réelle, pas la clé anon) ET que le profil correspondant a role='admin'.
// Le gateway Supabase (verify_jwt activé par défaut sur ces fonctions) rejette
// déjà les requêtes sans JWT bien formé avant même d'arriver ici ; cette
// vérification supplémentaire s'assure que l'utilisateur authentifié est
// bien un admin, pas n'importe quel utilisateur connecté.
export async function requireAdmin(req: Request, supabaseAdmin: SupabaseClient) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) return null;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") return null;

  return userData.user;
}
