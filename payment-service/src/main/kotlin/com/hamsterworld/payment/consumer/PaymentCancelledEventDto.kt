package com.hamsterworld.payment.consumer

import java.math.BigDecimal

/**
 * PaymentCancelledEvent DTO
 *
 * Cash Gateway에서 발행하는 결제 취소 이벤트
 */
data class PaymentCancelledEventDto(
    val paymentPublicId: String,
    val originPaymentPublicId: String,
    val orderPublicId: String?,  // nullable (외부 거래) - Order의 Public ID (Snowflake Base62)
    val userPublicId: String?,
    val provider: String,
    val mid: String,
    val amount: BigDecimal,
    val pgTransaction: String,
    val pgApprovalNo: String,
    val gatewayPaymentPublicId: String,  // Cash Gateway Payment Public ID
    val originSource: String
)
