package com.hamsterworld.ecommerce.consumer
import java.math.BigDecimal
data class PaymentProcessFailedEventDto(
    val processPublicId: String,
    val orderPublicId: String,
    val amount: BigDecimal,
    val reason: String?,
    val code: String?,
    val message: String?
)
