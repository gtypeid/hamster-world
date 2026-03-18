package com.hamsterworld.cashgateway.external.paymentgateway.abs

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.CancelPaymentCtx

interface PaymentGatewayClientProtocol {

    fun payment(paymentCtx: ApprovePaymentCtx)

    fun cancel(paymentCtx: CancelPaymentCtx)

    fun handleWebhook(rawPayload: String)

    fun getProvider(): Provider
}
