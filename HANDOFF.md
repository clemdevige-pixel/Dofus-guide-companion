# HANDOFF — Dofus Guide Companion / clôture V1

Date : 2026-09-16

## TL;DR

Branche active : `agent/initial-scaffold`.

État courant :
- route Astrub → Dofus Sylvestre certifiée sur son périmètre métier ;
- **1009 étapes / 20 blocs** ;
- `pnpm.cmd test:route` vert (**48/48**) ;
- `pnpm.cmd validate:route` vert ;
- `pnpm.cmd build` vert ;
- anti-régressions métier actifs ;
- `PRÉREQUIS` conservés en donnée mais non affichés côté joueur ;
- nettoyage UX des titres et commentaires intégré ;
- marqueurs visuels Alignement / Dofus / Donjon intégrés.

Le chantier route n’est plus à rouvrir globalement. Il reste uniquement la **recette release-readiness V1** puis le gel de la version.

## 1. Sources de vérité

Projet : **Dofus Guide Companion**  
Repo : `clemdevige-pixel/Dofus-guide-companion`  
Branche : `agent/initial-scaffold`

Source éditoriale : Google Sheet **Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre**, onglet `ROUTE`.  
ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`

Runtime : `data/route.json`, généré depuis le Sheet.

Références métier :
- Ganymède GP0 + guides spécialisés : ordre relatif, fenêtres, mutualisations ;
- DofusPourLesNoobs : détail de quête, positions, interactions et prérequis factuels.

Ne jamais reconstruire ou réordonner la route depuis la mémoire ou l’intuition.

## 2. Contrat route actuel

- `STEP_ID` = identité métier stable ;
- `MOMENT_ID` = frontière autoritaire d’une carte multi-step ;
- `DISPLAY_ROLE` = `OBJECTIVE`, `TRANSITION`, `DETAIL` ;
- une ligne sans `MOMENT_ID` reste une carte autonome ;
- maximum 5 `OBJECTIVE` par carte ;
- `PARALLEL_ID / PARALLEL_PHASE` = lifecycle des vraies quêtes à garder actives ensemble ;
- `GOAL_ID / GOAL_PHASE` = lifecycle des fils rouges ;
- `completedStepIds` = unique vérité de progression ;
- aucune logique spécifique à une quête dans React.

La certification métier couvre notamment : Alignement 75→100, Ordres 4→5, Tengu / Forêt Pétrifiée, Fratrie / Ébène / Gang des Toxines, Enutrosor 2/3, Turquoise, DDG, Ivoire, Ébène, Tour du Monde, Valonia / Ilyzaelle et fin Dom de Pin → Sylvestre.

`src/route/routeContracts.test.ts` protège les dépendances sensibles.

## 3. Contrat UX actuel

### Titres joueur

La donnée conserve le titre éditorial complet. Le runtime applique `getPlayerFacingStepTitle()` après validation pour afficher un titre court.

Exemples :
- `Dépôt de ravitaillement — avancer jusqu'au verrou ...` → `Dépôt de ravitaillement` ;
- `◆ Serre du Royalmouth — PASSAGE #3` → `Serre du Royalmouth`.

Les cartes composites réellement significatives gardent leur suffixe.

Implémentation :
- `src/route/displayTitle.ts` ;
- `src/route/loader.ts`.

Les tests éditoriaux doivent auditer la donnée brute, pas les titres normalisés pour l’UI.

### Marqueurs visuels

Direction validée :
- Alignement → bouclier ;
- série Dofus → œuf/Dofus custom ;
- Donjon → château ;
- maximum 2 marqueurs visibles devant un titre.

Implémentation :
- `src/components/StepMarkers.tsx` ;
- `src/step-markers.css` ;
- `RouteStep.dofusSeries?: string` ;
- colonne Sheet `DOFUS_SERIES` ;
- export via `scripts/export-route.ts`.

`type === 'alignment'` et `type === 'dungeon'` sont réutilisés directement : ne pas ajouter de tags redondants.

### Prérequis / GUIDE_ITEMS / warnings

- `prerequisites` reste disponible pour audit/validation mais n’est pas rendu sur les cartes ;
- `warning` sert uniquement aux informations réellement utiles au joueur ;
- les commentaires internes de routing ont été purgés ;
- `GUIDE_ITEMS` reste une donnée structurée utile, mais n’est **pas affiché automatiquement dans les séquences** uniquement pour recopier le déroulé DPLN ;
- le lien DPLN reste la source du détail fin d’une quête ;
- les actions `LANCER / AVANCER / TERMINER / STOP` restent visibles sur les vrais `OBJECTIVE` d’un `MOMENT_ID` ;
- le message métier d’un `VERROU DUR` reste visible dans une séquence.

## 4. Flux officiel de modification de route

```text
Google Sheet ROUTE
→ scripts/export-route.ts
→ data/route.json
→ pnpm.cmd test:route
→ pnpm.cmd validate:route
→ pnpm.cmd build
→ commit / push
```

Ne jamais maintenir une version JSON manuelle divergente du Sheet.

## 5. Ce qu’il reste avant gel V1

### A — Recette visuelle finale

Contrôler dans l’application :
- une quête Alignement avec bouclier ;
- une quête Dofus avec œuf ;
- un donjon avec château ;
- une carte pouvant cumuler 2 marqueurs ;
- titres `— avancer jusqu’à...` sans suffixe visible ;
- titres donjon `— PASSAGE #N` sans suffixe visible ;
- cartes composites gardant leur suffixe utile ;
- warnings / hard locks / transitions restant lisibles.

### B — Parité Sheet → JSON

Vérifier une dernière fois la parité complète de `DOFUS_SERIES` entre le Sheet et `data/route.json` puis, si nécessaire, réexporter depuis le Sheet.

Le Sheet reste la source éditoriale finale.

### C — Release-readiness runtime

Tester :
- persistance/reprise de progression après fermeture ;
- navigation précédent/suivant ;
- saut direct par numéro de carte ;
- progression globale et par bloc ;
- validation/dévalidation d’une carte et de ses sous-objectifs ;
- mode compact / détaillé ;
- ouverture DPLN ;
- copie `/travel` ;
- raccourcis globaux ;
- restauration taille/position de fenêtre ;
- absence d’erreur console bloquante ;
- build Tauri si l’environnement le permet.

Le warning Vite `chunk > 500 kB` n’est pas bloquant en soi. Ne pas modifier l’architecture uniquement pour faire disparaître ce warning.

### D — Hygiène repo

Décider avant gel V1 si `tsconfig.tsbuildinfo` doit rester suivi. Aujourd’hui il est généré par TypeScript et provoque régulièrement des blocages de `git pull --rebase` lorsqu’il est modifié localement.

### E — Gel V1

Quand A+B+C+D sont validés :
- figer la route V1 ;
- créer le commit/tag de référence ;
- mettre à jour ce handoff avec cette référence ;
- ne plus réoptimiser la route sans bug concret ou nouvelle exigence métier ;
- passer aux évolutions post-V1.

## 6. Règles pour le prochain agent

Avant intervention lire :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md` si la route est réellement rouverte
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md` pour une correction métier de route
7. `HANDOFF.md`

Ne pas :
- rouvrir la certification globale sans défaut concret ;
- déplacer une chaîne uniquement parce qu’elle diffère de Ganymède ;
- parser un titre/instruction pour déduire une règle métier ;
- dupliquer des vérités déjà présentes dans la donnée ;
- réintroduire des commentaires de routing visibles joueur ;
- considérer une optimisation locale comme preuve d’une route à nouveau « certifiée » sans contrôler le paquet impacté.

État de reprise attendu : **route métier figée, 48/48 tests verts, validation/build verts, recette release-readiness V1 à terminer**.
