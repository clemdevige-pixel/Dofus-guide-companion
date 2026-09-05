export type StepType =
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

export type GuideItemAction = 'take' | 'advance' | 'finish' | 'do';
export type StepDisplayRole = 'objective' | 'transition' | 'detail';
export type ParallelPhase = 'start' | 'progress' | 'finish';

export interface RouteBlock {
  id: string;
  order: number;
  title: string;
  shortTitle?: string;
}

export interface RouteCoordinate {
  x: number;
  y: number;
}

export interface GuideItem {
  action: GuideItemAction;
  label: string;
  location?: RouteCoordinate;
  note?: string;
}

export interface RouteStep {
  id: string;
  order: number;
  blockId: string;
  type: StepType;
  displayType?: string;
  /** Rôle éditorial dans une carte mutualisée : checkbox, transition sans checkbox ou détail technique. */
  displayRole?: StepDisplayRole;
  title: string;
  action?: string;
  /** Prérequis joueur issus de la colonne PRÉREQUIS / RESSOURCES du Sheet. */
  prerequisites?: string;
  /** Avertissement/contexte joueur issu de la colonne À SAVOIR du Sheet. */
  warning?: string;
  instruction?: string;
  source?: {
    label: string;
    url: string;
  };
  /** Identifiant éditorial d'un même moment de parcours affiché comme une seule carte. */
  momentId?: string;
  /** Groupe de quêtes qui doivent rester actives et être avancées conjointement sur plusieurs cartes. */
  parallelGroup?: {
    parallelId: string;
    phase: ParallelPhase;
  };
  /** Position structurée où une quête est lancée. */
  location?: RouteCoordinate;
  /** Position structurée vers laquelle le joueur doit se rendre pour exécuter cette étape. */
  destination?: RouteCoordinate;
  launchInstruction?: string;
  /** Actions courtes du roadbook : quoi prendre/avancer/terminer et où. */
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

export interface RouteDocument {
  schemaVersion: 1;
  routeVersion: string;
  title: string;
  blocks: RouteBlock[];
  steps: RouteStep[];
}
