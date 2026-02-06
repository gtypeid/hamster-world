package com.hamsterworld.hamsterpg.domain.payment.service

import com.hamsterworld.hamsterpg.domain.notification.service.NotificationService
import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import com.hamsterworld.hamsterpg.domain.payment.repository.PaymentRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class PaymentSchedulerService(
    private val repository: PaymentRepository,
    private val notificationService: NotificationService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun processPendingTransactions() {
        val threshold = LocalDateTime.now().minusSeconds(1)

        // 1. 결제 PENDING 처리
        val pending = repository.findPendingTransactions(threshold)
        if (pending.isNotEmpty()) {
            log.info("Processing ${pending.size} pending payments")

            pending.forEach { payment ->
                try {
                    val processed = processTransaction(payment)
                    repository.save(processed)
                    notificationService.sendWebhookAsync(processed)
                } catch (e: Exception) {
                    log.error("Failed to process payment: ${payment.id}", e)
                }
            }
        }

        // 2. 취소 CANCEL_PENDING 처리
        val cancelPending = repository.findCancelPendingTransactions(threshold)
        if (cancelPending.isNotEmpty()) {
            log.info("Processing ${cancelPending.size} cancel pending payments")

            cancelPending.forEach { payment ->
                try {
                    val cancelled = payment.cancel()
                    repository.save(cancelled)
                    notificationService.sendWebhookAsync(cancelled)
                } catch (e: Exception) {
                    log.error("Failed to cancel payment: ${payment.id}", e)
                }
            }
        }
    }

    private fun processTransaction(payment: Payment): Payment {
        val isSuccess = kotlin.random.Random.nextInt(100) < 80

        return if (isSuccess) {
            payment.complete()
        } else {
            val reasons = listOf(
                "INSUFFICIENT_FUNDS",
                "CARD_DECLINED",
                "INVALID_CARD",
                "LIMIT_EXCEEDED"
            )
            payment.fail(reasons.random())
        }
    }
}
