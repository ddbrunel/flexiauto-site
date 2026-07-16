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

      const { error } = await supabase
        .from("partner_applications")
        .update({
          statut: "converti",
          subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          partner_since: partnerSince.toISOString(),
          engagement_end_date: engagementEnd.toISOString(),
          subscription_status: "active",
        })
        .eq("id", applicationId);

      if (error) {
        console.error("Erreur mise à jour partner_applications:", error);
        // On répond quand même 200 : Stripe réessaie sur non-2xx, et l'erreur
        // est déjà loggée pour investigation manuelle côté Supabase.
      }
    } else {
      console.error("checkout.session.completed reçu sans application_id en metadata");
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
