# FlexiAuto — Comparateur d'auto-écoles

## Contexte du projet
Site comparateur d'auto-écoles françaises. Stack : HTML/CSS/JS vanilla, déployé sur Vercel.
URL production : https://flexiauto-site.vercel.app
Clé Google Maps restreinte à ce domaine uniquement.

## Design — Ce qui doit changer
- Le design actuel ne convient pas, il faut le moderniser
- S'inspirer de : Yego, Waze, Alan (moderne, épuré, dark mode possible)
- Couleurs actuelles à remplacer : chercher un style plus premium
- La carte doit être immersive et prendre plus de place
- Les fiches auto-écoles doivent être plus visuelles et aérées
- Typographie : plus moderne (ex: Inter, DM Sans)

## Ce qui fonctionne
- Carte Google Maps avec clusters de markers ✅
- Liste des auto-écoles à gauche ✅
- Popup au clic sur un marker ✅
- Déploiement Vercel automatique ✅

## Ce qui n'est pas encore fonctionnel
- Bouton "Voir la fiche" → page fiche auto-école à créer
- Bouton "S'inscrire" → formulaire d'inscription à créer
- Barre de recherche par ville/code postal → à connecter
- Filtres (Permis, Trier par) → à rendre fonctionnels
- Bouton "Comparer" → fonctionnalité à créer
- Page "Explorer" → à créer
- Connexion / Espace personnel → à tester et vérifier

## Connexions à tester
- Connexion email/mot de passe
- Connexion Google OAuth
- Connexion via lien magique (magic link)
- Vérifier que la session persiste après connexion

## Conventions
- Tout le code est dans index.html (fichier unique pour l'instant)
- Déploiement : vercel --prod dans le terminal
- Ne jamais toucher à la clé API Google Maps
- Langue : français partout dans l'interface


## Contexte Design
- Lis impérativement PRODUCT.md (stratégie : registre, utilisateurs, principes) et DESIGN.md (système visuel : couleurs, typo, composants) avant toute modification visuelle ou création d'élément UI.
- Registre : **product** — l'outil de comparaison (carte, filtres, comparateur, compte) est le cœur du produit.
- Principes clés : la carte reste le cœur de l'expérience (jamais reléguée) ; rassurer avant de vendre sur les fiches ; comparer sans confusion ; aucune friction inutile entre comparaison et inscription ; premium sans être froid.
- Point de dette identifié dans DESIGN.md : le verre dépoli (backdrop-filter blur) est aujourd'hui appliqué presque partout dans le code — à réserver aux surfaces vraiment flottantes (popups, overlay de connexion), pas à généraliser davantage.
