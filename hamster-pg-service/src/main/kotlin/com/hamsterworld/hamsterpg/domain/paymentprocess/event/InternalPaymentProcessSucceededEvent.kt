package com.hamsterworld.hamsterpg.domain.paymentprocess.event

import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess

data class InternalPaymentProcessSucceededEvent(
    val process: PaymentProcess
)
