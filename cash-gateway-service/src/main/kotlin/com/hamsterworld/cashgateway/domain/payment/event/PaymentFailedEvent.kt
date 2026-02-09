package com.hamsterworld.cashgateway.domain.payment.event

import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.cashgateway.web.event.CashGatewayDomainEvent
import com.hamsterworld.common.tracing.TraceContextHolder
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 결제 실패 이벤트
 *
 * **발행 시점**: PaymentProcess FAILED 처리 완료 (CoreService에서 직접 발행)
 *
 * **특징**: Payment 엔티티 없음 (실패는 PaymentProcess만 기록)
 *
 * **구독자**:
 * - ecommerce-service: Order 상태 → PAYMENT_FAILED
 */
data class PaymentFailedEvent(
    val processPublicId: String,    // PaymentProcess의 Public ID (Snowflake Base62)
    val orderPublicId: String?,     // Order의 Public ID (Snowflake Base62)
    val userPublicId: String?,      // User의 Public ID (Snowflake Base62)
    val provider: com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider?,
    val mid: String,
    val amount: BigDecimal,
    val orderNumber: String?,
    val code: String?,
    val message: String?,
    val reason: String?,
    val originSource: String,
    // DomainEvent 메타데이터 (OpenTelemetry trace context)
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : CashGatewayDomainEvent(
    aggregateId = orderPublicId ?: processPublicId,  // orderPublicId가 있으면 사용, 없으면 processPublicId
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
) {
    companion object {
        fun from(process: PaymentProcess, reason: String?, userPublicId: String?): PaymentFailedEvent {
            return PaymentFailedEvent(
                processPublicId = process.publicId,
                orderPublicId = process.orderPublicId,
                userPublicId = userPublicId,
                provider = process.provider,
                mid = process.mid,
                amount = process.amount,
                orderNumber = process.orderNumber,
                code = process.code,
                message = process.message,
                reason = reason,
                originSource = process.originSource ?: "UNKNOWN"  // nullable 처리
            )
        }
    }
}
