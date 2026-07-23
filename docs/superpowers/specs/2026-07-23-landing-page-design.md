# Landing Page — Design

## 1. Contexte

Le spec produit principal (`2026-07-21-journal-trading-design.md`, section 7) définit déjà la structure fonctionnelle de la landing page : 8 sections, pricing en affichage seul (14 jours d'essai, 5€/mois ou 99€ à vie), avis clients obligatoirement marqués comme fictifs tant qu'il n'y a pas de vrais utilisateurs, bilingue FR/EN. Ce document ne remplace pas ce spec — il définit uniquement la **direction visuelle** de la landing page, restée non tranchée jusqu'ici (aucune implémentation n'existe encore ; seuls des mockups exploratoires avaient été faits pendant le brainstorming initial du produit).

Référence de style demandée par l'utilisateur : https://optirise-agency.webflow.io/ (capture d'écran fournie directement, l'outil de fetch texte ayant été incapable de restituer les couleurs réelles). Cette référence est sombre (marine/anthracite, pas noir pur), avec un accent doré et un mélange typographique majuscules grasses / italique serif élégant — traitement "éditorial premium", assez éloigné d'un SaaS plat classique.

**Décision clé** : la landing page a sa **propre identité visuelle**, distincte du thème "Emerald Terminal" (vert émeraude) de l'app elle-même. L'app garde son accent vert ; la landing page utilise l'accent `#ffa361` (corail/orange), une teinte déjà explorée et validée dans une session de brainstorming précédente (`.superpowers/brainstorm/1148-1784628617/content/emerald-terminal-ffa361.html`). C'est un choix assumé de rupture entre la vitrine marketing et le produit connecté — comme beaucoup de SaaS ont une landing page avec sa propre identité de marque, distincte du thème de l'app.

Ce chantier est indépendant de la passe "polish premium" en cours sur l'app elle-même (responsive, icônes lucide-react, données de démo — voir mémoire de session) : ils partagent seulement la librairie d'icônes (lucide-react) et la police système sans-serif de base, pas la palette de couleur ni le traitement typographique.

## 2. Direction visuelle

### 2.1 Couleurs

Tokens propres à la landing page (à ne pas mélanger avec les tokens `--color-*` de l'app) :

- `--lp-bg` : `#0a0c14` (fond principal, marine très sombre)
- `--lp-bg-glow` : `radial-gradient(circle at 25% 0%, rgba(255,163,97,0.10), transparent 45%)` superposé au fond dans les sections hero/CTA pour la profondeur
- `--lp-surface` : `#12151a` (cartes)
- `--lp-border` : `rgba(255,255,255,0.06)` à `rgba(255,255,255,0.08)`
- `--lp-accent` : `#ffa361` (accent unique de la landing — CTA, liens actifs, chiffres des étapes, tagline en italique)
- `--lp-accent-dim` : `rgba(255,163,97,0.12)` (fonds de badges/pills, sélecteurs actifs)
- `--lp-text-primary` : `#f9fafb`
- `--lp-text-muted` : `#9ca3af`
- `--lp-text-faint` : `#6f7480`
- Texte sur fond accent (boutons) : `#1a0e05` (brun très sombre, jamais blanc pur — cohérent avec l'exploration `#ffa361` d'origine)

**Vert/rouge** (`gain`/`loss` de l'app) ne sont **jamais** utilisés comme couleur de marque sur la landing page — réservés exclusivement à d'éventuelles captures d'écran de l'app montrant de vraies données (ex. dans la section "Fonctionnalités" si une capture de dashboard est utilisée).

Pas de thème clair pour la landing page en v1 (contrairement à l'app qui a un toggle dark/light) — la landing reste sombre uniquement, cohérent avec le ton "premium éditorial" choisi.

### 2.2 Typographie

Deux familles :
- **Sans-serif** (titres normaux, nav, corps de texte, boutons) : pile système déjà utilisée par l'app (`-apple-system, 'Segoe UI', sans-serif` via Tailwind), pas de nouveau webfont ici — cohérence de performance avec l'app.
- **Serif italique accent** (uniquement pour les taglines/accroches sous les titres, jamais pour un titre entier ni un corps de texte) : **Playfair Display**, chargée via `next/font/google`, poids 400 italique uniquement. Effet recherché : un mot ou une courte phrase en italique élégant juste après un titre en sans-serif gras, comme validé dans les mockups (`Trade avec discipline.` en gras, `Progresse avec des données.` en italique Playfair en-dessous).

Cet usage de l'italique reste un accent ponctuel (hero, titres de section, tagline) — jamais le texte courant.

### 2.3 Cards et composants

- Cards (fonctionnalités, étapes, témoignages, FAQ, pricing) : fond `--lp-surface`, bordure 1px `--lp-border`, `border-radius: 12px`, padding généreux (18-22px).
- Cards "étape numérotée" (section 3.4) : le numéro (01-04) en Playfair italique, grand corps (~26px), couleur accent à faible opacité (~0.4) pour un effet filigrane plutôt qu'un chiffre plein.
- Boutons CTA primaires : fond `--lp-accent` plein, texte `#1a0e05`, `border-radius: 8px`, poids 700.
- Boutons secondaires ("Voir un aperçu") : contour `rgba(255,255,255,0.15)`, texte `--lp-text-primary`, transparent.
- Icônes : `lucide-react`, taille ~18-20px, couleur accent sur fond `--lp-accent-dim` en pastille arrondie pour les 4 cards de fonctionnalités (même traitement que les stat-cards de l'app, avec la couleur en moins puisque la landing n'a qu'un seul accent).

## 3. Structure (reprise du spec section 7.1, habillée visuellement)

### 3.1 Nav
Logo (même mark SVG que l'app — le tracé "check/flèche montante" — mais tracé en `--lp-accent` au lieu du vert) + "Journal", liens *Fonctionnalités / Pricing / Avis / FAQ* (scroll ancré vers les sections), sélecteur FR/EN (pill à deux options, actif = fond `--lp-accent-dim` + texte accent), lien texte "Se connecter" (vers `/login`), CTA plein "Essai gratuit 14 jours" (vers `/register`).

### 3.2 Hero
Eyebrow (petit label majuscule espacé, couleur accent) : "Discipline · Statistiques · Progression". Titre en deux lignes : ligne 1 en sans-serif gras normal, ligne 2 en Playfair italique couleur accent. Sous-titre en `--lp-text-muted`. Deux CTA côte à côte : primaire plein + secondaire contour "Voir un aperçu" (ancre vers une capture d'écran du dashboard, plus bas ou dans une section dédiée si besoin).

### 3.3 Fonctionnalités clés
4 cards en grille (2×2 desktop, 1 colonne mobile) : Dashboard complet, Suivi des erreurs, Heatmaps de performance, Calculateur de taille de position. Chaque card : icône lucide en pastille, titre, description courte (1-2 phrases).

### 3.4 Comment ça marche
4 cards numérotées (grille 2×2 desktop, 1 colonne mobile) — validées dans les mockups : *Crée ton compte → Enregistre tes trades → Suis tes stats & erreurs → Progresse*. Titre de section avec la même construction gras + italique que le hero.

### 3.5 Avis clients
Cards témoignages (nom, rôle/contexte fictif, citation, étoiles). **Obligatoire** (reprend spec 7.2) : bandeau au-dessus de la section précisant qu'il s'agit d'exemples de format en attendant de vrais retours, et une mention "Exemple" ou "Démo" visible sur chaque carte. Jamais présenté comme un vrai retour.

### 3.6 Pricing
Reprend le contenu déjà validé dans le mockup `landing-structure-v3.html` : sélecteur de devise (EUR/USD/FCFA, taux fixe indicatif codé en dur) au-dessus de 2 cartes — *Mensuel* (5€/mois) et *À vie* (99€ paiement unique, carte mise en avant avec badge "Meilleure valeur"), chacune avec un tag "14 jours gratuits" et un CTA plein. Rappel visible (petite note, pas un avertissement anxiogène) que l'essai ne demande pas de carte bancaire. Aucun paiement réel branché (spec 7.3) — l'inscription depuis cette section crée un compte utilisable normalement.

### 3.7 FAQ
Accordéon (même traitement de card, un chevron lucide qui pivote à l'ouverture). Contenu à définir lors du plan d'implémentation (questions probables : essai gratuit, données personnelles, export, multi-devises).

### 3.8 CTA finale + Footer
Bande de rappel du CTA principal sur fond légèrement différent (peut-être `--lp-bg-glow` plus prononcé). Footer : liens légaux (mentions légales, confidentialité — contenu minimal en v1), contact, réseaux sociaux si pertinent (à trancher en implémentation), sélecteur de langue redondant en bas de page (pattern courant).

## 4. Responsive

La landing page doit être responsive desktop → mobile complet dès cette v1 (contrairement à la passe "polish" de l'app qui s'arrête pour l'instant à la tablette ~768px) : c'est la première page que verra un visiteur, souvent depuis un téléphone. Les grilles 2×2 (fonctionnalités, étapes) passent en 1 colonne sous ~640px ; le nav bascule en menu hamburger sous ~768px.

## 5. i18n

Landing page entièrement bilingue FR/EN dès la v1 (spec 7.4), via next-intl comme le reste du projet — toutes les chaînes (y compris les mentions "Exemple"/"Démo" des avis, le contenu de la FAQ, les CGU du footer) doivent avoir une entrée dans les deux fichiers de messages.

## 6. Hors scope (v1)

- Paiement réel (Stripe) — affichage seul, cf. spec 8.
- Vrais avis clients — reportés à quand le produit aura de vrais utilisateurs.
- Section équipe, blog, formulaire de contact avec carte du monde, barre de statistiques chiffrées (client count, satisfaction %, etc.) — présents sur le site de référence mais non pertinents ici : le produit n'a pas encore de vrais chiffres à afficher, et les afficher de façon fictive violerait le même principe que pour les avis clients (spec 7.2).
- Thème clair pour la landing page.
- Conversion de devise en temps réel (taux fixe indicatif uniquement, spec 7.3).
