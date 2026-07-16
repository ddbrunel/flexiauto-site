-- Vérification : liste les policies actuellement actives sur la table
-- (à lancer d'abord pour voir ce qui existe vraiment)
select policyname, roles, cmd, qual, with_check
from pg_policies
where tablename = 'partner_applications';

-- Correctif : on recrée la policy d'insertion publique de façon idempotente,
-- avec "to public" (plutôt que "to anon") pour éviter tout souci de
-- correspondance de rôle avec les nouvelles clés API Supabase
-- (sb_publishable_...) — l'accès reste limité à l'INSERT uniquement,
-- SELECT/UPDATE/DELETE restent bloqués pour public/anon/authenticated.
drop policy if exists "Le public peut soumettre une candidature" on public.partner_applications;

create policy "Le public peut soumettre une candidature"
  on public.partner_applications
  for insert
  to public
  with check (true);

-- Vérification finale : doit maintenant afficher la nouvelle policy
select policyname, roles, cmd, with_check
from pg_policies
where tablename = 'partner_applications';
