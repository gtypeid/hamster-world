package com.hamsterworld.hamsterpg.domain.paymentprocess.event

import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess

data class InternalPaymentProcessFailedEvent(
    val process: PaymentProcess,
    val reason: String
)
