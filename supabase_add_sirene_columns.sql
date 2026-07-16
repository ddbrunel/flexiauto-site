-- schools.siret existe déjà (text, contrainte UNIQUE, vide sur les 10 909
-- lignes) — rien à faire dessus. On ajoute uniquement les 5 colonnes
-- manquantes issues du croisement avec l'API Sirene.
alter table public.schools
  add column if not exists siren text,
  add column if not exists denomination_legale text,
  add column if not exists date_creation_entreprise date,
  add column if not exists etat_administratif text,
  add column if not exists siret_match_confiance text;

-- PostgreSQL n'accepte pas "ADD CONSTRAINT IF NOT EXISTS" : si tu relances ce
-- script une 2e fois, retire cette contrainte manuellement au préalable
-- (ou ignore l'erreur "already exists", sans conséquence).
alter table public.schools
  add constraint siret_match_confiance_valide
  check (siret_match_confiance is null or siret_match_confiance in ('exact', 'probable', 'aucun'));
