export interface Task {
  id: string;
  name: string;
  duration: number;
  predecessorIds: string[];
}

export interface CPMNode extends Task {
  es: number;
  ef: number;
  ls: number;
  lf: number;
  tf: number;
  isCritical: boolean;
}

export interface CPMResult {
  nodes: CPMNode[];
  edges: [string, string][];
  projectDuration: number;
  criticalPath: string[];
}
