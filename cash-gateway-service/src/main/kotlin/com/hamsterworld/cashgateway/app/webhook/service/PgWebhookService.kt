package com.hamsterworld.cashgateway.app.webhook.service

import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayClient
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class PgWebhookService(
    private val paymentGatewayClient: PaymentGatewayClient
) {
    private val log = LoggerFactory.getLogger(PgWebhookService::class.java)

    @Transactional(propagation = Propagation.MANDATORY)
    fun handleWebhook(provider: Provider, rawPayload: String) {
        log.info("[Webhook 수신] provider={}", provider)

        try {
            paymentGatewayClient.bind(provider).handleWebhook(rawPayload)
        } catch (e: Exception) {
            log.error("[Webhook 처리 실패] provider={}, error={}", provider, e.message, e)
            throw CustomRuntimeException("Webhook 처리 실패: ${e.message}", e)
        }
    }
}
