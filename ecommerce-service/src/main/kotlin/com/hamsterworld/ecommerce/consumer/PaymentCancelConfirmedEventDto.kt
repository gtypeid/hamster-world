package com.hamsterworld.ecommerce.consumer
import java.math.BigDecimal
data class PaymentCancelConfirmedEventDto(
    val paymentPublicId: String,
    val orderPublicId: String,
    val amount: BigDecimal,
    val originPaymentPublicId: String,
    val status: String
)
