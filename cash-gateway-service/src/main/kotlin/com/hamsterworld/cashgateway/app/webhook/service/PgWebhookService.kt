package com.hamsterworld.cashgateway.app.webhook.service

import com.hamsterworld.cashgateway.domain.payment.model.Payment
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

    /**
     * Webhook 처리 메인 로직
     *
     * **트랜잭션 전파 정책**:
     * - `MANDATORY`: 반드시 부모 트랜잭션 내에서 호출되어야 함
     * - 호출 경로: PgWebhookController.receiveWebhook(REQUIRES_NEW) → handleWebhook(MANDATORY)
     * - 목적: Webhook 처리 실패 시 전체 롤백 (PaymentAttempt, Payment 포함)
     *
     * PaymentGatewayClient를 통해 Provider별 Webhook 처리 위임
     * 실제 비즈니스 로직은 PaymentGatewayClientProtocolCore.handleWebhook()에 구현됨
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun handleWebhook(provider: Provider, rawPayload: String): Payment? {
        log.info("[Webhook 수신] provider={}", provider)

        return try {
            // Provider 바인딩하여 handleWebhook 호출
            // 실제 로직은 PaymentGatewayClientProtocolCore.handleWebhook()에 구현됨
            paymentGatewayClient.bind(provider).handleWebhook(rawPayload)
        } catch (e: Exception) {
            log.error("[Webhook 처리 실패] provider={}, error={}", provider, e.message, e)
            throw CustomRuntimeException("Webhook 처리 실패: ${e.message}", e)
        }
    }
}
