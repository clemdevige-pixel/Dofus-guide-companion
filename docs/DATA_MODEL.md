# DATA MODEL — Dofus Guide Companion

## 1. Source de vérité

Le Google Sheet `ROUTE` est la source éditoriale. `data/route.json` est un artefact généré et validé.

Flux officiel :

```text
Google Sheet ROUTE
→ scripts/export-route.ts
→ validation stricte
→ data/route.json
→ loader / selectors
→ UI
```

Aucune logique métier spécifique à une quête ne doit être reconstruite dans React.

## 2. Route

```ts
interface RouteDocument {
  schemaVersion: 1;
  routeVersion: string;
  title: string;
  blocks: RouteBlock[];
  steps: RouteStep[];
}
```

```ts
interface RouteBlock {
  id: string;
  order: number;
  title: string;
  shortTitle?: string;
}
```

## 3. Étape

```ts
interface RouteCoordinate {
  x: number;
  y: number;
}

type StepDisplayRole = 'objective' | 'transition' | 'detail';
type ParallelPhase = 'start' | 'progress' | 'finish';

interface GuideItem {
  action: 'take' | 'advance' | 'finish' | 'do';
  label: string;
  location?: RouteCoordinate;
  note?: string;
}

interface RouteStep {
  id: string;
  order: number;
  blockId: string;
  type: StepType;
  displayType?: string;
  displayRole?: StepDisplayRole;

  title: string;
  dofusSeries?: string;

  prerequisites?: string;
  warning?: string;
  action?: string;
  instruction?: string;

  source?: {
    label: string;
    url: string;
  };

  momentId?: string;
  parallelGroup?: {
    parallelId: string;
    phase: ParallelPhase;
  };

  location?: RouteCoordinate;
  destination?: RouteCoordinate;
  launchInstruction?: string;
  guideItems?: GuideItem[];
  preparationItems?: PreparationItem[];

  longRunningGoal?: {
    goalId: string;
    phase: 'start' | 'progress' | 'finish';
  };

  hardLock?: {
    goalId?: string;
    message: string;
  };
}
```

## 4. Identités et regroupements

### `STEP_ID`

Identité métier stable d’une étape technique. Il ne dépend jamais du numéro de ligne Sheet.

Conserver un ID uniquement si l’événement métier reste le même.

### `MOMENT_ID`

Frontière autoritaire d’une carte multi-step.

Règles :
- lignes contiguës ;
- même bloc ;
- un moment fermé ne réapparaît pas ;
- une ligne sans `MOMENT_ID` reste une carte autonome ;
- chaque ligne d’un moment possède un `DISPLAY_ROLE` ;
- le premier membre est `OBJECTIVE` ;
- maximum 5 `OBJECTIVE` par carte.

L’UI ne déduit jamais un moment depuis le titre, l’action ou le type.

### `DISPLAY_ROLE`

- `OBJECTIVE` → checkbox / sous-objectif significatif ;
- `TRANSITION` → action intermédiaire sans checkbox ;
- `DETAIL` → information rattachée au dernier objectif.

Les `action` restent visibles sur les vrais `OBJECTIVE`. Elles ne doivent pas être réintroduites sur `TRANSITION` / `DETAIL` comme doublon visuel.

## 5. Groupes parallèles et fils rouges

### `PARALLEL_ID / PARALLEL_PHASE`

Lifecycle :

```text
start → progress* → finish
```

Ils représentent des quêtes réellement gardées actives ensemble au-delà d’une seule carte.

Le rappel UI n’apparaît que sur une carte appartenant au groupe, jamais sur une carte intermédiaire sans rapport.

### `GOAL_ID / GOAL_PHASE`

Lifecycle des fils rouges :

```text
start → progress* → finish
```

Un hard lock peut fermer un goal lorsque le contrat de route le prévoit.

## 6. Prérequis, warnings et préparation

### `prerequisites`

Donnée éditoriale de cohérence : ce qui doit déjà être vrai ou disponible avant l’étape.

Elle est conservée pour audit/validation mais **n’est pas rendue dans les cartes joueur**.

Les besoins actionnables doivent passer par :
- une carte `PRÉPA` ;
- `warning` si critique ;
- `instruction` / champs structurés si nécessaire.

### `warning`

Information réellement utile avant l’action :
- ordre obligatoire ;
- objet à conserver ;
- timer ;
- condition particulière ;
- interaction critique de sortie.

Les commentaires de routing, d’audit ou d’historique n’ont rien à faire dans `warning`.

Convention forte :

```text
⚠ AVANT DE SORTIR DU DONJON — <action critique>
```

uniquement lorsqu’un oubli peut imposer un nouveau passage ou bloquer la progression.

### `preparationItems`

Checklist structurée des ressources/conditions réellement préparables avant consommation.

Ne pas y déplacer un objet obtenu naturellement pendant la quête.

## 7. Lancement et déplacement

- `location` = position de lancement/prise ;
- `launchInstruction` = méthode de lancement lorsqu’il n’existe pas de coordonnée unique ;
- `destination` = prochain lieu utile ;
- `LANCEMENT_REQUIS=TRUE` doit accompagner une vraie prise.

Ne jamais utiliser `POSITION` comme simple destination.

## 8. `GUIDE_ITEMS`

Format Sheet :

```text
ACTION :: LIBELLÉ :: [x,y] :: NOTE OPTIONNELLE
```

Actions autorisées : `PRENDRE`, `AVANCER`, `TERMINER`, `FAIRE`.

`GUIDE_ITEMS` reste une donnée structurée utile pour les actions courtes et les cartes simples qui en ont besoin.

Décision UX V1 : **ne pas afficher automatiquement `GUIDE_ITEMS` dans les séquences `MOMENT_ID` uniquement pour recopier le déroulé fin déjà disponible sur DPLN**.

Dans une séquence, conserver en priorité :
- objectif ;
- action structurante ;
- transition indispensable ;
- warning/STOP ;
- position utile ;
- message de hard lock.

DPLN reste la source du détail fin d’exécution d’une quête.

## 9. Titres éditoriaux vs titres joueur

`RouteStep.title` conserve le titre éditorial complet dans la donnée brute.

Après validation, `src/route/loader.ts` applique `getPlayerFacingStepTitle()` depuis `src/route/displayTitle.ts` pour produire un titre joueur plus court.

Exemples :

```text
Dépôt de ravitaillement — avancer jusqu'au verrou ...
→ Dépôt de ravitaillement

◆ Serre du Royalmouth — PASSAGE #3
→ Serre du Royalmouth
```

Une carte composite significative peut conserver son suffixe.

Important : les lints éditoriaux / anti-doublons doivent auditer **la donnée brute avant normalisation UI**.

## 10. Marqueurs visuels

`dofusSeries?: string` indique qu’une étape appartient directement à une série d’obtention de Dofus.

Source Sheet : colonne `DOFUS_SERIES`.

Rendu :
- `type === 'alignment'` → bouclier ;
- `dofusSeries` présent → œuf/Dofus ;
- `type === 'dungeon'` → château ;
- maximum 2 marqueurs visibles devant un titre.

Ne pas créer de métadonnées redondantes pour Alignement ou Donjon : leur `type` existe déjà.

## 11. Hard locks

Un `VERROU DUR` représente un blocage réel de progression, pas une recommandation.

Le validateur rejette un hard lock dont le titre commence par `NIVEAU <nombre>`.

Dans une séquence, le message métier de `hardLock.message` doit rester visible.

## 12. Colonnes techniques du Sheet

Colonnes structurantes actuellement utilisées :
- `STEP_ID` ;
- `GOAL_ID` ;
- `GOAL_PHASE` ;
- `POSITION` ;
- `LANCEMENT` ;
- `LANCEMENT_REQUIS` ;
- `DESTINATION` ;
- `GUIDE_ITEMS` ;
- `MOMENT_ID` ;
- `DISPLAY_ROLE` ;
- `PARALLEL_ID` ;
- `PARALLEL_PHASE` ;
- `DOFUS_SERIES`.

La plage d’export couvre désormais `ROUTE!A5:W`.

## 13. Validation

L’export/chargement doit échouer notamment si :
- ID dupliqué ;
- type ou bloc invalide ;
- URL structurée invalide ;
- coordonnées invalides ;
- lancement incomplet ;
- lifecycle goal/parallèle incohérent ;
- `MOMENT_ID` non contigu, multi-bloc ou sans `DISPLAY_ROLE` ;
- moment commençant par autre chose que `OBJECTIVE` ;
- plus de 5 `OBJECTIVE` dans une carte ;
- hard lock de niveau personnage ;
- `FIN` absente, multiple ou non terminale.

`data/route.json` reste un artefact généré. Toute correction éditoriale se fait d’abord dans le Sheet.
