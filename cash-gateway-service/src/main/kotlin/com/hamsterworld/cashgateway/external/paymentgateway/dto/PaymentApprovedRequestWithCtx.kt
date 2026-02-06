package com.hamsterworld.cashgateway.external.paymentgateway.dto

import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayProvider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentRequest

class PaymentApprovedRequestWithCtx(
    override val provider: PaymentGatewayProvider,
    override val paymentCtx: ApprovePaymentCtx,
    override val paymentRequest: PaymentRequest
) : PaymentRequestWithCtx<ApprovePaymentCtx>(provider, paymentCtx, paymentRequest)
