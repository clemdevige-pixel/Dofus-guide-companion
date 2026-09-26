# HANDOFF — Dofus Guide Companion / V1

Date : 2026-09-25
Branche : `agent/initial-scaffold`
Version : **1.0.0**

## TL;DR

V1 gelée et prête à distribuer.

État validé :
- route Astrub → Dofus Sylvestre certifiée sur son périmètre métier ;
- **973 étapes / 32 blocs** ;
- **59 PRÉPA** reconstruites autour des consommations réelles ;
- ordre relatif des **943 étapes métier historiques** conservé pendant la refonte blocs/prépas ;
- tests route/progress : **verts sur la CI du correctif Meno/Frimar** ;
- validation route : verte ;
- build frontend : vert ;
- `cargo check` Tauri Windows : vérification CI en cours sur le dernier correctif ;
- recette manuelle validée : save/reload, navigation, progression, compact, DPLN, `/travel`, raccourcis, taille/position fenêtre, console ;
- Sheet `ROUTE` et `data/route.json` synchronisés.

Ne pas relancer une optimisation globale de route sans bug concret ou nouvelle exigence métier.

Dernière refonte UX route intégrée :
- **32 cartes `ENTRÉE`**, exactement une par bloc ;
- **0 carte `PRÉPA` autonome** ;
- 35 préparations globales fusionnées dans les entrées de bloc ;
- 24 préparations tardives déplacées directement sur leur étape de consommation ;
- type éditorial `ENTRÉE` mappé sur le comportement structuré de préparation pour conserver les checklists sans ajouter de logique spécifique dans React ;

Dernière correction métier intégrée :
- Meno mutualisé en **un seul passage** pour `Une voix de crystal` + `Piège de crystal` / `Son nom est Personne` ;
- anciennes étapes du premier passage Meno supprimées ;
- ancienne mécanique « capturer les Frimar » supprimée partout ;
- `La machine à démonter le temps` indique désormais explicitement de **drop 2 Métaux Éternels sur les Frimar** ;
- Royalmouth conservé à **3 passages** après vérification des dépendances du Dofus Pourpre : aucune suppression appliquée.

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

État de reprise : **V1 maintenue ; refonte des cartes de préparation intégrée ; 973 étapes / 32 blocs ; tests route, validation et build frontend verts ; `cargo check` Windows du dernier commit fonctionnel encore en cours au moment de ce handoff.**


## Update 2026-09-26 — ordre Pandamonium / Cavaliers

- Correction d'un verrou réel de prérequis : `Toute possession dépossède` ne peut pas être faite au bloc 25, car `Quand l'éveil n'est qu'un songe` n'est terminé qu'au bloc 29.
- Paquet indivisible déplacé dans le bloc 29, immédiatement après la fin de `Quand l'éveil n'est qu'un songe` :
  - `Toute possession dépossède`
  - `Le chant du Pandamonium`
  - `Le début de la fin`
- Ce placement est volontairement avant `La danse de la dissonance`, qui dépend de `Le début de la fin`.
- `Les sentiers de la guerre` reste au bloc 25 : ses prérequis amont (`Rêves translucides` et `Chachyène de vie`) sont déjà fermés à cet endroit.
- `Les quatre volontés` reste immédiatement après `Les sentiers de la guerre`.
- Ressources Pandamonium déplacées de l'entrée du bloc 25 vers l'entrée du bloc 29 ; total `Umeshushu` du bloc 29 porté à 7 pour couvrir les besoins cumulés.
- `STEP_ID` conservés ; `moment-route-step-0714` attribué à `Les sentiers de la guerre` pour éviter un `MOMENT_ID` partagé entre deux blocs.
- Source éditoriale `ROUTE` et `data/route.json` resynchronisés.
- Commit de correction : `3f30ee0141ecc88a1cdd5795b2dc187dff81a40c`.
- CI frontend du commit : `test:route`, `validate:route` et build au vert.


## Update 2026-09-26 — audit prérequis blocs 24 à 32

- Audit des prérequis imbriqués effectué sur les blocs 24 à 32, avec recoupement de la ROUTE, de Ganymède GP0 et des pages DPLN utiles.
- Un second verrou critique a été trouvé dans le bloc 24 : la mutualisation Meno Ivoire + Abyssal en un seul passage était impossible.
- Cause : `Une voix de crystal` exige `Son nom est Personne` lancée ou terminée avant le combat contre Meno, tandis que `Son nom est Personne` n'est disponible qu'après avoir terminé `Piège de crystal`, qui exige lui-même un premier Meno.
- Correction : deux passages Meno explicites et linéaires :
  1. `Piège de crystal` → Meno → terminer `Piège de crystal` → lancer/terminer `Son nom est Personne`.
  2. Plus tard dans Nordalie : Nileza → Meno avec `Une voix de crystal` active → partitions → retour via Pichon → terminer `Une voix de crystal`.
- Nouveaux STEP_ID : `route-step-1173`, `route-step-1174`, `route-step-1175`.
- Aucun autre prérequis inversé identifié dans les blocs 24 à 32 après vérification des portes d'entrée, dépendances croisées et chaînes finales Dom de Pin / Qui nous protège / Flovoraison.
- Commit route : `0c780dcc80d54c27680c0e5946ef506f10a3d624`.
