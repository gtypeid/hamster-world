package com.hamsterworld.cashgateway.external.paymentgateway.dto

import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayProvider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentResponse

data class PaymentResponseWithCtx(
    val provider: PaymentGatewayProvider,
    val paymentCtx: PaymentCtx,
    val paymentResponse: PaymentResponse
)
