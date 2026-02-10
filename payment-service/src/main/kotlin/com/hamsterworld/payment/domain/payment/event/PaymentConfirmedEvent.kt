package com.hamsterworld.payment.domain.payment.event

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.payment.domain.payment.constant.PaymentStatus
import com.hamsterworld.payment.web.event.PaymentDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.UUID

/**
 * 결제 확정 완료 이벤트 (Business Truth 확정)
 *
 * Payment Service → Ecommerce Service (Kafka)
 *
 * ## 발생 시점
 * - PaymentApprovedEvent 수신 후 Payment 생성 완료 시
 * - Payment + OrderSnapshot이 같은 트랜잭션으로 확정됨
 * - **Business Truth의 Source of Truth가 확정된 시점**
 *
 * ## Ecommerce Service에서 수신하여:
 * - Order 상태를 PAID로 변경
 *
 * ## 설계 철학
 * - Cash Gateway: Communication Truth (PG와 주고받은 메시지의 진실)
 * - Payment Service: Business Truth (우리 시스템이 확정한 거래의 진실)
 * - Ecommerce는 Payment Service의 확정만 신뢰
 */
data class PaymentConfirmedEvent(
    val paymentPublicId: String,           // Payment Service Payment Public ID
    val orderPublicId: String,             // Ecommerce Order Public ID
    val amount: BigDecimal,                // 결제 금액
    val status: PaymentStatus,             // APPROVED
    val gatewayPaymentPublicId: String,    // Cash Gateway Payment Public ID (Communication Truth)
    // DomainEvent 메타데이터 (OpenTelemetry trace context)
    override val eventId: String = UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : PaymentDomainEvent(
    aggregateId = orderPublicId,
    aggregateType = "Order",
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)
