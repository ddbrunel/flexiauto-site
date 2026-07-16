import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const ALLOWED_DUREES = ["trimestre", "semestre", "annuel"];
const PROD_URL = "https://flexiauto-site.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function resolveSiteUrl(origin: unknown): string {
  if (
    typeof origin === "string" &&
    (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1"))
  ) {
    return origin;
  }
  return PROD_URL;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id, duree_engagement, origin } = await req.json();

    if (!application_id || !ALLOWED_DUREES.includes(duree_engagement)) {
      return new Response(JSON.stringify({ error: "Paramètres invalides" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = resolveSiteUrl(origin);

    // Le prix est résolu dynamiquement via son lookup_key (trimestre/semestre/annuel)
    // configuré dans le Dashboard Stripe — aucun price_id à coder en dur ici.
    const prices = await stripe.prices.list({ lookup_keys: [duree_engagement], limit: 1 });
    const price = prices.data[0];

    if (!price) {
      return new Response(JSON.stringify({ error: "Prix introuvable pour cette durée d'engagement" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${siteUrl}/confirmation.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/inscription-partenaire.html?duree=${duree_engagement}`,
      metadata: { application_id, duree_engagement },
      subscription_data: {
        metadata: { application_id, duree_engagement },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erreur lors de la création de la session de paiement" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
