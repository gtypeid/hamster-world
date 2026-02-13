import { useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
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

// ─── Colors ───

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

// ─── LR Layout: columns = Git | Actions | AWS ───
//
//  Col 0 (x=0)      Col 1 (x=280)     Col 2 (x=560)    Col 3 (x=820+)
//  ┌──────────┐     ┌──────────────┐   ┌───────────┐    ┌────────────────────────────────┐
//  │ Git IO   │────>│ hamster-world│──>│ Actions   │──> │  AWS (instances)               │
//  │ (Pages)  │     │ (Repository) │   │           │    │  ┌──┐ ┌──┐ ┌──┐               │
//  └──────────┘     └──────────────┘   │           │──> │  │DB│ │KF│ │AU│  (infra row)   │
//                                      │ Terraform │    │  └──┘ └──┘ └──┘               │
//                                      │           │──> │  ┌──┐ ┌──┐ ┌──┐ ┌──┐          │
//                                      └───────────┘    │  │CM│ │BL│ │PY│ │SP│ (app row) │
//                                                       │  └──┘ └──┘ └──┘ └──┘          │
//                                                       │        ┌──┐                    │
//                                                       │        │FT│  (front row)       │
//                                                       │        └──┘                    │
//                                                       └────────────────────────────────┘

// Column X positions
const COL_GIT = 0;
const COL_REPO = 250;
const COL_ACTIONS = 500;
const COL_AWS_START = 780;

// AWS zone boundaries
const AWS_PAD = 30;
const AWS_X = COL_AWS_START - AWS_PAD;
const AWS_INNER_X = COL_AWS_START;

// Row Y positions (centered vertically)
const ROW_CENTER = 200;

// Instance positions inside AWS zone (LR layout, top-to-bottom rows)
const INST_W = 150;
const INST_GAP = 16;

const INFRA_ROW_Y = 40;
const APP_ROW_Y = 200;
const FRONT_ROW_Y = 360;

function instanceX(col: number): number {
  return AWS_INNER_X + col * (INST_W + INST_GAP);
}

const INSTANCE_POSITIONS: Record<InstanceId, { x: number; y: number }> = {
  // Infra row (3)
  'hamster-db':       { x: instanceX(0), y: INFRA_ROW_Y },
  'hamster-kafka':    { x: instanceX(1), y: INFRA_ROW_Y },
  'hamster-auth':     { x: instanceX(2), y: INFRA_ROW_Y },
  // App row (4)
  'hamster-commerce': { x: instanceX(0),   y: APP_ROW_Y },
  'hamster-billing':  { x: instanceX(1),   y: APP_ROW_Y },
  'hamster-payment':  { x: instanceX(2),   y: APP_ROW_Y },
  'hamster-support':  { x: instanceX(3),   y: APP_ROW_Y },
  // Front row (1)
  'hamster-front':    { x: instanceX(1.5), y: FRONT_ROW_Y },
};

const AWS_ZONE_W = (INST_W + INST_GAP) * 4 + AWS_PAD * 2;
const AWS_ZONE_H = FRONT_ROW_Y + 140 + AWS_PAD;

// ─── Component ───

export function InfraFlowView() {
  const instances = useInfraStore((s) => s.instances);
  const sessionPhase = useInfraStore((s) => s.sessionPhase);

  const { nodes, edges } = useMemo(() => {
    const n: Node[] = [];
    const e: Edge[] = [];

    // ─── AWS Zone background node ───
    n.push({
      id: 'aws-zone',
      type: 'group',
      position: { x: AWS_X, y: -AWS_PAD },
      data: { label: '' },
      style: {
        width: AWS_ZONE_W,
        height: AWS_ZONE_H,
        background: 'rgba(249, 115, 22, 0.03)',
        border: '2px dashed #92400e',
        borderRadius: '16px',
        padding: '0',
        zIndex: -1,
      },
    });

    // AWS zone label node
    n.push({
      id: 'aws-label',
      type: 'default',
      position: { x: AWS_X + AWS_ZONE_W / 2 - 60, y: -AWS_PAD - 16 },
      data: {
        label: (
          <div className="text-[10px] font-bold text-orange-400 tracking-wider">
            AWS EC2 (Free Tier)
          </div>
        ),
      },
      selectable: false,
      draggable: false,
      style: {
        background: '#1c1917',
        border: '1px solid #92400e',
        borderRadius: '4px',
        padding: '0',
        width: 120,
        height: 20,
      },
    });

    // ─── Git column ───
    n.push(makeControlNode(
      'github-pages',
      { x: COL_GIT, y: ROW_CENTER - 40 },
      'GitHub IO', '📄', 'hamster-controller',
      true, // always visible
    ));

    // ─── Repo column ───
    n.push(makeControlNode(
      'hamster-repo',
      { x: COL_REPO, y: ROW_CENTER - 40 },
      'hamster-world', '📦', 'Repository',
      sessionPhase !== 'idle',
    ));

    // ─── Actions/Terraform column ───
    n.push(makeControlNode(
      'github-actions',
      { x: COL_ACTIONS, y: ROW_CENTER - 80 },
      'GitHub Actions', '⚙️', 'Workflow Runner',
      isPhaseActive(sessionPhase, 'triggering'),
    ));
    n.push(makeControlNode(
      'terraform',
      { x: COL_ACTIONS, y: ROW_CENTER + 20 },
      'Terraform', '🏗️', 'IaC Engine',
      isPhaseActive(sessionPhase, 'applying'),
    ));

    // ─── Control edges (LR flow) ───
    e.push(
      makeLREdge('github-pages', 'hamster-repo', 'API call', sessionPhase !== 'idle'),
      makeLREdge('hamster-repo', 'github-actions', 'workflow_dispatch', isPhaseActive(sessionPhase, 'triggering')),
      makeVertEdge('github-actions', 'terraform', 'run', isPhaseActive(sessionPhase, 'applying')),
    );

    // ─── Terraform → instances ───
    // Single edge from terraform to the AWS zone (conceptually to first infra instances)
    for (const id of ['hamster-db', 'hamster-kafka', 'hamster-auth'] as InstanceId[]) {
      const inst = instances[id];
      e.push({
        id: `e-tf-${id}`,
        source: 'terraform',
        target: id,
        animated: inst.status === 'provisioning',
        style: {
          stroke: inst.status === 'idle' ? '#334155' : inst.status === 'provisioning' ? '#d97706' : '#16a34a',
          strokeWidth: 1.5,
          opacity: inst.status === 'idle' ? 0.2 : 0.7,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: inst.status === 'idle' ? '#334155' : '#16a34a' },
      });
    }

    // ─── Instance nodes ───
    for (const id of INSTANCE_IDS) {
      const inst = instances[id];
      const colors = STATUS_COLORS[inst.status];
      const pos = INSTANCE_POSITIONS[id];

      n.push({
        id,
        type: 'default',
        position: pos,
        data: {
          label: (
            <div className="text-center">
              <div
                className="text-[7px] font-bold px-2 py-0.5 rounded-t"
                style={{ color: colors.text, background: 'rgba(0,0,0,0.4)' }}
              >
                {statusLabel(inst.status)}
              </div>
              <div className="text-xl my-0.5">{INSTANCE_ICONS[id]}</div>
              <div className="text-[11px] font-bold" style={{ color: colors.text }}>
                {inst.label}
              </div>
              <div className="text-[8px]" style={{ color: colors.text, opacity: 0.6 }}>
                {inst.services.join(' + ')}
              </div>
              {inst.ip && (
                <div className="text-[8px] mt-0.5 font-mono px-1 py-0.5 rounded"
                  style={{ background: 'rgba(0,0,0,0.4)', color: '#4ade80' }}>
                  {inst.ip}
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '0',
          width: INST_W,
          height: inst.ip ? 120 : 105,
          boxShadow: inst.status === 'running'
            ? `0 0 20px ${colors.border}40`
            : inst.status === 'provisioning'
            ? `0 0 15px ${colors.border}30`
            : 'none',
        },
      });
    }

    // ─── Dependency edges ───
    const deps: [InstanceId, InstanceId][] = [
      // infra → app
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
      // app → front
      ['hamster-commerce', 'hamster-front'],
      ['hamster-billing', 'hamster-front'],
      ['hamster-payment', 'hamster-front'],
      ['hamster-support', 'hamster-front'],
    ];

    for (const [src, tgt] of deps) {
      const srcInst = instances[src];
      const tgtInst = instances[tgt];
      const active = srcInst.status === 'running' && tgtInst.status !== 'idle';

      e.push({
        id: `e-dep-${src}-${tgt}`,
        source: src,
        target: tgt,
        animated: active,
        style: {
          stroke: active ? '#475569' : '#1e293b',
          strokeWidth: 1,
          opacity: active ? 0.4 : 0.1,
          strokeDasharray: active ? undefined : '3,3',
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
        fitViewOptions={{ padding: 0.12 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="#1e293b" gap={24} size={1} />
        <Controls position="top-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

// ─── Helpers ───

function makeControlNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  icon: string,
  subtitle: string,
  active: boolean,
): Node {
  return {
    id,
    type: 'default',
    position,
    data: {
      label: (
        <div className="text-center">
          <div className="text-lg mb-0.5">{icon}</div>
          <div className={`text-[11px] font-bold ${active ? 'text-indigo-300' : 'text-gray-500'}`}>
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
      width: 150,
      height: 76,
      boxShadow: active ? '0 0 20px rgba(99, 102, 241, 0.25)' : 'none',
    },
  };
}

function makeLREdge(source: string, target: string, label: string, active: boolean): Edge {
  return {
    id: `e-lr-${source}-${target}`,
    source,
    target,
    animated: active,
    label: active ? label : undefined,
    labelStyle: { fill: '#818cf8', fontSize: 8, fontWeight: 600 },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.95 },
    style: {
      stroke: active ? '#6366f1' : '#334155',
      strokeWidth: active ? 2 : 1,
      opacity: active ? 1 : 0.3,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: active ? '#6366f1' : '#334155' },
  };
}

function makeVertEdge(source: string, target: string, label: string, active: boolean): Edge {
  return {
    id: `e-v-${source}-${target}`,
    source,
    target,
    animated: active,
    label: active ? label : undefined,
    labelStyle: { fill: '#818cf8', fontSize: 8, fontWeight: 600 },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.95 },
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
  const currentIdx = activePhases.indexOf(current);
  return phases.some((p) => {
    const pIdx = activePhases.indexOf(p);
    return pIdx >= 0 && currentIdx > pIdx;
  });
}
