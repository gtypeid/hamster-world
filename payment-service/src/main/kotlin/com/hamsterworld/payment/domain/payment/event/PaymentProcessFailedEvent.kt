package com.hamsterworld.payment.domain.payment.event

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.payment.web.event.PaymentDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 결제 처리 실패 이벤트
 *
 * Payment Service → Ecommerce Service (Kafka)
 *
 * ## 발생 시점
 * - PaymentFailedEvent 수신 후 (Cash Gateway로부터)
 * - Payment는 생성하지 않음 (실패는 불변 기록 안 함)
 * - **실패 사실을 Ecommerce에 전달하는 용도**
 *
 * ## Ecommerce Service에서 수신하여:
 * - Order 상태를 PAYMENT_FAILED로 변경
 *
 * ## 설계 철학
 * - Cash Gateway: Communication Truth (PG 통신 실패)
 * - Payment Service: 실패 확정 및 전파 (Business Layer 책임)
 * - Ecommerce는 Payment Service의 확정만 신뢰
 */
data class PaymentProcessFailedEvent(
    val processPublicId: String,    // PaymentProcess Public ID
    val orderPublicId: String,      // Ecommerce Order Public ID
    val amount: BigDecimal,         // 결제 시도 금액
    val reason: String?,            // 실패 사유
    val code: String?,              // 실패 코드
    val message: String?,           // 실패 메시지
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
