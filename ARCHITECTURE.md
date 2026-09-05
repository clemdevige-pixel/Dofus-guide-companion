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

Le contrat distingue :
- `STEP_ID` : identité d'une étape technique ;
- `MOMENT_ID` : identité éditoriale d'un **moment joueur** pouvant regrouper plusieurs étapes techniques ;
- `DISPLAY_ROLE` : rôle d'une ligne à l'intérieur du moment (`OBJECTIVE`, `TRANSITION`, `DETAIL`).

`getStepGroups()` suit une règle unique :
- plusieurs lignes contiguës partageant le même `MOMENT_ID` = une seule carte ;
- une ligne sans `MOMENT_ID` = une carte autonome.

Il n'existe aucun regroupement automatique fondé sur le type, l'action, la présence de `STOP` ou la proximité des lignes.

Dans une carte mutualisée, `getSequenceObjectives()` utilise exclusivement `DISPLAY_ROLE` :
- `OBJECTIVE` crée une checkbox ;
- `TRANSITION` reste visible dans l'objectif précédent sans checkbox ;
- `DETAIL` reste attaché à l'objectif précédent sans checkbox.

`MOMENT_ID` et `DISPLAY_ROLE` sont les deux seules vérités de présentation métier d'une carte. React ne déduit jamais ces décisions depuis le texte ou le type technique.

Aucune logique React ne doit reconnaître des chaînes comme « Emma », « Tour du monde » ou `TERMINER + LANCER` par leur texte pour décider du regroupement ou du rôle checkbox/transition.

## 6. Validation des moments

La validation refuse :
- `momentId` vide ;
- même `momentId` utilisé dans plusieurs blocs ;
- même `momentId` réouvert après avoir été fermé ;
- séquence non contiguë d'un même moment ;
- `displayRole` inconnu ;
- `displayRole` défini sans `momentId` ;
- `momentId` défini sans `displayRole` ;
- moment commençant par autre chose que `objective` ;
- plus de 5 objectifs dans une carte.

Cette validation protège le contrat Sheet → runtime → UI.

## 7. Fils rouges, verrous et groupes parallèles

Les fils rouges utilisent `GOAL_ID / GOAL_PHASE` exportés vers `longRunningGoal`.

Lifecycle : `start → progress → finish`.

Un hard lock est un blocage réel de progression, pas une simple recommandation.

Un niveau personnage seul ne doit pas créer de `VERROU DUR`. Le validateur rejette explicitement les titres `NIVEAU <n>...` sur un hard lock.

Les vraies salves de quêtes conjointes utilisent `PARALLEL_ID / PARALLEL_PHASE` :
- lifecycle `start → progress* → finish` ;
- le groupe peut rester actif dans la donnée pendant plusieurs cartes ;
- le rappel UI n'est visible que lorsque la carte consultée appartient elle-même au groupe ;
- aucune carte intermédiaire sans rapport ne doit afficher ce rappel.

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
- groupes/cartes de route depuis `MOMENT_ID` ;
- objectifs/checkpoints visibles d'un moment depuis `DISPLAY_ROLE` ;
- rappels de groupes parallèles depuis `PARALLEL_ID` et la carte visible.

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
- lifecycle parallèle incohérent ;
- hard lock de niveau personnage ;
- FIN absente, multiple ou non finale.

Un export invalide ne doit jamais produire silencieusement une route partiellement cassée.

## 11. Export Google Sheet

`scripts/export-route.ts` est le seul point de transformation éditorial → runtime.

Plage actuelle : `ROUTE!A5:V`.

Les colonnes techniques jusqu'à `PARALLEL_PHASE` sont validées avant écriture de `data/route.json`.

## 12. Anti-patterns interdits

- logique spécifique par nom de quête ;
- parsing `title` / `instruction` pour déduire comportement, carte ou rôle de checkbox ;
- index/numéro de ligne comme identité ;
- route mock ou override parallèle ;
- correction manuelle de `route.json` ;
- utilisation de `POSITION` comme destination ;
- nouveau store uniquement pour reproduire une donnée dérivable ;
- regroupement automatique de lignes sans `MOMENT_ID` ;
- `MOMENT_ID` sans `DISPLAY_ROLE` ;
- laisser React décider qu'une ligne est une checkbox à partir de son `type` ;
- afficher un groupe parallèle sur une carte qui n'en est pas un checkpoint.
