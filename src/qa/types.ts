export type QAModule =
  | 'Canvas'
  | 'Layers'
  | 'Timeline'
  | 'Color'
  | 'Export'
  | 'Animation'
  | 'History'
  | 'Selections'
  | 'Import'
  | 'Brushes';

export interface QATestCase {
  id: string;
  phaseId: string;
  name: string;
  description: string;
  module: QAModule;
  type: 'auto' | 'guided' | 'stress';
  steps?: string;
  expected?: string;
  status: 'passed' | 'failed' | 'not_executed';
  lastRun?: string;
}

export interface QAIncident {
  id: string;
  title: string;
  date: string;
  time: string;
  phaseId: string;
  module: QAModule;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'improvement';
  status: 'pending' | 'investigating' | 'resolved' | 'verified' | 'closed';
  description: string;
  reproductionSteps: string;
  expectedResult: string;
  obtainedResult: string;
  crashReport?: string;
  notes?: string;
  assignee: string;
}

export interface QABuildHistory {
  id: string;
  build: string;
  commit: string;
  date: string;
  score: number;
  openIncidents: number;
  regressionsCount: number;
  status: 'Certificada' | 'Rechazada' | 'Evaluada';
}

export interface PlanMaestroPhase {
  id: string;
  name: string;
  description: string;
}

export type QAStateStatus = 'Initializing' | 'WaitingProject' | 'Ready' | 'Suspended' | 'Error';

