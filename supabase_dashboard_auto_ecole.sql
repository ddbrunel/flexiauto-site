-- ============================================================
-- 1) handle_new_user() doit copier partner_application_id depuis les
--    metadata du compte auth — c'est ce qui permet à rattache-auto-ecole
--    de retrouver le SIRET du partenaire dès la création du compte.
--    stripe-webhook appellera désormais
--    supabase.auth.admin.inviteUserByEmail(email, { data: { role:
--    'auto_ecole', partner_application_id, prenom, nom } }).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_prenom text := new.raw_user_meta_data->>'prenom';
  v_nom    text := new.raw_user_meta_data->>'nom';
  v_full_name text;
begin
  v_full_name := coalesce(
    nullif(trim(coalesce(v_prenom, '') || ' ' || coalesce(v_nom, '')), ''),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.email
  );
  insert into public.profiles (id, email, role, prenom, nom, full_name, partner_application_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'eleve'),
    v_prenom,
    v_nom,
    v_full_name,
    nullif(new.raw_user_meta_data->>'partner_application_id', '')::uuid
  );
  return new;
end;
$$;

-- ============================================================
-- 2) Statut du rattachement compte auto-école ↔ fiche schools, rempli par
--    l'Edge Function rattache-auto-ecole :
--    'auto'                 = trouvé automatiquement (SIRET direct ou
--                              Sirene + même commune) ; profiles.ecole_id
--                              est rempli.
--    'a_faire_manuellement' = aucune correspondance fiable trouvée ;
--                              ecole_id reste null, à traiter à la main
--                              depuis le dashboard admin.
-- ============================================================
alter table public.profiles
  add column if not exists statut_rattachement text;

alter table public.profiles
  drop constraint if exists statut_rattachement_valide;
alter table public.profiles
  add constraint statut_rattachement_valide
  check (statut_rattachement is null or statut_rattachement in ('auto', 'a_faire_manuellement'));

-- ============================================================
-- 3) Distingue les élèves qui s'entraînent au code (prospect) de ceux
--    inscrits à la conduite (eleve). Recommandation : une seule colonne,
--    pas de table de liaison — c'est un état binaire par profil, sans
--    historique de transition à conserver aujourd'hui ; une table séparée
--    ajouterait une jointure partout (dashboard, comptages) pour un
--    bénéfice nul tant qu'aucun historique n'est demandé.
-- ============================================================
alter table public.profiles
  add column if not exists statut_eleve text not null default 'prospect';

alter table public.profiles
  drop constraint if exists statut_eleve_valide;
alter table public.profiles
  add constraint statut_eleve_valide
  check (statut_eleve in ('prospect', 'eleve'));

-- ============================================================
-- 4) Index pour les requêtes du nouveau dashboard auto-école (prospects/
--    élèves d'une école, retrouver la candidature liée à un compte).
-- ============================================================
create index if not exists idx_profiles_ecole_id on public.profiles(ecole_id);
create index if not exists idx_profiles_partner_application_id on public.profiles(partner_application_id);
