package com.hamsterworld.cashgateway.external.paymentgateway.abs

import com.hamsterworld.cashgateway.domain.payment.model.Payment
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.CancelPaymentCtx
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class PaymentGatewayClient(
    private val registry: PaymentGatewayClientRegistry
) {
    private val log = LoggerFactory.getLogger(PaymentGatewayClient::class.java)

    fun <T : PaymentGatewayClientProtocol> bind(clientClass: Class<T>): PaymentGatewayClientProtocol {
        val delegate = registry.getClient(clientClass)
        return PaymentGatewayClientRunner(delegate)
    }

    /**
     * Provider로 Client 바인딩
     *
     * Registry에서 해당 Provider를 가진 Client를 조회하여 반환
     */
    fun bind(provider: Provider): PaymentGatewayClientProtocol {
        val delegate = registry.getClientByProvider(provider)
        return PaymentGatewayClientRunner(delegate)
    }

    // inner class
    private class PaymentGatewayClientRunner(
        private val delegate: PaymentGatewayClientProtocol
    ) : PaymentGatewayClientProtocol {

        override fun payment(paymentCtx: ApprovePaymentCtx): Payment? {
            return delegate.payment(paymentCtx)
        }

        override fun cancel(paymentCtx: CancelPaymentCtx): Payment {
            return delegate.cancel(paymentCtx)
        }

        override fun handleWebhook(rawPayload: String): Payment? {
            return delegate.handleWebhook(rawPayload)
        }

        override fun getProvider(): Provider {
            return delegate.getProvider()
        }
    }
}
