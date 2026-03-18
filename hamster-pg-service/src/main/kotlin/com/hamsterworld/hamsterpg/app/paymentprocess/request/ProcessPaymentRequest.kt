package com.hamsterworld.hamsterpg.app.paymentprocess.request

import java.math.BigDecimal

data class ProcessPaymentRequest(
    val midId: String,
    val userId: String?,
    val orderId: String,
    val amount: BigDecimal,
    val echo: Map<String, Any?> = emptyMap()
)
