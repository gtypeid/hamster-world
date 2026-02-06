import type {
  PaymentProcess,
  PaymentProcessStatus,
  ProcessDetail,
  ProcessEvent,
  ProcessEventType,
  Payment,
  PaymentStatus,
} from '@/types/gateway'

// Mock: 프로세스 목록
export const mockProcesses: PaymentProcess[] = [
  {
    // Public IDs
    publicId: '7nX9kP2mQ8rT1vY5', // PaymentProcess Public ID (Snowflake Base62)
    orderPublicId: '5aB3cD7eF9gH2jK4', // Ecommerce Order Public ID
    userPublicId: '3xY6zA9bC2dE5fG8', // Ecommerce User Public ID

    // Process Info
    gatewayReferenceId: 'CGW_20260204_001',
    orderNumber: 'ORD_20260204_A1B2C3',
    provider: 'HAMSTER_PG',
    mid: 'MID_DUMMY_001',
    amount: 15000,
    status: 'UNKNOWN' as PaymentProcessStatus,

    // PG Info
    pgTransaction: null,
    pgApprovalNo: null,
    failureReason: null,

    // Timestamps
    createdAt: new Date(Date.now() - 10000).toISOString(), // 10초 전
    modifiedAt: null,
  },
  {
    // Public IDs
    publicId: '8oY1lQ3nR9sU2wZ6',
    orderPublicId: '6bC4dE8fG0hI3kL5',
    userPublicId: '4yZ7aB0cD3eF6gH9',

    // Process Info
    gatewayReferenceId: 'CGW_20260204_002',
    orderNumber: 'ORD_20260204_D4E5F6',
    provider: 'HAMSTER_PG',
    mid: 'MID_DUMMY_001',
    amount: 12000,
    status: 'SUCCESS' as PaymentProcessStatus,

    // PG Info
    pgTransaction: 'PG87654321',
    pgApprovalNo: 'AUTH789',
    failureReason: null,

    // Timestamps
    createdAt: new Date(Date.now() - 300000).toISOString(), // 5분 전
    modifiedAt: new Date(Date.now() - 295000).toISOString(),
  },
  {
    // Public IDs
    publicId: '9pZ2mR4oS0tV3xA7',
    orderPublicId: '7cD5eF9gH1iJ4lM6',
    userPublicId: '5zA8bC1dE4fG7hI0',

    // Process Info
    gatewayReferenceId: 'CGW_20260204_003',
    orderNumber: 'ORD_20260204_G7H8I9',
    provider: 'HAMSTER_PG',
    mid: 'MID_DUMMY_001',
    amount: 8000,
    status: 'FAILED' as PaymentProcessStatus,

    // PG Info
    pgTransaction: 'PG11111111',
    pgApprovalNo: null,
    failureReason: '잔액 부족 (INSUFFICIENT_BALANCE)',

    // Timestamps
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
    modifiedAt: new Date(Date.now() - 3598000).toISOString(),
  },
  {
    // Public IDs
    publicId: '0qA3nS5pT1uW4yB8',
    orderPublicId: '8dE6fG0hI2jK5mN7',
    userPublicId: '6aB9cD2eF5gH8iJ1',

    // Process Info
    gatewayReferenceId: 'CGW_20260204_004',
    orderNumber: 'ORD_20260204_J1K2L3',
    provider: 'HAMSTER_PG',
    mid: 'MID_DUMMY_001',
    amount: 25000,
    status: 'SUCCESS' as PaymentProcessStatus,

    // PG Info
    pgTransaction: 'PG22222222',
    pgApprovalNo: 'AUTH456',
    failureReason: null,

    // Timestamps
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
    modifiedAt: new Date(Date.now() - 7195000).toISOString(),
  },
]

// Mock: 프로세스 상세 (진행 중)
export const mockProcessDetailInProgress: ProcessDetail = {
  process: mockProcesses[0],
  events: [
    {
      eventId: 'EVT_1aB2cD3eF4gH5iJ6',
      traceId: 'TRACE_001_CGW_20260204_001',
      timestamp: new Date(Date.now() - 10000).toISOString(),
      eventType: 'PROCESS_CREATED' as ProcessEventType,
      message: 'PaymentProcess 생성 (UNKNOWN)',
      details: { gatewayReferenceId: 'CGW_20260204_001' },
      status: 'success',
    },
    {
      eventId: 'EVT_2bC3dE4fG5hI6jK7',
      traceId: 'TRACE_001_CGW_20260204_001',
      timestamp: new Date(Date.now() - 9500).toISOString(),
      eventType: 'STOCK_RESERVATION_REQUESTED' as ProcessEventType,
      message: 'Kafka: StockReservationRequested (Payment Service로 발행)',
      details: { items: [{ productId: 1, quantity: 5 }] },
      status: 'success',
    },
    {
      eventId: 'EVT_3cD4eF5gH6iJ7kL8',
      traceId: 'TRACE_001_CGW_20260204_001',
      timestamp: new Date(Date.now() - 8000).toISOString(),
      eventType: 'STOCK_RESERVED' as ProcessEventType,
      message: 'Kafka: StockReserved - Payment Service 재고 차감 완료',
      status: 'success',
    },
    {
      eventId: 'EVT_4dE5fG6hI7jK8lM9',
      traceId: 'TRACE_001_CGW_20260204_001',
      timestamp: new Date(Date.now() - 7000).toISOString(),
      eventType: 'PG_REQUEST_SENT' as ProcessEventType,
      message: 'PG 요청 발송 (Hamster PG)',
      details: { tid: 'PG_PENDING_001' },
      status: 'success',
    },
    {
      eventId: 'EVT_5eF6gH7iJ8kL9mN0',
      traceId: 'TRACE_001_CGW_20260204_001',
      timestamp: new Date().toISOString(),
      eventType: 'PG_WEBHOOK_RECEIVED' as ProcessEventType,
      message: 'PG 응답 대기 중...',
      status: 'pending',
    },
  ],
  payment: undefined, // 아직 Payment 없음
}

// Mock: 프로세스 상세 (성공)
export const mockProcessDetailSuccess: ProcessDetail = {
  process: mockProcesses[1],
  events: [
    {
      eventId: 'EVT_6fG7hI8jK9lM0nO1',
      traceId: 'TRACE_002_CGW_20260204_002',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      eventType: 'PROCESS_CREATED' as ProcessEventType,
      message: 'PaymentProcess 생성 (UNKNOWN)',
      status: 'success',
    },
    {
      eventId: 'EVT_7gH8iJ9kL0mN1oP2',
      traceId: 'TRACE_002_CGW_20260204_002',
      timestamp: new Date(Date.now() - 299500).toISOString(),
      eventType: 'STOCK_RESERVATION_REQUESTED' as ProcessEventType,
      message: 'Kafka: StockReservationRequested',
      status: 'success',
    },
    {
      eventId: 'EVT_8hI9jK0lM1nO2pQ3',
      traceId: 'TRACE_002_CGW_20260204_002',
      timestamp: new Date(Date.now() - 298000).toISOString(),
      eventType: 'STOCK_RESERVED' as ProcessEventType,
      message: 'Kafka: StockReserved',
      status: 'success',
    },
    {
      eventId: 'EVT_9iJ0kL1mN2oP3qR4',
      traceId: 'TRACE_002_CGW_20260204_002',
      timestamp: new Date(Date.now() - 297000).toISOString(),
      eventType: 'PG_REQUEST_SENT' as ProcessEventType,
      message: 'PG 요청 발송',
      details: { tid: 'PG87654321' },
      status: 'success',
    },
    {
      eventId: 'EVT_0jK1lM2nO3pQ4rS5',
      traceId: 'TRACE_002_CGW_20260204_002',
      timestamp: new Date(Date.now() - 296000).toISOString(),
      eventType: 'PG_WEBHOOK_RECEIVED' as ProcessEventType,
      message: 'PG Webhook 수신 (SUCCESS)',
      details: { tid: 'PG87654321', approvalNo: 'AUTH789' },
      status: 'success',
    },
    {
      eventId: 'EVT_1kL2mN3oP4qR5sT6',
      traceId: 'TRACE_002_CGW_20260204_002',
      timestamp: new Date(Date.now() - 295900).toISOString(),
      eventType: 'PROCESS_COMPLETED' as ProcessEventType,
      message: 'PaymentProcess.status = SUCCESS',
      status: 'success',
    },
    {
      eventId: 'EVT_2lM3nO4pQ5rS6tU7',
      traceId: 'TRACE_002_CGW_20260204_002',
      timestamp: new Date(Date.now() - 295800).toISOString(),
      eventType: 'PAYMENT_CREATED' as ProcessEventType,
      message: 'Payment 생성 (APPROVED)',
      details: { paymentPublicId: 'PAY_1aB2cD3eF4gH5iJ6' },
      status: 'success',
    },
  ],
  payment: {
    publicId: 'PAY_1aB2cD3eF4gH5iJ6',
    processPublicId: '8oY1lQ3nR9sU2wZ6',
    orderPublicId: '6bC4dE8fG0hI3kL5',
    userPublicId: '4yZ7aB0cD3eF6gH9',
    originPaymentPublicId: null,
    gatewayReferenceId: 'CGW_20260204_002',
    mid: 'MID_DUMMY_001',
    amount: 12000,
    status: 'APPROVED' as PaymentStatus,
    provider: 'HAMSTER_PG',
    originSource: 'ECOMMERCE',
    pgTransaction: 'PG87654321',
    pgApprovalNo: 'AUTH789',
    createdAt: new Date(Date.now() - 295800).toISOString(),
    modifiedAt: null,
  },
}

// Mock: 프로세스 상세 (실패)
export const mockProcessDetailFailed: ProcessDetail = {
  process: mockProcesses[2],
  events: [
    {
      eventId: 'EVT_3mN4oP5qR6sT7uV8',
      traceId: 'TRACE_003_CGW_20260204_003',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      eventType: 'PROCESS_CREATED' as ProcessEventType,
      message: 'PaymentProcess 생성',
      status: 'success',
    },
    {
      eventId: 'EVT_4nO5pQ6rS7tU8vW9',
      traceId: 'TRACE_003_CGW_20260204_003',
      timestamp: new Date(Date.now() - 3599500).toISOString(),
      eventType: 'STOCK_RESERVATION_REQUESTED' as ProcessEventType,
      message: 'Kafka: StockReservationRequested',
      status: 'success',
    },
    {
      eventId: 'EVT_5oP6qR7sT8uV9wX0',
      traceId: 'TRACE_003_CGW_20260204_003',
      timestamp: new Date(Date.now() - 3599000).toISOString(),
      eventType: 'STOCK_RESERVED' as ProcessEventType,
      message: 'Kafka: StockReserved',
      status: 'success',
    },
    {
      eventId: 'EVT_6pQ7rS8tU9vW0xY1',
      traceId: 'TRACE_003_CGW_20260204_003',
      timestamp: new Date(Date.now() - 3598500).toISOString(),
      eventType: 'PG_REQUEST_SENT' as ProcessEventType,
      message: 'PG 요청 발송',
      status: 'success',
    },
    {
      eventId: 'EVT_7qR8sT9uV0wX1yZ2',
      traceId: 'TRACE_003_CGW_20260204_003',
      timestamp: new Date(Date.now() - 3598000).toISOString(),
      eventType: 'PG_WEBHOOK_RECEIVED' as ProcessEventType,
      message: 'PG Webhook 수신 (FAILED)',
      details: { code: 'INSUFFICIENT_BALANCE', message: '잔액 부족' },
      status: 'error',
    },
    {
      eventId: 'EVT_8rS9tU0vW1xY2zA3',
      traceId: 'TRACE_003_CGW_20260204_003',
      timestamp: new Date(Date.now() - 3597900).toISOString(),
      eventType: 'PROCESS_FAILED' as ProcessEventType,
      message: 'PaymentProcess.status = FAILED',
      status: 'error',
    },
    {
      eventId: 'EVT_9sT0uV1wX2yZ3aB4',
      traceId: 'TRACE_003_CGW_20260204_003',
      timestamp: new Date(Date.now() - 3597500).toISOString(),
      eventType: 'STOCK_RESTORED' as ProcessEventType,
      message: 'Kafka: 재고 복구 완료 (+5개)',
      status: 'success',
    },
  ],
  payment: undefined, // 실패는 Payment 없음
}

// Helper: 프로세스 Public ID로 상세 조회
export function getMockProcessDetail(processPublicId: string): ProcessDetail | null {
  switch (processPublicId) {
    case '7nX9kP2mQ8rT1vY5':
      return mockProcessDetailInProgress
    case '8oY1lQ3nR9sU2wZ6':
      return mockProcessDetailSuccess
    case '9pZ2mR4oS0tV3xA7':
      return mockProcessDetailFailed
    default:
      return null
  }
}
