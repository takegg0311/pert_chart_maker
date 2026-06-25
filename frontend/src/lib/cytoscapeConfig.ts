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

export const nodeHtmlLabelParams = [
  {
    query: 'node',
    halign: 'center' as const,
    valign: 'center' as const,
    halignBox: 'center' as const,
    valignBox: 'center' as const,
    tpl: (data: any) => `
      <div class="aon-box ${data.isCritical ? 'aon-box--critical' : ''}">
        <div class="aon-box__quad">
          <span class="aon-box__cell aon-box__cell--es">${data.es ?? '-'}</span>
          <span class="aon-box__cell aon-box__cell--ef">${data.ef ?? '-'}</span>
        </div>
        <div class="aon-box__name">${data.name}</div>
        <div class="aon-box__duration">${data.duration}日</div>
        <div class="aon-box__quad">
          <span class="aon-box__cell aon-box__cell--ls">${data.ls ?? '-'}</span>
          <span class="aon-box__cell aon-box__cell--lf">${data.lf ?? '-'}</span>
        </div>
      </div>
    `,
  },
];
