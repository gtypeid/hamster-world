package com.hamsterworld.payment.domain.payment.event

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.payment.domain.payment.constant.PaymentStatus
import com.hamsterworld.payment.web.event.PaymentDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 결제 취소 확정 완료 이벤트
 *
 * Payment Service → Ecommerce Service (Kafka)
 *
 * ## 발생 시점
 * - PaymentCancelledEvent 수신 후 Payment (CANCELLED) 생성 완료 시
 * - Payment + 재고 복원이 같은 트랜잭션으로 확정됨
 * - **취소 확정의 Business Truth**
 *
 * ## Ecommerce Service에서 수신하여:
 * - Order 상태를 CANCELED로 변경
 *
 * ## 설계 철학
 * - Cash Gateway: Communication Truth (PG 취소 통신)
 * - Payment Service: Business Truth (취소 거래 확정 + 재고 복원)
 * - Ecommerce는 Payment Service의 확정만 신뢰
 */
data class PaymentCancelConfirmedEvent(
    val paymentPublicId: String,     // Payment Service Payment Public ID (취소 Payment)
    val orderPublicId: String,       // Ecommerce Order Public ID
    val amount: BigDecimal,          // 취소 금액
    val originPaymentPublicId: String,  // 원본 Payment Public ID
    val status: PaymentStatus,       // CANCELLED
    // DomainEvent 메타데이터 (OpenTelemetry trace context)
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : PaymentDomainEvent(
    aggregateId = orderPublicId,  // Order Public ID를 aggregateId로 사용
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)
