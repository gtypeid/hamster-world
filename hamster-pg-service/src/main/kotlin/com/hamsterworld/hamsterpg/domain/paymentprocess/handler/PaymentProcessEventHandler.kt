package com.hamsterworld.hamsterpg.domain.paymentprocess.handler

import com.hamsterworld.hamsterpg.domain.notification.service.NotificationService
import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import com.hamsterworld.hamsterpg.domain.payment.repository.PaymentRepository
import com.hamsterworld.hamsterpg.domain.paymentprocess.event.InternalPaymentProcessFailedEvent
import com.hamsterworld.hamsterpg.domain.paymentprocess.event.InternalPaymentProcessSucceededEvent
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

/**
 * PaymentProcess 내부 이벤트 핸들러
 *
 * CAS를 통해 확정된 PaymentProcess 결과를 받아:
 * 1. Payment 생성 (유의미한 거래 결과 기록)
 * 2. Notification 발송 (Cash Gateway에 결과 전달)
 */
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
