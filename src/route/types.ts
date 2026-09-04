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
  title: string;
  action?: string;
  instruction?: string;
  source?: {
    label: string;
    url: string;
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
