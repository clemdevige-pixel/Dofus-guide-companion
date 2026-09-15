# AGENTS.md — Dofus Guide Companion

Ce fichier est le contrat de travail des agents intervenant sur le repo.

## 1. Lire avant de coder

Toujours lire dans cet ordre :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md` si la route est réellement rouverte
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md` pour une correction métier de route
7. `HANDOFF.md`

`HANDOFF.md` est l’unique handoff opérationnel.

## 2. Principes non négociables

- Architecture simple, locale et data-driven.
- Google Sheet `ROUTE` = source éditoriale.
- `data/route.json` = artefact généré.
- Aucune logique spécifique à une quête dans React.
- Ne jamais parser un texte d’affichage pour déduire une règle métier.
- `completedStepIds` = unique vérité de progression.
- `STEP_ID` = identité métier stable.
- `MOMENT_ID` = frontière autoritaire d’une carte multi-step.
- `DISPLAY_ROLE` = `OBJECTIVE`, `TRANSITION`, `DETAIL`.
- `PARALLEL_ID / PARALLEL_PHASE` = vraies quêtes à garder actives ensemble.
- `GOAL_ID / GOAL_PHASE` = lifecycle des fils rouges.
- Réutiliser les données existantes avant d’ajouter une métadonnée.
- Une information utile ne doit apparaître qu’une fois dans le flux joueur.
- Une information interne de routing ne doit jamais apparaître côté joueur.

## 3. Interdictions

Interdit :
- `if (step.title === '...')` pour piloter une règle métier ;
- numéro de ligne Sheet comme identité ;
- progression dupliquée dans plusieurs stores ;
- route mock / override parallèle ;
- correction manuelle de `data/route.json` comme source éditoriale ;
- utiliser `POSITION` comme destination ;
- créer un `VERROU DUR` depuis un simple niveau recommandé ;
- regrouper automatiquement sans `MOMENT_ID` ;
- `DISPLAY_ROLE` sans `MOMENT_ID` ;
- `MOMENT_ID` sans `DISPLAY_ROLE` ;
- moment commençant par autre chose que `OBJECTIVE` ;
- carte de plus de 5 `OBJECTIVE` ;
- afficher toutes les micro-étapes techniques comme objectifs ;
- afficher un groupe parallèle sur une carte sans rapport ;
- dupliquer le détail DPLN dans les séquences sans valeur ajoutée ;
- laisser des commentaires d’audit/routing dans `warning` ou les titres joueur.

## 4. Contrat UI

Une carte représente un moment joueur.

### Cartes mutualisées

- `OBJECTIVE` = checkbox ;
- `TRANSITION` / `DETAIL` = rattachés à l’objectif précédent ;
- actions principales conservées sur les `OBJECTIVE` ;
- hard lock conserve son message métier ;
- transitions indispensables restent visibles ;
- footer/navigation restent stables.

### Prérequis

`prerequisites` reste disponible pour audit/validation mais n’est pas affiché sur les cartes.

### GUIDE_ITEMS

Donnée structurée utile. Ne pas l’afficher automatiquement dans les séquences uniquement pour recopier DPLN.

### Titres

La donnée brute conserve le titre éditorial complet.

Le runtime utilise `getPlayerFacingStepTitle()` pour masquer les suffixes éditoriaux inutiles et les métadonnées de passage de donjon.

Les tests éditoriaux doivent auditer la donnée brute avant cette normalisation UI.

### Marqueurs

- Alignement = `type === 'alignment'` ;
- Donjon = `type === 'dungeon'` ;
- Dofus = `dofusSeries` ;
- maximum 2 icônes visibles.

Aucune détection par titre.

## 5. Route

La route actuelle est certifiée sur son périmètre métier. Ne pas relancer une optimisation globale sans défaut concret.

Pour une correction :
1. reproduire le défaut ;
2. cartographier le paquet indivisible ;
3. vérifier Ganymède + source factuelle ;
4. modifier le Sheet ;
5. préserver les identités/lifecycles non concernés ;
6. ajouter/adapter un test si le défaut est généralisable ;
7. exporter ;
8. tester.

Une différence avec Ganymède n’est pas automatiquement une incohérence.

## 6. Export

Plage actuelle : `ROUTE!A5:W`.

Colonnes techniques jusqu’à `DOFUS_SERIES`.

Flux officiel :

```text
Google Sheet ROUTE
→ pnpm export:route
→ pnpm test:route
→ pnpm validate:route
→ pnpm build
→ commit / push
```

Check Tauri lorsque l’environnement le permet.

Sous PowerShell Windows, utiliser `pnpm.cmd` si `pnpm.ps1` est bloqué.

## 7. Qualité

Avant d’annoncer un chantier intégré :
- tests verts ;
- validation verte ;
- build vert ;
- aucune divergence connue Sheet / JSON ;
- aucune régression visible sur les cartes concernées.

Ne jamais annoncer “100% certifié” après quelques checks ciblés seulement.

## 8. Documentation

Mettre la doc à jour seulement lorsque le contrat produit/data/architecture change.

Ne pas créer de handoff parallèle. Mettre à jour `HANDOFF.md` avec :
- état réel des tests ;
- état Sheet / JSON ;
- ce qui est intégré ;
- ce qui reste avant release.
