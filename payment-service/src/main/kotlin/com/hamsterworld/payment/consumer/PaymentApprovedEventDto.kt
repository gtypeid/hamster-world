package com.hamsterworld.payment.consumer

import java.math.BigDecimal

data class PaymentApprovedEventDto(
    val paymentPublicId: String,
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
