-- Table des candidatures partenaires (formulaire inscription-partenaire.html)
create table public.partner_applications (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  nom_ecole         text not null,
  siret             text not null,
  adresse           text not null,
  ville             text not null,
  code_postal       text not null,
  gerant_nom        text not null,
  gerant_prenom     text not null,
  email             text not null,
  telephone         text not null,
  agrement          text,
  site_actuel       text,
  nb_eleves_an      text,
  duree_engagement  text not null,
  statut            text not null default 'nouveau',
  constraint duree_engagement_valide check (duree_engagement in ('trimestre', 'semestre', 'annuel')),
  constraint statut_valide check (statut in ('nouveau', 'contacté', 'converti', 'refusé'))
);

-- Row Level Security
alter table public.partner_applications enable row level security;

-- Le formulaire public (clé anon) peut uniquement INSÉRER une candidature.
create policy "Le public peut soumettre une candidature"
  on public.partner_applications
  for insert
  to anon
  with check (true);

-- Aucune policy SELECT/UPDATE/DELETE pour anon/authenticated : par défaut RLS
-- bloque tout accès en lecture/écriture hors INSERT. Seul service_role
-- (utilisé côté back-office / Edge Functions) contourne RLS et peut lire,
-- mettre à jour le statut, ou supprimer des lignes.
