package com.hamsterworld.cashgateway.external.paymentgateway.abs

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentApprovedRequestWithCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentCancelledRequestWithCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentResponseWithCtx
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.CancelPaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentRequest
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentResponse
import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.common.domain.converter.DomainConverterAdapter
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.slf4j.LoggerFactory
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestTemplate
import org.springframework.http.*

abstract class PaymentGatewayClientProtocolCore(
    private val pgRestTemplate: RestTemplate,
    private val objectMapper: ObjectMapper,
    private val domainConverterAdapter: DomainConverterAdapter,
    private val paymentGatewayCoreService: PaymentGatewayCoreService,
    private val provider: PaymentGatewayProvider
) : PaymentGatewayClientProtocol {

    private val log = LoggerFactory.getLogger(PaymentGatewayClientProtocolCore::class.java)

    override fun getProvider(): Provider {
        return provider.getProvider()
    }

    /**
     * PG 결제 요청
     *
     * **트랜잭션 전파 정책**:
     * - `MANDATORY`: 반드시 부모 트랜잭션 내에서 호출되어야 함
     * - 호출 경로: PaymentService.approve(MANDATORY) → payment(MANDATORY) → handleRequest(MANDATORY)
     * - 목적: PG 요청 실패 시 전체 롤백 (PaymentAttempt 포함)
     *
     * **Webhook 전용 정책**:
     * - 모든 PG를 비동기로 간주, Payment 생성은 Webhook에서만 처리
     * - 응답 성공 = 요청 접수 완료 (승인 완료 아님)
     * - PaymentAttempt는 UNKNOWN 상태 유지, Webhook에서 SUCCESS/FAILED로 CAS 업데이트
     */
    @Transactional(propagation = Propagation.MANDATORY)
    override fun payment(paymentCtx: ApprovePaymentCtx) {
        // TODO: Webhook 전용 정책 적용
        // - 배경: 동기/비동기 혼재 시 복잡도 증가 (응답 처리 vs Webhook 처리 중복)
        //   1) 동기 PG라도 Webhook도 보낼 수 있음 (중복 처리 문제)
        //   2) Webhook이 응답보다 먼저 올 수 있음 (Race Condition)
        //   3) tid 기반 조회는 응답 처리 후에만 가능 (UNKNOWN 상태는 tid 없음)
        // - 해결: 모든 PG를 비동기로 간주, 승인/거절은 Webhook에서만 처리
        // - 장점: 단일 처리 경로, 멱등성 보장 용이, 상태 관리 단순화
        // - 단점: 응답 즉시 결과 확인 불가 (Webhook 대기 필요)

        val request: PaymentRequest = provider.prepareRequest(paymentCtx)

        val jsonBody: String
        try {
            jsonBody = objectMapper.writeValueAsString(request)
        } catch (e: JsonProcessingException) {
            throw CustomRuntimeException("PG 요청 직렬화 실패", e)
        }

        val requestPaymentProcess = domainConverterAdapter.convert(
            PaymentApprovedRequestWithCtx(provider, paymentCtx, request),
            PaymentProcess::class.java
        )
        paymentGatewayCoreService.handleRequest(requestPaymentProcess)

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val entity = HttpEntity(jsonBody, headers)

        log.info("[{}] 결제 요청 -> {}", provider.getProvider().name, provider.getEndpoint())
        log.info("Request Body = {}", jsonBody)

        val responseEntity: ResponseEntity<String>
        try {
            responseEntity = pgRestTemplate.exchange(
                provider.getEndpoint(),
                HttpMethod.POST,
                entity,
                String::class.java
            )
        } catch (e: Exception) {
            log.error("[{}] PG 서버 통신 실패 (서버 다운 또는 네트워크 오류): {}", provider.getProvider().name, e.message, e)

            // PG 서버 다운 시 PaymentProcess를 FAILED로 기록하고 null 반환
            // 예외를 던지지 않아 트랜잭션 커밋되며, Kafka 재시도 방지
            requestPaymentProcess.status = PaymentProcessStatus.FAILED
            requestPaymentProcess.code = "PG_SERVER_DOWN"
            requestPaymentProcess.message = "PG 서버 통신 실패: ${e.message}"

            log.warn("[{}] PaymentProcess를 FAILED로 기록 | processId={}",
                provider.getProvider().name, requestPaymentProcess.id)

            return
        }

        val rawResponse = responseEntity.body
        log.info("[{}] 결제 응답 <- {}", provider.getProvider().name, rawResponse)

        val response: PaymentResponse = provider.parsePaymentResponse(rawResponse!!)
            ?: throw CustomRuntimeException("PG 응답 파싱 실패: null 응답")

        /**
         * **Webhook 전용 정책 적용** (MANDATORY 트랜잭션 전파 정책과 연계)
         *
         * **배경**:
         * - 기존: 동기 PG 응답 처리 (성공/실패 분기)
         *   - 성공: Payment 생성 + 커밋
         *   - 실패: handleResponseFailure() + 예외 던짐 → 롤백
         *
         * **문제점** (MANDATORY 전파 정책 도입 후):
         * - PG 응답 실패 (code != "0000") = "정상적인 실패" (비즈니스 결과)
         * - 예외 던지면 전체 롤백 (PaymentAttempt FAILED 기록 소실)
         * - Kafka 재시도 → 동일한 실패 반복 → 무한 재시도
         *
         * **해결**:
         * - PG 응답은 단순히 "요청 접수 완료" 의미만 가짐
         * - 성공/실패 분기 제거, 항상 PaymentAttempt는 UNKNOWN 상태 유지
         * - 실제 승인/거절은 Webhook에서만 처리 (handleInternalWebhook)
         * - 장점:
         *   1. 단일 처리 경로 (응답 vs Webhook 중복 제거)
         *   2. Race Condition 방지 (Webhook이 응답보다 먼저 올 수 있음)
         *   3. 멱등성 보장 용이 (tid 기반 CAS)
         *   4. 트랜잭션 경계 단순화 (정상 흐름만 커밋)
         *
         * **기존 코드** (제거됨):
         * ```kotlin
         * if (!provider.isSuccess(response)) {
         *     handleResponseFailure(responseAttempt)  // FAILED 기록
         *     throw CustomRuntimeException(...)       // 롤백 유발 (문제!)
         * }
         * ```
         */
        log.info(
            "[{}] PG 요청 접수 완료 - Webhook으로 최종 결과 수신 예정",
            provider.getProvider().name
        )

        // 이벤트는 Webhook에서만 발행
    }

    override fun cancel(paymentCtx: CancelPaymentCtx) {
        val request: PaymentRequest = provider.prepareRequest(paymentCtx)

        val jsonBody: String
        try {
            jsonBody = objectMapper.writeValueAsString(request)
        } catch (e: JsonProcessingException) {
            throw CustomRuntimeException("PG 취소 요청 직렬화 실패", e)
        }

        val requestAttempt = domainConverterAdapter.convert(
            PaymentCancelledRequestWithCtx(provider, paymentCtx, request),
            PaymentProcess::class.java
        )
        paymentGatewayCoreService.handleRequest(requestAttempt)

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val entity = HttpEntity(jsonBody, headers)

        log.info("[{}] 취소 요청 -> {}", provider.getProvider().name, provider.getEndpoint())
        log.info("Request Body = {}", jsonBody)

        val responseEntity: ResponseEntity<String>
        try {
            responseEntity = pgRestTemplate.exchange(
                provider.getEndpoint(),
                HttpMethod.POST,
                entity,
                String::class.java
            )
        } catch (e: Exception) {
            log.error("[{}] PG 서버 통신 실패 (서버 다운 또는 네트워크 오류): {}", provider.getProvider().name, e.message, e)

            // PG 서버 다운 시 PaymentProcess를 FAILED로 기록
            requestAttempt.status = PaymentProcessStatus.FAILED
            requestAttempt.code = "PG_SERVER_DOWN"
            requestAttempt.message = "PG 서버 통신 실패 (취소): ${e.message}"
            paymentGatewayCoreService.handleRequest(requestAttempt)

            log.error("[{}] 취소 실패 - PG 서버 다운 | processId={}",
                provider.getProvider().name, requestAttempt.id)

            throw CustomRuntimeException("PG 서버 통신 실패 (취소)", e)
        }

        val rawResponse = responseEntity.body
        log.info("[{}] 취소 응답 <- {}", provider.getProvider().name, rawResponse)

        val response: PaymentResponse = provider.parsePaymentResponse(rawResponse!!)
            ?: throw CustomRuntimeException("PG 취소 응답 파싱 실패: null 응답")

        val responseAttempt = domainConverterAdapter.convert(
            PaymentResponseWithCtx(provider, paymentCtx, response),
            PaymentProcess::class.java
        )

        if (!provider.isSuccess(response)) {
            paymentGatewayCoreService.handleResponseFailure(responseAttempt)
            // 상세 실패 정보 구성
            val errorMsg = String.format(
                "[%s] 취소 실패 - code=%s, message=%s",
                provider.getProvider().name,
                response.getCode(),
                response.getMessage()
            )

            log.error(errorMsg)
            throw CustomRuntimeException(errorMsg)
        }

        // 취소 성공 처리 (이벤트 발행)
        paymentGatewayCoreService.handleCancelledResponseSuccess(responseAttempt)
    }

    /**
     * Webhook 처리 메인 로직
     *
     * **트랜잭션 전파 정책**:
     * - `MANDATORY`: 반드시 부모 트랜잭션 내에서 호출되어야 함
     * - 호출 경로: PgWebhookService.handleWebhook(MANDATORY) → handleWebhook(MANDATORY)
     * - 목적: Webhook 처리 전체가 하나의 트랜잭션으로 원자적 처리
     *
     * **처리 플로우**:
     * 1. Payload 파싱
     * 2. tid 검증
     * 3. orderNumber 기반 내부/외부 거래 판단
     * 4. 내부: UNKNOWN → SUCCESS/FAILED CAS 업데이트
     * 5. 외부: PaymentProcess + Payment 신규 생성
     */
    @Transactional(propagation = Propagation.MANDATORY)
    override fun handleWebhook(rawPayload: String) {
        log.info("[{}] Webhook 수신", provider.getProvider().name)
        log.debug("Webhook Payload = {}", rawPayload)

        // 1. Payload 파싱
        val response: PaymentResponse = try {
            provider.parsePaymentResponse(rawPayload)
        } catch (e: Exception) {
            log.error("[{}] Webhook 파싱 실패: {}", provider.getProvider().name, e.message)
            throw CustomRuntimeException("Webhook 파싱 실패", e)
        }

        // 2. tid 검증 (필수)
        val tid = response.getPgTransaction()
            ?: throw CustomRuntimeException("Webhook에 tid 없음")

        // 3. MID 추출
        val mid = provider.extractMid(response) ?: provider.getMid()

        log.info("[{}] Webhook 처리 시작 | tid={}, mid={}, success={}",
            provider.getProvider().name, tid, mid, response.isSuccess())

        // PENDING 상태의 PaymentProcess 조회 (Webhook은 PENDING 상태에서만 처리)
        val existingProcess = paymentGatewayCoreService.findAttemptByTid(tid)

        if (existingProcess == null) {
            log.error("[{}] 해당 거래를 찾을 수 없음 | tid={}", provider.getProvider().name, tid)
            throw CustomRuntimeException("해당 거래를 찾을 수 없음: tid=$tid")
        }

        log.info("[{}] 거래 PaymentProcess 조회 성공 | processId={}, status={}",
            provider.getProvider().name, existingProcess.id, existingProcess.status)

        // PENDING 상태 검증
        if (existingProcess.status != com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus.PENDING) {
            log.warn("[{}] PENDING 상태가 아닌 거래에 Webhook 수신 | processId={}, status={}",
                provider.getProvider().name, existingProcess.id, existingProcess.status)
            return  // 이미 처리됨 or 잘못된 상태
        }

        // PENDING → SUCCESS/FAILED로 CAS 업데이트 (이벤트 발행)
        handleInternalWebhook(existingProcess, response, rawPayload)

        /*
            // [외부 거래] gatewayReferenceId 없음 + tid 있음 = 외부에서 발생한 거래
            log.info("[{}] 외부 거래 판단 | tid={}, mid={}", provider.getProvider().name, tid, mid)

            // tid 중복 체크 (멱등성 보장)
            val duplicateCheck = paymentGatewayCoreService.findAttemptByTid(tid)
            if (duplicateCheck != null) {
                log.warn("[{}] 중복 tid 감지 | tid={}, 기존 processId={}",
                    provider.getProvider().name, tid, duplicateCheck.id)
                return null  // 이미 처리됨
            }

            // PaymentProcess + Payment 신규 생성
            return handleExternalWebhook(response, rawPayload, tid, mid)
        */
    }

    /**
     * 내부 요청 Webhook 처리
     * - 이미 PaymentProcess가 존재 (우리가 PG 요청한 거래)
     * - PENDING → SUCCESS/FAILED 로 CAS 업데이트
     * - handleWebhook(MANDATORY)의 트랜잭션 내에서 실행됨
     *
     * ## 변경 사항
     * - 기존: Payment 반환
     * - 변경: Unit (이벤트 발행으로 처리)
     */
    private fun handleInternalWebhook(
        existingProcess: PaymentProcess,
        response: PaymentResponse,
        rawPayload: String
    ) {
        log.info("[{}] 내부 요청 Webhook 처리 시작 | processId={}, 기존 status={}",
            provider.getProvider().name, existingProcess.id, existingProcess.status)

        // 응답 데이터로 PaymentProcess 업데이트 준비
        existingProcess.pgTransaction = response.getPgTransaction()
        existingProcess.pgApprovalNo = response.getPgApprovalNo()
        existingProcess.code = response.getCode()
        existingProcess.message = response.getMessage()
        existingProcess.responsePayload = rawPayload

        if (provider.isSuccess(response)) {
            // 성공 → 이벤트 발행
            paymentGatewayCoreService.handleResponseSuccess(existingProcess)
        } else {
            // 실패 → PaymentProcess만 업데이트 + 이벤트 발행
            paymentGatewayCoreService.handleResponseFailure(existingProcess)
        }
    }

    /**
     * 외부 거래 Webhook 처리
     * - PaymentAttempt가 없음 (외부에서 발생한 거래)
     * - PaymentProcess 신규 생성 + 이벤트 발행
     * - handleWebhook(MANDATORY)의 트랜잭션 내에서 실행됨
     *
     * ## 변경 사항
     * - 기존: Payment 생성 및 반환
     * - 변경: 이벤트 발행으로 처리
     *
     * @param response 파싱된 PG 응답
     * @param rawPayload 원본 Webhook payload
     * @param tid PG Transaction ID (이미 추출됨)
     * @param mid Merchant ID (이미 추출됨)
     */
    private fun handleExternalWebhook(
        response: PaymentResponse,
        rawPayload: String,
        tid: String,
        mid: String
    ) {
        log.info("[{}] 외부 거래 Webhook | tid={}, mid={}",
            provider.getProvider().name, tid, mid)

        // TODO: PgMerchantMapping으로 originSource 조회
        // val mapping = pgMerchantMappingRepository.findByProviderAndMid(provider.getProvider(), mid)
        // val originSource = mapping?.originSource ?: "${provider.getProvider().name}_WEBHOOK"
        val originSource = "${provider.getProvider().name}_WEBHOOK"

        // Amount 추출
        val amount = response.getAmount()
            ?: run {
                log.warn("[{}] Webhook에서 amount 추출 실패 | tid={}",
                    provider.getProvider().name, tid)
                java.math.BigDecimal.ZERO
            }

        // 외부 거래 PaymentProcess 생성 (성공/실패 모두 기록)
        val providerEnum = provider.getProvider()
        val externalAttempt = PaymentProcess(
            orderPublicId = null,  // 외부 거래는 orderPublicId 없음
            userPublicId = null,
            provider = providerEnum,
            mid = mid,
            amount = amount,
            status = if (response.isSuccess())
                PaymentProcessStatus.SUCCESS
            else
                PaymentProcessStatus.FAILED,
            gatewayReferenceId = PaymentProcess.generateGatewayReferenceId(providerEnum, mid),
            orderNumber = null,
            code = response.getCode(),
            message = response.getMessage(),
            pgTransaction = tid,  // 파라미터로 받은 tid 사용
            pgApprovalNo = response.getPgApprovalNo(),
            originSource = originSource,
            requestPayload = null,  // 외부 거래는 요청 알 수 없음
            responsePayload = rawPayload
        )

        // PaymentProcess 기록 (성공/실패 모두)
        paymentGatewayCoreService.handleRequest(externalAttempt)

        // 성공 건만 이벤트 발행
        if (response.isSuccess()) {
            paymentGatewayCoreService.handleResponseSuccess(externalAttempt)
        } else {
            log.info("[{}] 외부 거래 실패 기록 완료 | tid={}, status={}, code={}",
                provider.getProvider().name, response.getPgTransaction(),
                externalAttempt.status, response.getCode())
        }
    }
}
