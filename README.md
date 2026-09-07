# Dofus Guide Companion

Companion desktop léger pour suivre une roadmap Dofus étape par étape en overlay pendant le jeu.

## État actuel

La V1 est fonctionnelle sur la branche active `agent/initial-scaffold` :

- route réelle chargée depuis `data/route.json` ;
- progression locale persistée ;
- navigation précédente / suivante et navigation directe par numéro de carte ;
- validation des cartes et sous-objectifs ;
- regroupement explicite des moments via `MOMENT_ID` / `DISPLAY_ROLE` ;
- quêtes parallèles structurées via `PARALLEL_ID` / `PARALLEL_PHASE` ;
- fils rouges et verrous dérivés de la route ;
- raccourcis globaux configurables ;
- taille et position de fenêtre persistées ;
- overlay Tauri always-on-top ;
- liens DofusPourLesNoobs ouverts dans le navigateur système.

## Source de vérité

La roadmap éditoriale reste le Google Sheet :

`Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`

L'application ne duplique jamais la logique des quêtes dans le code. Le runtime consommé par l'application est un export structuré :

```text
Google Sheet ROUTE
    ↓
scripts/export-route.ts
    ↓
validation stricte
    ↓
data/route.json
    ↓
selectors
    ↓
UI Tauri / React
```

`data/route.json` est un artefact généré : toute correction éditoriale doit être faite dans le Sheet puis réexportée.

## Stack V1

- Tauri 2
- React
- TypeScript
- Vite
- données JSON data-driven
- persistance locale

## Démarrage développeur

Prérequis Tauri : Rust, Node.js et les dépendances système de la plateforme.

```bash
pnpm install
pnpm tauri dev
```

Build front seul :

```bash
pnpm build
```

Build desktop :

```bash
pnpm tauri build
```

Contrôles route :

```bash
pnpm test:route
pnpm validate:route
```

Export depuis le Google Sheet :

```bash
pnpm export:route
```

L'export nécessite `GOOGLE_ACCESS_TOKEN` ou `GOOGLE_SHEETS_API_KEY`.

## Principes

- zéro logique de quête hardcodée dans l'UI ;
- `completedStepIds` est l'unique vérité de progression ;
- `MOMENT_ID` définit les frontières de cartes mutualisées ;
- `DISPLAY_ROLE` définit checkbox / transition / détail ;
- `PARALLEL_ID` définit les vraies salves de quêtes parallèles ;
- aucune lecture mémoire de Dofus ;
- aucun OCR en V1 ;
- aucune automatisation d'input ;
- fonctionnement hors ligne avec une route déjà exportée ;
- l'overlay doit rester plus simple à utiliser que le Google Sheet.

## Contrat agents

Avant toute modification, lire dans cet ordre :

1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md` pour les chantiers route
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md` pour les audits/réécritures de route
7. `HANDOFF.md`
