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

`displayType` conserve un libellé éditorial utile (`TOUR`, `TURQUOISE`, `ALIGN.`...) sans multiplier les types comportementaux de l'application.

### Position de lancement vs destination

`location` représente **uniquement** la position où une ou plusieurs quêtes sont lancées. Elle provient de la colonne `POSITION` du Sheet et protège le contrat de prise de quête.

`destination` représente le **point vers lequel le joueur doit se rendre pour exécuter l'étape courante**, même lorsqu'aucune quête n'y est lancée. Elle provient de `DESTINATION`.

Les deux champs sont volontairement séparés : une étape de parcours Ganymède peut demander d'aller à un atelier, une zone de farm, un PNJ de progression ou un donjon sans lancer de nouvelle quête. Il est interdit de détourner `POSITION` pour ce besoin.

Quand une prise et le prochain objectif ont lieu au même point, `location` et `destination` peuvent légitimement contenir la même coordonnée.

Quand une quête n'a pas de position de lancement unique correcte, `launchInstruction` décrit explicitement comment la lancer (objet à double-cliquer, PNJ dépendant de la classe, branche de choix, etc.).

Une étape pouvant lancer plusieurs quêtes compatibles peut conserver une seule `location` lorsque les prises sont réellement regroupées au même point. Si ce regroupement ne peut pas être décrit correctement par une position unique, utiliser `launchInstruction` plutôt que d'inventer une coordonnée moyenne ou approximative.

L'UI n'embarque aucune logique spécifique par quête et ne doit pas reconstruire une destination depuis le texte.

## 5. Roadbook structuré : GUIDE_ITEMS

Les moments de parcours mutualisés peuvent exposer `guideItems` pour répondre directement à la question du joueur : **quoi faire maintenant, et où ?**

Exemple runtime :

```json
{
  "guideItems": [
    {
      "action": "advance",
      "label": "Bûcherons en détresse",
      "location": { "x": 3, "y": -21 },
      "note": "Interroge le Bûcheron traumatisé."
    },
    {
      "action": "advance",
      "label": "Tel est pris qui croyait prendre",
      "location": { "x": 1, "y": -21 },
      "note": "Parle à Alberta Borida."
    }
  ]
}
```

Dans `ROUTE`, la colonne technique `GUIDE_ITEMS` utilise **une action par ligne** avec le format :

```text
ACTION :: LIBELLÉ :: [x,y] :: NOTE OPTIONNELLE
```

Actions autorisées :

- `PRENDRE` → `take` ;
- `AVANCER` → `advance` ;
- `TERMINER` → `finish` ;
- `FAIRE` → `do`.

Exemple éditorial :

```text
AVANCER :: Bûcherons en détresse :: [3,-21] :: Interroge le Bûcheron traumatisé.
AVANCER :: Tel est pris qui croyait prendre :: [1,-21] :: Parle à Alberta Borida.
```

Règles :

- `GUIDE_ITEMS` sert aux listes courtes et actionnables, pas à recopier DPLN ;
- la note est facultative et doit seulement expliquer ce que la position représente lorsque le nom de la quête ne suffit pas ;
- les explications longues, `STOP`, ordre obligatoire ou cas particuliers restent dans `instruction` ;
- l'UI groupe les items par action et affiche par exemple « Vous devez maintenant prendre : » ;
- React ne parse jamais `title` ou `instruction` pour reconstruire ces listes ;
- les coordonnées des items sont indépendantes de `POSITION` et `DESTINATION` : elles décrivent les arrêts individuels d'un moment de parcours.

## 6. Identité stable dans le Sheet

`ROUTE` contient des colonnes techniques :

- `STEP_ID` : identité métier stable de l'étape ;
- `GOAL_ID` : identité stable d'un fil rouge ;
- `GOAL_PHASE` : `start`, `progress` ou `finish` ;
- `POSITION` : position **de lancement** unique sous la forme `[x,y]` lorsqu'elle existe ;
- `LANCEMENT` : instruction structurée de lancement lorsqu'aucune position unique n'est correcte ;
- `LANCEMENT_REQUIS` : booléen indiquant que la ligne réalise une ou plusieurs prises de quête et doit donc posséder `POSITION` ou `LANCEMENT` ;
- `DESTINATION` : destination structurée `[x,y]` du moment de parcours ;
- `GUIDE_ITEMS` : liste structurée des actions courtes du roadbook pour les étapes mutualisées.

`STEP_ID` est une valeur figée. Il ne doit jamais être recalculé depuis le numéro de ligne, le titre ou l'ordre de l'étape.

Lors d'une relinéarisation Ganymède, un ancien `STEP_ID` reste attaché au même événement métier (par exemple la fin d'une quête ou un checkpoint déjà sauvegardé). Un nouveau moment de lancement/progression reçoit un nouvel ID. Ne jamais recycler un ID historique pour une étape sémantiquement différente.

Une insertion de ligne dans le Sheet ne doit donc pas invalider la progression locale déjà sauvegardée.

## 7. Fils rouges et verrous

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

## 8. Préparation

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

Le texte éditorial reste disponible dans le Sheet ; l'application n'a pas besoin de dupliquer les colonnes d'audit ou de mise en forme.

La préparation doit tenir compte des ressources obtenues naturellement dans les quêtes précédentes : ne pas demander un achat/farm si la route optimisée fournit déjà la ressource avant son usage.

## 9. Action

`action` reste principalement une donnée d'affichage :

- `LANCER`
- `LANCER / STOP`
- `TERMINER`
- `AVANCER / STOP`
- `REPRENDRE / AVANCER`
- `REPRENDRE / TERMINER`
- `FAIRE LE LOT`
- `PRÉPARER`
- `FIL ROUGE`
- `VERROU DUR`

L'application ne déduit jamais `type` depuis `action`.

Exception de validation éditoriale : une action contenant `LANCER` doit avoir `LANCEMENT_REQUIS=TRUE`. Cette règle ne sert pas à déterminer le rendu ; elle protège la complétude de la donnée de lancement.

## 10. Données volontairement absentes

Ne pas exporter si elles ne servent pas à l'application :

- numéro de ligne Google Sheet ;
- colonnes d'audit internes, dont `GANYMEDE_AUDIT` ;
- notes de validation historiques ;
- couleurs du Sheet ;
- formules du Sheet.

Les couleurs sont une responsabilité de l'UI, dérivée des données structurées.

Les regroupements Ganymède ne doivent pas être reconstruits à partir du texte. Lorsqu'un moment de parcours doit afficher plusieurs quêtes concernées, utiliser `guideItems`.

## 11. Export depuis le Sheet

Commande :

```bash
pnpm export:route
```

Configuration : voir `.env.example`.

Flux :

```text
ROUTE (A:R)
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
- `DESTINATION` n'est pas une paire d'entiers `[x,y]` ;
- une entrée `GUIDE_ITEMS` utilise une action inconnue ou une position invalide ;
- une action contient `LANCER` sans `LANCEMENT_REQUIS=TRUE` ;
- `LANCEMENT_REQUIS=TRUE` sans `POSITION` ni `LANCEMENT` ;
- un verrou référence un `GOAL_ID` jamais déclaré ;
- une URL structurée est invalide.

Aucune erreur de données ne doit être masquée par une heuristique côté front.

`data/route.json` est un artefact généré. Toute correction éditoriale se fait dans le Sheet puis passe par l'exporteur.
