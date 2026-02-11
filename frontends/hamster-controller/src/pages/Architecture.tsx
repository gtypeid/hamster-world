import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Position,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

export function Architecture() {
  const nodes: Node[] = useMemo(() => [
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

    // Gateway Layer
    {
      id: 'nginx',
      data: { label: '🌐 Nginx\n(Reverse Proxy)' },
      position: { x: 250, y: 200 },
      style: { background: '#10B981', color: 'white', fontWeight: 'bold' },
    },

    // Backend Services Layer
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

    // Database Layer
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
  ], []);

  const edges: Edge[] = useMemo(() => [
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

    // Keycloak connections
    { id: 'e-nginx-keycloak', source: 'nginx', target: 'keycloak', style: { strokeDasharray: '5,5' } },
  ], []);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-4xl font-bold mb-4 text-white">
          🏗️ Architecture
        </h1>
        <p className="text-gray-400 mb-6">
          Hamster World의 전체 시스템 아키텍처를 시각화한 다이어그램입니다.
        </p>
      </section>

      {/* Architecture Diagram */}
      <section className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <h2 className="text-xl font-bold text-white">시스템 구조도</h2>
        </div>
        <div style={{ height: '700px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'input') return '#FF9900';
                return '#3B82F6';
              }}
            />
          </ReactFlow>
        </div>
      </section>

      {/* Legend */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="w-4 h-4 bg-purple-600 rounded mb-2"></div>
          <p className="text-sm font-bold text-white">Frontend</p>
          <p className="text-xs text-gray-400">React 19</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="w-4 h-4 bg-blue-600 rounded mb-2"></div>
          <p className="text-sm font-bold text-white">Backend</p>
          <p className="text-xs text-gray-400">Spring Boot 3.x</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="w-4 h-4 bg-red-600 rounded mb-2"></div>
          <p className="text-sm font-bold text-white">Message Broker</p>
          <p className="text-xs text-gray-400">Apache Kafka</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="w-4 h-4 bg-yellow-600 rounded mb-2"></div>
          <p className="text-sm font-bold text-white">Database</p>
          <p className="text-xs text-gray-400">MySQL / MongoDB</p>
        </div>
      </section>

      {/* Infrastructure Details */}
      <section className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white">📦 인프라 구성</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-aws-orange mb-2">Instance 1: 인프라 서비스</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Kafka (Message Broker)</li>
              <li>MySQL (통합 데이터베이스)</li>
              <li>MongoDB</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-github-purple mb-2">Instance 2: 애플리케이션 A</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Spring Boot 앱 (E-Commerce, Payment 등)</li>
              <li>Nginx (Reverse Proxy)</li>
              <li>React 프론트엔드</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-yellow-500 mb-2">Instance 3: 애플리케이션 B</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Keycloak (인증/인가)</li>
              <li>추가 Spring Boot 앱</li>
              <li>Grafana (모니터링)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
