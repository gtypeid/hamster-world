import type { TopologyResponse } from '@/types/topology'

/**
 * Mock Topology Data
 * - kafka-topology.yml 기반
 */
export const mockTopology: TopologyResponse = {
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
          events: [], // DLT는 모든 이벤트
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
}
