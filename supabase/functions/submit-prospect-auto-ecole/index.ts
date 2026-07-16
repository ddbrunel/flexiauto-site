import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// service_role contourne RLS — même contrainte que submit-partner-application :
// ce projet bloque les écritures du rôle anon quelle que soit la policy.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const REQUIRED_FIELDS = ["nom_ecole", "ville", "gerant_prenom", "gerant_nom", "email", "telephone"];
const NOTIFICATION_EMAIL = "flexiauto.contact@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendNotificationEmail(body: Record<string, unknown>) {
  const row = (label: string, value: unknown) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#64748B;">${label}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(String(value))}</td></tr>`;

  const html = `
    <div style="font-family:sans-serif;color:#0F172A;max-width:520px;">
      <h2 style="color:#16A34A;">Nouveau prospect auto-école</h2>
      <table cellpadding="0" cellspacing="0">
        ${row("Auto-école", body.nom_ecole)}
        ${row("Ville", body.ville)}
        ${row("Gérant", `${body.gerant_prenom} ${body.gerant_nom}`)}
        ${row("Email", body.email)}
        ${row("Téléphone", body.telephone)}
      </table>
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
      to: [NOTIFICATION_EMAIL],
      subject: `Nouveau prospect auto-école — ${body.nom_ecole}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Échec envoi email Resend:", await res.text());
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    for (const field of REQUIRED_FIELDS) {
      if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
        return new Response(JSON.stringify({ error: `Champ requis manquant : ${field}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data, error } = await supabase
      .from("prospects_auto_ecole")
      .insert({
        nom_ecole: body.nom_ecole,
        ville: body.ville,
        gerant_prenom: body.gerant_prenom,
        gerant_nom: body.gerant_nom,
        email: body.email,
        telephone: body.telephone,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: "Erreur lors de l'enregistrement de la demande" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      await sendNotificationEmail(body);
    } catch (emailErr) {
      console.error("Erreur envoi email de notification:", emailErr);
    }

    return new Response(JSON.stringify({ id: data.id }), {
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
