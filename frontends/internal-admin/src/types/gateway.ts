// Cash Gateway Service 타입
// Backend: cash-gateway-service/domain

export type PaymentProcessStatus = 'UNKNOWN' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
export type PaymentStatus = 'APPROVED' | 'CANCELLED' | 'REFUNDED'

// PaymentProcess (상태 관리)
export interface PaymentProcess {
  // === Public IDs (Backend Response) ===
  publicId: string // PaymentProcess의 Public ID (Snowflake Base62) - API에서는 attemptPublicId로 노출
  orderPublicId: string | null // Ecommerce Order Public ID (cross-service reference)
  userPublicId: string | null // Ecommerce User Public ID (cross-service reference)

  // === Process Info ===
  gatewayReferenceId: string // Gateway Reference ID (CGW_YYYYMMDD_XXX)
  orderNumber: string // Order number from ecommerce
  provider: string // PG provider (e.g., 'HAMSTER_PG')
  mid: string // Merchant ID
  amount: number
  status: PaymentProcessStatus

  // === PG Info ===
  pgTransaction: string | null // PG transaction ID
  pgApprovalNo: string | null // PG approval number
  failureReason: string | null // Failure reason if status is FAILED

  // === PG Request Tracking ===
  requestedAt: string | null // PG 요청 시작 시각
  ackReceivedAt: string | null // PG 202/200 응답 받은 시각 (큐에 넣었다는 응답)
  lastRequestAttemptAt: string | null // 마지막 재시도 시각
  requestAttemptCount: number // 총 요청 시도 횟수

  // === Timestamps ===
  createdAt: string
  modifiedAt: string | null // Webhook으로 최종 상태 변경 시각
}

// Payment (확정된 거래 기록)
export interface Payment {
  // === Public IDs (Backend Response) ===
  publicId: string // Payment의 Public ID (Snowflake Base62) - API에서는 paymentPublicId로 노출
  processPublicId: string // PaymentProcess의 Public ID (FK reference) - API에서는 attemptPublicId로 노출
  orderPublicId: string | null // Ecommerce Order Public ID (cross-service reference)
  userPublicId: string | null // Ecommerce User Public ID (cross-service reference)
  originPaymentPublicId: string | null // 취소 시 원본 Payment Public ID

  // === Payment Info ===
  gatewayReferenceId: string // Gateway Reference ID
  mid: string // Merchant ID
  amount: number
  status: PaymentStatus
  provider: string // PG provider
  originSource: string // Payment origin source

  // === PG Info ===
  pgTransaction: string // PG transaction ID
  pgApprovalNo: string | null // PG approval number

  // === Timestamps ===
  createdAt: string
  modifiedAt: string | null
}

// 이벤트 타임라인용 (Outbox/ProcessEvent 테이블 JOIN 결과)
export type ProcessEventType =
  | 'PROCESS_CREATED'
  | 'STOCK_RESERVATION_REQUESTED'
  | 'STOCK_RESERVED'
  | 'STOCK_RESERVATION_FAILED'
  | 'PG_REQUEST_SENT'
  | 'PG_WEBHOOK_RECEIVED'
  | 'PROCESS_COMPLETED'
  | 'PROCESS_FAILED'
  | 'PAYMENT_CREATED'
  | 'STOCK_RESTORED'

export interface ProcessEvent {
  // === Event IDs (추적용) ===
  eventId: string // Event의 Public ID (Snowflake Base62) - Outbox/ProcessEvent 테이블의 eventId
  traceId: string | null // 분산 추적용 Trace ID (여러 서비스 걸친 추적)

  // === Event Info ===
  eventType: ProcessEventType
  message: string
  details?: Record<string, unknown>
  status: 'success' | 'pending' | 'error'

  // === Timestamps ===
  timestamp: string
}

// 프로세스 상세 (펼쳐지는 형태로 표시)
export interface ProcessDetail {
  process: PaymentProcess
  events: ProcessEvent[]
  payment?: Payment
}

// Legacy (하위 호환)
export interface PaymentAttempt {
  id: number
  orderId: string
  amount: number
  status: PaymentAttemptStatus
  pgTransactionId?: string
  createdAt: string
  modifiedAt: string
}

export enum PaymentAttemptStatus {
  PENDING = 'PENDING',
  STOCK_RESERVATION_PENDING = 'STOCK_RESERVATION_PENDING',
  STOCK_RESERVED = 'STOCK_RESERVED',
  STOCK_RESERVATION_FAILED = 'STOCK_RESERVATION_FAILED',
  PG_REQUESTED = 'PG_REQUESTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface KafkaEvent {
  id: number
  eventType: string
  attemptId: number
  topic: string
  payload: Record<string, unknown>
  status: 'sent' | 'failed'
  timestamp: string
}
