# HANDOFF — Dofus Guide Companion / V1

Date : 2026-09-16
Branche : `agent/initial-scaffold`
Version : **1.0.0**

## TL;DR

V1 gelée et prête à distribuer.

État validé :
- route Astrub → Dofus Sylvestre certifiée sur son périmètre métier ;
- **1002 étapes / 32 blocs** ;
- **59 PRÉPA** reconstruites autour des consommations réelles ;
- ordre relatif des **943 étapes métier historiques** conservé pendant la refonte blocs/prépas ;
- tests route/progress : **51/51** ;
- validation route : verte ;
- build frontend : vert ;
- `cargo check` Tauri Windows : vert ;
- recette manuelle validée : save/reload, navigation, progression, compact, DPLN, `/travel`, raccourcis, taille/position fenêtre, console ;
- Sheet `ROUTE` et `data/route.json` synchronisés.

Ne pas relancer une optimisation globale de route sans bug concret ou nouvelle exigence métier.

## Sources de vérité

Source éditoriale : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`.
Runtime : `data/route.json`, généré depuis le Sheet.

Contrats :
- `STEP_ID` = identité métier stable ;
- `MOMENT_ID` = frontière d’une carte multi-step ;
- `DISPLAY_ROLE` = `OBJECTIVE`, `TRANSITION`, `DETAIL` ;
- `completedStepIds` = unique vérité de progression ;
- aucune logique spécifique à une quête dans React ;
- aucune correction manuelle de `data/route.json` comme source éditoriale.

## UX V1

- titres joueur nettoyés au runtime, titres source complets conservés en donnée ;
- marqueurs structurés : Alignement / Dofus / Donjon ;
- prérequis conservés pour audit mais masqués côté joueur ;
- actions structurantes conservées dans les séquences ;
- clic sur un bloc incomplet → première carte non validée ;
- prépas locales placées près de leur première consommation réelle.

## Compatibilité des saves

La progression est reconciliée avec la route courante :
- IDs supprimés nettoyés ;
- progression métier conservée via `STEP_ID` ;
- nouvelles PRÉPA historiques antérieures à la dernière étape métier déjà validée fermées lors d’un changement de `routeVersion` ;
- aucune progression n’est déduite d’un simple saut de consultation.

## Flux route

```text
Google Sheet ROUTE
→ pnpm export:route
→ pnpm test:route
→ pnpm validate:route
→ pnpm build
→ commit / push
```

Sous PowerShell Windows, utiliser `pnpm.cmd` si nécessaire.

## Release 1.0.0

Versions synchronisées :
- `package.json` = `1.0.0` ;
- `src-tauri/tauri.conf.json` = `1.0.0` ;
- `src-tauri/Cargo.toml` = `1.0.0` ;
- `src-tauri/Cargo.lock` resynchronisé.

Hygiène repo :
- `*.tsbuildinfo` est ignoré ;
- `tsconfig.tsbuildinfo` n’est pas suivi ;
- aucun workflow temporaire ne doit rester dans `.github/workflows/`.

Build Windows de distribution :

```powershell
pnpm.cmd install
pnpm.cmd tauri build
```

Bundles générés sous `src-tauri/target/release/bundle/`.

## Reprise post-V1

Lire dans l’ordre : `AGENTS.md`, `SPEC.md`, `ARCHITECTURE.md`, `docs/DATA_MODEL.md`, puis ce `HANDOFF.md`.

État de reprise : **V1 gelée, route figée, 51/51 tests verts, validation/build/Tauri verts, version 1.0.0 prête à distribuer.**
