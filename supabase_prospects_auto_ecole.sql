-- Table des prospects auto-école (formulaire "S'inscrire" côté auto-école
-- sur connexion.html) — collecte légère, avant toute conversion partenaire.
create table public.prospects_auto_ecole (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  nom_ecole      text not null,
  ville          text not null,
  gerant_prenom  text not null,
  gerant_nom     text not null,
  email          text not null,
  telephone      text not null,
  statut         text not null default 'nouveau',
  choix          text,
  constraint statut_valide check (statut in ('nouveau', 'contacté', 'converti', 'perdu')),
  constraint choix_valide check (choix is null or choix in ('paiement', 'decouverte'))
);

-- RLS : comme partner_applications, le rôle anon est bloqué en écriture
-- sur ce projet quelle que soit la policy — l'insert et la mise à jour du
-- champ "choix" passent exclusivement par des Edge Functions en
-- service_role (submit-prospect-auto-ecole, update-prospect-choice).
alter table public.prospects_auto_ecole enable row level security;

-- Aucune policy pour anon/authenticated : par défaut, RLS bloque tout accès
-- direct. Seul service_role (Edge Functions) contourne RLS et peut lire,
-- insérer, mettre à jour ou supprimer.
