---
name: FlexiAuto
description: Comparateur d'auto-écoles françaises — carte immersive, fiches et comparaison
colors:
  blue: "#1976d2"
  blue-deep: "#0d5fb3"
  blue-light: "#4aa3e5"
  blue-ink: "#0f5f9f"
  sage: "#6fbf73"
  sage-deep: "#4f9b57"
  sage-ink: "#2f7d42"
  amber: "#e5a72f"
  amber-ink: "#8a620f"
  violet: "#7e8fc5"
  violet-ink: "#53679c"
  bg: "#f4fbff"
  bg-elevated: "#ffffff"
  bg-tint: "#e8f5fb"
  ink: "#17324d"
  ink-secondary: "#2e536f"
  muted: "#7b91a3"
  muted-strong: "#5f7588"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.3px"
rounded:
  pill: "100px"
  card: "14px"
  card-lg: "16px"
  popup: "18px"
  input: "9px"
  chip: "8px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "9px 20px"
  button-primary-hover:
    backgroundColor: "{colors.blue-deep}"
  button-secondary:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.pill}"
    padding: "9px 20px"
  card-listing:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "13px 14px"
---

# Design System: FlexiAuto

## 1. Overview

**Creative North Star: "La Route Claire"**

FlexiAuto se pense comme un trajet balisé et lumineux vers le permis de conduire, pas comme un formulaire administratif à remplir. La carte occupe l'écran, le fond est clair et aéré (blanc, bleu très pâle), et chaque élément se détaille sur des surfaces nettes qui laissent la carte visible en dessous — la navigation reste le décor, jamais reléguée à une vignette. Le bleu (#1976d2) porte la confiance et l'action ; le vert sauge (#6fbf73) marque exclusivement la réussite (taux de réussite, disponibilité, sélection comparateur), jamais utilisé comme couleur de marque à parts égales avec le bleu. Inter porte tout le système — titres, corps, labels — dans un seul family bien maîtrisé, comme il convient à un outil produit où l'utilisateur est dans une tâche (rechercher, comparer, s'inscrire), pas dans un moment de marque. Le système rejette explicitement le style institutionnel des sites d'auto-école traditionnels (bleu-blanc-rouge terne, formulaires austères) et l'esthétique comparateur low-cost saturée de pop-ups et de bannières.

**Key Characteristics:**
- Fond clair, aéré, jamais dense — le blanc et le bleu très pâle dominent, la carte reste visible en arrière-plan derrière les panneaux.
- Bleu = action et confiance ; vert sauge = signal de réussite uniquement, toujours secondaire.
- Inter (800/700 pour les titres et chiffres-clés, 400/500 pour le reste) — un seul family, pas de pairing display/body : c'est un outil produit, pas une page de marque.
- Boutons pilule (radius 100px) pour les actions, cartes à coins arrondis (12–18px) pour le contenu.
- Surfaces nettes, sans flou décoratif — voir la Règle du Verre Dépoli Banni dans Elevation.

## 2. Colors

Palette "printemps professionnelle" : dominante bleue sur fond blanc/bleu très clair, avec le vert sauge réservé au signal de réussite.

### Primary
- **Bleu Confiant** (#1976d2): couleur de marque et d'action — boutons primaires, markers de carte, liens actifs, logo. Porte l'essentiel de l'identité visuelle.
- **Bleu Profond** (#0d5fb3): état hover/pressed du bleu confiant, dégradés de boutons.
- **Bleu Ciel** (#4aa3e5): accents plus légers — corps des markers, éléments décoratifs sur fond clair.

### Secondary
- **Vert Sauge** (#6fbf73): signal de réussite exclusivement — taux de réussite, badges "places disponibles", sélection active dans le comparateur. N'est jamais utilisé comme couleur de marque à parts égales avec le bleu ; sa rareté relative est ce qui lui donne son sens.
- **Vert Sauge Profond** (#4f9b57 / #2f7d42): texte et bordures sur les éléments verts (badges, chips).

### Tertiary
- **Ambre Chaleureux** (#e5a72f): accents ponctuels — badges "places qui se remplissent vite", KPI prix/formule. Usage rare et intentionnel, jamais dominant.

### Neutral
- **Fond Page** (#f4fbff): fond global de l'application, dominante bleu très pâle.
- **Fond Élevé** (#ffffff): cartes, panneaux, popups.
- **Fond Teinté** (#e8f5fb): variations de fond secondaires (carte, sections alternées).
- **Encre Principale** (#17324d): texte principal, titres.
- **Encre Secondaire** (#2e536f): sous-titres, texte de support.
- **Muted** (#7b91a3 / #5f7588): labels, métadonnées, placeholders.

### Named Rules
**La Règle du Vert Rare.** Le vert sauge ne décore jamais une surface par défaut — il apparaît uniquement pour confirmer un fait positif (réussite, disponibilité, sélection). Si un élément vert n'annonce pas une bonne nouvelle, ce n'est pas la bonne couleur.

## 3. Typography

**Family:** Inter (avec fallback sans-serif) — un seul family pour tout le système.

**Character:** Un produit, pas une brochure : Inter porte les titres en 800/700 pour le caractère, et descend à 400/500 pour tout texte courant, sans rupture de famille. C'est la permission propre au registre produit — les utilisateurs sont dans une tâche (chercher, comparer, s'inscrire), pas dans un moment de marque à faire durer.

### Hierarchy
- **Display** (800, 28–32px, line-height 1.15, letter-spacing -0.02em): titre du hero d'accueil (`hero-h1`), titre de page comparaison/fiche. Échelle fixe, pas de `clamp()` fluide — le produit se consulte à une densité constante, pas en scroll de landing page.
- **Headline** (800, 22–26px, line-height 1.2): titre de fiche auto-école, titre de comparaison.
- **Title** (700, 13–16px, line-height 1.3): nom de carte auto-école, titres de section (`sec-title`), nom en popup.
- **Body** (400, 13–14px, line-height 1.5–1.75): description, contenu de fiche, texte de formulaire. Plafonner à 65–75ch sur les blocs de description longue.
- **Label** (500, 10–12px, letter-spacing 0.2–0.5px, souvent uppercase): badges, KPI labels, libellés de champ.

### Named Rules
**La Règle du Family Unique.** Inter porte tout le système, du display au label — pas de pairing display/body. Le contraste vient du poids (400 à 800) et de la taille, pas d'un changement de famille.

## 4. Elevation

Le système est plat par défaut : aucune surface n'utilise `backdrop-filter`. La profondeur vient uniquement d'ombres et de fonds opaques ou quasi-opaques (blanc à 88–96%) — jamais d'un flou décoratif. Le glassmorphism a été retiré de tout le site (header, sidebar, cartes, popups, modale de connexion) au profit d'ombres douces et diffuses (`0 18px 46px rgba(31,86,125,0.16)`).

### Shadow Vocabulary
- **Ombre Ambiante** (`0 18px 46px rgba(31,86,125,0.16), 0 2px 10px rgba(31,86,125,0.08)`): ombre par défaut des panneaux flottants (sidebar, cartes de recherche).
- **Ombre Popup** (`0 16px 48px rgba(0,0,0,0.75)` en mode carte / `0 24px 70px rgba(31,86,125,0.18)` sur fond clair): popups Google Maps, cartes de connexion.
- **Lueur Bleue** (`0 2px 12px rgba(25,118,210,0.35)` → `0 4px 20px rgba(25,118,210,0.5)` au hover): halo sous les boutons primaires et CTA.

### Named Rules
**La Règle du Verre Dépoli Banni.** Aucun `backdrop-filter` nulle part dans le système — ni sur les cartes, ni sur les popups, ni sur la modale de connexion. L'élévation se lit par l'ombre et l'opacité du fond, jamais par le flou. Le blur décoratif faisait partie de la dette visuelle du système ; il a été retiré entièrement, pas seulement réduit.

## 5. Components

### Buttons
- **Shape:** pilule (radius 100px) pour toutes les actions principales ; carré arrondi (8–10px) pour les boutons tertiaires/filtres.
- **Primary:** dégradé bleu (`linear-gradient(135deg, #1976d2, #0d5fb3)`), texte blanc, padding `9px 20px`, ombre bleue portée. Utilisé pour "S'inscrire", CTA de fiche, bouton de comparaison actif.
- **Secondary:** fond blanc/verre clair, texte encre secondaire, bordure bleue légère (`rgba(25,118,210,.16)`). Utilisé pour "Voir la fiche", retour, filtres actifs.
- **Tertiary/Ghost:** fond quasi transparent, texte muted, bordure fine. Utilisé pour les filtres inactifs et actions secondaires en popup.
- **Hover/Focus:** translation verticale légère (`translateY(-1px)`) + intensification de l'ombre bleue ; jamais de changement de forme.

### Chips / Badges
- **Style:** pilule, fond teinté à 10–15% d'opacité de la couleur sémantique (bleu, vert sauge, ambre), bordure assortie à 30–38% d'opacité.
- **State:** vert sauge = disponibilité/positif, ambre = urgence modérée ("places qui se remplissent"), rouge/corail = urgence forte — jamais de rouge saturé plein, toujours teinté.

### Cards / Containers
- **Corner Style:** 12–16px selon le contexte (14px pour les cartes de liste, 16–18px pour les panneaux et popups).
- **Background:** blanc à 88–96% d'opacité sur la carte, blanc plein hors contexte carte.
- **Shadow Strategy:** Ombre Ambiante par défaut ; pas d'ombre superposée à une autre ombre sauf sur les popups (voir Elevation).
- **Border:** 1px, bleu à faible opacité (`rgba(25,118,210,.15–.36)`) — s'intensifie légèrement au hover/sélection, jamais de bordure gauche colorée en accent.
- **Internal Padding:** 13–14px pour les cartes de liste, 18–20px pour les blocs de fiche et de formule.

### Inputs / Fields
- **Style:** fond blanc teinté (`rgba(255,255,255,.86–.92)`), radius 9–24px selon le contexte (barre de recherche = pilule, champ de formulaire = 9–10px), bordure bleue très légère au repos.
- **Focus:** bordure bleue renforcée + halo doux (`box-shadow: 0 0 0 4px rgba(25,118,210,.10)`), jamais de changement de couleur de fond brutal.

### Navigation
- **Header:** fond dégradé blanc translucide qui s'estompe vers le haut de la carte, hauteur 62px, logo Inter 800 avec icône dégradée bleu→vert sauge.
- **Sidebar (liste auto-écoles):** panneau flottant à gauche, 310–330px de large, scroll interne discret (scrollbar 3–4px bleue).

### Markers de carte (composant signature)
Cercle bleu en dégradé (`linear-gradient(145deg, #4aa3e5, #0d5fb3)`) avec anneau de pulsation animé (`pulse-ring`), icône voiture blanche au centre. Au clic/hover, agrandissement `scale(1.2)` et intensification de l'ombre bleue. Les clusters reprennent la même famille de bleu avec anneaux concentriques translucides. Ce composant ne doit jamais changer de forme ou de palette — c'est l'ancrage visuel de la marque sur la carte.

## 6. Do's and Don'ts

### Do:
- **Do** garder la carte visible en arrière-plan derrière tous les panneaux flottants — c'est le cœur de l'expérience, jamais une vignette secondaire.
- **Do** réserver le vert sauge au signal de réussite (taux de réussite, disponibilité, sélection) — jamais comme couleur de marque à parts égales avec le bleu.
- **Do** utiliser Inter à 700 minimum pour tout ce qui doit avoir du caractère (titres, chiffres, boutons principaux) ; 400–500 pour tout le reste.
- **Do** garder les boutons en forme de pilule (radius 100px) pour toutes les actions principales.
- **Do** vérifier le contraste texte/fond sur chaque nouvelle surface teintée — le texte muted (#7b91a3) échoue l'AA en dessous de 18px (3.27:1) ; utiliser muted-strong (#5f7588, 4.79:1) pour tout texte de lecture, même petit.

### Don't:
- **Don't** utiliser `backdrop-filter` où que ce soit — le glassmorphism a été retiré entièrement du système. L'élévation se lit par l'ombre et l'opacité du fond.
- **Don't** utiliser une bordure gauche colorée comme accent sur une carte ou un badge — utiliser un fond teinté ou une bordure complète.
- **Don't** reproduire le style institutionnel des sites d'auto-école traditionnels (bleu-blanc-rouge terne, formulaires austères) ni l'esthétique comparateur low-cost surchargée de pop-ups et bannières publicitaires.
- **Don't** modifier le style visuel de la carte Google Maps elle-même, ni la clé API Google Maps.
- **Don't** descendre en dessous du poids 600 pour les titres/chiffres/boutons, ni utiliser une taille de texte inférieure à 10px.
- **Don't** empiler deux box-shadow sur un même élément, sauf sur les popups où c'est déjà la convention établie.
