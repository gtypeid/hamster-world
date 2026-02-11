package com.hamsterworld.cashgateway.external.paymentgateway.polling

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.domain.paymentprocess.repository.PaymentProcessRepository
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayClientRegistry
import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayProvider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.AcknowledgementResponse
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentRequest
import com.hamsterworld.cashgateway.external.paymentgateway.provider.DummyPaymentGatewayProvider
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.ResponseEntity
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestTemplate
import java.time.LocalDateTime

/**
 * PG 요청 폴링 서비스
 *
 * ## 역할
 * - UNKNOWN 상태의 PaymentProcess를 조회하여 PG에 요청
 * - CAS 업데이트로 동시성 제어 (UNKNOWN → PENDING)
 * - PG 응답 후 메타데이터 업데이트
 * - Webhook 수신 시까지 PENDING 상태 유지
 *
 * ## 작동 방식
 * 1. @Scheduled로 주기적 실행 (fixedDelay로 overlapping 방지)
 * 2. UNKNOWN 상태 조회
 * 3. CAS: UNKNOWN → PENDING (중복 방지)
 * 4. PG 요청 전송
 * 5. 메타데이터 업데이트 (requestedAt, ackReceivedAt 등)
 *
 * ## 활성화
 * ```yaml
 * payment.gateway.polling.enabled: true
 * ```
 *
 * @see com.hamsterworld.common.web.kafka.OutboxEventProcessor (참고 구조)
 */
@Service
@ConditionalOnProperty(
    prefix = "payment.gateway.polling",
    name = ["enabled"],
    havingValue = "true",
    matchIfMissing = false  // 기본값: 비활성화
)
class PaymentGatewayPgPollingService(
    private val paymentProcessRepository: PaymentProcessRepository,
    private val clientRegistry: PaymentGatewayClientRegistry,
    private val providers: List<PaymentGatewayProvider>,
    private val objectMapper: ObjectMapper,
    private val pgRestTemplate: RestTemplate
) {
    companion object {
        private val logger = LoggerFactory.getLogger(PaymentGatewayPgPollingService::class.java)
        private const val BATCH_SIZE = 10  // 한 번에 처리할 최대 개수
    }

    /**
     * UNKNOWN 상태의 PaymentProcess를 PG에 요청
     *
     * fixedDelay: 이전 실행 완료 후 5초 대기 (overlapping 방지)
     * initialDelay: 서버 시작 후 10초 대기 (초기화 시간 확보)
     */
    @Scheduled(fixedDelay = 5000, initialDelay = 10000)
    @Transactional
    fun pollAndRequest() {
        try {
            // UNKNOWN 상태 조회 (배치 처리, Limit 적용)
            val unknownProcesses = paymentProcessRepository
                .findByStatusWithLimit(
                    PaymentProcessStatus.UNKNOWN,
                    PageRequest.of(0, BATCH_SIZE)
                )

            if (unknownProcesses.isEmpty()) {
                return
            }

            logger.info("Processing {} UNKNOWN payment processes", unknownProcesses.size)

            unknownProcesses.forEach { process ->
                try {
                    processPaymentRequest(process)
                } catch (e: Exception) {
                    logger.error(
                        "Failed to process payment request - processId: {}, error: {}",
                        process.id, e.message
                    )
                }
            }
        } catch (e: Exception) {
            logger.error("Unexpected error during payment polling", e)
        }
    }

    /**
     * 개별 PaymentProcess 처리
     * CAS 업데이트와 PG 요청을 한 번에 처리
     */
    @Transactional
    fun processPaymentRequest(process: PaymentProcess) {
        val now = LocalDateTime.now()
        val processId = process.id!!

        logger.info(
            "Processing payment request - processId: {}, gatewayReferenceId: {}, provider: {}, mid: {}",
            process.id, process.gatewayReferenceId, process.provider, process.mid
        )

        // Provider 찾기
        val provider = providers.find { it.getProvider() == process.provider }
            ?: throw CustomRuntimeException("Provider not found for process: $processId")

        try {
            // PaymentCtx 생성
            val paymentCtx = ApprovePaymentCtx(
                userPublicId = process.userPublicId ?: "",
                orderPublicId = process.orderPublicId ?: "",
                orderNumber = process.orderNumber ?: "Payment",
                amount = process.amount,
                mid = process.mid
            )

            // PG 요청 준비
            var request: PaymentRequest = provider.prepareRequest(paymentCtx)

            // DummyPaymentRequest인 경우 echo에 gatewayReferenceId 추가
            if (request is DummyPaymentGatewayProvider.DummyPaymentRequest) {
                val echoWithGatewayRef = request.echo + ("gatewayReferenceId" to process.gatewayReferenceId)
                request = request.copy(echo = echoWithGatewayRef)
            }

            // HTTP 요청 전송
            val url = provider.getEndpoint()
            val response: ResponseEntity<String> = pgRestTemplate.postForEntity(
                url,
                request,
                String::class.java
            )

            val responseCode = response.statusCode.value().toString()
            val responseBody = response.body

            logger.info(
                "PG response received - processId: {}, statusCode: {}, provider: {}",
                process.id, responseCode, provider.getProvider().name
            )

            // PG 승인 응답 파싱 (초기 요청 접수 확인)
            val ackResponse = provider.parseAcknowledgementResponse(
                responseBody ?: "",
                responseCode
            )

            // ⚠️ 주의:
            // 적합한 프로세스 다만, 한편으론 문제가 발생할 수 있다
            // isAcknowledged 가 개발자 실수로 잘못 파싱한경우
            // 문제 발생 가능성이 있으므로, 언노운 상태는 무조건 벗어난다, 설령 수동 재시도를 할지언정
            /*
            // 요청이 정상 접수되었는지 확인
            if (!ackResponse.isAcknowledged()) {
                logger.error(
                    "PG request not acknowledged - processId: {}, code: {}, message: {}",
                    process.id, ackResponse.getAckCode(), ackResponse.getAckMessage()
                )
                // UNKNOWN 상태 유지하여 재시도 가능하게 함
                return
            }
            */

            val ackReceivedAt = LocalDateTime.now()

            // CAS 업데이트: UNKNOWN → PENDING + 메타데이터
            val updated = paymentProcessRepository.casUpdateToPending(
                id = processId,
                expectedStatus = PaymentProcessStatus.UNKNOWN,
                newStatus = PaymentProcessStatus.PENDING,
                requestedAt = now,
                ackReceivedAt = ackReceivedAt,
                responseCode = responseCode,
                pgTransaction = ackResponse.getPgTransaction(),
                responsePayload = responseBody
            )

            if (updated == 0) {
                // 이미 다른 스케줄러가 처리 중
                logger.debug("Payment process already being processed - processId: {}", processId)
                return
            }

            logger.info(
                "Payment request completed - processId: {}, tid: {}, ackReceived: true",
                process.id, ackResponse.getPgTransaction()
            )

        } catch (e: Exception) {
            logger.error(
                "Failed to send payment request - processId: {}, provider: {}, error: {}",
                process.id, process.provider, e.message, e
            )

            // 실패 시 상태 변경하지 않음 (UNKNOWN 유지)
            // 이곳에서의 실패란 대체적으로 통신조차 가지 않았을 경우, 다만 아닐 수도 있다
        }
    }

}
