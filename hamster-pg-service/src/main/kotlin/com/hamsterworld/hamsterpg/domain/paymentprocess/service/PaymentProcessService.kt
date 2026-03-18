package com.hamsterworld.hamsterpg.domain.paymentprocess.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.hamsterpg.app.paymentprocess.request.ProcessPaymentRequest
import com.hamsterworld.hamsterpg.app.paymentprocess.response.PaymentProcessDetailsResponse
import com.hamsterworld.hamsterpg.app.paymentprocess.response.ProcessPaymentResponse
import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.hamsterpg.domain.paymentprocess.repository.PaymentProcessRepository
import com.hamsterworld.hamsterpg.domain.pgmid.service.PgMidService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PaymentProcessService(
    private val paymentProcessRepository: PaymentProcessRepository,
    private val pgMidService: PgMidService,
    private val objectMapper: ObjectMapper
) {

    companion object {
        private val log = LoggerFactory.getLogger(PaymentProcessService::class.java)
    }

    @Transactional
    fun acceptPaymentRequest(request: ProcessPaymentRequest): ProcessPaymentResponse {
        val pgMid = pgMidService.getMid(request.midId)
        require(pgMid.isActive) { "MID is not active: ${request.midId}" }

        val echoJson = try {
            objectMapper.writeValueAsString(request.echo)
        } catch (e: Exception) {
            log.warn("echo 직렬화 실패: {}", e.message)
            null
        }

        val process = PaymentProcess.create(
            midId = pgMid.midId,
            orderId = request.orderId,
            userId = request.userId,
            amount = request.amount,
            echo = echoJson
        )

        paymentProcessRepository.save(process)

        log.info("[거래 접수] midId={}, orderId={}, amount={}", pgMid.midId, request.orderId, request.amount)

        return ProcessPaymentResponse(
            code = "ACK_OK",
            amount = request.amount,
            message = "Payment request accepted"
        )
    }

    @Transactional(readOnly = true)
    fun findByTid(tid: String): PaymentProcess? {
        return paymentProcessRepository.findByTid(tid)
    }

    @Transactional(readOnly = true)
    fun findByTidResponse(tid: String): PaymentProcessDetailsResponse? {
        val process = findByTid(tid) ?: return null
        return PaymentProcessDetailsResponse.from(process)
    }
}
