import { useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Position,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { TopologyViewer } from '@common/topology';
import type { TopologyResponse } from '@common/topology';

// ─── 정적 아키텍처 데이터 ───

const ARCH_NODES: Node[] = [
  // Frontend Layer
  {
    id: 'user',
    type: 'input',
    data: { label: '👤 사용자' },
    position: { x: 250, y: 0 },
    style: { background: '#FF9900', color: 'white', fontWeight: 'bold' },
  },
  {
    id: 'ecommerce-fe',
    data: { label: '🛒 이커머스 FE' },
    position: { x: 50, y: 100 },
    style: { background: '#8B5CF6', color: 'white' },
  },
  {
    id: 'admin-fe',
    data: { label: '👨‍💼 내부 어드민 FE' },
    position: { x: 250, y: 100 },
    style: { background: '#8B5CF6', color: 'white' },
  },
  {
    id: 'pg-fe',
    data: { label: '💳 햄스터 PG FE' },
    position: { x: 450, y: 100 },
    style: { background: '#8B5CF6', color: 'white' },
  },
  // Gateway
  {
    id: 'nginx',
    data: { label: '🌐 Nginx\n(Reverse Proxy)' },
    position: { x: 250, y: 200 },
    style: { background: '#10B981', color: 'white', fontWeight: 'bold' },
  },
  // Backend Services
  {
    id: 'ecommerce-api',
    data: { label: '🔌 E-Commerce API\n(Spring Boot)' },
    position: { x: 50, y: 320 },
    style: { background: '#3B82F6', color: 'white' },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  {
    id: 'payment',
    data: { label: '💰 Payment Service\n(Spring Boot)' },
    position: { x: 250, y: 320 },
    style: { background: '#3B82F6', color: 'white' },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  {
    id: 'cash-gateway',
    data: { label: '🌉 Cash Gateway\n(Spring Boot)' },
    position: { x: 450, y: 320 },
    style: { background: '#3B82F6', color: 'white' },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  {
    id: 'notification',
    data: { label: '📧 Notification\n(Spring Boot)' },
    position: { x: 650, y: 320 },
    style: { background: '#3B82F6', color: 'white' },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  // Message Broker
  {
    id: 'kafka',
    data: { label: '⚡ Apache Kafka\n(Message Broker)' },
    position: { x: 250, y: 480 },
    style: { background: '#EF4444', color: 'white', fontWeight: 'bold', width: 200 },
  },
  // Database
  {
    id: 'mysql',
    data: { label: '🗄️ MySQL\n(통합 DB)' },
    position: { x: 100, y: 620 },
    style: { background: '#F59E0B', color: 'white' },
  },
  {
    id: 'mongodb',
    data: { label: '🍃 MongoDB' },
    position: { x: 300, y: 620 },
    style: { background: '#10B981', color: 'white' },
  },
  // Auth
  {
    id: 'keycloak',
    data: { label: '🔐 Keycloak\n(Auth)' },
    position: { x: 500, y: 620 },
    style: { background: '#6366F1', color: 'white' },
  },
];

const ARCH_EDGES: Edge[] = [
  // User to Frontend
  { id: 'e-user-ecommerce', source: 'user', target: 'ecommerce-fe', animated: true },
  { id: 'e-user-admin', source: 'user', target: 'admin-fe', animated: true },
  { id: 'e-user-pg', source: 'user', target: 'pg-fe', animated: true },
  // Frontend to Nginx
  { id: 'e-ecommerce-nginx', source: 'ecommerce-fe', target: 'nginx' },
  { id: 'e-admin-nginx', source: 'admin-fe', target: 'nginx' },
  { id: 'e-pg-nginx', source: 'pg-fe', target: 'nginx' },
  // Nginx to Backend
  { id: 'e-nginx-ecommerce-api', source: 'nginx', target: 'ecommerce-api' },
  { id: 'e-nginx-payment', source: 'nginx', target: 'payment' },
  { id: 'e-nginx-cash', source: 'nginx', target: 'cash-gateway' },
  // Backend to Kafka
  { id: 'e-ecommerce-kafka', source: 'ecommerce-api', target: 'kafka', animated: true, style: { stroke: '#EF4444' } },
  { id: 'e-payment-kafka', source: 'payment', target: 'kafka', animated: true, style: { stroke: '#EF4444' } },
  { id: 'e-cash-kafka', source: 'cash-gateway', target: 'kafka', animated: true, style: { stroke: '#EF4444' } },
  { id: 'e-noti-kafka', source: 'notification', target: 'kafka', animated: true, style: { stroke: '#EF4444' } },
  // Backend to Database
  { id: 'e-ecommerce-mysql', source: 'ecommerce-api', target: 'mysql' },
  { id: 'e-payment-mysql', source: 'payment', target: 'mysql' },
  { id: 'e-cash-mysql', source: 'cash-gateway', target: 'mysql' },
  { id: 'e-ecommerce-mongo', source: 'ecommerce-api', target: 'mongodb' },
  // Keycloak
  { id: 'e-nginx-keycloak', source: 'nginx', target: 'keycloak', style: { strokeDasharray: '5,5' } },
];

// ─── 토폴로지 데이터 ───

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

// ─── 탭 타입 ───

type DocTab = 'architecture' | 'topology' | 'readme';

export function Documentation() {
  const [activeTab, setActiveTab] = useState<DocTab>('architecture');
  const topology = useMemo(() => STATIC_TOPOLOGY, []);

  const tabs: { key: DocTab; label: string; icon: string }[] = [
    { key: 'architecture', label: 'System Architecture', icon: '🏗️' },
    { key: 'topology', label: 'Event Flow Topology', icon: '⚡' },
    { key: 'readme', label: 'README', icon: '📖' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <h1 className="text-3xl font-bold text-white mb-2">Documentation</h1>
        <p className="text-gray-400 text-sm mb-4">
          시스템 아키텍처, 이벤트 토폴로지, 프로젝트 문서를 확인할 수 있습니다.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-gray-800 text-white border-b-2 border-indigo-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'topology' && <TopologyTab topology={topology} />}
        {activeTab === 'readme' && <ReadmeTab />}
      </div>
    </div>
  );
}

// ─── Architecture Tab ───

function ArchitectureTab() {
  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Diagram */}
      <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-3 border-b border-gray-700 bg-gray-900/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">System Architecture Diagram</h2>
          <span className="text-xs text-gray-500">사용자 → Frontend → Nginx → Backend → Kafka → DB</span>
        </div>
        <div className="h-[calc(100%-44px)]">
          <ReactFlow
            nodes={ARCH_NODES}
            edges={ARCH_EDGES}
            fitView
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={true}
            zoomOnScroll={true}
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls position="top-right" />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'input') return '#FF9900';
                const bg = node.style?.background;
                return typeof bg === 'string' ? bg : '#3B82F6';
              }}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Legend + Infra Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { color: 'bg-purple-600', label: 'Frontend', desc: 'React 19' },
            { color: 'bg-blue-600', label: 'Backend', desc: 'Spring Boot 3.x' },
            { color: 'bg-red-600', label: 'Message Broker', desc: 'Apache Kafka' },
            { color: 'bg-yellow-600', label: 'Database', desc: 'MySQL / MongoDB' },
          ].map((item) => (
            <div key={item.label} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className={`w-3 h-3 ${item.color} rounded mb-1.5`} />
              <p className="text-xs font-bold text-white">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Infra Details */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-bold text-white mb-3">인프라 구성 (AWS EC2)</h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-amber-400 font-semibold">Instance 1</span>
              <span className="text-gray-400"> — Kafka, MySQL, MongoDB</span>
            </div>
            <div>
              <span className="text-purple-400 font-semibold">Instance 2</span>
              <span className="text-gray-400"> — Spring Boot Apps, Nginx, React FE</span>
            </div>
            <div>
              <span className="text-yellow-400 font-semibold">Instance 3</span>
              <span className="text-gray-400"> — Keycloak, Grafana, 추가 서비스</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Topology Tab ───

function TopologyTab({ topology }: { topology: TopologyResponse }) {
  return (
    <div className="h-full p-6">
      <div className="h-full bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
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
    </div>
  );
}

// ─── README Tab ───

function ReadmeTab() {
  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Project Overview */}
        <section className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-white">Hamster World</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              이벤트 드리븐 아키텍처 기반의 이커머스 플랫폼으로,
              AWS 프리티어 환경에서 온디맨드로 운영되는 포트폴리오 프로젝트입니다.
            </p>

            <h3 className="text-lg font-semibold text-indigo-400">주요 특징</h3>
            <ul className="list-disc list-inside space-y-1.5 ml-4 text-sm">
              <li>Apache Kafka를 활용한 비동기 메시지 처리</li>
              <li>마이크로서비스 아키텍처 (Spring Boot 서비스)</li>
              <li>Terraform으로 인프라 관리 (IaC)</li>
              <li>GitHub Actions로 CI/CD 자동화</li>
              <li>프리티어 한도 내 온디맨드 운영</li>
            </ul>

            <h3 className="text-lg font-semibold text-yellow-400">기술 스택</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 font-semibold mb-1">Backend</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Java 21, Spring Boot 3.x</li>
                  <li>Apache Kafka</li>
                  <li>MySQL, MongoDB</li>
                  <li>Keycloak (인증/인가)</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-400 font-semibold mb-1">Frontend / Infra</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>React 19, TypeScript</li>
                  <li>Vite, Tailwind CSS</li>
                  <li>Terraform (AWS IaC)</li>
                  <li>GitHub Actions (CI/CD)</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-400 mb-2">빠른 시작:</p>
              <pre className="text-green-400 font-mono text-sm">
{`# 1. 인프라 시작
GitHub Actions 트리거 (Create Instance)

# 2. 애플리케이션 배포
Docker 이미지 pull & run

# 3. 서비스 접속
http://ecommerce.hamster-world.com

# 4. 종료
GitHub Actions 트리거 (Destroy)`}
              </pre>
            </div>
          </div>
        </section>

        {/* System Requirements */}
        <section className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-white">시스템 요구사항</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 text-sm">
            <li>AWS 계정 (프리티어)</li>
            <li>GitHub Personal Access Token (workflow 권한)</li>
            <li>Docker Hub 계정</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
