package com.hamsterworld.hamsterpg.domain.payment.event

import com.hamsterworld.hamsterpg.domain.payment.model.Payment

data class PaymentCompletedEvent(
    val payment: Payment
)
