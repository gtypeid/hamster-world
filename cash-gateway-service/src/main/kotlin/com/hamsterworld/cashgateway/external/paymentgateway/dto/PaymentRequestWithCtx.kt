package com.hamsterworld.cashgateway.external.paymentgateway.dto

import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayProvider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentRequest

abstract class PaymentRequestWithCtx<T : PaymentCtx>(
    open val provider: PaymentGatewayProvider,
    open val paymentCtx: T,
    open val paymentRequest: PaymentRequest
)
