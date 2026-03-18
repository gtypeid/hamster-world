package com.hamsterworld.payment.domain.payment.dto

import com.hamsterworld.payment.domain.payment.model.Payment

data class PaymentWithOriginPublicId(
    val payment: Payment,
    val originPaymentPublicId: String?
)
