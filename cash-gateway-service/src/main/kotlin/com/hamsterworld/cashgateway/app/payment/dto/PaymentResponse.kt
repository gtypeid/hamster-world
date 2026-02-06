package com.hamsterworld.cashgateway.app.payment.dto

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import com.hamsterworld.cashgateway.domain.payment.model.Payment
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import java.math.BigDecimal

/**
 * Payment Response DTO
 *
 * 외부 결제 등록 응답
 */
data class PaymentResponse(
    val paymentPublicId: String,  // Payment의 Public ID (Snowflake Base62)
    val attemptPublicId: String,  // PaymentAttempt의 Public ID (Snowflake Base62)
    val orderPublicId: String?,  // E-commerce Service의 Order Public ID (Snowflake Base62)
    val userPublicId: String?,   // E-commerce Service의 User Public ID (Snowflake Base62)
    val provider: Provider,
    val mid: String,
    val amount: BigDecimal,
    val pgTransaction: String,
    val pgApprovalNo: String,
    val gatewayReferenceId: String,
    val status: PaymentStatus,
    val originPaymentPublicId: String?,  // 취소건의 경우 원본 Payment의 Public ID (Snowflake Base62)
    val originSource: String
) {
    companion object {
        fun from(
            payment: Payment,
            attemptPublicId: String,
            originPaymentPublicId: String?
        ): PaymentResponse {
            return PaymentResponse(
                paymentPublicId = payment.publicId,
                attemptPublicId = attemptPublicId,
                orderPublicId = payment.orderPublicId,
                userPublicId = payment.userPublicId,
                provider = payment.provider,
                mid = payment.mid,
                amount = payment.amount,
                pgTransaction = payment.pgTransaction,
                pgApprovalNo = payment.pgApprovalNo,
                gatewayReferenceId = payment.gatewayReferenceId,
                status = payment.status,
                originPaymentPublicId = originPaymentPublicId,
                originSource = payment.originSource
            )
        }
    }
}
