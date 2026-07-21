# Journal de Trading — Design

> Nom de travail : **« Journal »**. Le nom définitif du projet est reporté à plus tard ; à remplacer partout une fois choisi.

## 1. Contexte et objectifs

Application web de journal de trading. Usage personnel dans un premier temps, mais conçue comme un vrai produit SaaS premium destiné à être ouvert à d'autres traders (page marketing avec inscription dès la v1, cf. section 7).

Marchés tradés : forex, matières premières, crypto, indices (et autres CFD/futures) — le modèle de données ne doit pas être figé à un seul type d'actif.

Trois objectifs à couvrir dès la v1, à poids égal :
- **Discipline & psychologie** : identifier les erreurs récurrentes (revenge trading, non-respect du plan, etc.).
- **Analyse de performance statistique** : win rate, profit factor, R moyen, performance par stratégie/instrument/jour/durée.
- **Centralisation** : un seul endroit propre pour consigner chaque trade (remplace Excel/notes/captures éparpillées).

Accès requis depuis ordinateur et téléphone, avec les mêmes données partout → exclut une solution 100% locale (navigateur uniquement) ; une vraie base de données en ligne est nécessaire.

Inspiration (pas copie) tirée de captures d'écran d'un outil existant orienté prop-traders : cf. sections 5 et 6 pour ce qui en a été retenu.

## 2. Architecture

- **Application** : Next.js (React), une seule app gérant pages et routes API.
- **Hébergement** : Vercel, déploiement automatique à chaque push sur GitHub.
- **Base de données** : Neon (Postgres serverless), accédée via un ORM léger (Drizzle).
- **Authentification** : Auth.js (NextAuth), connexion email/mot de passe (ou magic link). Toutes les données sont scopées par `user_id`, ce qui permet le multi-utilisateurs sans changement de schéma.
- **Stockage des fichiers** : Vercel Blob, pour les captures d'écran attachées aux trades.
- **Internationalisation (i18n)** : Français + Anglais dès la v1, sur l'app et la landing page (sélecteur de langue). Nécessite une librairie d'i18n pour Next.js (ex: next-intl) et des routes localisées.
- **UI** : responsive, utilisable aussi bien sur ordinateur que sur mobile (site web, pas d'app native).

Toute la stack reste sur des paliers gratuits à l'échelle d'un usage personnel/petit groupe (le paiement réel n'étant pas encore branché, cf. section 7.3).

## 3. Modèle de données

Toutes les tables ci-dessous (sauf `users`) sont scopées par `user_id`.

**users**
- id, email, password_hash (géré par Auth.js), created_at
- `locale` : langue préférée (fr | en), déduite du navigateur à l'inscription, modifiable
- `account_balance` : solde de compte actuel, mis à jour manuellement — sert de valeur par défaut au calculateur de taille de position
- `default_risk_percent` : optionnel, % de risque par défaut proposé dans le calculateur
- `daily_loss_limit`, `weekly_loss_limit`, `monthly_loss_limit` : limites de perte personnelles optionnelles (en devise du compte), pour les barres de suivi du dashboard (section 5)

**instruments** (CRUD géré par l'utilisateur)
- id, user_id, name (ex: EUR/USD, XAU/USD, BTC/USD), asset_class (forex | commodity | crypto | index | other)
- `point_value` : valeur en devise du compte d'un mouvement d'un point/pip, pour la taille de position habituelle de l'utilisateur. Sert au calcul automatique du P&L et au calculateur de taille de position.
- created_at

**strategies** (CRUD géré par l'utilisateur)
- id, user_id, name, description (optionnelle), created_at

**checklist_rules** (CRUD géré par l'utilisateur, pré-rempli avec un jeu de règles courantes à la création du compte, ex: "Plan respecté", "Pas de revenge trading", "Taille de position correcte", "Stop loss placé avant l'entrée")
- id, user_id, label, active (bool — permet de retirer une règle sans casser l'historique), display_order, created_at

**trades**
- id, user_id, instrument_id (FK), strategy_id (FK, nullable)
- direction (long | short)
- entry_price, exit_price (nullable si trade encore ouvert), quantity
- stop_loss_price (nullable), take_profit_price (nullable)
- entered_at (datetime), exited_at (datetime, nullable)
- status (open | closed)
- `pnl_amount` : résultat net en devise du compte, calculé automatiquement (`(exit_price - entry_price) * quantity * instrument.point_value`, signe inversé si `direction = short`), modifiable manuellement (`pnl_override: bool`)
- `risk_amount` : calculé automatiquement (`|entry_price - stop_loss_price| * quantity * instrument.point_value`), modifiable manuellement
- `r_multiple` : calculé, `pnl_amount / risk_amount` (non stocké si `risk_amount` nul/absent)
- notes (texte libre, nullable)
- created_at, updated_at

**trade_checklist_responses** (table de jointure)
- id, trade_id (FK), checklist_rule_id (FK), checked (bool)
- `phase` : quand `checked = true`, phase du trade où l'erreur/le point a été observé (pré-entrée | entrée | gestion | sortie), nullable — alimente l'onglet Erreurs (section 5.3)

**trade_screenshots**
- id, trade_id (FK), url (Vercel Blob), caption (optionnel, ex: "avant"/"après"), created_at

## 4. Calcul du résultat, du risque et taille de position

Calcul **semi-automatique** (décision actée) :

- Chaque instrument a une `point_value` configurée une fois par l'utilisateur.
- `pnl_amount` et `risk_amount` sont calculés automatiquement à partir des prix (entrée/sortie/stop), de la quantité et de cette valeur de point.
- L'utilisateur peut toujours **corriger manuellement** le résultat final si besoin (frais, swap, taille non standard).
- Le R-multiple est dérivé automatiquement (`pnl_amount / risk_amount`).

**Calculateur de taille de position** (page indépendante ET intégré/réutilisable dans la fiche trade) :
- Entrées : solde du compte (pré-rempli depuis `users.account_balance`), % de risque souhaité (ou montant fixe), instrument (pour `point_value`), distance du stop loss.
- Sortie : quantité suggérée = `risk_amount / (stop_distance * point_value)`.
- Dans la fiche trade, ce calcul peut pré-remplir le champ `quantity`.

## 5. Pages et fonctionnalités de l'app

### 5.1 Authentification
- `/login`, `/register` (Auth.js). L'inscription crée un compte directement utilisable (aucune restriction fonctionnelle en v1 — la logique d'essai/abonnement réelle arrive avec l'intégration Stripe future, cf. section 7.3).

### 5.2 Dashboard (`/dashboard`)
Enrichi suite à l'analyse des captures d'inspiration :
- Cartes de stats : win rate, profit factor, R moyen (espérance), drawdown courant/max, P&L cumulé, fréquence de trades (par jour/semaine/mois), séries de gains/pertes (max/moy).
- **Barres de limite de perte** : jour/semaine/mois, comparant la perte courante de la période aux limites définies dans les paramètres utilisateur (`daily_loss_limit`, etc.) — aide à la discipline, purement informatif (pas de blocage de saisie).
- Equity curve (P&L cumulé en R ou en devise, au choix) avec sélecteur de période (1M/3M/6M/1Y/YTD/Tout).
- Performance par stratégie et par instrument.
- Calendrier heatmap des jours gagnants/perdants.
- **Heatmaps de performance croisées** : Symbole × Jour de la semaine, Symbole × Durée du trade, Symbole × Mois — aucune nouvelle saisie requise, calculées à partir des champs déjà enregistrés (`entered_at`, `exited_at`, `instrument_id`, `pnl_amount`).

### 5.3 Onglet Erreurs (`/erreurs`)
Évolution de la simple checklist de discipline en véritable module d'analyse (remplace/complète le CRUD `/checklist`) :
- Total d'erreurs enregistrées, nombre de catégories actives, catégorie la plus fréquente, % de trades avec au moins une erreur.
- Répartition par catégorie (bar chart).
- Répartition par phase du trade (pré-entrée / entrée / gestion / sortie), via le champ `phase` de `trade_checklist_responses`.

### 5.4 Journal (`/trades`)
Liste des trades, filtrable/triable (date, instrument, stratégie, résultat), recherche.

### 5.5 Fiche trade (`/trades/new`, `/trades/[id]`)
Tous les champs (instrument, prix, quantité, stratégie), checklist de discipline (avec sélection de phase par item coché), notes libres, upload de captures d'écran, calculateur de taille de position intégré.

### 5.6 Gestion
- `/strategies` — CRUD des stratégies
- `/instruments` — CRUD des instruments (avec `point_value`)
- `/checklist` — CRUD des règles de discipline (alimente l'onglet Erreurs)
- `/tools/position-size-calculator` — calculateur en page indépendante
- `/settings` — solde du compte, % de risque par défaut, limites de perte, langue, profil

### 5.7 Reporté (hors v1)
Deux fonctionnalités repérées dans les captures d'inspiration, jugées trop lourdes pour la v1 (cf. section 8) :
- **Module d'optimisation** : recommandations "à ne plus trader" basées sur un backtest par instrument (validation sur plusieurs périodes, comparaison avant/après). Nécessite un vrai moteur de backtesting.
- **Calendrier économique** : annonces macro filtrables par impact/devise. Nécessite une source de données tierce à intégrer et maintenir.

## 6. Identité visuelle & marque

Direction validée après itérations visuelles : premium, sombre, contrasté.

L'app propose **deux thèmes (sombre par défaut, clair en option)** avec bascule manuelle — décision qui annule et remplace le "100% dark theme, pas de mode clair" envisagé plus tôt. Chaque thème est pensé séparément (pas une inversion brute des couleurs) pour rester premium dans les deux cas ; tous les composants doivent utiliser des tokens de couleur (variables), jamais de couleurs codées en dur, pour que la bascule fonctionne partout sans exception.

**Thème sombre (par défaut)**
- Fond : graphite très sombre (`#0b0d10` fond principal, `#0d0f13` panneau de la barre latérale, `#12151a` cartes/surfaces élevées, `#171b21` sous-éléments), bordures fines `rgba(255,255,255,0.07)`.
- Accent d'identité : émeraude/teal (`#10b981`) — logo, état actif de la navigation, courbes de graphique, badges.
- Boutons d'action principaux : blanc pur (`#ffffff` sur texte `#0b0d10`) — fort contraste, look "premium SaaS" (référence Linear/Stripe), distinct de l'accent d'identité.
- Couleurs sémantiques : vert (`#34d399`) pour les gains, rouge/rose (`#fb7185`) pour les pertes.
- Texte : `#f3f4f6` (principal), `#8b93a1` (atténué), `#565d6b` (très atténué, labels de groupe).

**Thème clair**
- Fond : blanc cassé à légère dominante froide (`#eef1f0` fond principal, `#e6eae8` panneau de la barre latérale, `#ffffff` cartes/surfaces — les cartes ressortent en blanc pur sur le fond légèrement teinté), bordures `rgba(13,23,20,0.09)`.
- Accent d'identité : émeraude assombri (`#059669`, pas le même hex que le sombre) pour rester lisible sur fond clair.
- Boutons d'action principaux : encre foncée (`#10171a` sur texte `#eef1f0`) — l'inversion du bouton blanc-sur-sombre, pas une simple réutilisation de l'accent.
- Couleurs sémantiques : vert (`#15803d`) pour les gains, rouge (`#dc2626`) pour les pertes — assombris par rapport au thème sombre pour le contraste sur blanc.
- Texte : `#10171a` (principal), `#5b6b66` (atténué), `#93a29c` (très atténué).

*(Une variante avec accent corail `#ffa361` a été explorée et écartée au profit de l'émeraude, avant l'ajout du thème clair.)*

- **Typographie** : sans-serif géométrique moderne (ex: Inter ou Geist).
- **Logo** : silhouette de carnet aux coins arrondis, fine ligne d'en-tête, courbe ascendante (type coche de progression) à l'intérieur — évoque à la fois "journal" et "progression". Testé et lisible à taille favicon.
- **Bascule de thème** : accessible depuis n'importe quelle page (voir navigation, section 5.1bis), préférence mémorisée (cookie ou stockage local), démarre en sombre par défaut pour un nouveau compte.

### 6.1 Navigation de l'app (barre latérale)

Élément partagé par toutes les pages authentifiées (absent des versions précédentes de cette spec — corrigé après relecture visuelle) :

- **Barre latérale gauche persistante**, regroupée par sens :
  - *Aperçu* : Dashboard, Heatmaps, Erreurs
  - *Journal* : Trades
  - *Configuration* : Stratégies, Instruments, Checklist
  - *Outils* : Calculateur de taille de position
  - En bas : widget **"Aujourd'hui"** (P&L du jour + % de la limite de perte journalière utilisée), visible depuis n'importe quelle page.
- **Ligne utilitaire en haut à droite du contenu** (pas une barre de navigation complète, juste des contrôles de compte) : bascule thème clair/sombre, sélecteur de langue FR/EN, menu compte (avatar → accès à Paramètres, déconnexion).
- Chaque page garde son propre titre en haut de son contenu (pas de barre de titre globale redondante).

## 7. Landing page

Objectif : **vraie page marketing avec inscription**, connectée à l'authentification de l'app (pas juste une vitrine).

### 7.1 Structure (dans l'ordre)
1. **Nav** : logo + nom, liens (Fonctionnalités, Pricing, Avis, FAQ), sélecteur de langue (FR/EN), "Se connecter", CTA "Essai gratuit 14 jours".
2. **Hero** : accroche, sous-titre, CTA principal + secondaire ("Voir un aperçu").
3. **Fonctionnalités clés** : cartes présentant Dashboard complet, Suivi des erreurs, Heatmaps de performance, Calculateur de taille de position.
4. **Comment ça marche** : 4 étapes (Crée ton compte → Enregistre tes trades → Suis tes stats & erreurs → Progresse).
5. **Avis clients** — voir 7.2.
6. **Pricing** — voir 7.3.
7. **FAQ**.
8. **Bande CTA finale** + **Footer** (liens légaux, contact).

### 7.2 Avis clients — traitement obligatoire
Le produit n'a pas encore d'utilisateurs réels. Pour ne pas tromper les visiteurs :
- Les témoignages affichés sont **fictifs mais explicitement indiqués comme tels** (mention visible "Exemple" / "Démo" sur chaque carte, et un bandeau au-dessus de la section précisant qu'il s'agit d'un aperçu de format en attendant de vrais retours).
- À remplacer par de vrais avis dès que disponibles ; ne jamais présenter les exemples comme des retours authentiques.

### 7.3 Pricing — affichage uniquement en v1
Structure retenue : **essai gratuit de 14 jours**, puis au choix :
- **Mensuel** : 5€/mois
- **À vie** : 99€ paiement unique

**Important — portée v1** : ce pricing est **affiché mais pas fonctionnel**. L'inscription crée un compte utilisable normalement, sans collecte de paiement réelle et sans expiration forcée après 14 jours. L'intégration Stripe réelle (webhooks, statuts d'abonnement, page de gestion de facturation, CGV/politique de remboursement, TVA éventuelle) est explicitement reportée à une phase ultérieure, une fois le reste du produit validé (cf. section 8).

**Devise** : pricing affiché en EUR par défaut, avec un sélecteur EUR/USD/FCFA au-dessus des cartes de prix pour un affichage indicatif dans ces devises. La conversion utilise un **taux fixe codé en dur, mis à jour manuellement de temps en temps** — pas de taux de change en temps réel (cohérent avec l'absence de paiement réel branché). Cette conversion multi-devises concerne uniquement la landing page ; l'app elle-même reste en euros pour l'instant (compte de trading mono-devise, cf. section 8).

### 7.4 Langue
Landing page et app entièrement bilingues **français + anglais** dès la v1 (sélecteur de langue, tout le contenu traduit dans les deux langues).

## 8. Gestion des erreurs et cas limites

- Validation des formulaires : champs obligatoires (instrument, sens, dates), valeurs numériques cohérentes (prix > 0, quantité > 0).
- Suppression d'une stratégie ou d'un instrument déjà utilisé par des trades existants : suppression bloquée (ou confirmation explicite requise).
- États vides : message clair + appel à l'action quand il n'y a pas encore de trade / stratégie / instrument / règle de checklist.
- Captures d'écran : limite de taille/format (JPG/PNG, quelques Mo max), message d'erreur clair si dépassement.
- Authentification : session expirée → redirection propre vers la page de connexion.
- Division par zéro : si `risk_amount` est nul (pas de stop loss renseigné), le R-multiple n'est pas calculé/affiché.
- Landing page : bascule de langue/devise sans perte d'état de la page (pas de rechargement complet nécessaire pour la devise, qui est un simple changement d'affichage côté client).

## 9. Approche de test

Projet solo à ce stade : effort de test ciblé plutôt qu'une couverture exhaustive.

- **Tests unitaires automatisés** sur toute la logique de calcul : `pnl_amount`, `risk_amount`, `r_multiple`, calculateur de taille de position, agrégations du dashboard (win rate, profit factor, equity curve, heatmaps, regroupements par stratégie/instrument/jour/mois/durée), conversion de devise indicative sur la landing page.
- **Test manuel** pour les pages et l'UI au fil du développement. Pas de suite de tests end-to-end automatisée pour cette v1.

## 10. Hors périmètre pour la v1

- Partage/invitation multi-utilisateurs en tant que fonctionnalité (l'architecture le permet via `user_id` partout, mais aucune UI de partage/équipe en v1).
- Import CSV/API depuis un broker et synchronisation automatique (EA MT4/MT5, OAuth cTrader, import TradingView) — saisie manuelle uniquement en v1. Gros chantier technique envisageable plus tard une fois la v1 validée.
- Module d'optimisation (recommandations "à ne plus trader" basées sur backtest) — cf. 5.7.
- Calendrier économique — cf. 5.7.
- **Facturation réelle (Stripe)** : le pricing de la landing page est affiché mais non fonctionnel en v1 (cf. 7.3). Pas de webhooks, pas de gestion d'abonnement, pas de collecte de paiement.
- **Conversion de devise en temps réel** : seule une conversion indicative à taux fixe (mis à jour manuellement) est proposée sur la landing page. Pas de gestion multi-devises dans l'app elle-même (compte de trading mono-devise, EUR).
- Vrais avis clients : remplacés par des exemples clairement indiqués comme tels (cf. 7.2), en attendant de vrais retours utilisateurs.
- Application mobile native (site web responsive uniquement).
- Suite de tests end-to-end automatisée.
- Frais/commissions/swap comme champs suivis séparément (à absorber via la correction manuelle du résultat si besoin).
- Nom définitif du projet (nom de travail "Journal" utilisé partout en attendant).
