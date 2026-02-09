// DLQ Message Types
export type DLQStatus = 'PENDING' | 'REPROCESSING' | 'RESOLVED' | 'IGNORED'

export interface DLQMessage {
  id: string

  // Kafka 메타데이터
  originalTopic: string          // "ecommerce-events"
  consumerGroup: string          // "payment-service"
  originalPartition: number
  originalOffset: number
  originalTimestamp: number

  // DomainEvent 공통 필드 (백엔드에서 파싱되어 컬럼에 저장됨)
  aggregateId?: string           // Order/Product Public ID 등
  eventId?: string               // 이벤트 고유 ID
  traceId?: string               // 분산 추적 ID
  eventType?: string             // "OrderCreatedEvent", "ProductCreatedEvent"
  eventOccurredAt?: string       // ISO timestamp

  // 예외 정보
  exceptionClass: string
  exceptionMessage?: string
  stackTrace?: string

  // 상태 관리
  status: DLQStatus
  failedAt: string               // ISO timestamp
  retryCount: number
  reprocessAttempts: number
  lastReprocessAt?: string

  // 해결 정보
  resolvedAt?: string
  resolvedBy?: string
  notes?: string

  // 원본 메시지 (JSON string)
  originalMessage: string

  // 헤더
  headers: Record<string, string>
}

// Mock: DLQ Messages
export const mockDLQMessages: DLQMessage[] = [
  // 1. OrderCreatedEvent 실패 (Payment Service)
  {
    id: 'dlq-001',
    originalTopic: 'ecommerce-events',
    consumerGroup: 'payment-service',
    originalPartition: 2,
    originalOffset: 12345,
    originalTimestamp: Date.now() - 3600000, // 1시간 전

    // DomainEvent 필드
    aggregateId: '5aB3cD7eF9gH2jK4', // Order Public ID
    eventId: 'evt-550e8400-e29b-41d4-a716-446655440000',
    traceId: 'trace-20260209-001',
    eventType: 'OrderCreatedEvent',
    eventOccurredAt: new Date(Date.now() - 3600000).toISOString(),

    // 예외 정보
    exceptionClass: 'IllegalArgumentException',
    exceptionMessage: 'Stock validation failed: Insufficient stock for SKU PROD_001 (requested: 10, available: 3)',
    stackTrace: `java.lang.IllegalArgumentException: Stock validation failed
    at com.hamsterworld.payment.domain.product.service.ProductService.reserveStock(ProductService.kt:45)
    at com.hamsterworld.payment.consumer.OrderEventConsumer.handleOrderCreated(OrderEventConsumer.kt:67)`,

    // 상태
    status: 'PENDING',
    failedAt: new Date(Date.now() - 3600000).toISOString(),
    retryCount: 3,
    reprocessAttempts: 0,

    // 원본 메시지
    originalMessage: JSON.stringify({
      eventType: 'OrderCreatedEvent',
      aggregateId: '5aB3cD7eF9gH2jK4',
      metadata: {
        eventId: 'evt-550e8400-e29b-41d4-a716-446655440000',
        traceId: 'trace-20260209-001',
        occurredAt: new Date(Date.now() - 3600000).toISOString(),
      },
      payload: {
        orderNumber: 'ORD-20260209-001',
        orderPublicId: '5aB3cD7eF9gH2jK4',
        userId: '3xY6zA9bC2dE5fG8',
        userPublicId: '3xY6zA9bC2dE5fG8',
        totalPrice: 150000,
        items: [
          { productId: 'PROD_001', quantity: 10, price: 15000 }
        ]
      }
    }, null, 2),

    headers: {
      'x-failed-service': 'payment-service',
      'x-failed-consumer-group': 'payment-service-consumer',
      'x-failed-at': new Date(Date.now() - 3600000).toISOString(),
      'x-failed-reason': 'Stock validation failed'
    }
  },

  // 2. ProductCreatedEvent 실패 (Payment Service) - Duplicate SKU
  {
    id: 'dlq-002',
    originalTopic: 'ecommerce-events',
    consumerGroup: 'payment-service',
    originalPartition: 1,
    originalOffset: 12340,
    originalTimestamp: Date.now() - 7200000, // 2시간 전

    aggregateId: 'EPROD_1xY2zA3bC4dE5fG6',
    eventId: 'evt-660f9511-f3ac-52e5-b827-557766551111',
    traceId: 'trace-20260209-002',
    eventType: 'ProductCreatedEvent',
    eventOccurredAt: new Date(Date.now() - 7200000).toISOString(),

    exceptionClass: 'org.springframework.dao.DataIntegrityViolationException',
    exceptionMessage: 'Duplicate entry for SKU: PROD_002',

    status: 'RESOLVED',
    failedAt: new Date(Date.now() - 7200000).toISOString(),
    retryCount: 3,
    reprocessAttempts: 1,
    lastReprocessAt: new Date(Date.now() - 3600000).toISOString(),
    resolvedAt: new Date(Date.now() - 3000000).toISOString(),
    resolvedBy: 'admin-user-123',
    notes: '중복 SKU 이슈 해결 후 재처리 완료',

    originalMessage: JSON.stringify({
      eventType: 'ProductCreatedEvent',
      aggregateId: 'EPROD_1xY2zA3bC4dE5fG6',
      metadata: {
        eventId: 'evt-660f9511-f3ac-52e5-b827-557766551111',
        traceId: 'trace-20260209-002',
        occurredAt: new Date(Date.now() - 7200000).toISOString(),
      },
      payload: {
        publicId: 'EPROD_1xY2zA3bC4dE5fG6',
        sku: 'PROD_002',
        name: '햄스터 케이지 (대형)',
        price: 89000,
        stock: 50
      }
    }, null, 2),

    headers: {
      'x-failed-service': 'payment-service',
      'x-failed-consumer-group': 'payment-service-consumer'
    }
  },

  // 3. QuotaClaimedEvent 실패 (Payment Service)
  {
    id: 'dlq-003',
    originalTopic: 'progression-events',
    consumerGroup: 'payment-service',
    originalPartition: 0,
    originalOffset: 9876,
    originalTimestamp: Date.now() - 1800000, // 30분 전

    aggregateId: 'quota-arch-001',
    eventId: 'evt-770g0622-g4bd-63f6-c938-668877662222',
    traceId: 'trace-20260209-003',
    eventType: 'QuotaClaimedEvent',
    eventOccurredAt: new Date(Date.now() - 1800000).toISOString(),

    exceptionClass: 'com.hamsterworld.payment.exception.InsufficientBalanceException',
    exceptionMessage: 'User has insufficient balance for reward claim (required: 1000, available: 500)',

    status: 'PENDING',
    failedAt: new Date(Date.now() - 1800000).toISOString(),
    retryCount: 2,
    reprocessAttempts: 0,

    originalMessage: JSON.stringify({
      eventType: 'QuotaClaimedEvent',
      aggregateId: 'quota-arch-001',
      metadata: {
        eventId: 'evt-770g0622-g4bd-63f6-c938-668877662222',
        traceId: 'trace-20260209-003',
        occurredAt: new Date(Date.now() - 1800000).toISOString(),
      },
      payload: {
        quotaPublicId: 'quota-arch-001',
        userId: '3xY6zA9bC2dE5fG8',
        userPublicId: '3xY6zA9bC2dE5fG8',
        rewardAmount: 1000,
        quotaType: 'ARCHIVE'
      }
    }, null, 2),

    headers: {
      'x-failed-service': 'payment-service',
      'x-failed-consumer-group': 'payment-service-consumer'
    }
  },

  // 4. OrderCreatedEvent 실패 (Cash Gateway Service) - JSON Parsing Error
  {
    id: 'dlq-004',
    originalTopic: 'ecommerce-events',
    consumerGroup: 'cash-gateway-service',
    originalPartition: 2,
    originalOffset: 12350,
    originalTimestamp: Date.now() - 300000, // 5분 전

    aggregateId: '6bC4dE8fF0gH3kK5',
    eventId: 'evt-880h1733-h5ce-74g7-d049-779988773333',
    traceId: 'trace-20260209-004',
    eventType: 'OrderCreatedEvent',
    eventOccurredAt: new Date(Date.now() - 300000).toISOString(),

    exceptionClass: 'com.fasterxml.jackson.core.JsonProcessingException',
    exceptionMessage: 'Unexpected character at position 45',

    status: 'IGNORED',
    failedAt: new Date(Date.now() - 300000).toISOString(),
    retryCount: 0, // JsonProcessingException은 재시도 안함
    reprocessAttempts: 0,
    resolvedAt: new Date(Date.now() - 120000).toISOString(),
    resolvedBy: 'admin-user-456',
    notes: 'IGNORED: 잘못된 JSON 형식. Ecommerce Service 측 버그로 확인됨.',

    originalMessage: '{ "eventType": "OrderCreatedEvent", "malformed": json }', // 잘못된 JSON

    headers: {
      'x-failed-service': 'cash-gateway-service',
      'x-failed-consumer-group': 'cash-gateway-consumer'
    }
  },

  // 5. ProductStockChangedEvent 실패 (Ecommerce Service)
  {
    id: 'dlq-005',
    originalTopic: 'payment-events',
    consumerGroup: 'ecommerce-service',
    originalPartition: 1,
    originalOffset: 8765,
    originalTimestamp: Date.now() - 600000, // 10분 전

    aggregateId: 'PROD_1aB2cD3eF4gH5iJ6',
    eventId: 'evt-990i2844-i6df-85h8-e150-880099884444',
    traceId: 'trace-20260209-005',
    eventType: 'ProductStockChangedEvent',
    eventOccurredAt: new Date(Date.now() - 600000).toISOString(),

    exceptionClass: 'java.util.concurrent.TimeoutException',
    exceptionMessage: 'Database connection timeout after 5000ms',

    status: 'REPROCESSING',
    failedAt: new Date(Date.now() - 600000).toISOString(),
    retryCount: 3,
    reprocessAttempts: 2,
    lastReprocessAt: new Date(Date.now() - 180000).toISOString(),

    originalMessage: JSON.stringify({
      eventType: 'ProductStockChangedEvent',
      aggregateId: 'PROD_1aB2cD3eF4gH5iJ6',
      metadata: {
        eventId: 'evt-990i2844-i6df-85h8-e150-880099884444',
        traceId: 'trace-20260209-005',
        occurredAt: new Date(Date.now() - 600000).toISOString(),
      },
      payload: {
        productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
        ecommerceProductId: 'EPROD_1xY2zA3bC4dE5fG6',
        stockDelta: -5,
        currentStock: 45,
        reason: 'STOCK_RESERVED'
      }
    }, null, 2),

    headers: {
      'x-failed-service': 'ecommerce-service',
      'x-failed-consumer-group': 'ecommerce-consumer'
    }
  },

  // 6. ArchiveClaimedEvent 실패 (Payment Service)
  {
    id: 'dlq-006',
    originalTopic: 'progression-events',
    consumerGroup: 'payment-service',
    originalPartition: 2,
    originalOffset: 9880,
    originalTimestamp: Date.now() - 900000, // 15분 전

    aggregateId: 'archive-quest-001',
    eventId: 'evt-aa0j3955-j7eg-96i9-f261-991100995555',
    traceId: 'trace-20260209-006',
    eventType: 'ArchiveClaimedEvent',
    eventOccurredAt: new Date(Date.now() - 900000).toISOString(),

    exceptionClass: 'IllegalStateException',
    exceptionMessage: 'Archive already claimed by user',

    status: 'PENDING',
    failedAt: new Date(Date.now() - 900000).toISOString(),
    retryCount: 3,
    reprocessAttempts: 0,

    originalMessage: JSON.stringify({
      eventType: 'ArchiveClaimedEvent',
      aggregateId: 'archive-quest-001',
      metadata: {
        eventId: 'evt-aa0j3955-j7eg-96i9-f261-991100995555',
        traceId: 'trace-20260209-006',
        occurredAt: new Date(Date.now() - 900000).toISOString(),
      },
      payload: {
        archivePublicId: 'archive-quest-001',
        userId: '4yZ7aB0cC3dE6fG9',
        userPublicId: '4yZ7aB0cC3dE6fG9',
        rewardAmount: 500,
        archiveType: 'QUEST'
      }
    }, null, 2),

    headers: {
      'x-failed-service': 'payment-service',
      'x-failed-consumer-group': 'payment-service-consumer'
    }
  }
]

// Helper: DLQ Message 통계
export function getDLQStatistics(messages: DLQMessage[]) {
  return {
    total: messages.length,
    pending: messages.filter(m => m.status === 'PENDING').length,
    reprocessing: messages.filter(m => m.status === 'REPROCESSING').length,
    resolved: messages.filter(m => m.status === 'RESOLVED').length,
    ignored: messages.filter(m => m.status === 'IGNORED').length,
  }
}

// Helper: Topic → Service 매핑 (kafka-topology.yml 기반)
export function getTopicOwner(topic: string): string {
  const topicMap: Record<string, string> = {
    'ecommerce-events': 'ecommerce-service',
    'payment-events': 'payment-service',
    'cash-gateway-events': 'cash-gateway-service',
    'progression-events': 'progression-service',
  }
  return topicMap[topic] || 'unknown-service'
}

// Helper: Topic 설명 (kafka-topology.yml 기반)
export function getTopicDescription(topic: string): string {
  const descMap: Record<string, string> = {
    'ecommerce-events': '주문, 상품 관리',
    'payment-events': '재고 관리, 결제 검증',
    'cash-gateway-events': 'PG 연동',
    'progression-events': 'Archive, Quota 관리',
  }
  return descMap[topic] || ''
}
