# DATA MODEL — Dofus Guide Companion

## 1. Objectif

Définir un format de route indépendant de l'UI. Le Google Sheet reste la source éditoriale, mais les comportements applicatifs reposent sur des champs structurés et jamais sur du parsing de texte libre.

La route optimisée ne doit pas être pensée comme une simple liste « une quête = une ligne ». Une étape peut représenter un moment de parcours : prise anticipée, progression, objectif mutualisé, donjon partagé ou reprise différée. Le modèle reste néanmoins strictement linéaire et data-driven.

Voir `docs/ROUTE_OPTIMIZATION.md` pour la méthode éditoriale Ganymède.

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
type StepType =
  | 'quest'
  | 'resume'
  | 'dungeon'
  | 'preparation'
  | 'rule'
  | 'milestone'
  | 'long_running'
  | 'hard_lock'
  | 'alignment'
  | 'order'
  | 'major_step'
  | 'finish';

interface RouteStep {
  id: string;
  order: number;
  blockId: string;
  type: StepType;
  displayType?: string;

  title: string;
  action?: string;
  instruction?: string;

  source?: {
    label: string;
    url: string;
  };

  location?: {
    x: number;
    y: number;
  };
  launchInstruction?: string;

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

`displayType` conserve un libellé éditorial utile (`TOUR`, `TURQUOISE`, `ALIGN.`...) sans multiplier les types comportementaux de l'application.

`location` représente une position de lancement unique exploitable pour `/travel`. Quand une quête n'a pas de position unique correcte, `launchInstruction` décrit explicitement comment la lancer (objet à double-cliquer, PNJ dépendant de la classe, branche de choix, etc.). L'UI n'embarque aucune logique spécifique par quête : elle affiche la position si elle existe, sinon l'instruction de lancement structurée.

Une étape pouvant lancer plusieurs quêtes compatibles peut conserver une seule `location` lorsque les prises sont réellement regroupées au même point. Si ce regroupement ne peut pas être décrit correctement par une position unique, utiliser `launchInstruction` plutôt que d'inventerer une coordonnée moyenne ou approximative.

## 5. Identité stable dans le Sheet

`ROUTE` contient des colonnes techniques :

- `STEP_ID` : identité métier stable de l'étape ;
- `GOAL_ID` : identité stable d'un fil rouge ;
- `GOAL_PHASE` : `start`, `progress` ou `finish` ;
- `POSITION` : position de lancement unique sous la forme `[x,y]` lorsqu'elle existe ;
- `LANCEMENT` : instruction structurée de lancement lorsqu'aucune position unique n'est correcte ;
- `LANCEMENT_REQUIS` : booléen indiquant que la ligne réalise une ou plusieurs prises de quête et doit donc posséder `POSITION` ou `LANCEMENT`.

`STEP_ID` est une valeur figée. Il ne doit jamais être recalculé depuis le numéro de ligne, le titre ou l'ordre de l'étape.

Une insertion de ligne dans le Sheet ne doit donc pas invalider la progression locale déjà sauvegardée.

## 6. Fils rouges et verrous

Un fil rouge et son verrou sont liés par `goalId`, jamais par leur titre.

```json
{
  "id": "route-step-0121",
  "type": "long_running",
  "longRunningGoal": {
    "goalId": "eternelle-moisson",
    "phase": "start"
  }
}
```

Puis :

```json
{
  "id": "route-step-0887",
  "type": "hard_lock",
  "hardLock": {
    "goalId": "eternelle-moisson",
    "message": "Complète les captures manquantes avant de continuer."
  }
}
```

L'application peut ainsi dériver les fils rouges actifs sans rechercher « Ocre » ou « fil rouge » dans le texte.

La refonte Ganymède augmente volontairement le nombre de quêtes gardées actives. Toute quête qui doit traverser plusieurs étapes et dont l'état applicatif doit être exposé doit utiliser le mécanisme structuré de fil rouge plutôt qu'une convention textuelle implicite.

## 7. Préparation

Une PRÉPA est exportée vers `preparationItems` lorsque des lignes à puce sont présentes :

```json
{
  "type": "preparation",
  "title": "Frigost II",
  "preparationItems": [
    "4 Métaria Mage jaune / rouge / verte / bleue",
    "Pierres d'âme adaptées",
    "29 999 kamas"
  ]
}
```

Le texte éditorial reste disponible dans le Sheet ; la V1 n'a pas besoin de dupliquer les colonnes d'audit ou de mise en forme.

La préparation doit tenir compte des ressources obtenues naturellement dans les quêtes précédentes : ne pas demander un achat/farm si la route optimisée fournit déjà la ressource avant son usage.

## 8. Action

`action` reste principalement une donnée d'affichage :

- `LANCER`
- `LANCER / STOP`
- `TERMINER`
- `AVANCER / STOP`
- `REPRENDRE / AVANCER`
- `REPRENDRE / TERMINER`
- `PRÉPARER`
- `FIL ROUGE`
- `VERROU DUR`

L'application ne déduit jamais `type` depuis `action`.

Exception de validation éditoriale : une action contenant `LANCER` doit avoir `LANCEMENT_REQUIS=TRUE`. Cette règle ne sert pas à déterminer le rendu ; elle protège la complétude de la donnée de lancement.

## 9. Données volontairement absentes

Ne pas exporter si elles ne servent pas à l'application :

- numéro de ligne Google Sheet ;
- colonnes d'audit internes, dont `GANYMEDE_AUDIT` ;
- notes de validation historiques ;
- couleurs du Sheet ;
- formules du Sheet.

Les couleurs sont une responsabilité de l'UI, dérivée des données structurées.

Les regroupements Ganymède ne doivent pas être reconstruits à partir du texte. Si la future UI a besoin d'afficher explicitement plusieurs quêtes concernées par une étape de parcours, le modèle sera étendu avec un champ structuré dédié avant modification de React.

## 10. Export depuis le Sheet

Commande :

```bash
pnpm export:route
```

Configuration : voir `.env.example`.

Flux :

```text
ROUTE (A:P)
   ↓
scripts/export-route.ts
   ↓ validation stricte
   ↓
data/route.json
```

L'export échoue notamment si :

- `TYPE` est inconnu ;
- `STEP_ID` manque ou est dupliqué ;
- un bloc est absent ;
- `GOAL_PHASE` est invalide ;
- `POSITION` n'est pas une paire d'entiers `[x,y]` ;
- une action contient `LANCER` sans `LANCEMENT_REQUIS=TRUE` ;
- `LANCEMENT_REQUIS=TRUE` sans `POSITION` ni `LANCEMENT` ;
- un verrou référence un `GOAL_ID` jamais déclaré ;
- une URL structurée est invalide.

Aucune erreur de données ne doit être masquée par une heuristique côté front.

`data/route.json` est un artefact généré. Toute correction éditoriale se fait dans le Sheet puis passe par l'exporteur.
