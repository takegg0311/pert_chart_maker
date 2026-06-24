import type { Task, CPMNode, CPMResult } from '../types';

export function calculateCPM(tasks: Task[]): CPMResult {
  type NodeData = Task & Partial<CPMNode>;
  const m: Record<string, NodeData> = {};
  tasks.forEach(t => (m[t.id] = { ...t }));

  const visited = new Set<string>(), order: string[] = [];
  function dfs(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    m[id].predecessorIds.forEach(dfs);
    order.push(id);
  }
  tasks.forEach(t => dfs(t.id));

  order.forEach(id => {
    const t = m[id];
    t.es = t.predecessorIds.length
      ? Math.max(...t.predecessorIds.map(p => m[p].ef!))
      : 0;
    t.ef = t.es + t.duration;
  });

  const projectDuration = Math.max(...tasks.map(t => m[t.id].ef!));

  [...order].reverse().forEach(id => {
    const t = m[id];
    const successors = tasks.filter(s => s.predecessorIds.includes(id));
    t.lf = successors.length
      ? Math.min(...successors.map(s => m[s.id].ls!))
      : projectDuration;
    t.ls = t.lf - t.duration;
    t.tf = t.lf - t.ef!;
    t.isCritical = t.tf === 0;
  });

  const criticalPath = order.filter(id => m[id].tf === 0);

  return {
    nodes: order.map(id => m[id] as CPMNode),
    edges: tasks.flatMap(t =>
      t.predecessorIds.map(p => [p, t.id] as [string, string])
    ),
    projectDuration,
    criticalPath,
  };
}
