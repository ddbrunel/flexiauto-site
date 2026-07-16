-- Élargit la contrainte business_status pour accepter 2 valeurs "terminales"
-- supplémentaires, nécessaires pour que refresh_business_status.py puisse
-- marquer un place_id comme définitivement traité même en cas d'échec (sans
-- ça, ces lignes restent NULL et sont retraitées indéfiniment) :
--   'INTROUVABLE' : Google ne connaît plus ce place_id (NOT_FOUND,
--                    ZERO_RESULTS, INVALID_REQUEST) — échec permanent.
--   'INCONNU'     : Google renvoie un statut OK mais sans le champ
--                    business_status dans sa réponse — indéterminable.
alter table public.schools drop constraint if exists business_status_valide;

alter table public.schools
  add constraint business_status_valide
  check (business_status is null or business_status in (
    'OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY', 'INTROUVABLE', 'INCONNU'
  ));
