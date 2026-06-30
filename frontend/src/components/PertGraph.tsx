import { useEffect, useRef } from 'react';
import cytoscape, { type Core } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import type { Task, CPMResult } from '../types';
import { calculateCPM } from '../lib/cpm';
import { buildElements, cytoscapeStyle, dagreLayout, nodeHtmlLabelParams } from '../lib/cytoscapeConfig';
import './PertGraph.css';

cytoscape.use(dagre);
cytoscape.use(nodeHtmlLabel);

interface Props {
  tasks: Task[];
  cpmFromServer?: CPMResult | null;
  onNodeClick?: (taskId: string) => void;
  onCpmComputed?: (cpm: CPMResult) => void;
}

export function PertGraph({ tasks, cpmFromServer, onNodeClick, onCpmComputed }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || !tasks.length) return;

    const cpm = cpmFromServer ?? calculateCPM(tasks);
    onCpmComputed?.(cpm);

    const enrichedTasks = tasks.map((t, i) => {
      const node = cpm.nodes.find(n => n.id === t.id);
      const label = /^\d+$/.test(t.id) ? `#${t.id}` : `${i + 1}`;
      return { ...t, ...node, label };
    });

    cyRef.current?.destroy();
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: buildElements(enrichedTasks),
      style: cytoscapeStyle as any,
      layout: dagreLayout,
    });

    (cyRef.current as any).nodeHtmlLabel(nodeHtmlLabelParams);
    applyCPMStyles(cyRef.current, cpm);
    cyRef.current.one('layoutstop', () => {
      cyRef.current?.resize();
      cyRef.current?.fit(undefined, 30);
    });

    cyRef.current.on('tap', 'node', evt => onNodeClick?.(evt.target.id()));
    return () => cyRef.current?.destroy();
  }, [tasks, cpmFromServer]);

  return <div ref={containerRef} style={{ width: '100%', height: 600, textAlign: 'left' }} />;
}

function applyCPMStyles(cy: Core, cpm: CPMResult) {
  const critEdge = new Set(
    cpm.edges
      .filter(([s, t]) => cpm.criticalPath.includes(s) && cpm.criticalPath.includes(t))
      .map(([s, t]) => `${s}->${t}`)
  );

  critEdge.forEach(id => {
    cy.getElementById(id).style({
      'line-color': '#E24B4A',
      'target-arrow-color': '#E24B4A',
      width: 2,
    });
  });
}
