# DATA MODEL — Dofus Guide Companion

## 1. Objectif

Définir un format de route indépendant de l'UI. Le Google Sheet reste la source éditoriale ; l'application consomme uniquement des champs structurés exportés vers `data/route.json`.

La route optimisée n'est pas une simple liste « une quête = une ligne ». Une ou plusieurs lignes techniques peuvent appartenir à un même **moment joueur** affiché comme une seule carte.

Voir aussi :
- `docs/ROUTE_OPTIMIZATION.md` : doctrine métier ;
- `docs/ROUTE_OPTIMIZATION_WORKFLOW.md` : procédure de passe/audit.

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

## 3. Bloc

```ts
interface RouteBlock {
  id: string;
  order: number;
  title: string;
  shortTitle?: string;
}
```

## 4. Étape

```ts
interface RouteCoordinate {
  x: number;
  y: number;
}

interface GuideItem {
  action: 'take' | 'advance' | 'finish' | 'do';
  label: string;
  location?: RouteCoordinate;
  note?: string;
}

type StepDisplayRole = 'objective' | 'transition' | 'detail';
type ParallelPhase = 'start' | 'progress' | 'finish';

interface RouteStep {
  id: string;
  order: number;
  blockId: string;
  type: StepType;
  displayType?: string;
  displayRole?: StepDisplayRole;

  title: string;
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
  preparationItems?: string[];

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

`displayType` conserve un libellé éditorial utile (`TOUR`, `TURQUOISE`, `ALIGN.`...) sans multiplier les types comportementaux.

`displayRole` ne s'applique qu'aux lignes appartenant à un `momentId` explicite. Il indique comment la ligne participe à la carte :
- `objective` : sous-objectif significatif avec checkbox ;
- `transition` : action intermédiaire visible sans checkbox ;
- `detail` : information technique attachée à l'objectif précédent sans checkbox.

## 5. MOMENT_ID — frontière de carte autoritaire

`momentId` représente un **moment joueur indivisible**. Plusieurs `RouteStep` techniques partageant le même `momentId` contigu sont rendus comme **une seule carte**.

Cas typiques :
- terminer une quête puis lancer immédiatement sa suite auprès du même PNJ ;
- donjon → dialogue de sortie → rendu/reprise immédiate ;
- passage mutualisé où plusieurs lignes techniques forment un seul déplacement logique ;
- chaîne `TERMINER + LANCER` qui ne doit jamais être éclatée en plusieurs cartes.

Règles strictes :
- un `momentId` ne traverse pas deux blocs ;
- toutes ses lignes sont contiguës ;
- une fois fermé, le même `momentId` ne réapparaît pas plus loin ;
- chaque ligne possédant un `momentId` possède aussi un `displayRole` ;
- le premier membre d'un `momentId` est toujours `objective` ;
- une carte contient au maximum **5 lignes `OBJECTIVE`** ; `TRANSITION` et `DETAIL` ne comptent pas dans ce plafond ;
- l'UI ne déduit jamais un moment depuis les titres, types ou verbes d'action ;
- une ligne sans `momentId` est toujours une carte autonome.

`getStepGroups()` applique uniquement ce contrat. Il n'existe plus de regroupement automatique, de limite implicite `MAX_SEQUENCE_STEPS` ni de fallback heuristique.

### 5.1 DISPLAY_ROLE — structure interne d'une carte

`DISPLAY_ROLE` complète `MOMENT_ID` :
- `MOMENT_ID` répond à **« quelles lignes forment la même carte ? »** ;
- `DISPLAY_ROLE` répond à **« cette ligne crée-t-elle une checkbox ou complète-t-elle un objectif ? »**.

Valeurs Sheet autorisées :
- `OBJECTIVE` → `objective` ;
- `TRANSITION` → `transition` ;
- `DETAIL` → `detail`.

Un `DISPLAY_ROLE` sans `MOMENT_ID` est invalide.
Un `MOMENT_ID` sans `DISPLAY_ROLE` est invalide.
Le premier membre d'un moment doit être `OBJECTIVE`.

Pour l'affichage :
- `OBJECTIVE` définit toujours le titre de sa checkbox, même lorsqu'il s'agit d'un donjon ;
- `TRANSITION` et `DETAIL` se rattachent au dernier objectif ;
- une `TRANSITION` sans `instruction` reste visible grâce à un fallback compact construit uniquement depuis ses champs structurés `action + title` ;
- une instruction explicite reste prioritaire sur ce fallback.

### 5.2 PARALLEL_ID / PARALLEL_PHASE — quêtes à avancer ensemble

`parallelGroup` représente une **salve de quêtes qui doit rester active et progresser conjointement**, éventuellement sur plusieurs cartes.

Il ne remplace pas `MOMENT_ID` :
- `MOMENT_ID` = composition d'une carte ;
- `PARALLEL_ID` = continuité d'un groupe de quêtes entre plusieurs cartes ;
- `PARALLEL_PHASE` = lifecycle du groupe.

Lifecycle :

```text
start → progress* → finish
```

Règles strictes :
- `PARALLEL_ID` et `PARALLEL_PHASE` sont toujours définis ensemble ;
- une phase `start` ouvre exactement une fois le groupe ;
- `progress` n'est valide que pour un groupe déjà ouvert ;
- `finish` ferme le groupe et n'est valide qu'une fois ;
- aucun groupe parallèle ne peut rester ouvert en fin de route ;
- on ne crée un groupe que si plusieurs quêtes gagnent réellement à être gardées actives ensemble : mêmes monstres, mêmes drops, même donjon, même checkpoint ou même déplacement coûteux ;
- une simple proximité éditoriale ou une capture Ocre seule ne suffit pas.

Le texte joueur peut annoncer `QUÊTES À AVANCER ENSEMBLE`, mais le texte n'est jamais la source de vérité : seul `parallelGroup` pilote l'état du groupe.

## 6. Position de lancement vs destination

`location` représente uniquement la position où une ou plusieurs quêtes sont lancées (`POSITION` dans le Sheet).

`destination` représente le point vers lequel le joueur doit se rendre pour exécuter le moment courant (`DESTINATION`).

Quand une quête n'a pas de position de lancement unique correcte, `launchInstruction` décrit explicitement comment la lancer.

Interdit : détourner `POSITION` pour obtenir un bouton `/travel` vers un farm, un rendu ou un donjon.

## 7. Roadbook structuré : GUIDE_ITEMS

Les moments mutualisés peuvent exposer `guideItems` pour répondre directement à « quoi faire maintenant, et où ? ».

Format Sheet :

```text
ACTION :: LIBELLÉ :: [x,y] :: NOTE OPTIONNELLE
```

Actions autorisées :
- `PRENDRE` → `take` ;
- `AVANCER` → `advance` ;
- `TERMINER` → `finish` ;
- `FAIRE` → `do`.

`GUIDE_ITEMS` sert aux actions courtes. Les explications longues, STOP, ordre obligatoire et cas particuliers restent dans `instruction`.

## 8. Identité stable dans le Sheet

Colonnes techniques de `ROUTE` :
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
- `PARALLEL_PHASE`.

`STEP_ID` représente un événement métier stable, jamais une ligne physique.

Conserver un ancien ID uniquement si l'événement métier reste réellement le même. Une nouvelle prise anticipée, un nouveau checkpoint ou un nouveau moment reçoit un nouvel ID.

`MOMENT_ID` ne remplace pas `STEP_ID` :
- `STEP_ID` = identité persistante d'une étape technique ;
- `MOMENT_ID` = regroupement éditorial de plusieurs étapes en une carte ;
- `DISPLAY_ROLE` = rôle visuel de la ligne à l'intérieur de cette carte ;
- `PARALLEL_ID` = groupe de quêtes maintenu actif au-delà d'une carte ;
- `PARALLEL_PHASE` = phase de ce groupe.

## 9. Fils rouges et verrous

Un fil rouge et son verrou sont liés par `goalId`, jamais par leur titre.

Lifecycle :

```text
start → progress* → finish
```

Un verrou peut fermer le suivi d'un goal lorsque le contrat de la route le prévoit.

### Interdiction des faux verrous de niveau personnage

Un simple niveau recommandé ou niveau minimum de personnage ne crée pas automatiquement une carte `VERROU DUR`.

Les hard locks doivent représenter un blocage réel de progression dans notre route : quête obligatoire, métier requis, timer, objet/état nécessaire, succès, accès, etc.

Le validateur rejette explicitement un `VERROU DUR` dont le titre commence par `NIVEAU <nombre>`.

## 10. Préparation

Une `PRÉPA` devient `preparationItems` quand des lignes à puce sont disponibles.

La préparation doit tenir compte des ressources fournies naturellement par la route avant leur consommation. Ne pas transformer un niveau conseillé en prérequis bloquant dans une PRÉPA.

## 11. Action

`action` reste principalement une donnée d'affichage :
- `LANCER` ;
- `LANCER / STOP` ;
- `TERMINER` ;
- `AVANCER / STOP` ;
- `REPRENDRE / AVANCER` ;
- `FAIRE LE LOT` ;
- `PRÉPARER` ;
- `FIL ROUGE` ;
- `VERROU DUR`.

L'application ne déduit jamais `type`, `displayRole` ni `parallelGroup` depuis `action`.

Une action contenant `LANCER` doit posséder une donnée de lancement structurée.

## 12. Données volontairement absentes

Ne pas exporter si elles ne servent pas à l'application :
- numéro de ligne Google Sheet ;
- notes d'audit historiques ;
- couleurs ;
- formules ;
- règles implicites reconstituables uniquement en lisant le texte.

## 13. Export depuis le Sheet

Commande :

```bash
pnpm export:route
```

Flux :

```text
ROUTE (A:V)
   ↓
scripts/export-route.ts
   ↓ validation stricte
   ↓
data/route.json
```

L'export/validation échoue notamment si :
- `TYPE` est inconnu ;
- `STEP_ID` manque ou est dupliqué ;
- un bloc est absent ;
- `GOAL_PHASE` est invalide ;
- `POSITION` / `DESTINATION` sont invalides ;
- `GUIDE_ITEMS` est invalide ;
- `DISPLAY_ROLE` est invalide ou défini hors `MOMENT_ID` ;
- un `MOMENT_ID` est défini sans `DISPLAY_ROLE` ;
- un moment commence par `TRANSITION` ou `DETAIL` ;
- une carte expose plus de 5 `OBJECTIVE` ;
- une prise n'a aucune donnée de lancement ;
- un `MOMENT_ID` est vide, non contigu ou traverse plusieurs blocs ;
- `PARALLEL_ID` / `PARALLEL_PHASE` sont incomplets ou ont un lifecycle invalide ;
- un groupe parallèle reste actif en fin de route ;
- un hard lock référence un goal jamais démarré ;
- un hard lock de niveau personnage est introduit ;
- une URL structurée est invalide.

`data/route.json` reste un artefact généré. Toute correction éditoriale se fait dans le Sheet puis passe par l'exporteur.
