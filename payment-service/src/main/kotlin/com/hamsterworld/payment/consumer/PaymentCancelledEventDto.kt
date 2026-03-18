package com.hamsterworld.payment.consumer

import java.math.BigDecimal

data class PaymentCancelledEventDto(
    val paymentPublicId: String,
    val originPaymentPublicId: String,
    val orderPublicId: String?,
    val userKeycloakId: String?,
    val provider: String,
    val cashGatewayMid: String,
    val amount: BigDecimal,
    val pgTransaction: String,
    val pgApprovalNo: String,
    val gatewayPaymentPublicId: String,
    val originSource: String
)
