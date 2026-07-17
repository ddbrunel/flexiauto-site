import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

// Deno n'a pas l'API crypto Node utilisée par défaut par le SDK Stripe pour
// vérifier la signature — on passe par le SubtleCrypto provider fourni par
// Stripe pour cet environnement (constructEventAsync au lieu de constructEvent).
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ENGAGEMENT_MONTHS: Record<string, number> = {
  trimestre: 4,
  semestre: 6,
  annuel: 12,
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") || "https://flexiauto-site.vercel.app";

// Crée le compte auto_ecole du partenaire dès le paiement confirmé (email
// d'invitation envoyé par Supabase Auth — le gérant définit son mot de passe
// sur definir-mot-de-passe.html), puis déclenche le rattachement automatique
// à sa fiche schools via SIRET/Sirene.
async function provisionAutoEcoleAccount(
  applicationId: string,
  application: { email: string; gerant_nom: string | null; gerant_prenom: string | null },
) {
  const metadata = {
    role: "auto_ecole",
    partner_application_id: applicationId,
    prenom: application.gerant_prenom,
    nom: application.gerant_nom,
  };

  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    application.email,
    { data: metadata, redirectTo: `${SITE_URL}/definir-mot-de-passe.html` },
  );

  let userId = invited?.user?.id;

  if (inviteError) {
    // Compte déjà existant (webhook rejoué par Stripe, ou gérant déjà
    // invité) : pas une erreur en soi — on retrouve son id pour quand même
    // déclencher/rejouer le rattachement plutôt que d'abandonner.
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", application.email)
      .maybeSingle();
    userId = existing?.id;

    if (!userId) {
      console.error("Échec invitation compte auto-école:", inviteError);
      return;
    }
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/rattache-auto-ecole`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    console.error("Échec rattache-auto-ecole:", await res.text());
  }
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature) {
    return new Response("Signature Stripe manquante", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error("Signature invalide:", err);
    return new Response("Signature invalide", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const applicationId = session.metadata?.application_id;
    const dureeEngagement = session.metadata?.duree_engagement ?? "";

    if (applicationId) {
      const partnerSince = new Date();
      const months = ENGAGEMENT_MONTHS[dureeEngagement] ?? 0;
      const engagementEnd = new Date(partnerSince);
      engagementEnd.setMonth(engagementEnd.getMonth() + months);

      const { data: application, error } = await supabase
        .from("partner_applications")
        .update({
          statut: "converti",
          subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          partner_since: partnerSince.toISOString(),
          engagement_end_date: engagementEnd.toISOString(),
          subscription_status: "active",
        })
        .eq("id", applicationId)
        .select("email, gerant_nom, gerant_prenom")
        .single();

      if (error || !application) {
        console.error("Erreur mise à jour partner_applications:", error);
        // On répond quand même 200 : Stripe réessaie sur non-2xx, et l'erreur
        // est déjà loggée pour investigation manuelle côté Supabase.
      } else {
        await provisionAutoEcoleAccount(applicationId, application);
      }
    } else {
      console.error("checkout.session.completed reçu sans application_id en metadata");
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
