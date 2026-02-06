package com.hamsterworld.hamsterpg.domain.payment.handler

import com.hamsterworld.hamsterpg.domain.notification.service.NotificationService
import com.hamsterworld.hamsterpg.domain.payment.event.CancelRequestedEvent
import com.hamsterworld.hamsterpg.domain.payment.event.NotificationSentEvent
import com.hamsterworld.hamsterpg.domain.payment.event.PaymentCancelledEvent
import com.hamsterworld.hamsterpg.domain.payment.event.PaymentCompletedEvent
import com.hamsterworld.hamsterpg.domain.payment.event.PaymentFailedEvent
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class PaymentEventHandler(
    private val notificationService: NotificationService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handleTransactionCompleted(event: PaymentCompletedEvent) {
        log.info("Transaction completed event received: tid=${event.payment.tid}, approvalNo=${event.payment.approvalNo}")
        // Scheduler가 webhook을 처리하므로 여기서는 로깅만
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handleTransactionFailed(event: PaymentFailedEvent) {
        log.info("Transaction failed event received: tid=${event.payment.tid}, reason=${event.reason}")
        // Scheduler가 webhook을 처리하므로 여기서는 로깅만
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handleCancelRequested(event: CancelRequestedEvent) {
        log.info("Cancel requested event received: tid=${event.payment.tid}")
        // Scheduler가 실제 취소 처리를 하므로 여기서는 로깅만
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handleTransactionCancelled(event: PaymentCancelledEvent) {
        log.info("Transaction cancelled event received: tid=${event.payment.tid}")
        // Scheduler가 webhook을 처리하므로 여기서는 로깅만
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handleNotificationSent(event: NotificationSentEvent) {
        log.info("Notification sent event received: tid=${event.payment.tid}, status=${event.payment.notificationStatus}")
    }
}
