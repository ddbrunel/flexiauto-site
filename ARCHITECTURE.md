# ARCHITECTURE.md — FlexiAuto

Documentation exhaustive de `index.html` (et des pages annexes) pour permettre une migration de Google Maps JS API vers **Mapbox GL JS** sans perte de fonctionnalité. Ce document décrit l'état réel du code, pas l'intention produit (voir PRODUCT.md/DESIGN.md pour la stratégie et le système visuel).

Le site est un fichier HTML/CSS/JS vanilla unique (`index.html`, 1619 lignes), sans build step, plus 3 pages HTML statiques annexes. Aucune dépendance npm n'est utilisée en runtime (les `dependencies`/`devDependencies` du `package.json` — `vercel`, `playwright` — ne servent qu'au déploiement et aux tests, pas au site lui-même). Toutes les librairies front sont chargées via CDN dans le `<head>`.

## Librairies chargées (CDN)

| Librairie | URL | Rôle |
|---|---|---|
| Google Fonts (Inter) | `fonts.googleapis.com/css2?family=Inter:...` | Police unique du design system |
| Tabler Icons (webfont) | `cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0` | Chargé mais non utilisé dans le HTML actuel (icônes réellement utilisées = SVG inline) |
| Supercluster | `cdn.jsdelivr.net/npm/supercluster@8.0.1/dist/supercluster.min.js` | Clustering géographique côté client (remplace `@googlemaps/markerclusterer`, retiré lors d'une migration précédente) |
| Google Maps JS API | `maps.googleapis.com/maps/api/js?key=...&libraries=marker&language=fr&region=FR&loading=async` (`defer`) | Carte, markers classiques (`google.maps.Marker`), InfoWindow |
| Supabase JS SDK v2 | `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | Client bulk-load (pagination) pour la table `schools` |

La clé Google Maps (`AIzaSyDtFgUhoQoVISlysDWgGsFUep9b7b7Yc5c`) est restreinte par domaine dans Google Cloud Console — visible dans le HTML servi, ce qui est le fonctionnement normal d'une clé Maps JS côté navigateur (protection par referrer, pas par secret). **Ne jamais la modifier ni la commit dans un contexte différent** (règle CLAUDE.md).

---

## 1. Structure HTML

### 1.1 Squelette body

```
<div id="map">                     ← conteneur Google Maps, plein viewport, z-index:0
body::before (pseudo-élément CSS)  ← dégradé de fondu au-dessus de la carte, décoratif
<div class="topbar-wrap">          ← z-index:900, position:fixed top:0
  <div id="header">…</div>
<div id="page-home">               ← z-index:100
<div id="page-carte">              ← z-index:200
<div id="page-fiche">              ← z-index:500
<div id="page-login">              ← z-index:800
<script>…</script>
```

Les "pages" ne sont **pas** des routes réelles : ce sont 4 `<div>` en position fixe superposés à la carte, dont l'affichage (`display:flex|block|none`) est piloté par `setPage(p)`. La carte Google Maps (`#map`) reste toujours montée en arrière-plan, jamais détruite/recréée — c'est le mécanisme qui permet à `#page-carte` de sembler "transparente" sur la carte.

Pattern important : `#page-home` et `#page-carte` ont `pointer-events:none` sur le conteneur (pour laisser les clics traverser vers la carte) et remettent `pointer-events:auto` explicitement sur leurs enfants interactifs (`.hero-wrap`, `.sidebar`, `.back-btn`, `#recenter-btn`, `.cdr-banner`). À reproduire à l'identique en cas de refonte : c'était la cause d'un bug critique passé (markers/clusters non cliquables) quand `#page-carte` n'avait pas ce `pointer-events:none`.

### 1.2 Topbar (`#header`, dans `.topbar-wrap`)

| Élément | Rôle |
|---|---|
| `.logo` (`<a onclick="showHome()">`) | Logo + nom "FlexiAuto", ramène à l'accueil |
| `.search-wrap#sw` | Conteneur de la recherche topbar |
| `input#si` | Champ de recherche (placeholder "Ville, auto-école, code postal...") |
| `.search-dd#sdd` | Dropdown de résultats (écoles locales + lieux géocodés Nominatim) |
| `.h-nav` | Conteneur droit : `.h-btn-info` ("En savoir plus" → `savoir-plus.html`), `.h-btn.primary` ("Se connecter" → `https://flexi-app-peach.vercel.app/login`, redirection externe, pas de modal locale) |

### 1.3 Bandeaux "Code de la route" (`.cdr-banner`)

Composant partagé (même classes CSS) instancié 2 fois dans `index.html`, positionné **sous** la topbar (`top:var(--chrome-height)`), avec un texte, un CTA et une croix de fermeture propres à chaque page :

| id | Page | Texte | Bouton | Fermeture (localStorage) |
|---|---|---|---|---|
| `#cdr-home-banner` | `#page-home` | "📚 Code de la route · Questions officielles" | "Essai gratuit →" | `cdr-home-closed` |
| `#cdr-carte-banner` | `#page-carte` | "🎯 Code de la route — Questions officielles · Moins cher que la concurrence" | "Essayer gratuit" | `cdr-carte-closed` |

Le clic sur le bouton fait toujours `alert('Code de la route — bientôt disponible !')` (fonctionnalité non développée). `savoir-plus.html` a une 3ᵉ instance indépendante (`#cdr-savoir-banner` / `cdr-savoir-closed`, script séparé, voir §7).

### 1.4 Page d'accueil (`#page-home`)

| Élément | Rôle |
|---|---|
| `.hero-wrap` | Carte centrale (quasi-opaque sur la carte) |
| `.hero-tag` | Badge "240+ auto-écoles partenaires en France" (texte statique) |
| `.hero-h1` | "Trouvez votre auto-école" |
| `.hero-sub` | Sous-titre statique |
| `.hero-btns` → `.btn-main.accent` (`onclick="showCarte()"`) | "Rechercher une auto-école" |
| `.hero-btns` → `.btn-main` (`onclick` → URL login externe) | "Se connecter à mon espace" |
| `.hero-stats` | 3 chiffres **codés en dur** (89% / 4.7 sur 5 / 12 000+) — pas de calcul dynamique depuis Supabase |
| `.home-footer` | Copyright + 5 liens RGPD (Politique de confidentialité, Mentions légales, CGU, Cookies, Contact), tous `onclick="alert('Page bientôt disponible !')"` — non fonctionnels |

### 1.5 Page carte (`#page-carte`)

| Élément | Rôle |
|---|---|
| `.back-btn` (`onclick="showHome()"`) | Retour à l'accueil |
| `#recenter-btn` (`onclick="recenterMap()"`) | Recentre sur la France ; masqué par défaut, affiché quand `zoom > 6` (listener `zoom_changed`) |
| `.sidebar#sidebar` | Panel gauche flottant, 310–330px |
| `.sidebar-head` (sticky) | Regroupe recherche + filtres + rayon + compteur |
| `.sidebar-search` → `input#sidebar-input` | Recherche texte locale (nom/ville) dans la liste affichée |
| `select#sort-select` (`onchange="setSort(this.value)"`) | Tri : défaut / score / note / réussite / prix / places |
| `select#permit-select` (`onchange="setPermit(this.value)"`) | Filtre permis : tous / B / AAC / Moto |
| `.view-toggle` → `#vt-card` / `#vt-list` (`onclick="setView(...)"`) | Bascule vue cartes / vue liste compacte |
| `.radius-row` → `input#radius-slider` + `span#radius-val` | Rayon géographique (0/10/25/50/100/200 km) |
| `div#sidebar-count` | Compteur "N auto-écoles" / "Chargement..." |
| `.sidebar-list#sidebar-list` | Contenu généré par `renderList()` |
| `.sidebar-limit-notice#sidebar-limit-notice` | Notice "Vue limitée à 300 résultats", affichée quand le nombre de clusters visibles dépasse `MAX_VISIBLE` |

### 1.6 Page fiche (`#page-fiche`)

| Élément | Rôle |
|---|---|
| `.f-topbar` → `.f-back` (`onclick="closeFiche()"`) | Retour (vers carte ou accueil selon provenance) |
| `div#f-topname` | Nom de l'école dans la topbar de la fiche |
| `.f-body#f-body` | Contenu généré dynamiquement par `showFiche()` : hero (avatar, badge partenaire, adresse, contacts), 4 stats, description, mini-carte (`#fiche-minimap`), formules (si partenaire) ou bloc "Devenir partenaire", CTA d'inscription |

### 1.7 Modale login (`#page-login`)

Modal de connexion email/mot de passe complète en HTML (`.login-card`, champs email + password, checkbox "se souvenir", `.login-btn`), mais **jamais affichée dans le flux actuel** : `showLogin()` est définie mais n'a aucun appelant dans le code — les boutons "Se connecter" (topbar, hero, popup) redirigent tous vers l'app externe `https://flexi-app-peach.vercel.app/login`. Le clic sur `.login-btn` ne fait qu'un `alert('Supabase sera connecté en V2')` : aucune authentification Supabase réelle n'est câblée ici. À traiter comme du code mort/vestige lors de la migration, sauf réactivation explicite.

---

## 2. Données

### 2.1 Connexion Supabase

```js
const SUPABASE_URL  = 'https://nlzplxhetonxvcdckmcq.supabase.co';
const SUPABASE_ANON = 'sb_publishable_er7mVFa1fYYWLwGFCacZ8Q_JWX_uyCF'; // clé publique anon
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
```

Deux modes d'accès coexistent :
- **`supabaseClient`** (SDK officiel) : utilisé uniquement par `loadSchools()` pour le chargement en masse paginé. *Nommé `supabaseClient` et non `supabase` car le SDK expose déjà un global `window.supabase` — une déclaration `const supabase = ...` provoquerait une `SyntaxError` de redéclaration qui casserait tout le script.*
- **`supabaseFetch(table, params)`** (fetch REST brut vers `${SUPABASE_URL}/rest/v1/${table}?${params}`, headers `apikey`/`Authorization: Bearer`) : utilisé par `loadSchoolDetails()` pour les fiches détaillées à la demande.

### 2.2 Table `schools`

Champs sélectionnés en liste (`FIELDS`, requête bulk paginée) :
```
id, name, city, address, zip, lat, lng, google_rating, google_reviews,
success_rate, permits, is_partner, flexi_score, slots, website, phone
```
Champs supplémentaires lus via `select=*` dans `loadSchoolDetails()` (fiche complète) : `email`, `founded_year`, `delay_days`, `instructors`, `hours`, `description`, en plus des champs ci-dessus.

Filtres appliqués côté requête : `.not('lat','is',null).not('lng','is',null)` (seules les écoles géolocalisées sont chargées) et tri serveur `.order('flexi_score', {ascending:false, nullsFirst:false})`.

### 2.3 Table `formules`

Chargée uniquement pour les écoles `is_partner === true`, via `supabaseFetch('formules', 'select=*&school_id=eq.'+id)`. Colonnes utilisées : `name`, `price`, `hours`, `description`, `is_popular`.

### 2.4 Format objet école — sortie de `formatSchool(row)`

```js
{
  id:          row.id,
  initials:    /* calculé : 2 dernières "mots" de ≥3 lettres du nom, initiales majuscules,
                  fallback = 2 premières lettres du nom */,
  name:        row.name || '',
  city:        row.city || '',
  address:     row.address || '',
  zip:         row.zip || '',
  lat:         parseFloat(row.lat) || null,
  lng:         parseFloat(row.lng) || null,
  phone:       row.phone || null,
  email:       row.email || null,
  website:     row.website || null,
  rating:      parseFloat(row.google_rating) || null,
  reviews:     row.google_reviews || 0,
  success:     row.success_rate || null,
  students:    null,                          // ⚠ jamais peuplé, jamais lu ailleurs (champ mort)
  founded:     row.founded_year || null,       // ⚠ jamais affiché dans l'UI actuelle
  slots:       row.slots || 0,
  delay:       row.delay_days || null,         // ⚠ jamais affiché dans l'UI actuelle
  instructors: row.instructors || null,        // ⚠ jamais affiché dans l'UI actuelle
  permits:     Array.isArray(row.permits) ? row.permits : (row.permits ? [row.permits] : ['B']),
  hours:       row.hours || null,
  desc:        row.description || '',
  score:       parseFloat(row.flexi_score) || 0,
  is_partner:  row.is_partner || false,
  formules:    [],   // rempli uniquement par loadSchoolDetails() pour les partenaires
}
```

Objet `formule` (dans `school.formules`, après mapping) :
```js
{ name, price, hours, desc, hot }  // hot = f.is_popular
```

### 2.5 Pagination (`loadSchools`)

Boucle `while(true)` par lots de `PAGE_SIZE = 1000` (limite native de l'API REST Supabase) via `.range(from, from+999)`, concaténation dans `all`, arrêt quand `data.length < PAGE_SIZE`. Le compteur `showLoader()` est mis à jour à chaque lot pour donner un retour visuel ("N auto-écoles..."). Au 2026-07, ~10 850 écoles sont chargées ainsi en mémoire (`SCHOOLS`, tableau global). Après chargement complet : `addMarkers()` (indexation Supercluster) puis `renderList()` (sidebar).

---

## 3. Fonctions JavaScript clés

| Fonction | Rôle (1 ligne) | Paramètres → Retour | Dépendances principales |
|---|---|---|---|
| `supabaseFetch(table, params)` | Fetch REST brut d'une table Supabase avec headers anon | `(string, string)` → `Promise<Array>` | `fetch` |
| `formatSchool(row)` | Convertit une ligne Supabase brute en objet école du frontend | `(row)` → `object` | — |
| `showLoader(msg)` | Affiche un message de chargement dans le compteur sidebar | `(string)` → `void` | DOM `#sidebar-count` |
| `loadSchools()` | Charge toutes les écoles géolocalisées par lots de 1000, triées par score | `()` → `Promise<void>` | `supabaseClient`, `formatSchool`, `addMarkers`, `renderList` |
| `loadSchoolDetails(id)` | Charge la fiche complète + formules d'une école (à la demande) | `(id)` → `Promise<object\|null>` | `supabaseFetch`, `formatSchool` |
| `initMap()` | Instancie la carte Google Maps, l'InfoWindow, Supercluster, et le listener `idle` débouncé | `()` → `void` | `google.maps.Map`, `Supercluster`, `updateMarkers` |
| `clusterPopupHTML(schools)` | Génère le HTML d'une liste d'écoles pour un cluster (⚠ **définie mais jamais appelée** — code mort) | `(Array)` → `string` | — |
| `mkIconUrl()` | Génère l'icône SVG (data URI) du marker "école individuelle" | `()` → `string` | — |
| `addMarkers()` | Charge `SCHOOLS` dans l'index spatial Supercluster puis déclenche le premier rendu | `()` → `void` | `sc.load`, `updateMarkers` |
| `boundsChangedSignificantly(bounds, zoom)` | Détecte si la vue a bougé de >10% ou si le zoom a changé depuis le dernier rendu | `(LatLngBounds, number)` → `boolean` | état `lastRenderedBounds` |
| `updateMarkers()` | Cœur du rendu : recalcule clusters/markers visibles, diff incrémental, cap à 300 | `()` → `void` | `sc.getClusters`, `renderSchoolMarker`, `renderClusterMarker` |
| `renderSchoolMarker(s)` | Crée un `google.maps.Marker` pour une école, câble le clic (zoom + popup) | `(school)` → `google.maps.Marker` | `mkIconUrl`, `popupHTML`, `hlCard`, `showCarte` |
| `clusterIconUrl(count)` | Génère l'icône SVG (anneaux concentriques) d'un cluster selon sa taille | `(number)` → `{url,size}` | — |
| `renderClusterMarker(feature, position)` | Crée un `google.maps.Marker` de cluster, clic → `fitBounds` sur ses membres | `(feature, {lat,lng})` → `google.maps.Marker` | `clusterIconUrl`, `sc.getLeaves` |
| `popupHTML(s)` | Génère le HTML de l'InfoWindow (popup "Yego Option C") | `(school)` → `string` | référence `window.visitWebsite/sInscrire/closePopup` |
| `window.visitWebsite(url)` | Ouvre le site de l'école (nouvel onglet) ou redirige vers `site-inexistant.html` | `(string)` → `void` | — |
| `window.sInscrire()` | Redirige vers `inscription.html` | `()` → `void` | — |
| `window.closePopup()` | Ferme l'InfoWindow partagée | `()` → `void` | `infoWindow` |
| `setPage(p)` | Bascule l'affichage des 4 "pages", gère le bandeau carte, recalcule le chrome, resize la carte | `('home'\|'carte'\|'fiche')` → `void` | `updateChromeHeight`, `google.maps.event.trigger` |
| `updateChromeHeight()` | Recalcule les variables CSS `--chrome-height` / `--carte-chrome-height` selon les bandeaux visibles | `()` → `void` | DOM `#cdr-carte-banner` |
| `dismissCdrBanner(page)` | Ferme et mémorise (localStorage) la fermeture d'un bandeau Code de la route | `('home'\|'carte')` → `void` | `updateChromeHeight` |
| `showHome()` | Bascule vers l'accueil et recentre la carte sur la France | `()` → `void` | `setPage` |
| `showCarte()` | Bascule vers la carte, affiche un loader si les données ne sont pas encore prêtes | `()` → `void` | `setPage`, `renderList` |
| `showLogin()` / `closeLogin()` | Affiche/masque la modale de connexion locale (⚠ `showLogin` sans appelant actuel) | `()` → `void` | — |
| `recenterMap()` | Repositionne la carte au centre de la France, zoom 6 | `()` → `void` | `map` |
| `showFiche(id, from)` | Affiche la fiche détaillée d'une école (async ; charge les détails si partenaire) | `(id, from)` → `Promise<void>` | `SCHOOLS`, `loadSchoolDetails`, `setPage` |
| `closeFiche()` | Retour à la carte (avec re-render) ou à l'accueil selon la page d'origine | `()` → `void` | `setPage`, `renderList`, `showHome` |
| `setSort(v)` | Change le tri courant et relance le rendu de la liste | `(string)` → `void` | `renderList` |
| `setPermit(v)` | Change le filtre permis courant et relance le rendu de la liste | `(string)` → `void` | `renderList` |
| `setView(v, btn)` | Bascule entre vue "cartes" et vue "liste" dans la sidebar | `(string, Element)` → `void` | — |
| *(listener `input` sur `#radius-slider`)* | Met à jour `radiusKm`, la géolocalisation utilisateur (une fois) et relance le rendu | — | `navigator.geolocation`, `renderList` |
| `haversine(lat1,lng1,lat2,lng2)` | Distance à vol d'oiseau en km entre deux points | `(4× number)` → `number` | — |
| `renderList()` | Applique recherche/permis/rayon/tri à `SCHOOLS` et régénère les `.s-card` de la sidebar | `()` → `void` | `haversine`, état des filtres |
| `focusSchool(id)` | Centre la carte sur une école et ouvre son popup (ou va à la fiche si pas de coordonnées) | `(id)` → `void` | `hlCard`, `showCarte`, `popupHTML`, `showFiche` |
| `hlCard(id)` | Met en surbrillance une carte sidebar et la scroll dans la vue | `(id)` → `void` | — |
| *(listener `input` sur `#si`)* | Recherche topbar : filtre local instantané + géocodage Nominatim débouncé (400ms) | — | `renderSearchDD`, `fetch` (Nominatim) |
| `renderSearchDD(localRes, geoRes)` | Génère le HTML du dropdown de recherche (écoles locales + lieux géocodés) | `(Array, Array)` → `void` | référence `searchGo`/`zoomToPlace` |
| `zoomToPlace(lat,lng,bbox)` | Bascule sur la carte et zoome sur un lieu géocodé (bbox ou point) | `(number,number,Array\|null)` → `void` | `showCarte`, `map.fitBounds`/`panTo` |
| `searchGo(id)` | Bascule sur la carte et centre sur l'école sélectionnée dans le dropdown | `(id)` → `void` | `showCarte`, `focusSchool` |
| *(listener `input` sur `#sidebar-input`)* | Recherche texte locale dans la sidebar (met à jour `sidebarQuery` + relance `renderList`) | — | `renderList` |
| `bootMap()` | Point d'entrée : initialise la carte, lance le chargement des écoles, gère `?go=carte` | `()` → `void` | `initMap`, `loadSchools`, `showCarte` |
| *(bloc final)* | Attend que `window.google.maps` soit prêt (script `defer`) avant d'appeler `bootMap()`, avec polling 50ms en fallback | — | `bootMap` |

### État global (variables module-level)

```js
let map, sc=null, scLoaded=false, markers={}, renderedMarkers=new Map(),
    idleDebounceTimer=null, isUpdatingMarkers=false, pendingMarkersUpdate=false,
    lastRenderedBounds=null, cur='home', ficheFrom='home', ficheMap=null;
let currentSort='all', sidebarQuery='', viewMode='card', permitFilter='all';
let radiusKm=0, userLat=null, userLng=null;
const RADIUS_VALUES=[0,10,25,50,100,200];
let SCHOOLS = [];         // rempli par loadSchools()
let infoWindow = null;    // InfoWindow partagée, un seul popup ouvert à la fois
```

---

## 4. Logique carte

**Librairies** : Google Maps JavaScript API (`google.maps.Map`, `google.maps.Marker` classique — **pas** `AdvancedMarkerElement`, un choix délibéré pour préserver le style de carte personnalisé `MAP_STYLE`, incompatible avec la propriété `mapId` requise par les Advanced Markers) + Supercluster 8.0.1 pour le clustering géographique côté client (index spatial en mémoire, pas de dépendance à un clustering serveur).

### 4.1 Initialisation (`initMap`)

- `new google.maps.Map(#map, {center:{lat:46.6034,lng:1.8883}, zoom:6, styles:MAP_STYLE, disableDefaultUI:true, zoomControl:true, zoomControlOptions:{position:RIGHT_BOTTOM}, gestureHandling:'greedy', clickableIcons:false})`
- `MAP_STYLE` : tableau de styles Google Maps "Voyager clair" (géométrie `#f4fbff`, labels `#5f7588`, POI masqués, transit masqué, eau `#dff2fb`, routes principales ambrées). **Ne jamais modifier** (règle CLAUDE.md/DESIGN.md).
- `sc = new Supercluster({radius:60, maxZoom:15, minZoom:0})` — instance unique, réutilisée pour toute la session.
- `infoWindow = new google.maps.InfoWindow({disableAutoPan:false, maxWidth:280})` — instance unique et partagée par tous les markers (un seul popup ouvert à la fois).

### 4.2 Création des markers individuels (`renderSchoolMarker`)

Icône = SVG data-URI généré par `mkIconUrl()` (cercle blanc translucide + cercle bleu plein + icône voiture blanche, 36×36px). Au clic : si zoom actuel < 14, `fitBounds` sur un petit rectangle autour du point (marge ±0.006°) puis ouverture du popup après 650ms (laisse l'animation de zoom se terminer) ; si zoom ≥ 14, `panTo` direct + ouverture immédiate du popup. Bascule vers `#page-carte` si nécessaire, met en surbrillance la carte sidebar correspondante (`hlCard`).

### 4.3 Création des clusters (`renderClusterMarker`)

Icône = SVG data-URI généré par `clusterIconUrl(count)` (3 anneaux concentriques bleus à opacité dégressive, taille 34/40/46px selon que `count` est < 10 / < 50 / ≥ 50) + `label` natif Google Maps (nombre abrégé, `feature.properties.point_count_abbreviated`, converti en `String(...)` pour éviter les erreurs `InvalidValueError` de l'API sur les valeurs non-string). `zIndex` proportionnel au nombre de points pour que les gros clusters passent au-dessus. Au clic : récupère tous les points du cluster via `sc.getLeaves(clusterId, Infinity)`, construit un `LatLngBounds` les englobant tous, `fitBounds` avec marge de 80px sur chaque côté.

### 4.4 Ouverture du popup (`popupHTML`)

HTML généré à la volée (pas de template externe), injecté via `infoWindow.setContent(popupHTML(s))` puis `infoWindow.open({map, anchor:m})`. Structure : en-tête bleu (nom + ville + croix de fermeture `window.closePopup()`), rangée de 3 KPI (taux de réussite, note, permis), 2 boutons ("Visiter le site" → `window.visitWebsite(url)`, "S'inscrire" → `window.sInscrire()`). Les guillemets simples de l'URL du site sont échappés (`.replace(/'/g,"\\'")`) avant injection inline dans l'attribut `onclick`.

Le CSS custom force le style natif de l'InfoWindow Google Maps :
```css
.gm-style .gm-style-iw-c{border-radius:14px!important;padding:0!important;background:transparent!important;box-shadow:none!important}
.gm-style .gm-style-iw-d{overflow:visible!important;padding:0!important}
.gm-style-iw-tc::after{display:none!important}
.gm-ui-hover-effect{display:none!important}
```
Ce point est **spécifique à Google Maps InfoWindow** et n'a pas d'équivalent direct dans Mapbox GL JS (`mapboxgl.Popup` a sa propre classe CSS `.mapboxgl-popup-content` à réhabiller entièrement).

### 4.5 Mise à jour de la carte (`updateMarkers` + debounce)

- Écoute unique : `map.addListener('idle', ...)` → `clearTimeout` + `setTimeout(updateMarkers, 200)` (debounce 200ms, pas de rendu à chaque frame de pan/zoom).
- `updateMarkers()` :
  1. Garde de réentrance : si un rendu est déjà en cours (`isUpdatingMarkers`), pose `pendingMarkersUpdate=true` et retourne (au lieu de perdre l'appel) ; à la fin du rendu en cours, si `pendingMarkersUpdate`, relance immédiatement `updateMarkers()`.
  2. Sort tôt si `boundsChangedSignificantly()` renvoie `false` (déplacement < 10% de la largeur/hauteur de la vue **et** zoom inchangé) — évite les recalculs inutiles sur les micro-mouvements.
  3. `sc.getClusters([sw.lng,sw.lat,ne.lng,ne.lat], Math.floor(zoom))` → liste de features (clusters ou points individuels).
  4. Tri : clusters/points par taille décroissante (`point_count` ou 1), puis par `flexi_score` décroissant à égalité — priorise les gros clusters et les meilleures écoles quand on doit couper.
  5. Cap dur à `MAX_VISIBLE = 300` éléments simultanés (perf), avec notice `#sidebar-limit-notice` affichée si dépassement.
  6. Diff incrémental via `renderedMarkers` (`Map<clé, google.maps.Marker>`, clé = `'cl-'+cluster_id` ou `'pt-'+school.id`) : seuls les nouveaux éléments sont créés (`renderSchoolMarker`/`renderClusterMarker`), seuls les éléments disparus de la vue sont détruits (`marker.setMap(null)`) — un marker déjà affiché n'est jamais recréé inutilement.
  7. Toutes les opérations DOM sont regroupées dans un `requestAnimationFrame`.

### 4.6 Events écoutés sur la carte

| Event | Handler | Effet |
|---|---|---|
| `idle` | anonyme → debounce 200ms → `updateMarkers()` | Recalcule les markers/clusters visibles après chaque interaction stabilisée (pan, zoom, resize) |
| `zoom_changed` | anonyme | Affiche/masque `#recenter-btn` selon `zoom > 6` |
| `google.maps.event.trigger(map, 'resize')` | appelé manuellement dans `setPage`, `showCarte`, `closeFiche` | Force Google Maps à recalculer ses dimensions après un changement de layout (碰 pattern classique nécessaire quand le conteneur de la carte change de taille sans que la fenêtre ne redimensionne) |

**Points d'attention migration Mapbox GL JS** : l'équivalent de `idle` est l'event `moveend` (ou `idle` existe aussi sur Mapbox GL JS avec une sémantique proche) ; `getBounds()`/`getZoom()` ont des équivalents directs (`map.getBounds()`, `map.getZoom()`) mais `LatLngBounds.getSouthWest()/getNorthEast()` deviennent `bounds.getSouthWest()` (objet `LngLat`, méthodes `.lat`/`.lng` sans parenthèses car ce sont des propriétés, pas des méthodes, sur `mapboxgl.LngLat`). Le clustering peut soit rester géré manuellement par Supercluster (déjà en JS pur, réutilisable tel quel), soit être délégué au clustering natif des sources GeoJSON de Mapbox GL JS (`cluster:true` sur la source) — ce serait une simplification, mais changerait la logique de `updateMarkers`/`renderedMarkers` en profondeur. Les marqueurs SVG data-URI (`mkIconUrl`, `clusterIconUrl`) sont réutilisables tels quels comme images de `map.loadImage`/`map.addImage` ou comme `mapboxgl.Marker` DOM.

---

## 5. Logique filtres

Tous les filtres opèrent **côté client** sur le tableau `SCHOOLS` déjà entièrement chargé en mémoire (pas de requête Supabase par filtre) ; `renderList()` est le point d'entrée unique qui réapplique la chaîne complète à chaque changement d'état.

### 5.1 Filtre Permis (`setPermit` / `permitFilter`)

`select#permit-select` → `setPermit(v)` met à jour `permitFilter` puis appelle `renderList()`. Dans `renderList()` : `if(permitFilter!=='all') list=list.filter(s=>s.permits.includes(permitFilter))`. Options : `all` / `B` / `AAC` / `Moto`.

### 5.2 Tri (`setSort` / `currentSort`)

`select#sort-select` → `setSort(v)` mêmes principes. Branches dans `renderList()` :
```js
score:   list.sort((a,b)=>b.score-a.score)
rating:  list.sort((a,b)=>b.rating-a.rating)
success: list.sort((a,b)=>b.success-a.success)
price:   list.sort((a,b)=>(a.price_min||9999)-(b.price_min||9999))  // ⚠ no-op : `price_min` n'existe sur aucun objet école (formatSchool ne le produit pas) — ce tri n'a actuellement aucun effet observable
slots:   list.sort((a,b)=>b.slots-a.slots)
all:     pas de tri (ordre = ordre serveur, flexi_score décroissant, hérité de loadSchools())
```

### 5.3 Recherche par ville (géocodage Nominatim)

Deux champs de recherche distincts et indépendants :
- **Topbar (`#si`)** : sur `input`, filtre local instantané (nom/ville, 4 résultats max) affiché immédiatement, **puis** (debounce 400ms) appel à l'API Nominatim (`nominatim.openstreetmap.org/search?q=<query>+France&format=json&limit=3&countrycodes=fr&accept-language=fr`, header `User-Agent: FlexiAuto/1.0`) pour les résultats "lieux" (villes, départements). `renderSearchDD(localRes, geoRes)` fusionne les deux listes dans le dropdown `#sdd`, sous deux groupes ("Auto-écoles" / "Villes & lieux"). Clic sur un résultat local → `searchGo(id)` (bascule carte + `focusSchool`) ; clic sur un lieu géocodé → `zoomToPlace(lat,lng,bbox)` (bascule carte + `fitBounds` sur le bbox retourné par Nominatim, ou `panTo`+`setZoom(12)` si pas de bbox).
- **Sidebar (`#sidebar-input`)** : filtre texte purement local (pas de géocodage), met à jour `sidebarQuery` et relance `renderList()` — filtre sur `s.name`/`s.city` en minuscules.

### 5.4 Rayon géographique (`input#radius-slider`)

Slider à 6 crans (`RADIUS_VALUES=[0,10,25,50,100,200]` km, `value` = index 0–5). Sur `input` : met à jour `radiusKm`, le libellé (`#radius-val`, "National" si 0 sinon "Nkm"), et le dégradé de fond du slider (proportionnel à la position). Si `radiusKm>0` et que la position utilisateur n'est pas encore connue, appelle `navigator.geolocation.getCurrentPosition()` (une seule fois, résultat mis en cache dans `userLat`/`userLng`) avant de relancer `renderList()` ; sinon relance `renderList()` directement. Dans `renderList()` : `if(radiusKm>0 && userLat) list=list.filter(s=>haversine(userLat,userLng,s.lat,s.lng)<=radiusKm)`. `haversine()` calcule la distance orthodromique classique (rayon terrestre 6371km).

---

## 6. Design system appliqué

*(Synthèse de ce qui est **réellement implémenté** dans `index.html` — pour l'intention design complète, voir DESIGN.md.)*

### 6.1 Couleurs (variables CSS `:root`)

```css
--bg:#f4fbff; --bg2:#ffffff; --bg3:#e8f5fb;
--surface:rgba(255,255,255,0.88); --surface2:rgba(255,255,255,0.96);
--blue:#1976d2; --blue2:#0d5fb3; --blue3:#4aa3e5; --blue-lt:#0f5f9f;
--emerald:#6fbf73; --emerald2:#4f9b57; --emerald-lt:#2f7d42;
--amber:#e5a72f; --amber-lt:#8a620f;
--violet:#7e8fc5; --violet-lt:#53679c;
--text:#17324d; --text2:#2e536f; --muted:#7b91a3; --muted2:#5f7588;
--border:rgba(25,118,210,0.15); --border-blue:rgba(25,118,210,0.36); --border-em:rgba(111,191,115,0.38);
--shadow: 0 18px 46px rgba(31,86,125,0.16), 0 2px 10px rgba(31,86,125,0.08);
```
Ces valeurs correspondent exactement à la palette documentée dans DESIGN.md (`Bleu Confiant` #1976d2, `Vert Sauge` #6fbf73, `Ambre Chaleureux` #e5a72f). Le bleu du bloc "Code de la route" (`#1B4FD8`) est une couleur ponctuelle hors palette, propre à ce composant (choix explicite validé hors DESIGN.md lors d'une tâche précédente).

### 6.2 Police

Une seule famille : `'Inter', sans-serif`, chargée en poids 400/500/600/700/800 via Google Fonts. Aucun autre `font-family` dans le fichier (conforme à la "Règle du Family Unique" de DESIGN.md).

### 6.3 Classes CSS importantes

| Classe/préfixe | Zone |
|---|---|
| `.topbar-wrap`, `#header`, `.search-wrap`, `.h-nav`, `.h-btn*` | Topbar |
| `.cdr-banner*` | Bandeaux Code de la route (partagé entre pages) |
| `#page-home`, `.hero-*`, `.home-footer` | Accueil |
| `#page-carte`, `.sidebar*`, `.back-btn`, `#recenter-btn` | Carte + panel gauche |
| `.s-card`, `.s-av`, `.s-nm`, `.s-ct`, `.s-score`, `.s-kpi*`, `.badge-slots*` | Carte auto-école (sidebar) |
| `.mk`, `.mk-ring`, `.mk-body`, `.mk-tooltip` | Marker "voiture" (DOM, non utilisé directement par Maps — cf. note ci-dessous) |
| `.cluster-list*` | HTML de liste de cluster généré par `clusterPopupHTML` (code mort, §3) |
| `#page-fiche`, `.f-*`, `.sec-title`, `.formule*` | Page fiche détaillée |
| `#page-login`, `.login-*`, `.field`, `.rem-row` | Modale de connexion (non affichée actuellement, §1.7) |
| `.gm-style*`, `.marker-cluster*` | Overrides du CSS natif Google Maps |

Note : les classes `.mk*` (marker "voiture" en DOM/CSS avec anneau de pulsation animé) sont définies dans le CSS mais les markers réels sont rendus comme icônes **SVG data-URI** via `mkIconUrl()`/`clusterIconUrl()` — pas comme `AdvancedMarkerElement` DOM. Ces classes CSS documentent l'intention visuelle du composant "marker" (cf. DESIGN.md §5 "Markers de carte") mais ne sont pas directement appliquées à un élément DOM dans l'implémentation Google Maps `Marker` classique actuelle.

### 6.4 Variables CSS de layout

```css
--chrome-height: 62px;        /* hauteur fixe de la topbar seule */
--carte-chrome-height: 62px;  /* topbar + bandeau carte si visible, recalculé en JS */
```
Recalculées par `updateChromeHeight()` (§3) à chaque changement de page ou de fermeture de bandeau. Consommées par :
```css
.sidebar{top:calc(var(--carte-chrome-height) + 12px)}
.back-btn{top:calc(var(--carte-chrome-height) + 12px)}
#recenter-btn{top:calc(var(--carte-chrome-height) + 58px)}
.cdr-banner{top:var(--chrome-height)}
```
Ce mécanisme est le point d'ancrage de tout le layout fixe de la page carte — à préserver tel quel dans une réécriture pour ne pas casser le positionnement sidebar/boutons quand les bandeaux apparaissent/disparaissent.

### 6.5 Dette design connue

Le fichier contient un second bloc de règles CSS (commentaire `/* RELOOK PRINTEMPS CLAIR */`, ligne ~334) qui **redéfinit** par-dessus les styles du premier bloc (topbar, boutons, sidebar, markers, popups...) pour appliquer la palette claire "printemps" actuelle. C'est une superposition historique (glassmorphism sombre initial → thème clair actuel) plutôt qu'un système propre en une passe — à assainir/fusionner en un seul bloc de règles lors d'une réécriture, sans changer le rendu visuel final.

---

## 7. Pages annexes

### 7.1 `savoir-plus.html`

Page statique indépendante (pas de SPA, pas de Supabase, pas de carte). Structure : bandeau `.cdr-banner#cdr-savoir-banner` sous une topbar minimale (`#header` simplifié : logo → `index.html`, "En savoir plus" → self, "Se connecter" → URL externe), hero sombre (dégradé `#0F172A`→`#1E3A5F`, badge, titre à accent bleu `#60A5FA`), puis 2 colonnes ("Pour les élèves" / "Pour les auto-écoles") listant 4 arguments chacune avec un bouton CTA :
- Colonne élèves → `window.location.href='index.html?go=carte'` (le paramètre `?go=carte` est lu par `bootMap()` dans `index.html` pour ouvrir directement la page carte).
- Colonne auto-écoles → `alert('Fonctionnalité bientôt disponible !')`.

Script local : gestion du bandeau (`dismissCdrBanner()`, clé `cdr-savoir-closed`), indépendant du script principal d'`index.html`.

### 7.2 `site-inexistant.html`

Page statique minimale affichée quand `window.visitWebsite(url)` est appelée avec une URL vide (école sans site web). Contient la même topbar minimale que les autres pages annexes (logo, "En savoir plus", "Se connecter") et un message "Ce site internet n'existe pas encore" + bouton retour (`href="index.html"`). **Utilise encore l'ancien pattern de bandeau** (`.topbanner` positionné au-dessus du header, classes `topbanner`/`topbanner-cta`/`topbanner-close`, clé localStorage `fa_topbanner_dismissed`) — non aligné avec le pattern `.cdr-banner` actuel d'`index.html`/`savoir-plus.html` (écart volontaire, hors périmètre des dernières tâches de restructuration des bandeaux).

### 7.3 `inscription.html`

Page statique minimale affichée par `window.sInscrire()` (bouton "S'inscrire" du popup carte). Même structure que `site-inexistant.html` : topbar minimale + ancien pattern `.topbanner` + message "Inscription — Fonctionnalité bientôt disponible" + bouton retour vers `index.html`. Aucune logique métier, formulaire non implémenté.

---

## 8. Déploiement

- **Commande** : `vercel --prod` (ou `npx vercel --prod`, car `vercel` est une dépendance locale du projet — pas d'installation globale — voir `package.json`).
- **URL de production** : https://flexiauto-site.vercel.app
- **Configuration Vercel** : pas de `vercel.json` (aucune config de build/rewrites custom) — déploiement statique par défaut, les fichiers `.html` à la racine sont servis tels quels. Projet lié via `.vercel/project.json` : `projectId: prj_8fceDlW5gZkAxZwWNJNPW37aRpQL`, `orgId: team_zTDuY2mgDlvmwxuAlMZZiFJK`, `projectName: flexiauto-site`.
- **Pas de build step** : aucun bundler, aucune transpilation — les fichiers HTML sont servis directement, les seules dépendances externes sont chargées via CDN au runtime (§ "Librairies chargées" ci-dessus).
- **Environnement local** : test via serveur statique simple (ex. `python3 -m http.server 8080`), pas de dev server dédié au projet.
