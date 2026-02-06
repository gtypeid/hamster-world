package com.hamsterworld.payment.app.payment.response

import com.hamsterworld.payment.domain.payment.constant.PaymentStatus
import com.hamsterworld.payment.domain.payment.model.Payment
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * Payment 응답 DTO (Public ID만 노출)
 *
 * List/Page API용 - Payment 기본 정보만 포함
 */
data class PaymentResponse(
    val paymentPublicId: String,
    val processPublicId: String,
    val gatewayPaymentPublicId: String,
    val gatewayMid: String,
    val orderPublicId: String,
    val amount: BigDecimal,
    val status: PaymentStatus,
    val pgTransaction: String?,
    val pgApprovalNo: String?,
    val originPaymentPublicId: String?,  // 원본 Payment Public ID (취소건인 경우)
    val createdAt: LocalDateTime,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(payment: Payment, originPaymentPublicId: String?): PaymentResponse {
            return PaymentResponse(
                paymentPublicId = payment.publicId,
                processPublicId = payment.processPublicId,
                gatewayPaymentPublicId = payment.gatewayPaymentPublicId,
                gatewayMid = payment.gatewayMid,
                orderPublicId = payment.orderPublicId,
                amount = payment.amount,
                status = payment.status,
                pgTransaction = payment.pgTransaction,
                pgApprovalNo = payment.pgApprovalNo,
                originPaymentPublicId = originPaymentPublicId,
                createdAt = payment.createdAt,
                modifiedAt = payment.modifiedAt
            )
        }
    }
}
