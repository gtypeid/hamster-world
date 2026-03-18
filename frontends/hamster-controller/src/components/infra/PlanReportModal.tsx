/**
 * Infrastructure Viewer Modal - 3 tabs:
 *  1. Plan Report    (terraform plan 결과)
 *  2. Architecture   (ReactFlow 시스템 다이어그램)
 *  3. Event Flow     (Kafka 토폴로지 뷰어)
 */
import { useState, useMemo, useEffect } from 'react';
import 'reactflow/dist/style.css';
import { TopologyViewer } from '@common/topology';
import type { TopologyResponse } from '@common/topology';
import { useInfraStore } from '../../stores/useInfraStore';
import { parsePlanOutput } from '../../utils/parsePlan';
import { DocMiniFlow } from '../docs/DocMiniFlow';
import { UNIFIED_NODES, UNIFIED_EDGES } from '../docs/InfrastructureTab';

type LegacyViewerTab = 'report' | 'architecture' | 'topology';

/** @deprecated Use ViewerModal instead. Kept for backward compatibility. */
export function PlanReportModal({ initialTab, onClose, embedded }: { initialTab?: LegacyViewerTab; onClose?: () => void; embedded?: boolean }) {
  const planResult = useInfraStore((s) => s.planResult);
  const hasPlan = !!planResult;
  const [activeTab, setActiveTab] = useState<LegacyViewerTab>(initialTab ?? 'architecture');
  const topology = useMemo(() => STATIC_TOPOLOGY, []);

  // When tab changes via parent (ViewerModal), sync internal state
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Embedded mode: just render body content, no modal wrapper
  if (embedded) {
    return (
      <div className="h-full overflow-hidden">
        {activeTab === 'report' && (hasPlan ? <PlanReportTab /> : <PlanPendingPlaceholder />)}
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'topology' && <TopologyTab topology={topology} />}
      </div>
    );
  }

  const body = (
    <div className="flex-1 min-h-0 overflow-hidden">
      {activeTab === 'report' && (hasPlan ? <PlanReportTab /> : <PlanPendingPlaceholder />)}
      {activeTab === 'architecture' && <ArchitectureTab />}
      {activeTab === 'topology' && <TopologyTab topology={topology} />}
    </div>
  );

  const tabs: { key: LegacyViewerTab; label: string; badge?: string; color: string; activeColor: string }[] = [
    { key: 'architecture', label: 'System Architecture', color: 'text-blue-400', activeColor: 'border-blue-500 bg-blue-500/10' },
    { key: 'topology', label: 'Event Flow Topology', color: 'text-blue-400', activeColor: 'border-blue-500 bg-blue-500/10' },
    { key: 'report', label: 'Plan Report', badge: 'terraform plan', color: 'text-blue-400', activeColor: 'border-blue-500 bg-blue-500/10' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0b1120] border border-gray-700/60 rounded-xl shadow-2xl shadow-black/50 w-[96%] h-[94vh] flex flex-col overflow-hidden">

        {/* Header: tabs + close */}
        <div className="flex items-center justify-between px-4 border-b border-gray-800 shrink-0 bg-[#080e1a]">
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
                    isActive
                      ? `${tab.color} ${tab.activeColor}`
                      : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/[0.02]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'opacity-100' : 'opacity-30'} bg-blue-400`} />
                  {tab.label}
                  {tab.badge && isActive && (
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-800/50">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">
              확인 후 상단 <span className="text-green-400 font-semibold">Start</span>를 눌러 배포
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors text-lg"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body */}
        {body}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tab 1: Plan Report
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function PlanPendingPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-5">
        <div className="text-gray-600 text-3xl font-mono">terraform plan</div>
        <div className="text-gray-500 text-lg">
          Init 단계를 실행하면 Plan Report가 표시됩니다
        </div>
        <div className="text-gray-700 text-base">
          Connect &rarr; <span className="text-blue-400">Init</span> &rarr; Plan Report 자동 표시
        </div>
      </div>
    </div>
  );
}

function PlanReportTab() {
  const planRunUrl = useInfraStore((s) => s.planRunUrl);
  const planResult = useInfraStore((s) => s.planResult);
  const parsed = useMemo(() => parsePlanOutput(planResult), [planResult]);

  const summary = parsed?.summary ?? { toAdd: 0, toChange: 0, toDestroy: 0 };
  const resources = parsed?.resources ?? [];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      {/* GitHub Actions Run Link */}
      {planRunUrl && (
        <a
          href={planRunUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-indigo-700/40 bg-indigo-950/30 hover:bg-indigo-900/30 hover:border-indigo-600/50 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors">
              GitHub Actions에서 실행된 Terraform Plan
            </div>
            <div className="text-[11px] text-gray-500 font-mono truncate mt-0.5">
              {planRunUrl}
            </div>
          </div>
          <div className="shrink-0 text-xs text-indigo-400 group-hover:text-indigo-300 transition-colors font-semibold">
            자세히 보기 &rarr;
          </div>
        </a>
      )}

      {/* Row 1: Plan Summary + Infra Spec + Entrypoint */}
      <div className="grid grid-cols-3 gap-4">
        <Card title="Plan Summary">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CountBadge color="green">+</CountBadge>
              <span className={`text-sm font-mono font-bold ${summary.toAdd > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                {summary.toAdd} to add
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CountBadge color="yellow">~</CountBadge>
              <span className={`text-sm font-mono ${summary.toChange > 0 ? 'text-yellow-400 font-bold' : 'text-gray-500'}`}>
                {summary.toChange} to change
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CountBadge color="red">-</CountBadge>
              <span className={`text-sm font-mono ${summary.toDestroy > 0 ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                {summary.toDestroy} to destroy
              </span>
            </div>
          </div>
          {resources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-600 font-mono space-y-0.5">
              {resources.map((r) => (
                <div key={r.type}>{r.type} &times; {r.count}</div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Infrastructure Spec">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-gray-800/50">
              <SpecRow label="Region" value="ap-northeast-2 (Seoul)" />
              <SpecRow label="Instance" value="t3.micro (2 vCPU, 1GB)" />
              <SpecRow label="Count" value="8 instances" />
              <SpecRow label="Storage" value="8GB gp3 x8 = 64GB" />
              <SpecRow label="VPC" value="172.31.0.0/16 (default)" />
              <SpecRow label="Session" value="apply → sleep → destroy" />
            </tbody>
          </table>
        </Card>

        <Card title="Entrypoint">
          <div className="space-y-3">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">Front URL</div>
              <div className="text-xs font-mono text-blue-400 bg-blue-900/20 px-2.5 py-1.5 rounded border border-blue-800/30">
                http://&#123;public_ip&#125;
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">Keycloak URL</div>
              <div className="text-xs font-mono text-purple-400 bg-purple-900/20 px-2.5 py-1.5 rounded border border-purple-800/30">
                http://&#123;public_ip&#125;/keycloak
              </div>
            </div>
            <div className="text-[11px] text-gray-600">
              Public IP는 apply 후 확정
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Security Groups */}
      <Card title="Security Groups" subtitle="3-Tier Network Isolation">
        <div className="grid grid-cols-3 gap-3">
          {SECURITY_GROUPS.map((sg) => (
            <div key={sg.name} className={`rounded-lg border p-3.5 ${sg.borderColor} ${sg.bgColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-sm ${sg.dotColor}`} />
                <span className={`text-sm font-bold ${sg.textColor}`}>{sg.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ml-auto ${sg.scopeBadge}`}>
                  {sg.scope}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-2.5">{sg.purpose}</div>
              <div className="space-y-1 mb-2.5">
                {sg.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-gray-600">{rule.source}</span>
                    <span className="text-gray-700">&rarr;</span>
                    <span className="text-gray-400">{rule.port}</span>
                    <span className="text-gray-600 ml-auto">{rule.desc}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-gray-800/50 text-[11px] text-gray-600">
                {sg.instances.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Row 3: Instance Topology */}
      <Card title="Instance Topology" subtitle="8x t3.micro EC2">
        <div className="grid grid-cols-4 gap-3">
          {INSTANCES.map((inst) => (
            <div
              key={inst.id}
              className={`rounded-lg border p-3.5 ${inst.borderColor} bg-gradient-to-b ${inst.bgGradient}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${inst.dotColor}`} />
                <span className="text-xs font-bold text-gray-200">{inst.id}</span>
              </div>
              <div className="text-[11px] text-gray-500 mb-2">{inst.role}</div>
              <div className="space-y-1 mb-2.5">
                {inst.details.map((detail, i) => (
                  <div key={i}>
                    <div className="text-xs text-gray-300 font-mono">{detail.name}</div>
                    {detail.sub && (
                      <div className="pl-2 mt-0.5 space-y-px">
                        {detail.sub.map((s, j) => (
                          <div key={j} className="text-[10px] text-gray-600 font-mono">{s}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 pt-2 border-t border-gray-800/50">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${inst.sgBadgeColor}`}>
                  {inst.sg}
                </span>
                <span className="text-[11px] text-gray-600 font-mono ml-auto">{inst.ports}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Row 4: API Routing */}
      <Card title="API Routing" subtitle="Nginx Reverse Proxy (hamster-front :80)">
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {API_ROUTES.map((route) => (
            <div key={route.path} className="flex items-center gap-2 text-xs">
              <span className="font-mono text-indigo-400 w-44 shrink-0 truncate">{route.path}</span>
              <span className="text-gray-700">&rarr;</span>
              <span className="font-mono text-gray-400">{route.backend}</span>
              <span className="text-gray-700 ml-auto text-[11px]">{route.desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tab 2: Architecture
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ArchitectureTab() {
  return (
    <div className="h-full">
      <DocMiniFlow
        nodes={UNIFIED_NODES}
        edges={UNIFIED_EDGES}
        direction="TB"
        height="100%"
        miniMap
        draggable
        zoomable
      />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tab 3: Event Flow Topology
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TopologyTab({ topology }: { topology: TopologyResponse }) {
  return (
    <div className="h-full bg-gray-800">
      <TopologyViewer
        topology={topology}
        config={{
          minimap: true,
          controls: true,
          background: true,
          controlPanel: true,
        }}
      />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared UI Components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d1628] rounded-lg border border-gray-800/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</div>
        {subtitle && <span className="text-[11px] text-gray-600">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function CountBadge({ color, children }: { color: 'green' | 'yellow' | 'red'; children: React.ReactNode }) {
  const cls = {
    green: 'bg-green-900/40 text-green-400',
    yellow: 'bg-yellow-900/40 text-yellow-400',
    red: 'bg-red-900/40 text-red-400',
  };
  return (
    <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${cls[color]}`}>
      {children}
    </span>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 pr-3 text-gray-600 whitespace-nowrap">{label}</td>
      <td className="py-1 text-gray-300 font-mono">{value}</td>
    </tr>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Data: Plan Report
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface InstanceDetail {
  name: string;
  sub?: string[];
}

const INSTANCES: {
  id: string;
  role: string;
  details: InstanceDetail[];
  ports: string;
  sg: string;
  dotColor: string;
  borderColor: string;
  bgGradient: string;
  sgBadgeColor: string;
}[] = [
  {
    id: 'hamster-front',
    role: 'Reverse Proxy & Static Hosting',
    details: [
      { name: 'Nginx (reverse proxy)' },
      {
        name: 'React SPAs',
        sub: ['ecommerce', 'content-creator', 'hamster-pg', 'internal-admin'],
      },
    ],
    ports: ':80',
    sg: 'front-sg',
    dotColor: 'bg-blue-400',
    borderColor: 'border-blue-900/40',
    bgGradient: 'from-blue-950/30 to-transparent',
    sgBadgeColor: 'bg-blue-900/30 text-blue-400',
  },
  {
    id: 'hamster-auth',
    role: 'Authentication & Authorization',
    details: [
      { name: 'Keycloak 23.0' },
      { name: 'Realm: hamster-world' },
      {
        name: 'Roles',
        sub: ['MERCHANT', 'USER', 'DEVELOPER', 'VENDOR', 'SYSTEM'],
      },
      { name: 'Self-registration + JWT' },
    ],
    ports: ':8090',
    sg: 'auth-sg',
    dotColor: 'bg-purple-400',
    borderColor: 'border-purple-900/40',
    bgGradient: 'from-purple-950/30 to-transparent',
    sgBadgeColor: 'bg-purple-900/30 text-purple-400',
  },
  {
    id: 'hamster-db',
    role: 'Data Layer',
    details: [
      {
        name: 'MySQL 8.0',
        sub: [
          'ecommerce_db', 'delivery_db', 'cash_gateway_db', 'payment_db',
          'progression_db', 'notification_db', 'hamster_pg_db', 'keycloak_db',
        ],
      },
      { name: 'MongoDB 7.0' },
    ],
    ports: ':3306, :27017',
    sg: 'internal-sg',
    dotColor: 'bg-green-400',
    borderColor: 'border-green-900/40',
    bgGradient: 'from-green-950/20 to-transparent',
    sgBadgeColor: 'bg-green-900/30 text-green-400',
  },
  {
    id: 'hamster-kafka',
    role: 'Event Broker',
    details: [
      { name: 'Kafka 7.5 (KRaft)' },
    ],
    ports: ':9092, :9093',
    sg: 'internal-sg',
    dotColor: 'bg-green-400',
    borderColor: 'border-green-900/40',
    bgGradient: 'from-green-950/20 to-transparent',
    sgBadgeColor: 'bg-green-900/30 text-green-400',
  },
  {
    id: 'hamster-commerce',
    role: 'eCommerce Domain',
    details: [
      { name: 'ecommerce-service', sub: [':8080'] },
    ],
    ports: ':8080',
    sg: 'internal-sg',
    dotColor: 'bg-green-400',
    borderColor: 'border-green-900/40',
    bgGradient: 'from-green-950/20 to-transparent',
    sgBadgeColor: 'bg-green-900/30 text-green-400',
  },
  {
    id: 'hamster-billing',
    role: 'Payment Gateway',
    details: [
      { name: 'cash-gateway-service', sub: [':8082'] },
      { name: 'hamster-pg-service', sub: [':8086'] },
    ],
    ports: ':8082, :8086',
    sg: 'internal-sg',
    dotColor: 'bg-green-400',
    borderColor: 'border-green-900/40',
    bgGradient: 'from-green-950/20 to-transparent',
    sgBadgeColor: 'bg-green-900/30 text-green-400',
  },
  {
    id: 'hamster-payment',
    role: 'Payment Processing',
    details: [
      { name: 'payment-service', sub: [':8083'] },
    ],
    ports: ':8083',
    sg: 'internal-sg',
    dotColor: 'bg-green-400',
    borderColor: 'border-green-900/40',
    bgGradient: 'from-green-950/20 to-transparent',
    sgBadgeColor: 'bg-green-900/30 text-green-400',
  },
  {
    id: 'hamster-support',
    role: 'Support Services',
    details: [
      { name: 'progression-service', sub: [':8084'] },
      { name: 'notification-service', sub: [':8085'] },
    ],
    ports: ':8084, :8085',
    sg: 'internal-sg',
    dotColor: 'bg-green-400',
    borderColor: 'border-green-900/40',
    bgGradient: 'from-green-950/20 to-transparent',
    sgBadgeColor: 'bg-green-900/30 text-green-400',
  },
];

const SECURITY_GROUPS = [
  {
    name: 'front-sg',
    scope: 'Public',
    purpose: '사용자 트래픽 수신. 유일한 퍼블릭 진입점 (Nginx reverse proxy)',
    dotColor: 'bg-blue-400',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-900/30',
    bgColor: 'bg-blue-950/10',
    scopeBadge: 'bg-blue-900/30 text-blue-400',
    instances: ['hamster-front'],
    rules: [
      { source: '0.0.0.0/0', port: ':80', desc: 'HTTP' },
      { source: '0.0.0.0/0', port: ':22', desc: 'SSH' },
    ],
  },
  {
    name: 'auth-sg',
    scope: 'VPC + SSH',
    purpose: '인증 서버 (Keycloak). 브라우저는 Nginx /keycloak/ 프록시 경유',
    dotColor: 'bg-purple-400',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-900/30',
    bgColor: 'bg-purple-950/10',
    scopeBadge: 'bg-purple-900/30 text-purple-400',
    instances: ['hamster-auth'],
    rules: [
      { source: '172.31.0.0/16', port: ':8090', desc: 'Keycloak' },
      { source: '0.0.0.0/0', port: ':22', desc: 'SSH' },
    ],
  },
  {
    name: 'internal-sg',
    scope: 'VPC only',
    purpose: '내부 서비스 간 통신. DB, Kafka, Backend API. 외부 직접 접근 불가',
    dotColor: 'bg-green-400',
    textColor: 'text-green-400',
    borderColor: 'border-green-900/30',
    bgColor: 'bg-green-950/10',
    scopeBadge: 'bg-green-900/30 text-green-400',
    instances: ['hamster-db', 'hamster-kafka', 'hamster-commerce', 'hamster-billing', 'hamster-payment', 'hamster-support'],
    rules: [
      { source: '172.31.0.0/16', port: ':3306', desc: 'MySQL' },
      { source: '172.31.0.0/16', port: ':27017', desc: 'MongoDB' },
      { source: '172.31.0.0/16', port: ':9092-9093', desc: 'Kafka' },
      { source: '172.31.0.0/16', port: ':8080-8086', desc: 'Backend APIs' },
      { source: '0.0.0.0/0', port: ':22', desc: 'SSH' },
    ],
  },
];

const API_ROUTES = [
  { path: '/api/ecommerce/*', backend: 'commerce:8080', desc: 'eCommerce' },
  { path: '/api/cash-gateway/*', backend: 'billing:8082', desc: 'Cash GW' },
  { path: '/api/hamster-pg/*', backend: 'billing:8086', desc: 'PG Sim' },
  { path: '/api/payment/*', backend: 'payment:8083', desc: 'Payment' },
  { path: '/api/progression/*', backend: 'support:8084', desc: 'Progress' },
  { path: '/api/notification/*', backend: 'support:8085', desc: 'Notify' },
  { path: '/keycloak/*', backend: 'auth:8090', desc: 'Auth' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Data: Event Flow Topology
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STATIC_TOPOLOGY: TopologyResponse = {
  services: [
    {
      serviceName: 'ecommerce-service',
      subscribes: [
        { topic: 'payment-events', events: ['PaymentApprovedEvent', 'PaymentFailedEvent'] },
        { topic: 'cash-gateway-events', events: ['PaymentProcessCompletedEvent'] },
      ],
      publishes: [
        { topic: 'ecommerce-events', events: ['OrderCreatedEvent', 'OrderCancelledEvent', 'ProductCreatedEvent'] },
      ],
    },
    {
      serviceName: 'payment-service',
      subscribes: [
        { topic: 'ecommerce-events', events: ['OrderCreatedEvent', 'ProductCreatedEvent'] },
      ],
      publishes: [
        { topic: 'payment-events', events: ['PaymentApprovedEvent', 'PaymentFailedEvent', 'ProductStockChangedEvent', 'ProductCreatedEvent'] },
      ],
    },
    {
      serviceName: 'cash-gateway-service',
      subscribes: [
        { topic: 'ecommerce-events', events: ['OrderCreatedEvent'] },
      ],
      publishes: [
        { topic: 'cash-gateway-events', events: ['PaymentRequestedEvent', 'PaymentProcessCompletedEvent'] },
      ],
    },
    {
      serviceName: 'progression-service',
      subscribes: [
        { topic: 'ecommerce-events', events: ['OrderCreatedEvent'] },
        { topic: 'payment-events', events: ['PaymentApprovedEvent'] },
      ],
      publishes: [
        { topic: 'progression-events', events: ['ArchiveClaimedEvent', 'QuotaUpdatedEvent'] },
      ],
    },
    {
      serviceName: 'notification-service',
      subscribes: [
        { topic: 'ecommerce-events-dlt', events: [] },
        { topic: 'payment-events-dlt', events: [] },
        { topic: 'cash-gateway-events-dlt', events: [] },
        { topic: 'progression-events-dlt', events: [] },
      ],
      publishes: [],
    },
  ],
};
