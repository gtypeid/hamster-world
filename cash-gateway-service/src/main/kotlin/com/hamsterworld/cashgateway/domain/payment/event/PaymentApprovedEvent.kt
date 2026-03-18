package com.hamsterworld.cashgateway.domain.payment.event

import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.cashgateway.web.event.CashGatewayDomainEvent
import com.hamsterworld.common.tracing.TraceContextHolder
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 결제 승인 완료 이벤트
 *
 * **발행 시점**: PaymentProcess SUCCESS → Payment 생성 완료 (Payment.onCreate())
 *
 * **구독자**:
 * - ecommerce-service: Order 상태 → PAYMENT_APPROVED
 * - payment-service: 재고 차감
 *
 * **필드 정책**:
 * - orderPublicId: nullable (외부 거래는 NULL) - Order의 Public ID (Snowflake Base62)
 * - userKeycloakId: NOT NULL - User의 Keycloak Subject ID (Cash Gateway 필수)
 * - provider: String으로 전달 (외부 거래는 null → "EXTERNAL")
 * - pgTransaction, pgApprovalNo, orderNumber: NOT NULL (Payment 생성 = PG 응답 받음)
 */
data class PaymentApprovedEvent(
    val paymentPublicId: String,  // Payment의 Public ID (Snowflake Base62)
    val orderPublicId: String?,   // nullable (외부 거래) - Order의 Public ID (Snowflake Base62)
    val userKeycloakId: String,   // User의 Keycloak Subject ID (Cash Gateway 필수)
    val provider: String,         // Provider.name
    val cashGatewayMid: String,  // Cash Gateway MID (≠ PG MID)
    val amount: BigDecimal,
    val pgTransaction: String,       // NOT NULL (Payment 생성 = PG 응답 받음)
    val pgApprovalNo: String,        // NOT NULL
    val gatewayPaymentPublicId: String,  // NOT NULL (Cash Gateway Payment Public ID)
    val originSource: String,
    // DomainEvent 메타데이터 (OpenTelemetry trace context)
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : CashGatewayDomainEvent(
    aggregateId = orderPublicId ?: paymentPublicId,
    // 내부 거래(주문 기반): Order / 외부 거래(독립 결제): PaymentProcess — CashGatewayDomainEvent KDoc 참고
    aggregateType = if (orderPublicId != null) "Order" else "PaymentProcess",
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
) {
    companion object {
        /**
         * PaymentProcess로부터 PaymentApprovedEvent 생성
         *
         * ## 변경 사항
         * - Payment 엔티티 제거로 인해 PaymentProcess에서 직접 이벤트 생성
         * - paymentPublicId: PaymentProcess.publicId 사용
         * - gatewayPaymentPublicId: PaymentProcess.publicId 사용
         *
         * @param process PaymentProcess (SUCCESS 상태)
         * @return PaymentApprovedEvent
         */
        fun from(process: PaymentProcess): PaymentApprovedEvent {
            return PaymentApprovedEvent(
                paymentPublicId = process.publicId,  // PaymentProcess의 Public ID 사용
                orderPublicId = process.orderPublicId,
                userKeycloakId = process.userKeycloakId,
                provider = process.provider?.name ?: "UNKNOWN",
                cashGatewayMid = process.cashGatewayMid,
                amount = process.amount,
                pgTransaction = process.pgTransaction!!,  // NOT NULL (SUCCESS 시점엔 항상 있음)
                pgApprovalNo = process.pgApprovalNo!!,    // NOT NULL (SUCCESS 시점엔 항상 있음)
                gatewayPaymentPublicId = process.publicId,  // PaymentProcess의 Public ID 사용
                originSource = process.originSource ?: "INTERNAL"
            )
        }
    }
}
