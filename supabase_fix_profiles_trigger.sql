-- ============================================================
-- 1) Ajout réel des colonnes FlexiAuto (jamais appliqué la 1ère fois)
-- ============================================================
alter table public.profiles
  add column if not exists prenom text,
  add column if not exists nom text,
  add column if not exists telephone text,
  add column if not exists partner_application_id uuid references public.partner_applications(id);

-- ============================================================
-- 2) Élargir la contrainte de rôle pour accepter 'auto_ecole'
-- en plus des valeurs existantes du SaaS (admin/moniteur/eleve).
-- ============================================================
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'moniteur', 'eleve', 'auto_ecole'));

-- ============================================================
-- 3) Trigger corrigé — n'insère plus que des colonnes qui
-- existent réellement, et construit full_name (NOT NULL) de
-- façon sûre : prenom+nom, sinon full_name/name des metadata
-- OAuth (Google les fournit automatiquement), sinon l'email en
-- dernier recours pour ne jamais violer la contrainte NOT NULL.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

  insert into public.profiles (id, email, role, prenom, nom, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'eleve'),
    v_prenom,
    v_nom,
    v_full_name
  );
  return new;
end;
$$;

-- Le trigger on_auth_user_created existe déjà et pointe vers cette
-- fonction (create or replace function suffit, pas besoin de le recréer).

-- ============================================================
-- 4) RLS était désactivé malgré des policies existantes — on
-- l'active. Les 6 policies déjà en place (accès à son propre
-- profil, admin, moniteur → ses élèves via moniteur_id) sont
-- conservées telles quelles : elles sont compatibles avec
-- 'auto_ecole' sans modification.
-- ============================================================
alter table public.profiles enable row level security;
