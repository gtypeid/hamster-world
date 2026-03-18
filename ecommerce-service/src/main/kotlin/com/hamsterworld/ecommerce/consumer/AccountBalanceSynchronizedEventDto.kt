package com.hamsterworld.ecommerce.consumer
import java.math.BigDecimal
data class AccountBalanceSynchronizedEventDto(
    val accountPublicId: String,
    val userPublicId: String,
    val accountType: String,
    val balance: BigDecimal,
    val reason: String
)
