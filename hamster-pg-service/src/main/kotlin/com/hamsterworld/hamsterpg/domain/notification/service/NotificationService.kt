package com.hamsterworld.hamsterpg.domain.notification.service

import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import com.hamsterworld.hamsterpg.domain.payment.repository.PaymentRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import java.time.Duration

@Service
class NotificationService(
    private val repository: PaymentRepository,
    private val webClient: WebClient
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Async
    fun sendWebhookAsync(payment: Payment) {
        log.info("Sending webhook asynchronously: ${payment.id} to ${payment.callbackUrl}")

        try {
            val payload = mapOf(
                "tid" to payment.tid,
                "orderId" to payment.orderPublicId,
                "amount" to payment.amount,
                "status" to payment.status.name,
                "approvalNo" to payment.approvalNo,
                "failureReason" to payment.failureReason,
                "echo" to payment.echo
            )

            webClient.post()
                .uri(payment.callbackUrl)
                .bodyValue(payload)
                .retrieve()
                .toBodilessEntity()
                .timeout(Duration.ofSeconds(5))
                .block()

            val updated = payment.markNotificationSent(null)
            repository.save(updated)

            log.info("Webhook sent successfully: ${payment.id}")
        } catch (e: Exception) {
            log.error("Failed to send webhook: ${payment.id}", e)

            val updated = payment.markNotificationSent(e.message)
            repository.save(updated)
        }
    }
}
