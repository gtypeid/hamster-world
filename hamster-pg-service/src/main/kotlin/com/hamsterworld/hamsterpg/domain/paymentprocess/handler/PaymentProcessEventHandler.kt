package com.hamsterworld.hamsterpg.domain.paymentprocess.handler

import com.hamsterworld.hamsterpg.domain.notification.service.NotificationService
import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import com.hamsterworld.hamsterpg.domain.payment.repository.PaymentRepository
import com.hamsterworld.hamsterpg.domain.paymentprocess.event.InternalPaymentProcessFailedEvent
import com.hamsterworld.hamsterpg.domain.paymentprocess.event.InternalPaymentProcessSucceededEvent
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

@Component
class PaymentProcessEventHandler(
    private val paymentRepository: PaymentRepository,
    private val notificationService: NotificationService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @EventListener
    fun handleSucceeded(event: InternalPaymentProcessSucceededEvent) {
        val process = event.process
        log.info("[거래 승인] tid={}, approvalNo={}, amount={}",
            process.tid, process.approvalNo, process.amount)

        val payment = Payment.fromSuccessProcess(process)
        val saved = paymentRepository.save(payment)

        notificationService.sendNotification(saved)
    }

    @EventListener
    fun handleFailed(event: InternalPaymentProcessFailedEvent) {
        val process = event.process
        log.info("[거래 실패] tid={}, reason={}, amount={}",
            process.tid, event.reason, process.amount)

        val payment = Payment.fromFailedProcess(process)
        val saved = paymentRepository.save(payment)

        notificationService.sendNotification(saved)
    }
}
