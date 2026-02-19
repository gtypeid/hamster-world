package com.hamsterworld.cashgateway.external.paymentgateway.abs

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentApprovedRequestWithCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentCancelledRequestWithCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentResponseWithCtx
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.cashgateway.domain.cashgatewaymid.model.CashGatewayMid
import com.hamsterworld.cashgateway.domain.cashgatewaymid.repository.CashGatewayMidRepository
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.CancelPaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentRequest
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentResponse
import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.common.domain.converter.DomainConverterAdapter
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.common.tracing.TraceContextHolder
import org.slf4j.LoggerFactory
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestTemplate
import org.springframework.http.*

/**
 * PG 결제 게이트웨이 클라이언트 프로토콜 코어
 *
 * ## 변경 이력
 * - **2026-02-09** (Claude Opus 4 / claude-opus-4-6):
 *   `traceContextHolder` 생성자 파라미터 추가.
 *   `handleInternalWebhook()`에서 `executeWithRestoredTrace("webhook-callback")`을 호출하여
 *   PG Webhook 콜백 시 원본 결제 요청의 trace를 복원.
 *   Webhook은 PG 서비스가 보내는 별도 HTTP 요청이므로 OTel이 새 trace를 생성하지만,
 *   PaymentProcess에 저장된 traceId/spanId로 원본 trace에 자식 span을 연결함.
 *
 * @param traceContextHolder 비동기 경계(Webhook)에서 원본 trace를 복원하기 위한 헬퍼.
 *        micrometer Tracer를 내부적으로 사용하여 Spring Kafka observation scope chain에 등록됨.
 *
 * @see com.hamsterworld.common.tracing.TraceContextHolder.executeWithRestoredTrace trace 복원 메커니즘
 */
abstract class PaymentGatewayClientProtocolCore(
    private val pgRestTemplate: RestTemplate,
    private val objectMapper: ObjectMapper,
    private val domainConverterAdapter: DomainConverterAdapter,
    private val paymentGatewayCoreService: PaymentGatewayCoreService,
    private val provider: PaymentGatewayProvider,
    private val traceContextHolder: TraceContextHolder,
    private val cashGatewayMidRepository: CashGatewayMidRepository
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
        // Webhook 전용 정책:
        // - 모든 PG를 비동기로 간주, 승인/거절은 Webhook에서만 처리
        // - 응답 성공 = 요청 접수 완료 (승인 완료 아님)
        // - PaymentProcess는 UNKNOWN 상태 유지, Webhook에서 SUCCESS/FAILED로 CAS 업데이트

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

            // PG 서버 다운 시 PaymentProcess를 FAILED로 기록
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

        // Webhook 전용 정책: 응답은 "접수 완료" 의미만. 승인/거절은 Webhook에서 처리.
        log.info(
            "[{}] PG 요청 접수 완료 - Webhook으로 최종 결과 수신 예정",
            provider.getProvider().name
        )
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
     * Webhook 처리 메인 로직 (3단계 파이프라인)
     *
     * **트랜잭션 전파 정책**:
     * - `MANDATORY`: 반드시 부모 트랜잭션 내에서 호출되어야 함
     * - 호출 경로: PgWebhookService.handleWebhook(MANDATORY) → handleWebhook(MANDATORY)
     * - 목적: Webhook 처리 전체가 하나의 트랜잭션으로 원자적 처리
     *
     * ## 3단계 파이프라인
     *
     * **Step 1: 파싱** - PG 응답에서 필수 필드 추출 (tid, pgMid)
     *
     * **Step 2: PG MID → CashGatewayMid 특정**
     * - PG MID로 CashGatewayMid 후보 목록 역추적 (N:1이므로 복수 가능)
     * - 후보 1개 → 확정
     * - 후보 복수 → userId로 필터링하여 정확히 1개 확정
     * - 후보 0개 → 에러
     *
     * **Step 3: CashGatewayMid + PENDING → PaymentProcess 특정**
     * - 확정된 cashGatewayMid + provider + PENDING 상태로 PaymentProcess 조회
     * - 찾으면 → 내부 거래 (tid 업데이트 + 상태 마킹)
     * - 못 찾으면 → 외부 거래 (새 PaymentProcess 생성)
     */
    @Transactional(propagation = Propagation.MANDATORY)
    override fun handleWebhook(rawPayload: String) {
        val providerName = provider.getProvider().name
        log.info("[{}] Webhook 수신", providerName)
        log.debug("Webhook Payload = {}", rawPayload)

        // ── Step 1: 파싱 ──
        val response: PaymentResponse = try {
            provider.parsePaymentResponse(rawPayload)
        } catch (e: Exception) {
            log.error("[{}] Webhook 파싱 실패: {}", providerName, e.message)
            throw CustomRuntimeException("Webhook 파싱 실패", e)
        }

        val tid = response.getPgTransaction()
            ?: throw CustomRuntimeException("Webhook에 tid 없음")
        val pgMid = response.getMid()
            ?: throw CustomRuntimeException("Webhook에 PG MID 없음")
        val userId = response.getUserId()

        log.info("[{}] Step 1 완료 | tid={}, pgMid={}, userId={}, success={}",
            providerName, tid, pgMid, userId, response.isSuccess())

        // ── Step 2: PG MID → CashGatewayMid 특정 ──
        val cashGatewayMid = resolveCashGatewayMid(pgMid, userId)

        log.info("[{}] Step 2 완료 | cashGatewayMid={}, userKeycloakId={}",
            providerName, cashGatewayMid.mid, cashGatewayMid.userKeycloakId)

        // ── Step 3: CashGatewayMid + PENDING → PaymentProcess 특정 ──
        val existingProcess = paymentGatewayCoreService.findPendingByCashGatewayMidAndProvider(
            cashGatewayMid.mid, provider.getProvider()
        )

        if (existingProcess != null) {
            // 내부 거래: PENDING PaymentProcess 존재 → tid 업데이트 + 상태 마킹
            log.info("[{}] Step 3 완료 (내부 거래) | processId={}, cashGatewayMid={}",
                providerName, existingProcess.id, cashGatewayMid.mid)

            handleInternalWebhook(existingProcess, response, rawPayload)
        } else {
            // 외부 거래: PENDING PaymentProcess 없음 → 새 PaymentProcess 생성
            log.info("[{}] Step 3 완료 (외부 거래) | cashGatewayMid={}, tid={}",
                providerName, cashGatewayMid.mid, tid)

            handleExternalWebhook(response, rawPayload, tid, cashGatewayMid.mid)
        }
    }

    /**
     * PG MID → CashGatewayMid 특정 (Webhook Step 2)
     *
     * 1. PG MID로 후보 목록 조회 (N:1 관계이므로 복수 가능)
     * 2. 후보 1개 → 확정
     * 3. 후보 복수 + userId 있음 → userId로 필터링
     * 4. 후보 0개 → 에러
     *
     * @param pgMid PG 응답의 MID (PG사에 등록된 가맹점 ID)
     * @param userId PG 응답의 유저 식별자 (후보 필터링용, nullable)
     * @return 확정된 CashGatewayMid 엔티티
     */
    private fun resolveCashGatewayMid(
        pgMid: String,
        userId: String?
    ): CashGatewayMid {
        val providerEnum = provider.getProvider()

        // userId가 있으면 직접 1개 특정 시도
        if (userId != null) {
            val exact = cashGatewayMidRepository.findByProviderAndPgMidAndUserKeycloakId(
                providerEnum, pgMid, userId
            )
            if (exact != null) return exact
        }

        // userId 없거나 직접 매칭 실패 → 후보 목록 조회
        val candidates = cashGatewayMidRepository.findAllByProviderAndPgMid(providerEnum, pgMid)

        return when (candidates.size) {
            0 -> throw CustomRuntimeException(
                "CashGatewayMid를 찾을 수 없습니다. provider=$providerEnum, pgMid=$pgMid, userId=$userId"
            )
            1 -> candidates.first()
            else -> throw CustomRuntimeException(
                "CashGatewayMid 후보가 복수입니다. 특정할 수 없습니다. " +
                    "provider=$providerEnum, pgMid=$pgMid, userId=$userId, candidates=${candidates.map { it.mid }}"
            )
        }
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

        // PENDING 상태 검증
        if (existingProcess.status != PaymentProcessStatus.PENDING) {
            log.warn("[{}] PENDING 상태가 아닌 거래에 Webhook 수신 | processId={}, status={}",
                provider.getProvider().name, existingProcess.id, existingProcess.status)
            return  // 이미 처리됨 (중복 Webhook 무시)
        }

        // [2026-02-09] Claude Opus 4: Webhook 경계에서 원본 trace 복원
        //
        // ★ CRITICAL: Webhook은 PG 서비스가 보내는 별도 HTTP 요청이므로
        // OTel 자동 계측이 새 trace를 생성함. 결제 요청 시점의 trace와 연결하려면
        // PaymentProcess에 저장된 traceId/spanId로 명시적으로 자식 span을 생성해야 함.
        //
        // 동작 원리:
        //   1. PaymentProcess.traceId/spanId = 최초 결제 요청(ecommerce → cash-gateway) 시점의 trace 정보
        //   2. executeWithRestoredTrace()가 micrometer scope에 원본 trace의 자식 span 등록
        //   3. 이 scope 안에서 paymentGatewayCoreService의 이벤트 발행이 올바른 traceId 사용
        //
        // 주의: PG 서비스가 Webhook에 traceparent 헤더를 전달하지 않는 한,
        // 결제 요청 trace와 Webhook trace는 별도로 존재할 수 있음.
        // 이 코드는 PaymentProcess에 저장된 traceId로 Webhook 측 trace를 원본에 연결하는 역할.
        traceContextHolder.executeWithRestoredTrace(
            spanName = "webhook-callback",
            traceId = existingProcess.traceId,
            parentSpanId = existingProcess.spanId
        ) {
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
        cashGatewayMid: String?
    ) {
        log.info("[{}] 외부 거래 Webhook | tid={}, cashGatewayMid={}",
            provider.getProvider().name, tid, cashGatewayMid)

        // CashGatewayMid로 originSource + userKeycloakId 조회
        val mapping = if (cashGatewayMid != null) {
            cashGatewayMidRepository.findByProviderAndMid(provider.getProvider(), cashGatewayMid)
        } else null
        val originSource = mapping?.originSource ?: "${provider.getProvider().name}_WEBHOOK"
        val resolvedCashGatewayMid = cashGatewayMid ?: "UNKNOWN"
        val resolvedUserKeycloakId = mapping?.userKeycloakId
            ?: throw CustomRuntimeException("외부 거래의 userKeycloakId를 확인할 수 없습니다. cashGatewayMid=$cashGatewayMid")

        if (mapping != null) {
            log.info("[{}] CashGatewayMid 조회 성공 | cashGatewayMid={}, userKeycloakId={}, originSource={}",
                provider.getProvider().name, cashGatewayMid, resolvedUserKeycloakId, originSource)
        }

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
            userKeycloakId = resolvedUserKeycloakId,
            provider = providerEnum,
            cashGatewayMid = resolvedCashGatewayMid,
            amount = amount,
            status = if (response.isSuccess())
                PaymentProcessStatus.SUCCESS
            else
                PaymentProcessStatus.FAILED,
            gatewayReferenceId = PaymentProcess.generateGatewayReferenceId(providerEnum, resolvedCashGatewayMid),
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
