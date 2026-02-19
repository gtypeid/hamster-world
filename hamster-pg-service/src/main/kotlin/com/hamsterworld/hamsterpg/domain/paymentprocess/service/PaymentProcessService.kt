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

/**
 * PaymentProcess 비즈니스 로직
 *
 * - 외부(Cash Gateway) 거래 요청을 접수하고 PENDING 상태로 저장
 * - midId로 가맹점을 식별하고 활성 여부 검증
 * - ACK 반환 시 tid를 반환하지 않음 (아직 거래가 생성된 게 아니므로)
 * - 폴링 스케줄러가 CAS를 통해 비동기 처리
 */
@Service
class PaymentProcessService(
    private val paymentProcessRepository: PaymentProcessRepository,
    private val pgMidService: PgMidService,
    private val objectMapper: ObjectMapper
) {

    companion object {
        private val log = LoggerFactory.getLogger(PaymentProcessService::class.java)
    }

    /**
     * 거래 요청 접수
     *
     * 1. midId로 가맹점 조회 + 활성 여부 검증
     * 2. PaymentProcess 생성 (PENDING)
     * 3. ACK 응답 반환 (tid 미포함 - 아직 거래가 생성된 것이 아님)
     */
    @Transactional
    fun acceptPaymentRequest(request: ProcessPaymentRequest): ProcessPaymentResponse {
        // MID 조회 + 활성 검증
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
