package com.hamsterworld.hamsterpg.domain.paymentprocess.scheduler

import com.hamsterworld.hamsterpg.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.hamsterpg.domain.paymentprocess.repository.PaymentProcessRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import kotlin.random.Random

@Service
@ConditionalOnProperty(
    prefix = "payment.process.polling",
    name = ["enabled"],
    havingValue = "true",
    matchIfMissing = true
)
class PaymentProcessPollingScheduler(
    private val paymentProcessRepository: PaymentProcessRepository,
    private val eventPublisher: ApplicationEventPublisher
) {

    companion object {
        private val log = LoggerFactory.getLogger(PaymentProcessPollingScheduler::class.java)
        private const val BATCH_SIZE = 10
        private const val SUCCESS_RATE = 80
        private val FAIL_REASONS = listOf(
            "INSUFFICIENT_BALANCE",
            "INVALID_CARD",
            "EXPIRED_CARD",
            "LIMIT_EXCEEDED",
            "STOLEN_CARD"
        )
    }

    @Scheduled(fixedDelay = 2000, initialDelay = 5000)
    @Transactional
    fun pollAndProcess() {
        val pendingProcesses = paymentProcessRepository
            .findByStatusWithLimit(PaymentProcessStatus.PENDING, PageRequest.of(0, BATCH_SIZE))

        if (pendingProcesses.isEmpty()) return

        log.info("[폴링] PENDING {} 건 처리 시작", pendingProcesses.size)

        pendingProcesses.forEach { process ->
            try {
                processPayment(process)
            } catch (e: Exception) {
                log.error("[폴링] 처리 실패 - tid: {}, error: {}", process.tid, e.message)
            }
        }
    }

    private fun processPayment(process: PaymentProcess) {
        val claimResult = paymentProcessRepository.casUpdateToProcessing(
            id = process.id!!,
            expectedStatus = PaymentProcessStatus.PENDING,
            newStatus = PaymentProcessStatus.PROCESSING,
            processingStartedAt = LocalDateTime.now()
        )

        if (claimResult == 0) {
            log.debug("[CAS] 이미 처리 중 - processId: {}", process.id)
            return
        }

        val isSuccess = Random.nextInt(100) < SUCCESS_RATE

        if (isSuccess) {
            handleSuccess(process)
        } else {
            handleFailure(process)
        }
    }

    private fun handleSuccess(process: PaymentProcess) {
        val approvalNo = "AP${System.currentTimeMillis()}"

        val updated = paymentProcessRepository.casUpdateToFinal(
            id = process.id!!,
            expectedStatus = PaymentProcessStatus.PROCESSING,
            newStatus = PaymentProcessStatus.SUCCESS,
            approvalNo = approvalNo,
            failReason = null,
            processedAt = LocalDateTime.now()
        )

        if (updated == 0) {
            log.debug("[CAS] PROCESSING → SUCCESS 실패 (이미 처리됨) - processId: {}", process.id)
            return
        }

        process.registerSuccessEvent(approvalNo)
        publishEvents(process)
    }

    private fun handleFailure(process: PaymentProcess) {
        val failReason = FAIL_REASONS.random()

        val updated = paymentProcessRepository.casUpdateToFinal(
            id = process.id!!,
            expectedStatus = PaymentProcessStatus.PROCESSING,
            newStatus = PaymentProcessStatus.FAILED,
            approvalNo = null,
            failReason = failReason,
            processedAt = LocalDateTime.now()
        )

        if (updated == 0) {
            log.debug("[CAS] PROCESSING → FAILED 실패 (이미 처리됨) - processId: {}", process.id)
            return
        }

        process.registerFailedEvent(failReason)
        publishEvents(process)
    }

    private fun publishEvents(process: PaymentProcess) {
        process.pullDomainEvents().forEach { event ->
            eventPublisher.publishEvent(event)
        }
    }
}
