# FlexiAuto — Design System

## Philosophie
Site premium, épuré, professionnel. Inspiration : Yego, Alan, Waze.
Jamais de texte mal aligné, jamais de bouton avec du texte qui déborde.
Chaque élément doit respirer. Moins c'est plus.

---

## Typographie

### Police
- Font principale : Inter (Google Fonts) — importer dans le <head> :
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
- Font-family partout : 'Inter', -apple-system, BlinkMacSystemFont, sans-serif

### Tailles de texte
- Titre section : 15px, font-weight 600, color #0F172A
- Sous-titre / label : 13px, font-weight 500, color #374151
- Corps / description : 13px, font-weight 400, color #64748B
- Métadonnée / badge : 11px, font-weight 500
- Micro-label (sous métriques) : 10px, font-weight 400, color #94A3B8
- NE JAMAIS utiliser font-size en dessous de 10px
- NE JAMAIS utiliser font-weight 700 ou bold — maximum 600

### Line-height
- Titres : line-height 1.2
- Corps : line-height 1.5
- Boutons : line-height 1 (géré par flexbox)

---

## Couleurs

### Palette principale
- Bleu primaire : #1B4FD8 (boutons, markers, accents)
- Bleu foncé / sélectionné : #0F172A
- Bleu clair fond : #EEF3FF
- Bleu clair bordure : #C7D7FC
- Texte principal : #0F172A
- Texte secondaire : #374151
- Texte muted : #64748B
- Texte placeholder : #94A3B8

### Couleurs sémantiques
- Succès / réussite : #16A34A (vert)
- Avertissement / note : #D97706 (amber)
- Fond page : #ffffff
- Fond carte/input : #F7F8FA
- Bordure légère : #E8EBF0
- Bordure normale : #E2E8F0
- Séparateur : #F0F2F5

### Règles couleurs
- NE JAMAIS utiliser de couleurs hardcodées hors de cette palette
- NE JAMAIS mettre du texte blanc sur fond clair
- NE JAMAIS mettre du texte sombre sur fond coloré sans vérifier le contraste

---

## Boutons — Règles absolues

### Règle universelle pour TOUS les boutons
```css
display: flex;
align-items: center;
justify-content: center;
white-space: nowrap;
cursor: pointer;
font-family: 'Inter', sans-serif;
```

### Bouton primaire (action principale)
```css
background: #1B4FD8;
color: #ffffff;
border: none;
border-radius: 20px;
height: 34px;
padding: 0 18px;
font-size: 13px;
font-weight: 500;
```

### Bouton secondaire (outline)
```css
background: transparent;
color: #1B4FD8;
border: 1.5px solid #1B4FD8;
border-radius: 20px;
height: 34px;
padding: 0 18px;
font-size: 13px;
font-weight: 500;
```

### Bouton tertiaire (ghost/filtre)
```css
background: #F7F8FA;
color: #374151;
border: 1px solid #E2E8F0;
border-radius: 8px;
height: 30px;
padding: 0 10px;
font-size: 12px;
font-weight: 400;
```

### Bouton accent (Comparer, badge action)
```css
background: #EEF3FF;
color: #1B4FD8;
border: 1px solid #C7D7FC;
border-radius: 8px;
height: 30px;
padding: 0 12px;
font-size: 12px;
font-weight: 500;
```

### Bouton petit dans popup
```css
height: 30px;
border-radius: 8px;
font-size: 12px;
font-weight: 500;
padding: 0 10px;
display: flex;
align-items: center;
justify-content: center;
```

---

## Espacement et layout

### Règles générales
- Padding interne des sections : 12px 14px
- Gap entre éléments dans une ligne : 6px (compact), 10px (normal), 16px (large)
- Border-radius carte/panel : 12px
- Border-radius bouton pill : 20px
- Border-radius bouton carré : 8px
- Border-radius avatar : 9px
- Border-radius input : 24px (barre de recherche), 8px (input normal)

### Topbar
- Height : 52px
- Padding horizontal : 16px
- Gap entre éléments : 10px
- Border-bottom : 1px solid #F0F2F5
- Background : #ffffff

### Panel gauche
- Width : 296px fixe
- Border-right : 1px solid #F0F2F5
- Header padding : 12px
- Gap entre cartes : 7px
- Padding cartes : 11px 12px

### Cartes auto-écoles
- Border : 1px solid #E8EBF0
- Border-radius : 12px
- Hover : border-color #C7D7FC
- Sélectionnée : border-color #1B4FD8 + box-shadow 0 0 0 3px rgba(27,79,216,0.07)

---

## Markers carte — Style Yego

### Marker individuel
- Cercle : 28px diameter, background #1B4FD8, border-radius 50%
- Box-shadow : 0 2px 8px rgba(27,79,216,0.35)
- Icône voiture SVG : 14px, couleur white
- Pointe triangulaire : border-left 4px transparent, border-right 4px transparent, border-top 6px solid #1B4FD8
- Marker sélectionné : background #0F172A, pointe #0F172A

### Clusters
- Petit (2-10) : 30px, font-size 11px
- Moyen (11-50) : 36px, font-size 12px
- Grand (50+) : 42px, font-size 13px
- Couleur : background #1B4FD8, color #ffffff, font-weight 600
- Anneaux : 2 cercles concentriques rgba(27,79,216,0.10) et rgba(27,79,216,0.18)

---

## Icône voiture (logo + markers)

Toujours utiliser exactement ce SVG pour représenter une auto-école.
Vue de face, style panneau routier français, blanc sur fond bleu.

SVG viewBox="0 0 40 40" :
- Carrosserie : rect x=8 y=10 w=24 h=16 rx=5 fill=white
- Vitre : rect x=10 y=12 w=20 h=9 rx=3 fill=#1B4FD8 (ou couleur du fond)
- Bas carrosserie : rect x=6 y=22 w=28 h=7 rx=2 fill=white
- Roue gauche : circle cx=12 cy=32 r=4 fill=white + circle cx=12 cy=32 r=2 fill=fond
- Roue droite : circle cx=28 cy=32 r=4 fill=white + circle cx=28 cy=32 r=2 fill=fond
- Garde-boue gauche : rect x=5 y=24 w=5 h=5 rx=1 fill=white
- Garde-boue droite : rect x=30 y=24 w=5 h=5 rx=1 fill=white

---

## Popup marker

```css
background: #ffffff;
border-radius: 12px;
border: 1px solid #E2E8F0;
padding: 12px;
width: 200px;
box-shadow: 0 6px 20px rgba(0,0,0,0.10);
```

Contenu dans l'ordre :
1. Header : avatar (30px, border-radius 7px) + nom (13px 600) + ville (11px muted)
2. Stats grid 3 colonnes : valeur (12px 600 colorée) + label (10px muted)
3. Boutons côte à côte : "Visiter le site" (primaire) + "S'inscrire" (secondaire)

---

## Règles qualité — NE JAMAIS faire

- NE JAMAIS laisser du texte qui déborde hors de son conteneur
- NE JAMAIS avoir un bouton avec text-align:left si le texte doit être centré
- NE JAMAIS utiliser margin:auto pour centrer du texte dans un bouton — utiliser flexbox
- NE JAMAIS empiler deux box-shadow sauf pour les popups
- NE JAMAIS utiliser rgba() avec une opacité inférieure à 0.05 (invisible)
- NE JAMAIS laisser un z-index non défini sur les dropdowns (minimum z-index:100)
- NE JAMAIS modifier le style visuel de la carte Google Maps
- NE JAMAIS changer la clé API Google Maps
- TOUJOURS tester qu'un dropdown se ferme proprement et ne chevauche pas d'autres éléments
- TOUJOURS vérifier qu'un filtre actif met bien à jour la liste ET le compteur
