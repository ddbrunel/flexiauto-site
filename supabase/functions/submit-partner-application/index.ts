import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// service_role contourne RLS — nécessaire car ce projet bloque actuellement
// les écritures du rôle anon quelle que soit la policy définie (constaté en
// diagnostic direct). Ce sont des variables injectées automatiquement par
// Supabase pour toute Edge Function, pas des secrets à configurer.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const REQUIRED_FIELDS = [
  "nom_ecole", "siret", "adresse", "ville", "code_postal",
  "gerant_nom", "gerant_prenom", "email", "telephone",
];
const ALLOWED_DUREES = ["trimestre", "semestre", "annuel"];
const NOTIFICATION_EMAIL = "flexiauto.contact@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendNotificationEmail(body: Record<string, unknown>) {
  const row = (label: string, value: unknown) =>
    value ? `<tr><td style="padding:4px 12px 4px 0;color:#64748B;">${label}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(String(value))}</td></tr>` : "";

  const html = `
    <div style="font-family:sans-serif;color:#0F172A;max-width:520px;">
      <h2 style="color:#1B4FD8;">Nouvelle candidature partenaire</h2>
      <table cellpadding="0" cellspacing="0">
        ${row("Auto-école", body.nom_ecole)}
        ${row("SIRET", body.siret)}
        ${row("Adresse", body.adresse)}
        ${row("Ville", body.ville)}
        ${row("Code postal", body.code_postal)}
        ${row("Gérant", `${body.gerant_prenom} ${body.gerant_nom}`)}
        ${row("Email", body.email)}
        ${row("Téléphone", body.telephone)}
        ${row("Durée d'engagement", body.duree_engagement)}
        ${row("Agrément préfectoral", body.agrement)}
        ${row("Site actuel", body.site_actuel)}
        ${row("Nb élèves / an", body.nb_eleves_an)}
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
      subject: `Nouvelle candidature partenaire — ${body.nom_ecole}`,
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

    if (!ALLOWED_DUREES.includes(body.duree_engagement)) {
      return new Response(JSON.stringify({ error: "Durée d'engagement invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("partner_applications")
      .insert({
        nom_ecole: body.nom_ecole,
        siret: body.siret,
        adresse: body.adresse,
        ville: body.ville,
        code_postal: body.code_postal,
        gerant_nom: body.gerant_nom,
        gerant_prenom: body.gerant_prenom,
        email: body.email,
        telephone: body.telephone,
        agrement: body.agrement ?? null,
        site_actuel: body.site_actuel ?? null,
        nb_eleves_an: body.nb_eleves_an ?? null,
        duree_engagement: body.duree_engagement,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: "Erreur lors de l'enregistrement de la candidature" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // La candidature est déjà enregistrée à ce stade : un échec d'envoi d'email
    // ne doit pas faire échouer la réponse au formulaire, juste être loggé.
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
