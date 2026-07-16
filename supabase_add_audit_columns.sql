-- Regroupe les colonnes demandées en parties 1 et 3 (business_status était
-- cité dans les deux) : rien à exécuter deux fois.
alter table public.schools
  add column if not exists business_status text,
  add column if not exists qualite_donnees text,
  add column if not exists audit_raisons text,
  add column if not exists date_dernier_audit timestamptz;

alter table public.schools
  add constraint qualite_donnees_valide
  check (qualite_donnees is null or qualite_donnees in ('fiable', 'douteuse', 'a_purger'));

alter table public.schools
  add constraint business_status_valide
  check (business_status is null or business_status in ('OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'));
