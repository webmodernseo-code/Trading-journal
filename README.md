# Journal de Trading

Application web de journal de trading. Usage personnel dans un premier temps, conçue comme un futur produit SaaS ouvert à d'autres traders (forex, matières premières, crypto, indices).

Trois objectifs à poids égal :
- **Discipline & psychologie** — identifier les erreurs récurrentes (revenge trading, non-respect du plan, etc.)
- **Analyse de performance** — win rate, profit factor, R moyen, performance par stratégie/instrument/jour/durée
- **Centralisation** — un seul endroit pour consigner chaque trade, accessible depuis ordinateur et téléphone

## Stack technique

- Next.js (App Router, TypeScript), hébergé sur Vercel
- Neon (Postgres serverless) via Drizzle ORM
- Auth.js (Credentials + JWT), données scopées par utilisateur
- Vercel Blob pour les captures d'écran de trades
- next-intl — français + anglais dès la v1
- Tailwind CSS — thème dark "Emerald Terminal" (par défaut) + thème light
- Vitest pour les tests unitaires (toute la logique de calcul est testée)

## Structure du dépôt

- [docs/superpowers/specs/](docs/superpowers/specs/) — spec de design produit (modèle de données, pages, architecture)
- [docs/superpowers/plans/](docs/superpowers/plans/) — plan d'implémentation détaillé, tâche par tâche
- Branche `master` — tronc : specs, plan, corrections de plan découvertes en cours d'implémentation
- Branche `trading-journal-app` — implémentation de l'app (code Next.js), développée dans un git worktree isolé

## Avancement

Développement suivi via un plan d'implémentation en 25 tâches ([voir le plan](docs/superpowers/plans/2026-07-21-trading-journal-app.md)).

État au 2026-07-22 : fondations techniques terminées (scaffolding Next.js/Tailwind, suite de tests, toutes les fonctions de calcul métier — P&L, risque, R-multiple, taille de position, stats dashboard, heatmaps, limites de perte, streaks, analytics d'erreurs —, routing i18n fr/en). Connexion Neon/Drizzle en cours de mise en place ; authentification, CRUD et pages restantes à venir.
