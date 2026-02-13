import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  useInfraStore,
  INSTANCE_IDS,
  type InstanceId,
  type InstanceStatus,
  type SessionPhase,
} from '../../stores/useInfraStore';

// ─── Node style helpers ───

const STATUS_COLORS: Record<InstanceStatus, { bg: string; border: string; text: string }> = {
  idle:         { bg: '#1e293b', border: '#334155', text: '#94a3b8' },
  provisioning: { bg: '#422006', border: '#d97706', text: '#fbbf24' },
  running:      { bg: '#052e16', border: '#16a34a', text: '#4ade80' },
  failed:       { bg: '#450a0a', border: '#dc2626', text: '#f87171' },
  destroying:   { bg: '#431407', border: '#ea580c', text: '#fb923c' },
};

const INSTANCE_ICONS: Record<InstanceId, string> = {
  'hamster-db':       '🗄️',
  'hamster-auth':     '🔐',
  'hamster-kafka':    '⚡',
  'hamster-commerce': '🛒',
  'hamster-billing':  '💳',
  'hamster-payment':  '💰',
  'hamster-support':  '📧',
  'hamster-front':    '🌐',
};

function statusLabel(status: InstanceStatus): string {
  switch (status) {
    case 'idle': return 'Standby';
    case 'provisioning': return 'Starting...';
    case 'running': return 'Online';
    case 'failed': return 'Failed';
    case 'destroying': return 'Stopping...';
  }
}

// ─── Layout positions ───

// Dependency-aware layout: rows represent deployment stages
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  // Control layer
  'github-pages':    { x: 60,  y: 0 },
  'github-actions':  { x: 350, y: 0 },
  'terraform':       { x: 640, y: 0 },

  // Infrastructure layer (stage 1)
  'hamster-db':      { x: 60,  y: 180 },
  'hamster-kafka':   { x: 350, y: 180 },
  'hamster-auth':    { x: 640, y: 180 },

  // Application layer (stage 2)
  'hamster-commerce': { x: 0,   y: 360 },
  'hamster-billing':  { x: 230, y: 360 },
  'hamster-payment':  { x: 460, y: 360 },
  'hamster-support':  { x: 690, y: 360 },

  // Front layer (stage 3)
  'hamster-front':    { x: 350, y: 520 },
};

// ─── Component ───

export function InfraFlowView() {
  const instances = useInfraStore((s) => s.instances);
  const sessionPhase = useInfraStore((s) => s.sessionPhase);

  const { nodes, edges } = useMemo(() => {
    const n: Node[] = [];
    const e: Edge[] = [];

    // ─ Control nodes ─
    n.push(
      makeControlNode('github-pages', 'GitHub Pages', '📄', 'Hamster Controller', sessionPhase !== 'idle'),
      makeControlNode('github-actions', 'GitHub Actions', '⚙️', 'Workflow Runner', isPhaseActive(sessionPhase, 'triggering')),
      makeControlNode('terraform', 'Terraform', '🏗️', 'IaC Engine', isPhaseActive(sessionPhase, 'applying')),
    );

    // Control edges
    e.push(
      makeControlEdge('github-pages', 'github-actions', 'workflow_dispatch', sessionPhase !== 'idle'),
      makeControlEdge('github-actions', 'terraform', 'terraform apply', isPhaseActive(sessionPhase, 'applying')),
    );

    // Terraform → instance edges
    for (const id of INSTANCE_IDS) {
      const inst = instances[id];
      e.push({
        id: `e-terraform-${id}`,
        source: 'terraform',
        target: id,
        animated: inst.status === 'provisioning',
        style: {
          stroke: inst.status === 'idle' ? '#334155' : inst.status === 'provisioning' ? '#d97706' : '#16a34a',
          strokeWidth: 1.5,
          opacity: inst.status === 'idle' ? 0.3 : 0.8,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: inst.status === 'idle' ? '#334155' : '#16a34a' },
      });
    }

    // ─ Instance nodes ─
    for (const id of INSTANCE_IDS) {
      const inst = instances[id];
      const colors = STATUS_COLORS[inst.status];
      const pos = NODE_POSITIONS[id];

      n.push({
        id,
        type: 'default',
        position: pos,
        data: {
          label: (
            <div className="text-center">
              <div
                className="text-[8px] font-bold px-2 py-0.5 rounded-t mb-1"
                style={{ color: colors.text, background: 'rgba(0,0,0,0.3)' }}
              >
                {statusLabel(inst.status)}
              </div>
              <div className="text-2xl mb-1">{INSTANCE_ICONS[id]}</div>
              <div className="text-xs font-bold" style={{ color: colors.text }}>
                {inst.label}
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: colors.text, opacity: 0.7 }}>
                {inst.services.join(' + ')}
              </div>
              {inst.ip && (
                <div className="text-[9px] mt-1 font-mono px-1 py-0.5 rounded"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#4ade80' }}>
                  {inst.ip}
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '10px',
          padding: '0',
          width: 180,
          height: inst.ip ? 130 : 110,
          boxShadow: inst.status === 'running'
            ? `0 0 20px ${colors.border}40`
            : inst.status === 'provisioning'
            ? `0 0 15px ${colors.border}30`
            : 'none',
        },
      });
    }

    // ─ Dependency edges between instances ─
    const deps: [string, string][] = [
      ['hamster-db', 'hamster-auth'],
      ['hamster-db', 'hamster-commerce'],
      ['hamster-db', 'hamster-billing'],
      ['hamster-db', 'hamster-payment'],
      ['hamster-db', 'hamster-support'],
      ['hamster-kafka', 'hamster-commerce'],
      ['hamster-kafka', 'hamster-billing'],
      ['hamster-kafka', 'hamster-payment'],
      ['hamster-kafka', 'hamster-support'],
      ['hamster-auth', 'hamster-commerce'],
      ['hamster-auth', 'hamster-billing'],
      ['hamster-auth', 'hamster-payment'],
      ['hamster-commerce', 'hamster-front'],
      ['hamster-billing', 'hamster-front'],
      ['hamster-payment', 'hamster-front'],
      ['hamster-support', 'hamster-front'],
    ];

    for (const [src, tgt] of deps) {
      const srcInst = instances[src as InstanceId];
      const tgtInst = instances[tgt as InstanceId];
      const active = srcInst.status === 'running' && tgtInst.status !== 'idle';

      e.push({
        id: `e-dep-${src}-${tgt}`,
        source: src,
        target: tgt,
        animated: active,
        style: {
          stroke: active ? '#334155' : '#1e293b',
          strokeWidth: 1,
          opacity: active ? 0.5 : 0.15,
          strokeDasharray: active ? undefined : '4,4',
        },
      });
    }

    return { nodes: n, edges: e };
  }, [instances, sessionPhase]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={20} />
        <Controls position="top-right" />
        <MiniMap
          nodeColor={(node) => {
            if (node.id.startsWith('github') || node.id === 'terraform') return '#6366f1';
            const inst = instances[node.id as InstanceId];
            if (!inst) return '#334155';
            return STATUS_COLORS[inst.status].border;
          }}
          style={{ background: '#0f172a' }}
        />
      </ReactFlow>
    </div>
  );
}

// ─── Helpers ───

function makeControlNode(id: string, label: string, icon: string, subtitle: string, active: boolean): Node {
  return {
    id,
    type: 'default',
    position: NODE_POSITIONS[id],
    data: {
      label: (
        <div className="text-center">
          <div className="text-lg mb-1">{icon}</div>
          <div className={`text-xs font-bold ${active ? 'text-indigo-300' : 'text-gray-500'}`}>
            {label}
          </div>
          <div className={`text-[9px] ${active ? 'text-indigo-400' : 'text-gray-600'}`}>
            {subtitle}
          </div>
        </div>
      ),
    },
    style: {
      background: active ? '#1e1b4b' : '#0f172a',
      border: `2px ${active ? 'solid' : 'dashed'} ${active ? '#6366f1' : '#334155'}`,
      borderRadius: '10px',
      padding: '0',
      width: 160,
      height: 80,
      boxShadow: active ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none',
    },
  };
}

function makeControlEdge(source: string, target: string, label: string, active: boolean): Edge {
  return {
    id: `e-ctrl-${source}-${target}`,
    source,
    target,
    animated: active,
    label: active ? label : undefined,
    labelStyle: { fill: '#818cf8', fontSize: 9, fontWeight: 600 },
    labelBgStyle: { fill: '#1e1b4b', fillOpacity: 0.9 },
    style: {
      stroke: active ? '#6366f1' : '#334155',
      strokeWidth: active ? 2 : 1,
      opacity: active ? 1 : 0.3,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: active ? '#6366f1' : '#334155' },
  };
}

function isPhaseActive(current: SessionPhase, ...phases: SessionPhase[]): boolean {
  const activePhases: SessionPhase[] = ['triggering', 'applying', 'running', 'destroying'];
  if (phases.some((p) => p === current)) return true;
  // All subsequent phases also mean earlier steps are "done"
  const currentIdx = activePhases.indexOf(current);
  return phases.some((p) => {
    const pIdx = activePhases.indexOf(p);
    return pIdx >= 0 && currentIdx > pIdx;
  });
}
