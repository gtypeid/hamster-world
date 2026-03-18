package com.hamsterworld.hamsterpg.domain.notification.service

import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import com.hamsterworld.hamsterpg.domain.payment.repository.PaymentRepository
import com.hamsterworld.hamsterpg.domain.pgmid.service.PgMidService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import java.time.Duration

@Service
class NotificationService(
    private val paymentRepository: PaymentRepository,
    private val pgMidService: PgMidService,
    private val webClient: WebClient
) {
    private val log = LoggerFactory.getLogger(javaClass)

    fun sendNotification(payment: Payment) {
        val pgMid = pgMidService.getMid(payment.midId)
        val webhookUrl = pgMid.webhookUrl

        log.info("[노티 발송] tid={}, status={}, midId={}, webhookUrl={}",
            payment.tid, payment.status, payment.midId, webhookUrl)

        try {
            val payload = buildPayload(payment)

            webClient.post()
                .uri(webhookUrl)
                .bodyValue(payload)
                .retrieve()
                .toBodilessEntity()
                .timeout(Duration.ofSeconds(5))
                .block()

            payment.markNotificationSent()
            paymentRepository.save(payment)

            log.info("[노티 발송 완료] tid={}", payment.tid)
        } catch (e: Exception) {
            log.warn("[노티 발송 실패] tid={}, error={}", payment.tid, e.message)

            payment.markNotificationFailed(e.message ?: "Unknown error")
            paymentRepository.save(payment)
        }
    }

    fun resendNotification(payment: Payment) {
        log.info("[노티 재발송] tid={}, attemptCount={}",
            payment.tid, payment.notificationAttemptCount)

        sendNotification(payment)
    }

    private fun buildPayload(payment: Payment): Map<String, Any?> {
        return mapOf(
            "tid" to payment.tid,
            "midId" to payment.midId,
            "userId" to payment.userId,
            "orderId" to payment.orderId,
            "amount" to payment.amount,
            "status" to payment.status.name,
            "approvalNo" to payment.approvalNo,
            "failureReason" to payment.failureReason,
            "echo" to payment.echo
        )
    }
}
