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


## Design system
Lis impérativement DESIGN.md avant toute modification visuelle ou création d'élément UI.


## Design system
Lis impérativement DESIGN.md avant toute modification visuelle ou création d'élément UI.
