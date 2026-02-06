package com.hamsterworld.hamsterpg.domain.payment.scheduler

import com.hamsterworld.hamsterpg.domain.payment.service.PaymentSchedulerService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class PaymentScheduler(
    private val schedulerService: PaymentSchedulerService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Scheduled(fixedDelay = 1000)
    fun processPending() {
        try {
            schedulerService.processPendingTransactions()
        } catch (e: Exception) {
            log.error("Scheduler error: processPending", e)
        }
    }
}
