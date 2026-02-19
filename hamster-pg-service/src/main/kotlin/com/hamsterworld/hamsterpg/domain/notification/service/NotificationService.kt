package com.hamsterworld.hamsterpg.domain.notification.service

import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import com.hamsterworld.hamsterpg.domain.payment.repository.PaymentRepository
import com.hamsterworld.hamsterpg.domain.pgmid.service.PgMidService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import java.time.Duration

/**
 * Notification Service
 *
 * Payment 확정 결과를 Cash Gateway에 웹훅으로 전달한다.
 * - payment.midId로 MID를 조회하여 webhookUrl을 획득한다.
 * - 외부(Cash Gateway)의 응답과 무관하게 "발송했다"는 이력만 남긴다.
 * - 동기 처리 (스케줄러가 폴링하여 하나씩 처리하므로 @Async 불필요)
 */
@Service
class NotificationService(
    private val paymentRepository: PaymentRepository,
    private val pgMidService: PgMidService,
    private val webClient: WebClient
) {
    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * Payment 결과를 웹훅으로 발송
     *
     * payment.midId → MID 조회 → webhookUrl 획득 → 웹훅 발송
     */
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

    /**
     * 노티 재발송
     */
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
