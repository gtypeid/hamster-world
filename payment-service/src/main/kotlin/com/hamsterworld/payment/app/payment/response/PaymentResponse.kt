package com.hamsterworld.payment.app.payment.response

import com.hamsterworld.payment.domain.payment.constant.PaymentStatus
import com.hamsterworld.payment.domain.payment.model.Payment
import java.math.BigDecimal
import java.time.LocalDateTime

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
    val originPaymentPublicId: String?,
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
