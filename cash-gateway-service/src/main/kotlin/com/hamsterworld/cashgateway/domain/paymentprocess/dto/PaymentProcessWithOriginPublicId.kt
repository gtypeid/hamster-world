package com.hamsterworld.cashgateway.domain.paymentprocess.dto

import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess

data class PaymentProcessWithOriginPublicId(
    val process: PaymentProcess,
    val originProcessPublicId: String?
)
