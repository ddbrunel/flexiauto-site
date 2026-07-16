-- ============================================================
-- Fonction sécurisée : vérifie le rôle admin sans récursion RLS.
-- security definer => s'exécute avec les privilèges du propriétaire
-- (postgres, rolbypassrls=true) : la lecture de profiles ci-dessous ne
-- redéclenche PAS l'évaluation des policies de profiles, contrairement à
-- une sous-requête directe écrite dans une policy.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Supprime les 3 policies récursives.
-- ============================================================
drop policy if exists "acces profiles" on public.profiles;
drop policy if exists "admin lecture tout" on public.profiles;
drop policy if exists "admin update tout" on public.profiles;

-- ============================================================
-- Recrée l'accès admin (lecture + écriture complètes) via la fonction
-- sécurisée. Une seule policy "ALL" suffit (couvre SELECT/UPDATE/INSERT/
-- DELETE), au lieu des deux originales redondantes.
-- ============================================================
create policy "admin acces tout"
  on public.profiles
  for all
  to public
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- Inchangé, déjà sain, conservé tel quel (aucune action) :
--   "lecture propre"          (auth.uid() = id, SELECT)
--   "update propre"           (auth.uid() = id, UPDATE)
--   "moniteur lecture eleves" (moniteur_id = auth.uid(), SELECT)
-- Ces 3 policies + la nouvelle "admin acces tout" restent compatibles avec
-- le futur SaaS (rôles admin/moniteur/eleve/auto_ecole tous couverts), et
-- ne touchent ni auth.users ni les 3 comptes existants.
-- ============================================================

-- Vérification après exécution : doit renvoyer exactement 4 lignes,
-- aucune ne contenant plus de sous-requête "FROM profiles" dans qual.
select policyname, cmd, qual from pg_policies where tablename = 'profiles';
