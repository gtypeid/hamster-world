package com.hamsterworld.cashgateway.external.paymentgateway.dto

import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayProvider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.CancelPaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentRequest

class PaymentCancelledRequestWithCtx(
    override val provider: PaymentGatewayProvider,
    override val paymentCtx: CancelPaymentCtx,
    override val paymentRequest: PaymentRequest
) : PaymentRequestWithCtx<CancelPaymentCtx>(provider, paymentCtx, paymentRequest)
