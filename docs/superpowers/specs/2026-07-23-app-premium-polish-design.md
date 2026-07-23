# App Premium Polish — Design

## 1. Contexte

L'app (25 tâches du plan principal, entièrement implémentée et revue) fonctionne correctement, mais l'utilisateur a remonté deux problèmes en l'utilisant en local :
- **Aucune classe responsive n'existe nulle part dans le code** — confirmé en grep : zéro `sm:`/`md:`/`lg:` dans tout `src/`. Le spec principal exigeait pourtant une UI responsive (section 2 : "responsive, utilisable aussi bien sur ordinateur que sur mobile"). Ce n'était simplement jamais devenu une tâche concrète dans le plan d'exécution.
- **L'app paraît "moins premium" que les mockups d'origine** (`.superpowers/brainstorm/1148-.../`, direction "Emerald Terminal") : pas d'icônes cohérentes (quelques SVG à la main + des caractères `•` `●` `○` en guise d'icônes), une seule couleur d'accent utilisée partout sans distinction sémantique, un graphique sans relief, et surtout — chaque nouveau compte démarre **entièrement vide**, ce qui fait paraître le produit inachevé indépendamment du style.

Ce chantier couvre les trois en une seule passe : responsive, polish visuel, données de démo. Il est indépendant du chantier "landing page" (spec du 2026-07-23, déjà implémenté) — ils ne partagent que `lucide-react` et la pile de police système de base, pas la palette de couleur (l'app garde son thème Emerald Terminal vert, la landing page garde son identité marine/corail séparée).

## 2. Système visuel

### 2.1 Icônes

Remplacer tous les SVG à la main et caractères Unicode (`•`, `●`, `○`) par `lucide-react` (déjà une dépendance du projet depuis le chantier landing page). Mapping :

| Usage | Icône lucide-react |
|---|---|
| Logo app (sidebar) | *(garde le tracé SVG existant — identité de marque, pas une icône fonctionnelle)* |
| Nav — Dashboard | `LayoutDashboard` |
| Nav — Heatmaps | `LayoutGrid` |
| Nav — Erreurs | `AlertTriangle` |
| Nav — Trades (journal) | `BookOpen` |
| Nav — Stratégies | `BarChart3` |
| Nav — Instruments | `Coins` |
| Nav — Checklist | `ClipboardCheck` |
| Nav — Outils/Calculateur | `Calculator` |
| Theme toggle (dark) | `Moon` |
| Theme toggle (light) | `Sun` |
| Compte (TopBar) | `UserCircle` |
| Supprimer (instruments/stratégies) | `Trash2` — icône + texte existant, pas icône seule |
| Upload capture d'écran | `Upload` |
| Menu mobile (hamburger) | `Menu` / `X` (même paire que la landing page) |
| Dashboard — stat cards (win rate / profit factor / espérance / streak) | `TrendingUp` / `Target` / `Scale` / `Flame` respectivement |

Icônes des `StatCard` : petite pastille arrondie (fond `accent-dim`/`info-dim`/`warning-dim` selon la sémantique de la carte, cf. 2.2), même traitement que les cartes de fonctionnalités de la landing page.

### 2.2 Couleurs — deux tokens supplémentaires, sens fixe

L'app garde son système de tokens CSS existant (`--color-*`, dark + light, cf. spec principal section "Global Constraints"). Deux tokens s'ajoutent, chacun avec un seul sens partout où il apparaît — jamais de gris sur une valeur ou une icône :

- **`info`** (bleu) — donnée neutre/informative, ni bonne ni mauvaise dans l'absolu (profit factor, espérance). Remplace le gris utilisé aujourd'hui sur ces cartes.
  - Dark : `#60a5fa`, dim `rgba(96,165,250,0.14)`
  - Light : `#2563eb`, dim `rgba(37,99,235,0.10)`
- **`warning`** (ambre) — palier d'attention avant une limite de perte (dès 70% d'une limite utilisée), avant le rouge à 100%.
  - Dark : `#fbbf24`, dim `rgba(251,191,36,0.14)`
  - Light : `#d97706`, dim `rgba(217,119,6,0.10)`

`gain`/`loss`/`accent` existants gardent leur sens actuel (positif / négatif-alerte / marque). Répartition des couleurs sur le dashboard : Win rate = `gain` (métrique de performance), Profit factor & Espérance = `info` (neutres), Streak = `gain` si positif / `loss` si négatif (déjà le comportement actuel, inchangé).

Barres de limite de perte : `accent`/`gain` en dessous de 70% d'utilisation, `warning` de 70% à 99%, `loss` à 100% et au-delà.

### 2.3 Badges de classe d'actif (catégoriel, pas sémantique)

Dans la liste d'instruments (et réutilisé partout où un instrument est affiché avec sa classe, ex. liste de trades), un badge pastille indique la classe d'actif. Ces couleurs sont **catégorielles** (distinguer des types), pas sémantiques (bon/mauvais) — un système de couleur différent de 2.2, à ne pas confondre :

- Forex : bleu (réutilise `info`)
- Crypto : ambre (réutilise `warning`)
- Commodity (matière première) : violet — nouveau token `asset-commodity`, dark `#c4b5fd` / light `#7c3aed`
- Index : turquoise — nouveau token `asset-index`, dark `#5eead4` / light `#0d9488`
- Other : pas de couleur, texte neutre (`text-muted`)

### 2.4 Graphique de courbe d'équité

`EquityCurveChart` (dashboard) : ajouter un remplissage en dégradé sous la ligne (actuellement une ligne nue), même traitement que la landing page — un `<linearGradient>` de `var(--color-accent)` à transparent, `stop-opacity` 0.22 → 0.

## 3. Responsive

Cible : desktop → mobile complet (~375px), contrairement à la landing page qui s'arrêtait à la tablette — c'est l'app elle-même que l'utilisateur ouvre déjà sur son téléphone.

### 3.1 Sidebar / navigation

En dessous de 768px (`md`), la sidebar fixe (224px) disparaît entièrement, remplacée par une icône hamburger dans la `TopBar` qui ouvre un panneau glissant (même structure de nav, réutilisant `NAV_GROUPS`) — même pattern que `LandingNav` de la landing page. Au-dessus de 768px, comportement actuel inchangé.

### 3.2 Tableau des trades

En dessous de 640px (`sm`), le tableau (`<table>`, colonnes Date/Instrument/Sens/P&L) devient une liste de cartes empilées — une carte par trade, date + instrument en haut, sens + P&L en dessous, même lien vers le détail du trade. Au-dessus de 640px, tableau inchangé. Les filtres (`TradeFilters`) passent en colonne unique sous 640px au lieu d'une ligne.

### 3.3 Heatmaps

Les grilles (jusqu'à 12 colonnes pour la vue mensuelle) ne peuvent pas s'empiler en cartes. En dessous de 768px : la grille devient scrollable horizontalement (`overflow-x-auto`), la première colonne (nom de l'instrument) reste fixe pendant le scroll (`position: sticky; left: 0`) pour garder le contexte.

### 3.4 Autres pages (CRUD instruments/stratégies/checklist, settings, calculateur)

Ces pages sont déjà des formulaires/listes simples en une colonne (`max-w-lg`/`max-w-2xl`) — pas de restructuration nécessaire, seulement vérifier qu'aucun élément ne force une largeur minimale supérieure à 375px (audit rapide, pas de changement de structure attendu).

## 4. Données de démo

### 4.1 Déclenchement

Auto-remplies à l'inscription (dans `registerAction`, après la création du compte et le seed des règles de checklist par défaut) — pas d'étape opt-in, le nouvel utilisateur voit immédiatement un dashboard peuplé. Une bannière apparaît sur le dashboard tant que le compte contient des données de démo : *"Ce sont des données d'exemple — explore librement l'app. [Tout effacer et repartir de zéro]"*.

Traçabilité : les tables `instruments`, `strategies` et `trades` reçoivent chacune une colonne `is_demo` (boolean, `not null default false`) — nécessite une migration Drizzle. Chaque ligne créée par le seed de démo met `is_demo = true`; tout ce que l'utilisateur crée ensuite via les pages CRUD normales garde `false` (les server actions existantes n'ont rien à changer, `false` est déjà leur comportement par défaut implicite). Le bouton "Tout effacer" supprime, pour l'utilisateur courant uniquement, toutes les lignes `is_demo = true` des trois tables (trades d'abord, puis instruments/stratégies, pour respecter les clés étrangères) — jamais les lignes que l'utilisateur a créées lui-même, même si elles portent le même nom qu'une entrée de démo. La bannière du dashboard s'appuie sur un simple test "existe-t-il au moins un trade `is_demo = true` pour cet utilisateur ?" pour savoir si elle doit s'afficher.

### 4.2 Contenu

Générées par une fonction de seed dédiée (liste de trades fixe et déterministe, pas de génération aléatoire — reproductible et testable) :
- 3 instruments : un forex, un crypto, une matière première (couvre 3 des 4 badges de classe d'actif de la section 2.3).
- 2 stratégies.
- ~15-20 trades fermés, étalés sur le dernier mois glissant à partir de la date d'inscription, mélange long/short sur les deux instruments et les deux stratégies.
- Taux de réussite visé ~55-60% (assez pour un dashboard "vivant" et crédible, pas 100% qui semblerait artificiel).
- Quelques trades (environ un quart) avec une ou deux erreurs de checklist cochées, pour que la page Erreurs ne soit pas vide non plus.
- Le contenu exact (prix, dates, labels) est un détail d'implémentation à fixer dans le plan — cette section décrit la forme et les statistiques cibles, pas les valeurs littérales.

## 5. Hors scope (cette passe)

- Mobile complet pour la landing page (déjà scopée à desktop+tablette dans son propre spec — inchangé).
- Vercel Blob / upload de captures d'écran (bloqué en attente d'un token, sujet séparé).
- Toute nouvelle fonctionnalité produit — cette passe est uniquement visuelle/responsive/démo, aucune nouvelle page ni logique métier.
