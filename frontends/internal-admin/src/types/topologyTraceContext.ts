/**
 * Topology Trace Context Types
 * - DLQ 메시지나 다른 소스로부터 추출된 trace 정보
 * - TopologyViewer에 전달되어 관련 노드만 활성화
 */

/**
 * Topology Trace Context
 * - 특정 trace와 관련된 서비스, 토픽, 이벤트 정보
 * - 토폴로지에서 어떤 노드/엣지를 활성화할지 결정
 */
export interface TopologyTraceContext {
  // 추적 ID
  traceId: string

  // 최초 진입점 (엔트리포인트)
  // 이 트레이스가 시작된 이벤트와 발행자
  rootEventType: string           // e.g., "OrderCreatedEvent"
  rootService: string             // e.g., "ecommerce-service"
  rootTopic: string               // e.g., "ecommerce-events"

  // 이 이벤트 흐름과 관련된 모든 요소
  // 토폴로지가 이들만 필터링하여 활성화
  involvedServices: Set<string>   // e.g., {"ecommerce-service", "payment-service"}
  involvedTopics: Set<string>     // e.g., {"ecommerce-events"}

  // 트레이스 내 이벤트 흐름
  // 배열의 index가 곧 발생 순서
  // 마지막 이벤트가 실패, 그 전까지는 성공
  traceEventIds: string[]         // e.g., ["event-pub-ecommerce-...", "event-con-payment-...", "event-con-cash-gateway-..."]

  // 선택사항: 실패 이유
  failedReason?: string           // e.g., "Stock validation failed"
}
