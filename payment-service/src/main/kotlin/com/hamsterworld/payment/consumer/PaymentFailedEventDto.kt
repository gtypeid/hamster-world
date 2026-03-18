package com.hamsterworld.payment.consumer

import java.math.BigDecimal

data class PaymentFailedEventDto(
    val processPublicId: String,
    val orderPublicId: String?,
    val userKeycloakId: String?,
    val provider: String?,
    val cashGatewayMid: String,
    val amount: BigDecimal,
    val orderNumber: String?,
    val code: String?,
    val message: String?,
    val reason: String?,
    val originSource: String
)
