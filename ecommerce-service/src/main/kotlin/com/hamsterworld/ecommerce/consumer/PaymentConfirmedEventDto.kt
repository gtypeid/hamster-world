package com.hamsterworld.ecommerce.consumer
import java.math.BigDecimal
data class PaymentConfirmedEventDto(
    val paymentPublicId: String,
    val orderPublicId: String,
    val amount: BigDecimal,
    val status: String,
    val gatewayPaymentPublicId: String
)
