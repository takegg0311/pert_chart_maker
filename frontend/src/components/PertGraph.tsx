import { useEffect, useRef } from 'react';
import cytoscape, { type Core } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { Task, CPMResult } from '../types';
import { calculateCPM } from '../lib/cpm';
import { buildElements, cytoscapeStyle, dagreLayout } from '../lib/cytoscapeConfig';

cytoscape.use(dagre);

interface Props {
  tasks: Task[];
  cpmFromServer?: CPMResult | null;
  onNodeClick?: (taskId: string) => void;
}

export function PertGraph({ tasks, cpmFromServer, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || !tasks.length) return;

    const cpm = cpmFromServer ?? calculateCPM(tasks);

    const enrichedTasks = tasks.map(t => {
      const node = cpm.nodes.find(n => n.id === t.id);
      return { ...t, ...node };
    });

    cyRef.current?.destroy();
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: buildElements(enrichedTasks),
      style: cytoscapeStyle as any,
      layout: dagreLayout,
    });

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
