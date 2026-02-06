package com.hamsterworld.cashgateway.domain.payment.event

import com.hamsterworld.cashgateway.web.event.CashGatewayDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 결제 취소 완료 이벤트
 *
 * **발행 시점**: PaymentProcess CANCELLED → 취소 Payment 생성 완료 (Payment.onCancel())
 *
 * **구독자**:
 * - ecommerce-service: Order 상태 → CANCELED
 * - payment-service: 재고 복원
 *
 * **필드 정책**:
 * - orderPublicId: nullable (외부 거래는 NULL) - Order의 Public ID (Snowflake Base62)
 * - userPublicId: nullable (외부 거래는 NULL) - User의 Public ID (Snowflake Base62)
 * - provider: String으로 전달 (외부 거래는 null → "EXTERNAL")
 * - pgTransaction, pgApprovalNo, orderNumber: NOT NULL (Payment 생성 = PG 응답 받음)
 */
data class PaymentCancelledEvent(
    val paymentPublicId: String,       // 취소 Payment의 Public ID (Snowflake Base62)
    val originPaymentPublicId: String, // 원본 Payment의 Public ID (Snowflake Base62)
    val orderPublicId: String?,        // nullable (외부 거래) - Order의 Public ID (Snowflake Base62)
    val userPublicId: String?,         // nullable (외부 거래) - User의 Public ID (Snowflake Base62)
    val provider: String,       // Provider.name
    val mid: String,
    val amount: BigDecimal,
    val pgTransaction: String,       // NOT NULL (취소도 PG 응답 받음)
    val pgApprovalNo: String,        // NOT NULL (원본 승인번호)
    val gatewayPaymentPublicId: String,  // NOT NULL (Cash Gateway Payment Public ID)
    val originSource: String,
    // DomainEvent 메타데이터
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = null,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : CashGatewayDomainEvent(
    aggregateId = orderPublicId ?: paymentPublicId,  // orderPublicId가 있으면 사용, 없으면 paymentPublicId
    eventId = eventId,
    traceId = traceId,
    occurredAt = occurredAt
) {
    companion object {
        /**
         * PaymentProcess로부터 PaymentCancelledEvent 생성
         *
         * ## 변경 사항
         * - Payment 엔티티 제거로 인해 PaymentProcess에서 직접 이벤트 생성
         * - paymentPublicId: 취소 PaymentProcess.publicId 사용
         * - gatewayPaymentPublicId: 취소 PaymentProcess.publicId 사용
         * - originPaymentPublicId: 원본 PaymentProcess.publicId 사용
         *
         * @param cancelProcess 취소 PaymentProcess (CANCELLED 상태)
         * @param originProcess 원본 PaymentProcess (SUCCESS 상태)
         * @return PaymentCancelledEvent
         */
        fun from(
            cancelProcess: com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess,
            originProcess: com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
        ): PaymentCancelledEvent {
            return PaymentCancelledEvent(
                paymentPublicId = cancelProcess.publicId,  // 취소 PaymentProcess의 Public ID
                originPaymentPublicId = originProcess.publicId,  // 원본 PaymentProcess의 Public ID
                orderPublicId = cancelProcess.orderPublicId,
                userPublicId = cancelProcess.userPublicId,
                provider = cancelProcess.provider?.name ?: "UNKNOWN",
                mid = cancelProcess.mid,
                amount = cancelProcess.amount,
                pgTransaction = cancelProcess.pgTransaction!!,  // NOT NULL
                pgApprovalNo = originProcess.pgApprovalNo!!,  // 원본 승인번호 사용
                gatewayPaymentPublicId = cancelProcess.publicId,  // 취소 PaymentProcess의 Public ID
                originSource = cancelProcess.originSource ?: "INTERNAL"
            )
        }
    }
}
