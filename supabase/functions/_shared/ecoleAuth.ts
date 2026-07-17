import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface EcoleProfile {
  id: string;
  role: string;
  ecole_id: string | null;
  moniteur_id: string | null;
  partner_application_id: string | null;
}

// Vérifie le JWT et que le profil a role='auto_ecole' ou 'moniteur'. Ne
// renvoie jamais ecole_id depuis un paramètre fourni par le client — c'est
// toujours celui lu depuis le profil (règle du skill flexiauto-stack), avec
// résolution pour un moniteur qui n'a pas son propre ecole_id : on remonte
// alors au profil auto_ecole propriétaire via moniteur_id.
export async function requireAutoEcole(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<{ user: { id: string }; ecoleId: string | null; partnerApplicationId: string | null } | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) return null;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, ecole_id, moniteur_id, partner_application_id")
    .eq("id", userData.user.id)
    .single<EcoleProfile>();

  if (profileError || !profile || (profile.role !== "auto_ecole" && profile.role !== "moniteur")) {
    return null;
  }

  let ecoleId = profile.ecole_id;
  let partnerApplicationId = profile.partner_application_id;

  // Un moniteur n'a ni fiche ni abonnement propres : les deux se résolvent
  // via le profil auto_ecole propriétaire.
  if (profile.role === "moniteur" && profile.moniteur_id && (!ecoleId || !partnerApplicationId)) {
    const { data: owner } = await supabaseAdmin
      .from("profiles")
      .select("ecole_id, partner_application_id")
      .eq("id", profile.moniteur_id)
      .single();
    ecoleId = ecoleId ?? owner?.ecole_id ?? null;
    partnerApplicationId = partnerApplicationId ?? owner?.partner_application_id ?? null;
  }

  return { user: userData.user, ecoleId, partnerApplicationId };
}
