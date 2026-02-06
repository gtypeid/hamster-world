package com.hamsterworld.hamsterpg.domain.payment.event

import com.hamsterworld.hamsterpg.domain.payment.model.Payment

data class PaymentFailedEvent(
    val payment: Payment,
    val reason: String
)
