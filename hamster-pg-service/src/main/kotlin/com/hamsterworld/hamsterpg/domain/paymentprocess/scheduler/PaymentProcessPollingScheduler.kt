package com.hamsterworld.hamsterpg.domain.paymentprocess.scheduler

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.hamsterpg.app.paymentprocess.response.WebhookPaymentResponse
import com.hamsterworld.hamsterpg.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.hamsterpg.domain.paymentprocess.repository.PaymentProcessJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestTemplate
import java.time.LocalDateTime
import kotlin.random.Random

/**
 * PaymentProcess 폴링 스케줄러
 *
 * ## 역할
 * - PENDING 상태의 PaymentProcess를 조회하여 처리
 * - CAS 업데이트로 동시성 제어 (PENDING → PROCESSING)
 * - 랜덤 성공/실패 처리 (80% 성공, 20% 실패)
 * - Webhook 전송
 *
 * ## 작동 방식
 * 1. @Scheduled로 주기적 실행 (fixedDelay로 overlapping 방지)
 * 2. PENDING 상태 조회
 * 3. CAS: PENDING → PROCESSING (중복 방지)
 * 4. 랜덤 성공/실패 결정
 * 5. 상태 업데이트 (PROCESSING → SUCCESS/FAILED)
 * 6. Webhook 전송
 *
 * ## 활성화
 * ```yaml
 * payment.process.polling.enabled: true
 * ```
 *
 * @see com.hamsterworld.cashgateway.external.paymentgateway.polling.PaymentGatewayPgPollingService
 */
@Service
@ConditionalOnProperty(
    prefix = "payment.process.polling",
    name = ["enabled"],
    havingValue = "true",
    matchIfMissing = true  // 기본값: 활성화
)
class PaymentProcessPollingScheduler(
    private val paymentProcessRepository: PaymentProcessJpaRepository,
    private val restTemplate: RestTemplate,
    private val objectMapper: ObjectMapper
) {

    companion object {
        private val logger = LoggerFactory.getLogger(PaymentProcessPollingScheduler::class.java)
        private const val BATCH_SIZE = 10  // 한 번에 처리할 최대 개수
        private const val SUCCESS_RATE = 80  // 성공률 80%
        private val FAIL_REASONS = listOf(
            "INSUFFICIENT_BALANCE",
            "INVALID_CARD",
            "EXPIRED_CARD",
            "LIMIT_EXCEEDED",
            "SYSTEM_ERROR"
        )
    }

    /**
     * PENDING 상태의 PaymentProcess를 처리
     *
     * fixedDelay: 이전 실행 완료 후 3초 대기 (overlapping 방지)
     * initialDelay: 서버 시작 후 5초 대기 (초기화 시간 확보)
     */
    @Scheduled(fixedDelay = 3000, initialDelay = 5000)
    @Transactional
    fun pollAndProcess() {
        try {
            // PENDING 상태 조회 (배치 처리, Limit 적용)
            val pendingProcesses = paymentProcessRepository
                .findByStatusWithLimit(
                    PaymentProcessStatus.PENDING,
                    PageRequest.of(0, BATCH_SIZE)
                )

            if (pendingProcesses.isEmpty()) {
                return
            }

            logger.info("Processing {} PENDING payment processes", pendingProcesses.size)

            pendingProcesses.forEach { process ->
                try {
                    processPayment(process)
                } catch (e: Exception) {
                    logger.error(
                        "Failed to process payment - processId: {}, tid: {}, error: {}",
                        process.id, process.tid, e.message, e
                    )
                }
            }
        } catch (e: Exception) {
            logger.error("Unexpected error during payment polling", e)
        }
    }

    /**
     * 개별 PaymentProcess 처리
     * CAS 업데이트와 Webhook 전송
     */
    @Transactional
    fun processPayment(process: PaymentProcess) {
        val processId = process.id!!
        val now = LocalDateTime.now()

        logger.info(
            "Processing payment - processId: {}, tid: {}, orderId: {}",
            processId, process.tid, process.orderId
        )

        // CAS 업데이트: PENDING → PROCESSING
        val updated = paymentProcessRepository.casUpdateToProcessing(
            id = processId,
            expectedStatus = PaymentProcessStatus.PENDING,
            newStatus = PaymentProcessStatus.PROCESSING,
            processingStartedAt = now
        )

        if (updated == 0) {
            // 이미 다른 스케줄러가 처리 중
            logger.debug("Payment process already being processed - processId: {}", processId)
            return
        }

        // 랜덤 성공/실패 결정 (80% 성공)
        val isSuccess = Random.nextInt(100) < SUCCESS_RATE

        if (isSuccess) {
            handleSuccess(process)
        } else {
            handleFailure(process)
        }
    }

    /**
     * 성공 처리
     * CAS 업데이트 성공한 경우에만 webhook 전송
     */
    private fun handleSuccess(process: PaymentProcess) {
        val approvalNo = "AP${System.currentTimeMillis()}"
        val processedAt = LocalDateTime.now()

        val updated = paymentProcessRepository.casUpdateToFinal(
            id = process.id!!,
            expectedStatus = PaymentProcessStatus.PROCESSING,
            newStatus = PaymentProcessStatus.SUCCESS,
            approvalNo = approvalNo,
            failReason = null,
            processedAt = processedAt
        )

        if (updated == 0) {
            logger.debug("CAS failed (PROCESSING → SUCCESS) - processId: {}, 이미 처리됨", process.id)
            return
        }

        logger.info("Payment approved - tid: {}, approvalNo: {}", process.tid, approvalNo)
        sendWebhook(process, true, approvalNo, null)
    }

    /**
     * 실패 처리
     * CAS 업데이트 성공한 경우에만 webhook 전송
     */
    private fun handleFailure(process: PaymentProcess) {
        val failReason = FAIL_REASONS.random()
        val processedAt = LocalDateTime.now()

        val updated = paymentProcessRepository.casUpdateToFinal(
            id = process.id!!,
            expectedStatus = PaymentProcessStatus.PROCESSING,
            newStatus = PaymentProcessStatus.FAILED,
            approvalNo = null,
            failReason = failReason,
            processedAt = processedAt
        )

        if (updated == 0) {
            logger.debug("CAS failed (PROCESSING → FAILED) - processId: {}, 이미 처리됨", process.id)
            return
        }

        logger.warn("Payment failed - tid: {}, reason: {}", process.tid, failReason)
        sendWebhook(process, false, null, failReason)
    }

    /**
     * Webhook 전송
     *
     * 상대(cash-gateway)의 응답은 관심 없음. 보냈다는 사실만 기록.
     */
    private fun sendWebhook(
        process: PaymentProcess,
        isSuccess: Boolean,
        approvalNo: String?,
        failReason: String?
    ) {
        val echo = try {
            if (process.echo != null) {
                @Suppress("UNCHECKED_CAST")
                objectMapper.readValue(process.echo, Map::class.java) as Map<String, Any?>
            } else {
                emptyMap()
            }
        } catch (e: Exception) {
            logger.warn("Failed to parse echo JSON: {}", e.message)
            emptyMap()
        }

        val webhookPayload = WebhookPaymentResponse(
            status = if (isSuccess) "SUCCESS" else "FAILED",
            code = if (isSuccess) "0000" else "E001",
            transactionId = process.tid,
            approvalNo = approvalNo,
            amount = process.amount,
            echo = echo,
            message = if (isSuccess) {
                "Payment approved successfully"
            } else {
                "Payment failed: $failReason"
            }
        )

        try {
            restTemplate.postForEntity(
                process.webhookUrl,
                webhookPayload,
                String::class.java
            )
        } catch (e: Exception) {
            logger.warn("Webhook 전송 중 예외 (무시) - tid: {}, error: {}", process.tid, e.message)
        }

        // 보냈으면 끝. 응답 코드 상관없이 전송 시각만 기록.
        val updatedProcess = paymentProcessRepository.findById(process.id!!).orElse(null)
        updatedProcess?.markWebhookSent(0)
        if (updatedProcess != null) {
            paymentProcessRepository.save(updatedProcess)
        }

        logger.info("Webhook sent - tid: {}, url: {}", process.tid, process.webhookUrl)
    }
}
