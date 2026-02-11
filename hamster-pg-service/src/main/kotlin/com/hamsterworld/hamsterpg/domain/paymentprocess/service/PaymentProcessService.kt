package com.hamsterworld.hamsterpg.domain.paymentprocess.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.hamsterpg.app.paymentprocess.request.ProcessPaymentRequest
import com.hamsterworld.hamsterpg.app.paymentprocess.response.PaymentProcessDetailsResponse
import com.hamsterworld.hamsterpg.app.paymentprocess.response.ProcessPaymentResponse
import com.hamsterworld.hamsterpg.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.hamsterpg.domain.paymentprocess.repository.PaymentProcessJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * PaymentProcess 비즈니스 로직
 *
 * - 요청 접수 (PENDING 상태로 저장)
 * - 폴링 스케줄러가 PENDING → PROCESSING → SUCCESS/FAILED 처리
 */
@Service
class PaymentProcessService(
    private val paymentProcessRepository: PaymentProcessJpaRepository,
    private val objectMapper: ObjectMapper
) {

    companion object {
        private val logger = LoggerFactory.getLogger(PaymentProcessService::class.java)
    }

    /**
     * 결제 요청 접수
     *
     * @return 202 Accepted 응답 (비동기 처리)
     */
    @Transactional
    fun acceptPaymentRequest(request: ProcessPaymentRequest): ProcessPaymentResponse {
        val tid = generateTid()
        val echoJson = try {
            objectMapper.writeValueAsString(request.echo)
        } catch (e: Exception) {
            logger.warn("Failed to serialize echo: {}", e.message)
            null
        }

        val process = PaymentProcess(
            tid = tid,
            orderId = request.orderId,
            userPublicId = request.userPublicId,
            amount = request.amount,
            status = PaymentProcessStatus.PENDING,
            echo = echoJson,
            requestedAt = LocalDateTime.now()
        )

        paymentProcessRepository.save(process)

        logger.info(
            "Payment request accepted - tid: {}, orderId: {}, amount: {}",
            tid, request.orderId, request.amount
        )

        return ProcessPaymentResponse(
            status = "PENDING",
            code = "ACK_OK",
            transactionId = tid,
            amount = request.amount,
            echo = request.echo,
            message = "Payment request received and processing"
        )
    }

    /**
     * TID 생성 (DUMMY_YYYYMMDD_랜덤8자리)
     */
    private fun generateTid(): String {
        val dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
        val randomStr = (10000000..99999999).random()
        return "DUMMY_${dateStr}_${randomStr}"
    }

    /**
     * TID로 조회 (디버깅용)
     */
    @Transactional(readOnly = true)
    fun findByTid(tid: String): PaymentProcess? {
        return paymentProcessRepository.findByTid(tid)
    }

    /**
     * TID로 조회하여 DTO 반환 (디버깅용)
     */
    @Transactional(readOnly = true)
    fun findByTidResponse(tid: String): PaymentProcessDetailsResponse? {
        val process = findByTid(tid) ?: return null
        return PaymentProcessDetailsResponse.from(process)
    }
}
