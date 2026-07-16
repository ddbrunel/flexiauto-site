// Déclenchée par un Database Webhook Supabase sur INSERT dans public.profiles.
// Payload standard envoyé par Supabase : { type, table, schema, record, old_record }.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Vérifie que l'appel vient bien du Database Webhook configuré (secret
  // partagé passé en en-tête custom depuis le dashboard Supabase) — évite
  // que n'importe qui puisse déclencher l'envoi d'emails vers une adresse
  // arbitraire en appelant cette fonction publique directement.
  const providedSecret = req.headers.get("x-webhook-secret");
  const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const record = payload.record;

    if (payload.type !== "INSERT" || !record || record.role !== "eleve") {
      // Pas une inscription élève : rien à envoyer, mais ce n'est pas une erreur.
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prenom = record.prenom || "";
    const email = record.email;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email manquant sur le profil" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family:sans-serif;color:#0F172A;max-width:480px;">
        <h2 style="color:#1976d2;">Bienvenue sur FlexiAuto${prenom ? " " + prenom : ""} !</h2>
        <p style="line-height:1.6;">Tu peux maintenant choisir ton auto-école et t'entraîner au code.</p>
        <p style="line-height:1.6;color:#5f7588;">À très vite sur la route du permis 🚗</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FlexiAuto <onboarding@resend.dev>",
        to: [email],
        subject: `Bienvenue sur FlexiAuto${prenom ? " " + prenom : ""} !`,
        html,
      }),
    });

    if (!res.ok) {
      console.error("Échec envoi email Resend:", await res.text());
      return new Response(JSON.stringify({ error: "Échec de l'envoi de l'email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
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
