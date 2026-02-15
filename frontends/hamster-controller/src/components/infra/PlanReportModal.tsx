/**
 * Terraform Plan 결과를 풍성한 인프라 레포트 모달로 표시.
 *
 * 구조:
 * 1. Plan Summary + Infra Spec + Entrypoint
 * 2. Security Groups (색상 범례 - 먼저 보여줘야 인스턴스 카드 색상 이해됨)
 * 3. Instance Topology (각 인스턴스 상세 정보 포함)
 * 4. API Routing
 */
export function PlanReportModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0b1120] border border-gray-700/60 rounded-xl shadow-2xl shadow-black/50 w-[92%] max-w-6xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Infrastructure Plan Report</h2>
            <span className="text-xs font-mono text-blue-400 bg-blue-900/30 px-2.5 py-1 rounded border border-blue-800/50">
              terraform plan
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Row 1: Plan Summary + Infra Spec + Entrypoint */}
          <div className="grid grid-cols-3 gap-4">
            <Card title="Plan Summary">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CountBadge color="green">+</CountBadge>
                  <span className="text-sm text-green-400 font-mono font-bold">12 to add</span>
                </div>
                <div className="flex items-center gap-3">
                  <CountBadge color="yellow">~</CountBadge>
                  <span className="text-sm text-gray-500 font-mono">0 to change</span>
                </div>
                <div className="flex items-center gap-3">
                  <CountBadge color="red">-</CountBadge>
                  <span className="text-sm text-gray-500 font-mono">0 to destroy</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-600 font-mono space-y-0.5">
                <div>aws_instance &times; 8</div>
                <div>aws_security_group &times; 3</div>
                <div>aws_security_group_rule &times; 9</div>
              </div>
            </Card>

            <Card title="Infrastructure Spec">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-800/50">
                  <SpecRow label="Region" value="ap-northeast-2 (Seoul)" />
                  <SpecRow label="Instance" value="t3.micro (2 vCPU, 1GB)" />
                  <SpecRow label="Count" value="8 instances" />
                  <SpecRow label="Storage" value="30GB gp3 x8 = 240GB" />
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

          {/* Row 2: Security Groups (색상 범례 - 위에서 먼저 보여줌) */}
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

          {/* Row 3: Instance Topology (상세 정보 포함) */}
          <Card title="Instance Topology" subtitle="8x t3.micro EC2">
            <div className="grid grid-cols-4 gap-3">
              {INSTANCES.map((inst) => (
                <div
                  key={inst.id}
                  className={`rounded-lg border p-3.5 ${inst.borderColor} bg-gradient-to-b ${inst.bgGradient}`}
                >
                  {/* Instance header */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${inst.dotColor}`} />
                    <span className="text-xs font-bold text-gray-200">{inst.id}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mb-2">{inst.role}</div>

                  {/* Services detail */}
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

                  {/* Footer: sg + ports */}
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
      </div>
    </div>
  );
}

// ─── UI Components ───

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

// ─── Data ───

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
