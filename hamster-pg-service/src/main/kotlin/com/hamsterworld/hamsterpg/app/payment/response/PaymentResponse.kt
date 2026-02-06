package com.hamsterworld.hamsterpg.app.payment.response

import java.math.BigDecimal

data class PaymentResponse(
    val tid: String,
    val orderPublicId: String,
    val amount: BigDecimal,
    val status: String
)
