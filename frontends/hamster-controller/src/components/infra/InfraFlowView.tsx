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
  type SecurityGroup,
} from '../../stores/useInfraStore';

// ─── Colors ───

const STATUS_COLORS: Record<InstanceStatus, { bg: string; border: string; text: string }> = {
  idle:         { bg: '#1e293b', border: '#334155', text: '#94a3b8' },
  provisioning: { bg: '#422006', border: '#d97706', text: '#fbbf24' },
  running:      { bg: '#052e16', border: '#16a34a', text: '#4ade80' },
  failed:       { bg: '#450a0a', border: '#dc2626', text: '#f87171' },
  destroying:   { bg: '#431407', border: '#ea580c', text: '#fb923c' },
};

const SG_COLORS: Record<SecurityGroup, { bg: string; border: string; label: string }> = {
  'front-sg':    { bg: 'rgba(96, 165, 250, 0.06)',  border: '#1e40af', label: 'front-sg' },
  'auth-sg':     { bg: 'rgba(167, 139, 250, 0.06)', border: '#5b21b6', label: 'auth-sg' },
  'internal-sg': { bg: 'rgba(74, 222, 128, 0.06)',  border: '#166534', label: 'internal-sg' },
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

// ─── Layout (LR traffic flow) ───
//
//  Git IO → Repo → Actions/Terraform → AWS [ front-sg | auth-sg | internal-sg ]
//
//  Traffic flows left to right:
//   User → Front (public :80) → Auth (VPC :8090) → Internal (VPC :3306/:9092/:8080-8086)

// Column X positions
const COL_GIT = 0;
const COL_LAMBDA = 200;
const COL_GITHUB_API = 420;
const COL_ACTIONS = 620;
const COL_TERRAFORM = 820;
const COL_AWS_START = 1040;

// Row Y for control nodes (Plan row / Apply row)
const ROW_PLAN = 200;
const ROW_APPLY = 330;

// Instance dimensions
const INST_W = 160;
const INST_H_NORMAL = 120;
const INST_H_DB = 148;
const INST_GAP = 18;

// ─── AWS Security Group zones (L→R: front → auth → internal) ───
const AWS_PAD = 40;
const SG_PAD = 20;
const SG_LABEL_H = 28;
const SG_GAP = 30;   // gap between SG zones

// front-sg (1 instance: hamster-front)
const FRONT_SG_X = COL_AWS_START;
const FRONT_SG_Y = 0;
const FRONT_SG_W = INST_W + SG_PAD * 2;
const FRONT_SG_INST_Y = FRONT_SG_Y + SG_LABEL_H + 12;
const FRONT_SG_H = SG_LABEL_H + 12 + INST_H_NORMAL + SG_PAD + 20;

// auth-sg (1 instance: hamster-auth)
const AUTH_SG_X = FRONT_SG_X + FRONT_SG_W + SG_GAP;
const AUTH_SG_Y = 0;
const AUTH_SG_W = INST_W + SG_PAD * 2;
const AUTH_SG_INST_Y = AUTH_SG_Y + SG_LABEL_H + 12;
const AUTH_SG_H = FRONT_SG_H;

// internal-sg (6 instances: 2 infra row + 4 app row)
const INTERNAL_SG_X = AUTH_SG_X + AUTH_SG_W + SG_GAP;
const INTERNAL_SG_Y = 0;
const INTERNAL_INFRA_Y = INTERNAL_SG_Y + SG_LABEL_H + 12;
const INTERNAL_APP_Y = INTERNAL_INFRA_Y + INST_H_DB + INST_GAP;
const INTERNAL_SG_W = SG_PAD * 2 + (INST_W + INST_GAP) * 4 - INST_GAP;
const INTERNAL_SG_H = INTERNAL_APP_Y + INST_H_NORMAL + SG_PAD + 10;

function internalInstX(col: number): number {
  return INTERNAL_SG_X + SG_PAD + col * (INST_W + INST_GAP);
}

// Instance positions (absolute)
const INSTANCE_POSITIONS: Record<InstanceId, { x: number; y: number }> = {
  // front-sg
  'hamster-front':    { x: FRONT_SG_X + SG_PAD, y: FRONT_SG_INST_Y },
  // auth-sg
  'hamster-auth':     { x: AUTH_SG_X + SG_PAD, y: AUTH_SG_INST_Y },
  // internal-sg: infra row
  'hamster-db':       { x: internalInstX(0), y: INTERNAL_INFRA_Y },
  'hamster-kafka':    { x: internalInstX(1), y: INTERNAL_INFRA_Y },
  // internal-sg: app row
  'hamster-commerce': { x: internalInstX(0), y: INTERNAL_APP_Y },
  'hamster-billing':  { x: internalInstX(1), y: INTERNAL_APP_Y },
  'hamster-payment':  { x: internalInstX(2), y: INTERNAL_APP_Y },
  'hamster-support':  { x: internalInstX(3), y: INTERNAL_APP_Y },
};

// AWS overall zone
const AWS_X = COL_AWS_START - AWS_PAD;
const AWS_ZONE_W = (INTERNAL_SG_X + INTERNAL_SG_W) - COL_AWS_START + AWS_PAD * 2;
const AWS_ZONE_H = Math.max(FRONT_SG_H, INTERNAL_SG_H) + AWS_PAD + 10;

// ─── Component ───

export function InfraFlowView() {
  const instances = useInfraStore((s) => s.instances);
  const sessionPhase = useInfraStore((s) => s.sessionPhase);

  const { nodes, edges } = useMemo(() => {
    const n: Node[] = [];
    const e: Edge[] = [];

    // ─── AWS Zone background ───
    n.push({
      id: 'aws-zone',
      type: 'group',
      position: { x: AWS_X, y: -AWS_PAD },
      data: { label: '' },
      style: {
        width: AWS_ZONE_W,
        height: AWS_ZONE_H,
        background: 'rgba(249, 115, 22, 0.02)',
        border: '2px solid rgba(146, 64, 14, 0.5)',
        borderRadius: '20px',
        padding: '0',
        zIndex: -2,
      },
    });

    // AWS zone label
    n.push({
      id: 'aws-label',
      type: 'default',
      position: { x: AWS_X + 16, y: -AWS_PAD + 8 },
      data: {
        label: (
          <div className="text-[11px] font-bold text-orange-400/80 tracking-wider">
            AWS ap-northeast-2
          </div>
        ),
      },
      selectable: false,
      draggable: false,
      style: {
        background: 'transparent',
        border: 'none',
        padding: '0',
        width: 160,
        height: 20,
        boxShadow: 'none',
      },
    });

    // ─── Security Group zones (L→R: front → auth → internal) ───
    n.push(makeSGZone('sg-front', { x: FRONT_SG_X, y: FRONT_SG_Y }, FRONT_SG_W, FRONT_SG_H, 'front-sg'));
    n.push(makeSGZone('sg-auth', { x: AUTH_SG_X, y: AUTH_SG_Y }, AUTH_SG_W, AUTH_SG_H, 'auth-sg'));
    n.push(makeSGZone('sg-internal', { x: INTERNAL_SG_X, y: INTERNAL_SG_Y }, INTERNAL_SG_W, INTERNAL_SG_H, 'internal-sg'));

    // SG labels
    n.push(makeSGLabel('sg-front-label', { x: FRONT_SG_X + 12, y: FRONT_SG_Y + 6 }, 'front-sg', ':80 public'));
    n.push(makeSGLabel('sg-auth-label', { x: AUTH_SG_X + 12, y: AUTH_SG_Y + 6 }, 'auth-sg', ':8090 VPC'));
    n.push(makeSGLabel('sg-internal-label', { x: INTERNAL_SG_X + 12, y: INTERNAL_SG_Y + 6 }, 'internal-sg', '172.31.0.0/16'));

    // ─── Control pipeline nodes (L→R) ───
    //
    // 활성화 조건: 실제 해당 동작이 완료되었거나 진행 중일 때만 켜진다.
    // 각 행(Plan/Apply)은 2단계 점진 활성화:
    //
    // idle                → 전부 비활성
    // connecting          → IO 활성 (요청 보내는 중)
    // connected           → IO → Lambda → API 연결 완료 (Connect 성공 응답)
    // planning            → + Actions(Plan) 활성 (워크플로우 실행 중)
    // planned             → + TF Plan 활성 (리소스 검증 완료)
    // triggering          → + Actions(Apply) 활성 (워크플로우 디스패치)
    // applying            → + TF Apply 활성 (인프라 생성 중)
    // running/destroying  → 전체 유지

    const phase = sessionPhase;

    // IO는 connecting 이상이면 활성 (요청을 보내니까)
    const ioActive = phase !== 'idle';
    // Lambda, API는 Connect 응답을 받은 이후부터 활성
    const proxyDone = phase !== 'idle' && phase !== 'connecting';
    // Plan 경로 (2단계 활성화)
    // planRunning: planning 시작 시 Actions(Plan) 노드 활성 (워크플로우 실행 중)
    const planRunning = phase === 'planning' || phase === 'planned'
      || phase === 'triggering' || phase === 'applying'
      || phase === 'running' || phase === 'destroying';
    // planDone: plan 완료 후 TF Plan 노드 활성 (리소스 검증 완료)
    const planDone = phase === 'planned'
      || phase === 'triggering' || phase === 'applying'
      || phase === 'running' || phase === 'destroying';

    // Apply 경로 (2단계 활성화)
    // applyRunning: triggering 시작 시 Actions(Apply) 노드 활성
    const applyRunning = phase === 'triggering' || phase === 'applying'
      || phase === 'running' || phase === 'destroying';
    // applyDone: apply 실제 진행 시 TF Apply 노드 활성
    const applyDone = phase === 'applying'
      || phase === 'running' || phase === 'destroying';

    // GitHub IO (항상 표시)
    const ROW_MID = (ROW_PLAN + ROW_APPLY) / 2;
    n.push(makeControlNode(
      'github-pages', { x: COL_GIT, y: ROW_MID - 38 },
      'GitHub IO', '🐹', 'hamster-controller', ioActive,
    ));

    // Lambda Proxy
    n.push(makeControlNode(
      'lambda-proxy', { x: COL_LAMBDA, y: ROW_MID - 38 },
      'Lambda Proxy', '☁️', 'PAT 보관 · 토큰 보호',
      proxyDone,
    ));

    // GitHub API
    n.push(makeControlNode(
      'github-api', { x: COL_GITHUB_API, y: ROW_MID - 38 },
      'GitHub API', '🔗', 'hamster-world repo',
      proxyDone,
    ));

    // Plan row: Actions (Plan) → Terraform Plan (progressive)
    n.push(makeControlNode(
      'actions-plan', { x: COL_ACTIONS, y: ROW_PLAN - 38 },
      'Actions', '⚙️', 'terraform-plan.yml',
      planRunning,
    ));
    n.push(makeControlNode(
      'tf-plan', { x: COL_TERRAFORM, y: ROW_PLAN - 38 },
      'TF Plan', '📋', '리소스 검증',
      planDone,
    ));

    // Apply row: Actions (Apply) → Terraform Apply (progressive)
    n.push(makeControlNode(
      'actions-apply', { x: COL_ACTIONS, y: ROW_APPLY - 38 },
      'Actions', '⚙️', 'terraform-apply.yml',
      applyRunning,
    ));
    n.push(makeControlNode(
      'tf-apply', { x: COL_TERRAFORM, y: ROW_APPLY - 38 },
      'TF Apply', '🏗️', '인프라 생성/삭제',
      applyDone,
    ));

    // ─── Control edges ───
    // IO → Lambda: connecting 이상이면 활성 (요청 보내는 중)
    e.push(
      makeFlowEdge('github-pages', 'lambda-proxy', 'fetch', ioActive),
    );
    // Lambda → API: 응답 받은 이후 활성
    e.push(
      makeFlowEdge('lambda-proxy', 'github-api', 'proxy', proxyDone),
    );

    // API → Plan row (progressive: dispatch 먼저, plan 완료 후 결과 연결)
    e.push(
      makeFlowEdge('github-api', 'actions-plan', 'dispatch', planRunning),
      makeFlowEdge('actions-plan', 'tf-plan', 'run', planDone),
    );

    // API → Apply row (progressive: dispatch 먼저, apply 시작 후 연결)
    e.push(
      makeFlowEdge('github-api', 'actions-apply', 'dispatch', applyRunning),
      makeFlowEdge('actions-apply', 'tf-apply', 'run', applyDone),
    );

    // ─── TF Apply → AWS instances ───
    const tfTargets: InstanceId[] = ['hamster-front', 'hamster-auth', 'hamster-db', 'hamster-kafka'];
    for (const id of tfTargets) {
      const inst = instances[id];
      const isIdle = inst.status === 'idle';
      const isProv = inst.status === 'provisioning';
      e.push({
        id: `e-tf-${id}`,
        source: 'tf-apply',
        target: id,
        animated: isProv,
        style: {
          stroke: isIdle ? '#334155' : isProv ? '#d97706' : '#16a34a',
          strokeWidth: isIdle ? 1 : 2,
          opacity: isIdle ? 0.15 : 0.6,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: isIdle ? '#334155' : isProv ? '#d97706' : '#16a34a' },
      });
    }

    // ─── Instance nodes ───
    for (const id of INSTANCE_IDS) {
      const inst = instances[id];
      const colors = STATUS_COLORS[inst.status];
      const pos = INSTANCE_POSITIONS[id];
      const isDB = id === 'hamster-db';
      const nodeHeight = isDB ? INST_H_DB : INST_H_NORMAL;

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
              <div className="text-lg my-0.5">{INSTANCE_ICONS[id]}</div>
              <div className="text-[11px] font-bold" style={{ color: colors.text }}>
                {inst.label}
              </div>
              <div className="text-[8px]" style={{ color: colors.text, opacity: 0.7 }}>
                {inst.services.join(' + ')}
              </div>
              <div className="text-[7px] font-mono mt-0.5" style={{ color: colors.text, opacity: 0.5 }}>
                {inst.ports.join('  ')}
              </div>
              {isDB && (
                <div className="text-[6px] mt-0.5 px-1 leading-tight" style={{ color: '#94a3b8', opacity: 0.7 }}>
                  8 DBs: ecommerce, delivery, cash_gw, payment, progression, notification, hamster_pg, keycloak
                </div>
              )}
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
          height: nodeHeight,
          boxShadow: inst.status === 'running'
            ? `0 0 24px ${colors.border}40`
            : inst.status === 'provisioning'
            ? `0 0 18px ${colors.border}30`
            : 'none',
        },
      });
    }

    // ─── Traffic flow edges (front → auth → internal apps) ───
    // Front → Auth (reverse proxy /keycloak/)
    addTrafficEdge(e, instances, 'hamster-front', 'hamster-auth');
    // Front → App services (reverse proxy /api/*)
    addTrafficEdge(e, instances, 'hamster-front', 'hamster-commerce');
    addTrafficEdge(e, instances, 'hamster-front', 'hamster-billing');
    addTrafficEdge(e, instances, 'hamster-front', 'hamster-payment');
    addTrafficEdge(e, instances, 'hamster-front', 'hamster-support');
    // Auth → App services (token validation)
    addTrafficEdge(e, instances, 'hamster-auth', 'hamster-commerce');
    addTrafficEdge(e, instances, 'hamster-auth', 'hamster-billing');
    addTrafficEdge(e, instances, 'hamster-auth', 'hamster-payment');
    // App → DB
    addTrafficEdge(e, instances, 'hamster-commerce', 'hamster-db');
    addTrafficEdge(e, instances, 'hamster-billing', 'hamster-db');
    addTrafficEdge(e, instances, 'hamster-payment', 'hamster-db');
    addTrafficEdge(e, instances, 'hamster-support', 'hamster-db');
    // App → Kafka
    addTrafficEdge(e, instances, 'hamster-commerce', 'hamster-kafka');
    addTrafficEdge(e, instances, 'hamster-billing', 'hamster-kafka');
    addTrafficEdge(e, instances, 'hamster-payment', 'hamster-kafka');
    addTrafficEdge(e, instances, 'hamster-support', 'hamster-kafka');

    return { nodes: n, edges: e };
  }, [instances, sessionPhase]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        preventScrolling={true}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={1.8}
      >
        <Background color="#1e293b" gap={24} size={1} />
        <Controls position="top-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

// ─── Helpers ───

function addTrafficEdge(
  edges: Edge[],
  instances: Record<InstanceId, { status: InstanceStatus }>,
  src: InstanceId,
  tgt: InstanceId,
) {
  const srcRunning = instances[src].status === 'running';
  const tgtRunning = instances[tgt].status === 'running';
  const active = srcRunning && tgtRunning;
  const anyActive = instances[src].status !== 'idle' && instances[tgt].status !== 'idle';

  edges.push({
    id: `e-traffic-${src}-${tgt}`,
    source: src,
    target: tgt,
    animated: active,
    style: {
      stroke: active ? '#475569' : '#1e293b',
      strokeWidth: active ? 1.5 : 0.5,
      opacity: active ? 0.5 : anyActive ? 0.15 : 0.06,
      strokeDasharray: active ? undefined : '4,4',
    },
  });
}

function makeSGZone(
  id: string,
  position: { x: number; y: number },
  width: number,
  height: number,
  sg: SecurityGroup,
): Node {
  const colors = SG_COLORS[sg];
  return {
    id,
    type: 'group',
    position,
    data: { label: '' },
    style: {
      width,
      height,
      background: colors.bg,
      border: `1.5px dashed ${colors.border}`,
      borderRadius: '12px',
      padding: '0',
      zIndex: -1,
    },
  };
}

function makeSGLabel(
  id: string,
  position: { x: number; y: number },
  sg: SecurityGroup,
  subtitle: string,
): Node {
  const colors = SG_COLORS[sg];
  return {
    id,
    type: 'default',
    position,
    data: {
      label: (
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold tracking-wide" style={{ color: colors.border }}>
            {colors.label}
          </span>
          <span className="text-[7px] font-mono" style={{ color: colors.border, opacity: 0.6 }}>
            {subtitle}
          </span>
        </div>
      ),
    },
    selectable: false,
    draggable: false,
    style: {
      background: 'transparent',
      border: 'none',
      padding: '0',
      width: 180,
      height: 18,
      boxShadow: 'none',
    },
  };
}

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
      width: 155,
      height: 78,
      boxShadow: active ? '0 0 24px rgba(99, 102, 241, 0.3)' : 'none',
    },
  };
}

function makeFlowEdge(source: string, target: string, label: string, active: boolean): Edge {
  return {
    id: `e-flow-${source}-${target}`,
    source,
    target,
    animated: active,
    label: active ? label : undefined,
    labelStyle: { fill: '#818cf8', fontSize: 9, fontWeight: 600 },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.95 },
    labelBgPadding: [6, 3] as [number, number],
    style: {
      stroke: active ? '#6366f1' : '#334155',
      strokeWidth: active ? 2.5 : 1,
      opacity: active ? 1 : 0.25,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: active ? '#6366f1' : '#334155', width: 16, height: 12 },
  };
}

