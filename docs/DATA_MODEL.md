# DATA MODEL — Dofus Guide Companion

## 1. Objectif

Définir un format de route indépendant du Google Sheet et indépendant de l'UI.

Le modèle doit représenter la roadmap sans interpréter du texte libre pour connaître le comportement d'une étape.

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

## 5. Pourquoi `goalId`

Un fil rouge et son verrou dur doivent être liés par une donnée explicite.

Exemple :

```json
{
  "id": "ocre-start",
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
  "id": "ocre-hard-lock",
  "type": "hard_lock",
  "hardLock": {
    "goalId": "eternelle-moisson",
    "message": "Terminer les étapes 1 à 18 avant de continuer."
  }
}
```

L'application peut alors calculer les fils rouges actifs sans rechercher les mots « Ocre » ou « fil rouge » dans les titres.

## 6. Préparation

Une PRÉPA doit idéalement être exportée comme liste structurée :

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

Le texte brut peut être conservé en fallback pendant la première migration, mais la cible est une vraie liste.

## 7. Action

`action` est une donnée d'affichage simple, par exemple :

- `TERMINER`
- `AVANCER / STOP`
- `FAIRE & VALIDER`
- `REPRENDRE / TERMINER`
- `PRÉPARER`
- `FIL ROUGE`
- `VERROU DUR`

L'application ne doit pas déduire le type depuis `action`.

## 8. Données volontairement absentes

Ne pas exporter si elles ne servent pas à la V1 :

- numéro de ligne Google Sheet ;
- colonnes d'audit internes ;
- notes de validation historiques ;
- couleurs du Sheet ;
- formules du Sheet.

Les couleurs sont une responsabilité de l'UI, dérivée de `type`.

## 9. Exemple complet

```json
{
  "schemaVersion": 1,
  "routeVersion": "2026-09-03",
  "title": "Astrub → Dofus Sylvestre",
  "blocks": [
    {
      "id": "block-01",
      "order": 1,
      "title": "Incarnam → Astrub"
    }
  ],
  "steps": [
    {
      "id": "block-01-premiers-pas",
      "order": 1,
      "blockId": "block-01",
      "type": "quest",
      "title": "Premiers pas",
      "action": "TERMINER",
      "source": {
        "label": "DPLN",
        "url": "https://www.dofuspourlesnoobs.com/"
      }
    }
  ]
}
```

## 10. Migration depuis le Sheet

L'exporteur devra mapper explicitement les valeurs de TYPE du Sheet vers `StepType`.

Aucune valeur inconnue ne doit être acceptée silencieusement.

Le premier export peut conserver `instruction` sous forme de texte. Les structures plus riches (`preparationItems`, relations de fils rouges) peuvent être enrichies progressivement, mais sans créer de logique spécifique dans le front.
