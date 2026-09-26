# Dofus Guide Companion

Companion desktop léger pour suivre une roadmap Dofus étape par étape en overlay pendant le jeu.

## État actuel

La V1 est en **release-readiness final** sur `agent/initial-scaffold`.

État validé :
- route réelle chargée depuis `data/route.json` ;
- **1009 étapes / 20 blocs** ;
- route certifiée sur son périmètre métier ;
- `pnpm.cmd test:route` : **48/48 verts** ;
- `pnpm.cmd validate:route` : vert ;
- `pnpm.cmd build` : vert ;
- progression locale persistée ;
- navigation précédente / suivante + saut direct par carte ;
- cartes mutualisées via `MOMENT_ID / DISPLAY_ROLE` ;
- quêtes parallèles via `PARALLEL_ID / PARALLEL_PHASE` ;
- fils rouges et hard locks dérivés de la route ;
- raccourcis globaux configurables ;
- taille et position de fenêtre persistées ;
- overlay Tauri always-on-top ;
- titres joueur nettoyés au runtime ;
- marqueurs Alignement / Dofus / Donjon ;
- liens DofusPourLesNoobs ouverts dans le navigateur système.

Le chantier restant avant gel V1 est décrit dans `HANDOFF.md`.

## Source de vérité

La roadmap éditoriale reste le Google Sheet :

`Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`

Flux :

```text
Google Sheet ROUTE
    ↓
scripts/export-route.ts
    ↓
validation stricte
    ↓
data/route.json
    ↓
loader / selectors
    ↓
UI Tauri / React
```

`data/route.json` est un artefact généré. Toute correction éditoriale doit être faite dans le Sheet puis réexportée.

## Stack V1

- Tauri 2
- React
- TypeScript
- Vite
- données JSON data-driven
- persistance locale

## Démarrage développeur

```bash
pnpm install
pnpm tauri dev
```

Contrôles :

```bash
pnpm test:route
pnpm validate:route
pnpm build
pnpm tauri build
```

Sous PowerShell Windows, utiliser `pnpm.cmd` si `pnpm.ps1` est bloqué par l’ExecutionPolicy.

Export depuis le Sheet :

```bash
pnpm export:route
```

L’export nécessite `GOOGLE_ACCESS_TOKEN` ou `GOOGLE_SHEETS_API_KEY`.

## Principes

- zéro logique de quête hardcodée dans l’UI ;
- `completedStepIds` = unique vérité de progression ;
- `MOMENT_ID` = frontière des cartes mutualisées ;
- `DISPLAY_ROLE` = objectif / transition / détail ;
- `PARALLEL_ID` = vraies salves de quêtes parallèles ;
- `DOFUS_SERIES` = métadonnée source des marqueurs Dofus ;
- titres complets conservés en donnée, titres courts dérivés pour l’affichage ;
- aucun OCR / bot / automatisation d’input en V1 ;
- fonctionnement hors ligne avec route exportée ;
- l’overlay doit rester plus simple à utiliser que le Google Sheet.

## Documentation

Lire dans cet ordre :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md` uniquement si la route est rouverte
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md` pour une correction métier de route
7. `HANDOFF.md`

`HANDOFF.md` est l’unique handoff opérationnel du repo.
