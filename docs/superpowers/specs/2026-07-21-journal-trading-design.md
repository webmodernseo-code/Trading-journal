# Journal de Trading — Design

## 1. Contexte et objectifs

Application web de journal de trading, pour un usage personnel dans un premier temps, mais conçue pour pouvoir être montrée/partagée à d'autres utilisateurs plus tard sans refonte majeure.

Marchés tradés : forex, matières premières, crypto, indices (et autres CFD/futures) — le modèle de données ne doit pas être figé à un seul type d'actif.

Trois objectifs à couvrir dès la v1, à poids égal :
- **Discipline & psychologie** : identifier les erreurs récurrentes (revenge trading, non-respect du plan, etc.).
- **Analyse de performance statistique** : win rate, profit factor, R moyen, performance par stratégie/instrument.
- **Centralisation** : un seul endroit propre pour consigner chaque trade (remplace Excel/notes/captures éparpillées).

Accès requis depuis ordinateur et téléphone, avec les mêmes données partout → exclut une solution 100% locale (navigateur uniquement) ; une vraie base de données en ligne est nécessaire.

## 2. Architecture

- **Application** : Next.js (React), une seule app gérant pages et routes API.
- **Hébergement** : Vercel, déploiement automatique à chaque push sur GitHub.
- **Base de données** : Neon (Postgres serverless), accédée via un ORM léger (Drizzle).
- **Authentification** : Auth.js (NextAuth), connexion email/mot de passe (ou magic link). Toutes les données sont scopées par `user_id`, ce qui permet d'ajouter d'autres comptes plus tard sans changement de schéma.
- **Stockage des fichiers** : Vercel Blob, pour les captures d'écran attachées aux trades.
- **UI** : responsive, utilisable aussi bien sur ordinateur que sur mobile (site web, pas d'app native).

Toute la stack reste sur des paliers gratuits à l'échelle d'un usage personnel/petit groupe.

## 3. Modèle de données

Toutes les tables ci-dessous (sauf `users`) sont scopées par `user_id`.

**users**
- id, email, password_hash (géré par Auth.js), created_at
- `account_balance` (solde de compte actuel, mis à jour manuellement par l'utilisateur — sert de valeur par défaut au calculateur de taille de position)
- `default_risk_percent` (optionnel, % de risque par défaut proposé dans le calculateur)

**instruments** (CRUD géré par l'utilisateur)
- id, user_id, name (ex: EUR/USD, XAU/USD, BTC/USD), asset_class (forex | commodity | crypto | index | other)
- `point_value` : valeur en devise du compte d'un mouvement d'un point/pip, pour la taille de position habituelle de l'utilisateur. Sert à la fois au calcul automatique du P&L et au calculateur de taille de position.
- created_at

**strategies** (CRUD géré par l'utilisateur)
- id, user_id, name, description (optionnelle), created_at

**checklist_rules** (CRUD géré par l'utilisateur, pré-rempli avec un jeu de règles courantes à la création du compte, ex: "Plan respecté", "Pas de revenge trading", "Taille de position correcte", "Stop loss placé avant l'entrée")
- id, user_id, label, active (bool — permet de retirer une règle de la liste active sans casser l'historique des trades qui y répondent déjà), display_order, created_at

**trades**
- id, user_id, instrument_id (FK), strategy_id (FK, nullable)
- direction (long | short)
- entry_price, exit_price (nullable si trade encore ouvert), quantity
- stop_loss_price (nullable), take_profit_price (nullable)
- entered_at (datetime), exited_at (datetime, nullable)
- status (open | closed)
- `pnl_amount` : résultat net en devise du compte. Calculé automatiquement par défaut à partir de `(exit_price - entry_price) * quantity * instrument.point_value` (signe inversé si `direction = short`), mais **modifiable manuellement** (champ `pnl_override: bool` pour savoir si la valeur a été corrigée à la main, utile pour frais/swap non modélisés).
- `risk_amount` : calculé automatiquement à partir de `|entry_price - stop_loss_price| * quantity * instrument.point_value`, également modifiable manuellement.
- `r_multiple` : calculé, `pnl_amount / risk_amount` (non stocké si `risk_amount` est nul/absent).
- notes (texte libre, nullable)
- created_at, updated_at

**trade_checklist_responses** (table de jointure)
- id, trade_id (FK), checklist_rule_id (FK), checked (bool)

**trade_screenshots**
- id, trade_id (FK), url (Vercel Blob), caption (optionnel, ex: "avant"/"après"), created_at

## 4. Calcul du résultat, du risque et taille de position

Décision actée après discussion : calcul **semi-automatique**, pas de saisie manuelle brute du résultat.

- Chaque instrument a une `point_value` configurée une fois par l'utilisateur (valeur d'un point de mouvement de prix, pour sa taille de position habituelle).
- Le résultat (`pnl_amount`) et le risque (`risk_amount`) d'un trade sont calculés automatiquement à partir des prix (entrée/sortie/stop), de la quantité et de cette valeur de point.
- L'utilisateur peut toujours **corriger manuellement** le résultat final si besoin (frais, swap, taille de position non standard) — le calcul automatique est une aide, pas une contrainte.
- Le R-multiple est dérivé automatiquement (`pnl_amount / risk_amount`).

**Calculateur de taille de position** (accessible en page indépendante ET intégré/réutilisable dans la fiche trade) :
- Entrées : solde du compte (pré-rempli depuis `users.account_balance`, modifiable), % de risque souhaité (ou montant de risque fixe), instrument (pour récupérer `point_value`), distance du stop loss (prix d'entrée − prix de stop).
- Sortie : quantité suggérée = `risk_amount / (stop_distance * point_value)`, et rappel du montant de risque en devise.
- Dans la fiche trade, ce calcul peut pré-remplir le champ `quantity`.

## 5. Pages et fonctionnalités

- `/login`, `/register` — authentification (Auth.js)
- `/dashboard` — equity curve (P&L cumulé dans le temps sur les trades clôturés), win rate, profit factor, R moyen, performance par stratégie, performance par instrument, calendrier heatmap des jours gagnants/perdants
- `/trades` — liste des trades, filtrable et triable (date, instrument, stratégie, résultat), recherche
- `/trades/new`, `/trades/[id]` — création/édition/consultation d'un trade : tous les champs, checklist de discipline, notes libres, upload de captures d'écran, calculateur de taille de position intégré
- `/strategies` — CRUD des stratégies
- `/instruments` — CRUD des instruments (avec `point_value`)
- `/checklist` — CRUD des règles de discipline
- `/tools/position-size-calculator` — calculateur de taille de position en page indépendante
- `/settings` — solde du compte, % de risque par défaut, profil

## 6. Gestion des erreurs et cas limites

- Validation des formulaires : champs obligatoires (instrument, sens, dates), valeurs numériques cohérentes (prix > 0, quantité > 0).
- Suppression d'une stratégie ou d'un instrument déjà utilisé par des trades existants : suppression bloquée (ou confirmation explicite requise) pour ne jamais perdre silencieusement le lien historique.
- États vides : message clair + appel à l'action quand il n'y a pas encore de trade / stratégie / instrument / règle de checklist.
- Captures d'écran : limite de taille/format (JPG/PNG, quelques Mo max), message d'erreur clair si dépassement.
- Authentification : session expirée → redirection propre vers la page de connexion.
- Division par zéro : si `risk_amount` est nul (pas de stop loss renseigné), le R-multiple n'est pas calculé/affiché (pas d'erreur, champ vide).

## 7. Approche de test

Projet solo à ce stade : effort de test ciblé plutôt qu'une couverture exhaustive.

- **Tests unitaires automatisés** sur toute la logique de calcul : `pnl_amount`, `risk_amount`, `r_multiple`, calculateur de taille de position, agrégations du dashboard (win rate, profit factor, equity curve, regroupements par stratégie/instrument/jour). C'est la zone où une erreur serait la plus coûteuse (stats fausses affichées sans que l'utilisateur s'en aperçoive).
- **Test manuel** pour les pages et l'UI au fil du développement. Pas de suite de tests end-to-end automatisée pour cette v1.

## 8. Hors périmètre pour la v1

- Partage/invitation multi-utilisateurs (l'architecture le permet via `user_id` partout, mais aucune UI de partage/équipe en v1).
- Import CSV/API depuis un broker (saisie manuelle uniquement en v1).
- Application mobile native (site web responsive uniquement).
- Suite de tests end-to-end automatisée.
- Frais/commissions/swap comme champs suivis séparément (à absorber via la correction manuelle du résultat si besoin).
- Gestion multi-devises de compte (une seule devise de compte supposée pour l'instant).
