import { useMemo } from 'react';
import { TopologyViewer } from '@common/topology';
import type { TopologyResponse } from '@common/topology';

/**
 * Hamster World 정적 토폴로지 데이터
 * - internal-admin의 mockTopology와 동일한 구조
 * - 실제 API 없이 정적으로 보여줌
 */
const STATIC_TOPOLOGY: TopologyResponse = {
  services: [
    {
      serviceName: 'ecommerce-service',
      subscribes: [
        {
          topic: 'payment-events',
          events: ['PaymentApprovedEvent', 'PaymentFailedEvent'],
        },
        {
          topic: 'cash-gateway-events',
          events: ['PaymentProcessCompletedEvent'],
        },
      ],
      publishes: [
        {
          topic: 'ecommerce-events',
          events: ['OrderCreatedEvent', 'OrderCancelledEvent', 'ProductCreatedEvent'],
        },
      ],
    },
    {
      serviceName: 'payment-service',
      subscribes: [
        {
          topic: 'ecommerce-events',
          events: ['OrderCreatedEvent', 'ProductCreatedEvent'],
        },
      ],
      publishes: [
        {
          topic: 'payment-events',
          events: [
            'PaymentApprovedEvent',
            'PaymentFailedEvent',
            'ProductStockChangedEvent',
            'ProductCreatedEvent',
          ],
        },
      ],
    },
    {
      serviceName: 'cash-gateway-service',
      subscribes: [
        {
          topic: 'ecommerce-events',
          events: ['OrderCreatedEvent'],
        },
      ],
      publishes: [
        {
          topic: 'cash-gateway-events',
          events: ['PaymentRequestedEvent', 'PaymentProcessCompletedEvent'],
        },
      ],
    },
    {
      serviceName: 'progression-service',
      subscribes: [
        {
          topic: 'ecommerce-events',
          events: ['OrderCreatedEvent'],
        },
        {
          topic: 'payment-events',
          events: ['PaymentApprovedEvent'],
        },
      ],
      publishes: [
        {
          topic: 'progression-events',
          events: ['ArchiveClaimedEvent', 'QuotaUpdatedEvent'],
        },
      ],
    },
    {
      serviceName: 'notification-service',
      subscribes: [
        {
          topic: 'ecommerce-events-dlt',
          events: [],
        },
        {
          topic: 'payment-events-dlt',
          events: [],
        },
        {
          topic: 'cash-gateway-events-dlt',
          events: [],
        },
        {
          topic: 'progression-events-dlt',
          events: [],
        },
      ],
      publishes: [],
    },
  ],
};

export function Architecture() {
  const topology = useMemo(() => STATIC_TOPOLOGY, []);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <h1 className="text-3xl font-bold text-white mb-2">
          Event Flow Topology
        </h1>
        <p className="text-gray-400 text-sm">
          Hamster World의 Kafka 이벤트 드리븐 아키텍처. 서비스 간 이벤트 발행/구독 흐름을 시각화합니다.
        </p>
      </div>

      {/* Topology Viewer */}
      <div className="flex-1 m-6 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
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
