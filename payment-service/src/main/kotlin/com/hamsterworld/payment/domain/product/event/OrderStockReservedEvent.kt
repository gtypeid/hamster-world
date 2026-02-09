package com.hamsterworld.payment.domain.product.event

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.payment.web.event.PaymentDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 주문 재고 확보 완료 이벤트 (선차감 완료)
 *
 * Payment Service → E-commerce Service, Cash-Gateway Service (Kafka)
 *
 * ## 발생 시점
 * - OrderCreatedEvent 수신 후 재고 검증 + 차감 성공 시
 * - OrderSnapshot 생성 시 발행 (OrderSnapshot.createCompleted())
 * - **이미 재고가 차감된 상태** (선차감 전략)
 * - PG 승인 전에 재고를 먼저 차감하여 초과 판매 방지
 *
 * ## E-commerce Service에서 수신하여:
 * - Order 상태를 CONFIRMED로 변경
 *
 * ## Cash-Gateway Service에서 수신하여:
 * - PaymentAttempt 생성
 * - PG 결제 요청
 *
 * ## PG 실패 시:
 * - Cash-Gateway가 PaymentFailedEvent 발행
 * - Payment Service가 재고 복원 (OrderSnapshot 조회 → ProductRecord에 +수량 추가)
 */
data class OrderStockReservedEvent(
    val orderPublicId: String,        // E-commerce Service의 Order Public ID (Snowflake Base62)
    val userPublicId: String,         // User의 Public ID (Snowflake Base62)
    val orderNumber: String,          // 주문 번호
    val totalPrice: BigDecimal,       // 총 주문 금액
    val items: List<OrderItemDto>,    // 주문 항목 리스트
    // DomainEvent 메타데이터 (OpenTelemetry trace context)
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : PaymentDomainEvent(
    aggregateId = orderPublicId,  // Already a String (Public ID)
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)

/**
 * 주문 항목 DTO
 */
data class OrderItemDto(
    val productId: String,  // E-commerce Product의 Public ID (Snowflake Base62)
    val quantity: Int,
    val price: BigDecimal
)
