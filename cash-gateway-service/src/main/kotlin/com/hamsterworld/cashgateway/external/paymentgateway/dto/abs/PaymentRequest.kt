package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

interface PaymentRequest {
    fun getMid(): String

    fun getAmount(): BigDecimal

    fun getRequestType(): PaymentStatus
}
