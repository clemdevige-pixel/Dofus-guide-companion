# DATA MODEL — Dofus Guide Companion

## 1. Objectif

Définir un format de route indépendant de l'UI. Le Google Sheet reste la source éditoriale, mais les comportements applicatifs reposent sur des champs structurés et jamais sur du parsing de texte libre.

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

## 5. Identité stable dans le Sheet

`ROUTE` contient des colonnes techniques masquées :

- `STEP_ID` : identité métier stable de l'étape ;
- `GOAL_ID` : identité stable d'un fil rouge ;
- `GOAL_PHASE` : `start`, `progress` ou `finish`.

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

## 8. Action

`action` reste une donnée d'affichage :

- `TERMINER`
- `AVANCER / STOP`
- `REPRENDRE / TERMINER`
- `PRÉPARER`
- `FIL ROUGE`
- `VERROU DUR`

L'application ne déduit jamais `type` depuis `action`.

## 9. Données volontairement absentes

Ne pas exporter si elles ne servent pas à la V1 :

- numéro de ligne Google Sheet ;
- colonnes d'audit internes ;
- notes de validation historiques ;
- couleurs du Sheet ;
- formules du Sheet.

Les couleurs sont une responsabilité de l'UI, dérivée des données structurées.

## 10. Export depuis le Sheet

Commande :

```bash
pnpm export:route
```

Configuration : voir `.env.example`.

Flux :

```text
ROUTE (A:M)
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
- un verrou référence un `GOAL_ID` jamais déclaré ;
- une URL structurée est invalide.

Aucune erreur de données ne doit être masquée par une heuristique côté front.
