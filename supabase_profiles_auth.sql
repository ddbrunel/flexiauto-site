-- ============================================================
-- Table profiles — reliée à auth.users (Supabase Auth)
-- ============================================================
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  created_at              timestamptz not null default now(),
  role                    text not null,
  email                   text not null,
  prenom                  text,
  nom                     text,
  telephone               text,
  partner_application_id  uuid references public.partner_applications(id),
  constraint role_valide check (role in ('eleve', 'auto_ecole', 'admin'))
);

-- ============================================================
-- Trigger : à chaque inscription dans auth.users, crée
-- automatiquement la ligne profiles correspondante. Le rôle est
-- lu depuis les metadata passées au signUp() côté front
-- (options.data.role) ; par défaut 'eleve' si absent (cas Google
-- OAuth, qui n'est proposé que côté élève).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, prenom, nom)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'eleve'),
    new.raw_user_meta_data->>'prenom',
    new.raw_user_meta_data->>'nom'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS sur profiles
-- ============================================================
alter table public.profiles enable row level security;

-- Lecture : uniquement son propre profil
create policy "Un utilisateur peut lire son propre profil"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Modification : uniquement son propre profil
create policy "Un utilisateur peut modifier son propre profil"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Pas de policy INSERT pour authenticated/anon : la seule voie de
-- création est le trigger ci-dessus (via security definer, qui
-- contourne RLS), ce qui empêche un utilisateur de s'attribuer
-- lui-même un rôle en insérant directement une ligne.
--
-- Pas de policy DELETE : la suppression d'un profil suit
-- automatiquement la suppression du compte auth.users (on delete
-- cascade ci-dessus).
--
-- service_role (back-office / Edge Functions) contourne RLS par
-- défaut et voit/modifie tout, sans policy dédiée nécessaire —
-- même principe que sur partner_applications.
