# ARCHITECTURE — Dofus Guide Companion

## 1. Principes

Architecture simple, locale et data-driven.

Le companion ne connaît pas les règles métier de chaque quête. Il interprète uniquement une route structurée.

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
UI overlay
```

Le Google Sheet est la source éditoriale. `data/route.json` est un artefact généré.

## 3. Stack

- Tauri 2
- React
- TypeScript
- Vite
- persistance locale

Largeur compacte par défaut : 380 px, fenêtre librement redimensionnable.

## 4. Route et progression

Les données de route et la progression utilisateur restent séparées.

Progression persistée :
- `completedStepIds` ;
- `currentStepId` de consultation ;
- préférences UI.

Un `STEP_ID` est une identité métier stable. Une insertion/relinéarisation du Sheet ne doit pas casser la progression si l'événement métier n'a pas changé.

## 5. Cartes UI : moments explicites

Une ligne `RouteStep` n'équivaut pas nécessairement à une carte.

Le contrat actuel distingue :
- `STEP_ID` : identité d'une étape technique ;
- `MOMENT_ID` : identité éditoriale d'un **moment joueur** pouvant regrouper plusieurs étapes techniques ;
- `DISPLAY_ROLE` : rôle d'une ligne à l'intérieur du moment (`OBJECTIVE`, `TRANSITION`, `DETAIL`).

`getStepGroups()` applique la priorité suivante :
1. `MOMENT_ID` explicite et contigu → frontière de carte autoritaire ;
2. étapes ordinaires sans moment explicite → regroupement automatique de confort ;
3. étapes spéciales / fils rouges / verrous / grosses étapes → carte propre selon leur contrat.

Dans une carte mutualisée, `getSequenceObjectives()` utilise `DISPLAY_ROLE` quand il est présent :
- `OBJECTIVE` crée une checkbox ;
- `TRANSITION` reste visible dans l'objectif précédent sans checkbox ;
- `DETAIL` reste attaché à l'objectif précédent sans checkbox.

Le fallback historique par type ne sert que pour les moments pas encore migrés pendant la passe anti-redondance. La cible est de faire porter cette décision par `ROUTE`, pas par React.

Le regroupement automatique est limité techniquement mais cette limite n'est pas une règle métier. Si un moment doit absolument être une seule carte, le Sheet doit fournir `MOMENT_ID`.

Aucune logique React ne doit reconnaître des chaînes comme « Emma », « Tour du monde » ou `TERMINER + LANCER` par leur texte pour décider du regroupement ou du rôle checkbox/transition.

## 6. Validation des moments

La validation refuse :
- `momentId` vide ;
- même `momentId` utilisé dans plusieurs blocs ;
- même `momentId` réouvert après avoir été fermé ;
- séquence non contiguë d'un même moment ;
- `displayRole` inconnu ;
- `displayRole` défini sans `momentId`.

Cette validation protège le contrat Sheet → runtime → UI.

## 7. Fils rouges et verrous

Les fils rouges utilisent `GOAL_ID / GOAL_PHASE` exportés vers `longRunningGoal`.

Lifecycle : `start → progress → finish`.

Un hard lock est un blocage réel de progression, pas une simple recommandation.

Un niveau personnage seul ne doit pas créer de `VERROU DUR`. Le validateur rejette explicitement les titres `NIVEAU <n>...` sur un hard lock afin d'éviter de transformer une recommandation ou un niveau de quête en faux mur de parcours.

## 8. Lancements et déplacements

- `location` = position de prise de quête ;
- `launchInstruction` = lancement sans coordonnée unique ;
- `destination` = prochain lieu utile ;
- `guideItems` = arrêts/actions internes à un moment mutualisé.

React ne parse jamais les textes pour reconstruire ces données.

## 9. Sélecteurs dérivés

Les comportements suivants restent calculés depuis `route + completedStepIds` :
- première étape non validée ;
- progression ;
- fils rouges actifs ;
- prochain verrou dur ;
- préparation du bloc ;
- étapes validées ;
- groupes/cartes de route ;
- objectifs/checkpoints visibles d'un moment depuis `DISPLAY_ROLE`.

Ne pas dupliquer ces vérités dans un store global supplémentaire.

## 10. Validation de données

Le chargement/export doit échouer clairement si :
- ID dupliqué ;
- type/bloc invalide ;
- URL invalide ;
- coordonnées invalides ;
- lancement incomplet ;
- goal incohérent ;
- moment incohérent ;
- display role incohérent ;
- hard lock de niveau personnage ;
- FIN absente, multiple ou non finale.

Un export invalide ne doit jamais produire silencieusement une route partiellement cassée.

## 11. Export Google Sheet

`scripts/export-route.ts` est le seul point de transformation éditorial → runtime.

Plage actuelle : `ROUTE!A5:T`.

Colonnes techniques jusqu'à `DISPLAY_ROLE` sont validées avant écriture de `data/route.json`.

## 12. Anti-patterns interdits

- logique spécifique par nom de quête ;
- parsing `title` / `instruction` pour déduire comportement, carte ou rôle de checkbox ;
- index/numéro de ligne comme identité ;
- route mock ou override parallèle ;
- correction manuelle de `route.json` ;
- utilisation de `POSITION` comme destination ;
- nouveau store uniquement pour reproduire une donnée dérivable ;
- moment éditorial laissé au regroupement automatique alors qu'il est connu dans le Sheet ;
- laisser React décider qu'une ligne est une checkbox uniquement à partir de son `type` lorsqu'un rôle éditorial est connu.
