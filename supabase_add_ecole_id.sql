-- Rattachement élève ↔ auto-école (utilisé pour savoir si un élève a déjà
-- choisi son auto-école de référence, cf. bandeau de rappel sur
-- dashboard-eleve.html). Nullable : un élève peut ne pas avoir encore choisi.
alter table public.profiles
  add column if not exists ecole_id uuid references public.schools(id);
