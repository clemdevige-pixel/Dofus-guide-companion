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

export interface RouteBlock {
  id: string;
  order: number;
  title: string;
  shortTitle?: string;
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

export interface RouteDocument {
  schemaVersion: 1;
  routeVersion: string;
  title: string;
  blocks: RouteBlock[];
  steps: RouteStep[];
}
