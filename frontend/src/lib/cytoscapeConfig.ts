export function buildElements(tasks: any[]) {
  const nodes = tasks.map(t => ({ data: { ...t } }));
  const edges = tasks.flatMap(t =>
    t.predecessorIds.map((p: string) => ({
      data: { id: `${p}->${t.id}`, source: p, target: t.id },
    }))
  );
  return [...nodes, ...edges];
}

export const cytoscapeStyle = [
  {
    selector: 'node',
    style: {
      shape: 'rectangle',
      width: (ele: any) => 80 + ele.data('duration') * 5,
      height: 84,
      'background-color': '#ffffff',
      'border-color': '#b4b2a9',
      'border-width': 0.5,
      label: '',
    },
  },
  {
    selector: 'node[?isCritical]',
    style: {
      'border-color': '#E24B4A',
      'border-width': 1.5,
      'background-color': '#FCEBEB',
    },
  },
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.8,
      'line-color': '#888780',
      'target-arrow-color': '#888780',
      width: (ele: any) => Math.max(1, ele.target().data('duration') / 3),
    },
  },
];

export const dagreLayout = {
  name: 'dagre',
  rankDir: 'TB',
  nodeSep: 40,
  rankSep: 46,
  padding: 30,
};
