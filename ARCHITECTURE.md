# ARCHITECTURE — Dofus Guide Companion

## 1. Principes

Architecture locale, simple et data-driven.

Le Companion ne connaît pas les règles métier de chaque quête. Il interprète une route structurée.

Interdits :
- logique spécifique par nom de quête dans React ;
- parsing de texte pour déduire un comportement métier ;
- seconde vérité de progression ;
- correction manuelle de `data/route.json` comme source éditoriale.

## 2. Flux de données

```text
Google Sheet ROUTE
    ↓
scripts/export-route.ts
    ↓
validation stricte
    ↓
data/route.json
    ↓
route loader
    ↓
selectors
    ↓
UI React / Tauri
```

Le Sheet est la source éditoriale. `data/route.json` est un artefact généré.

## 3. Stack

- Tauri 2
- React
- TypeScript
- Vite
- CSS simple
- persistance locale

## 4. Progression

La route et la progression utilisateur sont séparées.

La vérité de progression est `completedStepIds`.

Sont persistés localement :
- étapes validées ;
- position de consultation / étape courante ;
- mode compact ;
- préférences UI ;
- raccourcis globaux ;
- taille et position de fenêtre.

Les fils rouges, verrou suivant, progression et groupes parallèles restent dérivés depuis `route + completedStepIds`.

## 5. Cartes UI

Une ligne `RouteStep` n’équivaut pas nécessairement à une carte.

Contrat :
- `STEP_ID` = identité métier stable ;
- `MOMENT_ID` = frontière d’une carte multi-step ;
- `DISPLAY_ROLE` = rôle dans la carte (`OBJECTIVE`, `TRANSITION`, `DETAIL`).

`getStepGroups()` :
- même `MOMENT_ID` contigu → une carte ;
- sans `MOMENT_ID` → carte autonome.

`getSequenceObjectives()` :
- `OBJECTIVE` crée une checkbox ;
- `TRANSITION` / `DETAIL` se rattachent au dernier objectif ;
- seules les actions des vrais `OBJECTIVE` restent exposées comme actions principales.

Maximum 5 `OBJECTIVE` par carte.

React ne décide jamais du regroupement depuis le titre, `STOP`, le type ou la proximité des lignes.

## 6. Hiérarchie de contenu joueur

Priorité :
1. objectif / titre ;
2. action structurante ;
3. position utile ;
4. warning réellement critique ;
5. instruction/transition nécessaire ;
6. lien DPLN pour le détail fin.

`prerequisites` reste en donnée pour audit/validation mais n’est pas affiché dans les cartes.

`warning` ne doit contenir que des informations joueur utiles, jamais des commentaires de routing.

`GUIDE_ITEMS` reste structuré en donnée. Décision UX V1 : ne pas l’afficher automatiquement dans les séquences `MOMENT_ID` uniquement pour recopier DPLN.

Le message métier d’un hard lock reste visible même dans une séquence.

## 7. Titres joueur

La route brute conserve le titre éditorial complet.

Après validation, `loadBundledRoute()` applique `getPlayerFacingStepTitle()` :
- suppression des suffixes éditoriaux de quête DPLN (`— avancer jusqu’à...`, `— reprise`, etc.) ;
- suppression du préfixe legacy `◆` et de `— PASSAGE #N` sur les donjons ;
- conservation des suffixes réellement significatifs sur les cartes composites.

Cette transformation est présentationnelle. Les tests éditoriaux doivent auditer la donnée brute.

## 8. Marqueurs visuels

`StepMarkers` dérive uniquement de données structurées :
- Alignement : `type === 'alignment'` ;
- Dofus : `dofusSeries` ;
- Donjon : `type === 'dungeon'`.

Maximum 2 icônes visibles devant un titre.

Aucune détection par titre.

## 9. Lancements et déplacements

- `location` = position de prise/lancement ;
- `launchInstruction` = lancement sans coordonnée unique ;
- `destination` = prochain lieu utile ;
- `guideItems` = actions structurées courtes lorsque leur rendu est pertinent.

`POSITION` ne doit jamais être détourné comme destination.

## 10. Fils rouges / hard locks / groupes parallèles

### Fils rouges

`GOAL_ID / GOAL_PHASE` → lifecycle `start → progress* → finish`.

### Hard locks

Blocage réel de progression. Un simple niveau recommandé ne suffit pas.

### Groupes parallèles

`PARALLEL_ID / PARALLEL_PHASE` → lifecycle `start → progress* → finish`.

Le rappel UI n’apparaît que sur les cartes qui appartiennent réellement au groupe.

## 11. Export

`scripts/export-route.ts` est le seul point de transformation Sheet → runtime.

Plage actuelle : `ROUTE!A5:W`.

La colonne `DOFUS_SERIES` alimente `RouteStep.dofusSeries`.

Flux de synchronisation :

```text
pnpm export:route
pnpm test:route
pnpm validate:route
pnpm build
```

Un état n’est « synchronisé » qu’après ce flux.

## 12. Validation

Le runtime doit échouer clairement sur les incohérences structurelles :
- ID/type/bloc invalide ;
- URL/coordonnées invalides ;
- lancement incomplet ;
- lifecycle goal/parallèle invalide ;
- moment non contigu / multi-bloc / sans display role ;
- premier membre non `OBJECTIVE` ;
- plus de 5 objectifs par carte ;
- hard lock de niveau personnage ;
- `FIN` absente, multiple ou non terminale.

## 13. Anti-patterns

Ne pas :
- reconnaître une quête par son titre pour décider d’un comportement ;
- dupliquer une donnée dérivable dans un nouveau store ;
- recréer un regroupement automatique sans `MOMENT_ID` ;
- afficher des commentaires de construction au joueur ;
- ajouter une métadonnée si un champ existant porte déjà la vérité ;
- transformer une dette d’affichage en nouvelle logique métier.
