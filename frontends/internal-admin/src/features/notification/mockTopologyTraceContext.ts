/**
 * Mock Topology Trace Context
 * - DLQ 메시지 시나리오를 토폴로지 컨텍스트로 변환한 목 데이터
 * - TopologyViewer 테스트용
 */

import type { TopologyTraceContext } from '@/types/topologyTraceContext'

/**
 * 시나리오 1: OrderCreatedEvent (ecommerce-service 발행)
 * - payment-service 에서 재고 검증 실패
 *
 * 트레이스 이벤트 흐름:
 * 1. OrderCreatedEvent 발행 (✅)
 * 2. payment-service 구독 처리 (❌ 실패)
 */
export const mockTraceContext_OrderCreatedEvent_PaymentFailed: TopologyTraceContext = {
  traceId: 'trace-20260209-001',

  // 최초 진입점
  rootEventType: 'OrderCreatedEvent',
  rootService: 'ecommerce-service',
  rootTopic: 'ecommerce-events',

  // 관련 요소들
  involvedServices: new Set([
    'ecommerce-service',
    'payment-service',
    'cash-gateway-service',
    'notification-service',
  ]),
  involvedTopics: new Set([
    'ecommerce-events',
  ]),

  // 트레이스 경로: 배열의 마지막이 실패, 그 전까지 성공
  // ID 형식: event-{parentId}-{eventName}
  // parentId = publisher-{serviceName}-{topic} 또는 consumer-{serviceName}-{topic}
  traceEventIds: [
    'event-publisher-ecommerce-service-ecommerce-events-OrderCreatedEvent', // Depth 1 (✅)
    'event-consumer-payment-service-ecommerce-events-OrderCreatedEvent', // Depth 2 (❌ FAILED)
  ],

  failedReason: 'Stock validation failed: Insufficient stock for SKU PROD_001',
}

/**
 * 시나리오 2: ProductCreatedEvent (ecommerce-service 발행)
 * - payment-service 에서 모두 성공적으로 처리 (해결됨)
 *
 * 트레이스 이벤트 흐름:
 * 1. ProductCreatedEvent 발행 (✅)
 * 2. payment-service 구독 처리 (✅)
 */
export const mockTraceContext_ProductCreatedEvent_PaymentResolved: TopologyTraceContext = {
  traceId: 'trace-20260209-002',

  rootEventType: 'ProductCreatedEvent',
  rootService: 'ecommerce-service',
  rootTopic: 'ecommerce-events',

  involvedServices: new Set([
    'ecommerce-service',
    'payment-service',
  ]),
  involvedTopics: new Set([
    'ecommerce-events',
  ]),

  // 성공한 케이스 (모든 이벤트 성공)
  traceEventIds: [
    'event-publisher-ecommerce-service-ecommerce-events-ProductCreatedEvent', // Depth 1 (✅)
    'event-consumer-payment-service-ecommerce-events-ProductCreatedEvent', // Depth 2 (✅)
  ],
}

/**
 * 시나리오 3: QuotaClaimedEvent (progression-service 발행)
 * - payment-service 에서 잔액 부족
 *
 * 트레이스 이벤트 흐름:
 * 1. QuotaClaimedEvent 발행 (✅)
 * 2. payment-service 구독 처리 (❌ 실패)
 */
export const mockTraceContext_QuotaClaimedEvent_PaymentFailed: TopologyTraceContext = {
  traceId: 'trace-20260209-003',

  rootEventType: 'QuotaClaimedEvent',
  rootService: 'progression-service',
  rootTopic: 'progression-events',

  involvedServices: new Set([
    'progression-service',
    'payment-service',
  ]),
  involvedTopics: new Set([
    'progression-events',
  ]),

  traceEventIds: [
    'event-publisher-progression-service-progression-events-QuotaClaimedEvent', // Depth 1 (✅)
    'event-consumer-payment-service-progression-events-QuotaClaimedEvent', // Depth 2 (❌ FAILED)
  ],

  failedReason: 'User has insufficient balance for reward claim',
}

/**
 * 시나리오 4: ProductStockChangedEvent (payment-service 발행)
 * - ecommerce-service 에서 DB 타임아웃 (재처리 중)
 *
 * 트레이스 이벤트 흐름:
 * 1. ProductStockChangedEvent 발행 (✅)
 * 2. ecommerce-service 구독 처리 (❌ 실패)
 */
export const mockTraceContext_ProductStockChangedEvent_EcommerceFailed: TopologyTraceContext = {
  traceId: 'trace-20260209-005',

  rootEventType: 'ProductStockChangedEvent',
  rootService: 'payment-service',
  rootTopic: 'payment-events',

  involvedServices: new Set([
    'payment-service',
    'ecommerce-service',
  ]),
  involvedTopics: new Set([
    'payment-events',
  ]),

  traceEventIds: [
    'event-publisher-payment-service-payment-events-ProductStockChangedEvent', // Depth 1 (✅)
    'event-consumer-ecommerce-service-payment-events-ProductStockChangedEvent', // Depth 2 (❌ FAILED)
  ],

  failedReason: 'Database connection timeout after 5000ms',
}

/**
 * 시나리오 5: ArchiveClaimedEvent (progression-service 발행)
 * - payment-service 에서 이미 청구된 archive (아직 미처리)
 *
 * 트레이스 이벤트 흐름:
 * 1. ArchiveClaimedEvent 발행 (✅)
 * 2. payment-service 구독 처리 (❌ 실패)
 */
export const mockTraceContext_ArchiveClaimedEvent_PaymentFailed: TopologyTraceContext = {
  traceId: 'trace-20260209-006',

  rootEventType: 'ArchiveClaimedEvent',
  rootService: 'progression-service',
  rootTopic: 'progression-events',

  involvedServices: new Set([
    'progression-service',
    'payment-service',
  ]),
  involvedTopics: new Set([
    'progression-events',
  ]),

  traceEventIds: [
    'event-publisher-progression-service-progression-events-ArchiveClaimedEvent', // Depth 1 (✅)
    'event-consumer-payment-service-progression-events-ArchiveClaimedEvent', // Depth 2 (❌ FAILED)
  ],

  failedReason: 'Archive already claimed by user',
}

/**
 * 시나리오 6: 복잡한 체이닝 (여러 토픽)
 * - ecommerce-service 발행 OrderCreatedEvent
 * - payment-service에서 성공하고 PaymentProcessedEvent 발행
 * - cash-gateway-service에서 실패
 *
 * 트레이스 이벤트 흐름:
 * 1. OrderCreatedEvent 발행 (✅)
 * 2. payment-service 구독 처리 (✅)
 * 3. PaymentProcessedEvent 발행 (✅)
 * 4. cash-gateway-service 구독 처리 (❌ 실패)
 */
export const mockTraceContext_ChainedEvents_CashGatewayFailed: TopologyTraceContext = {
  traceId: 'trace-20260209-007',

  rootEventType: 'OrderCreatedEvent',
  rootService: 'ecommerce-service',
  rootTopic: 'ecommerce-events',

  involvedServices: new Set([
    'ecommerce-service',
    'payment-service',
    'cash-gateway-service',
  ]),
  involvedTopics: new Set([
    'ecommerce-events',
    'payment-events',
  ]),

  traceEventIds: [
    'event-publisher-ecommerce-service-ecommerce-events-OrderCreatedEvent', // Depth 1 (✅)
    'event-consumer-payment-service-ecommerce-events-OrderCreatedEvent', // Depth 2 (✅)
    'event-publisher-payment-service-payment-events-PaymentProcessedEvent', // Depth 3 (✅)
    'event-consumer-cash-gateway-service-payment-events-PaymentProcessedEvent', // Depth 4 (❌ FAILED)
  ],

  failedReason: 'Payment gateway connection refused',
}

/**
 * 모든 목 컨텍스트
 */
export const ALL_MOCK_TRACE_CONTEXTS = [
  {
    name: 'OrderCreatedEvent - Payment Failed (Stock)',
    context: mockTraceContext_OrderCreatedEvent_PaymentFailed,
  },
  {
    name: 'ProductCreatedEvent - Payment Resolved',
    context: mockTraceContext_ProductCreatedEvent_PaymentResolved,
  },
  {
    name: 'QuotaClaimedEvent - Payment Failed (Balance)',
    context: mockTraceContext_QuotaClaimedEvent_PaymentFailed,
  },
  {
    name: 'ProductStockChangedEvent - Ecommerce Failed (Timeout)',
    context: mockTraceContext_ProductStockChangedEvent_EcommerceFailed,
  },
  {
    name: 'ArchiveClaimedEvent - Payment Failed (State)',
    context: mockTraceContext_ArchiveClaimedEvent_PaymentFailed,
  },
  {
    name: 'Chained Events - CashGateway Failed',
    context: mockTraceContext_ChainedEvents_CashGatewayFailed,
  },
]
