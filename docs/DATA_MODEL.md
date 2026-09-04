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
- l'UI ne déduit jamais un moment depuis les titres ou les verbes d'action ;
- le regroupement automatique sans `momentId` n'est qu'un fallback ergonomique, jamais une vérité éditoriale.

Le sélecteur `getStepGroups()` traite `momentId` comme frontière autoritaire. La limite technique de séquence automatique (`MAX_SEQUENCE_STEPS`) ne doit donc jamais servir à définir la structure métier d'une carte voulue explicitement.

### 5.1 DISPLAY_ROLE — structure interne d'une carte

`DISPLAY_ROLE` complète `MOMENT_ID` :
- `MOMENT_ID` répond à **« quelles lignes forment la même carte ? »** ;
- `DISPLAY_ROLE` répond à **« cette ligne crée-t-elle une checkbox ou complète-t-elle un objectif ? »**.

Valeurs Sheet autorisées :
- `OBJECTIVE` → `objective` ;
- `TRANSITION` → `transition` ;
- `DETAIL` → `detail`.

Un `DISPLAY_ROLE` sans `MOMENT_ID` est invalide.

Pendant la migration anti-redondance, les moments non encore renseignés conservent temporairement le fallback historique du sélecteur. La cible est de renseigner explicitement les grosses cartes mutualisées puis de supprimer ce fallback une fois la migration complète.

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
- `DISPLAY_ROLE`.

`STEP_ID` représente un événement métier stable, jamais une ligne physique.

Conserver un ancien ID uniquement si l'événement métier reste réellement le même. Une nouvelle prise anticipée, un nouveau checkpoint ou un nouveau moment reçoit un nouvel ID.

`MOMENT_ID` ne remplace pas `STEP_ID` :
- `STEP_ID` = identité persistante d'une étape technique ;
- `MOMENT_ID` = regroupement éditorial de plusieurs étapes en une carte ;
- `DISPLAY_ROLE` = rôle visuel de la ligne à l'intérieur de cette carte.

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

L'application ne déduit jamais `type` ni `displayRole` depuis `action`.

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
ROUTE (A:T)
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
- une prise n'a aucune donnée de lancement ;
- un `MOMENT_ID` est vide, non contigu ou traverse plusieurs blocs ;
- un hard lock référence un goal jamais démarré ;
- un hard lock de niveau personnage est introduit ;
- une URL structurée est invalide.

`data/route.json` reste un artefact généré. Toute correction éditoriale se fait dans le Sheet puis passe par l'exporteur.
