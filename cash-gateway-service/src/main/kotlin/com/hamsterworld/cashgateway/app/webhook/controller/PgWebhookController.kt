package com.hamsterworld.cashgateway.app.webhook.controller

import com.hamsterworld.cashgateway.app.webhook.dto.PgWebhookResponse
import com.hamsterworld.cashgateway.app.webhook.service.PgWebhookService
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

/**
 * PG Webhook 수신 컨트롤러
 *
 * PG사에서 결제 결과를 비동기로 전송하는 엔드포인트
 *
 * **엔드포인트**:
 * - POST /api/webhook/pg/{provider}
 *
 * **처리 방식**:
 * 1. 내부 거래 (Active Mode): 기존 PaymentAttempt 업데이트
 * 2. 외부 거래 (Webhook Mode): 새로운 PaymentAttempt + Payment 생성
 *
 * **멱등성 보장**:
 * - pgTransaction (tid)을 기준으로 중복 처리 방지
 *
 * **트랜잭션 경계**:
 * - Controller에서 REQUIRES_NEW로 트랜잭션 시작 (HTTP 진입점)
 * - 이후 모든 Service/Protocol 메서드는 MANDATORY로 동일 트랜잭션 참여
 * - Kafka Consumer와 동일한 패턴 (BaseKafkaConsumer.consumeEvent = REQUIRES_NEW)
 */
@RestController
@RequestMapping("/api/webhook/pg")
class PgWebhookController(
    private val pgWebhookService: PgWebhookService
) {
    private val log = LoggerFactory.getLogger(PgWebhookController::class.java)

    /**
     * PG Webhook 수신 엔드포인트
     *
     * **트랜잭션 전파 정책**:
     * - `REQUIRES_NEW`: 새 트랜잭션 시작 (HTTP 진입점)
     * - 예외 발생 시 전체 롤백 → HTTP 500 응답 → PG 재전송
     *
     * @param provider PG사 (DUMMY 등)
     * @param rawPayload Webhook 원본 페이로드 (JSON string)
     * @return PgWebhookResponse (success, paymentId)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @PostMapping("/{provider}")
    fun receiveWebhook(
        @PathVariable provider: String,
        @RequestBody rawPayload: String
    ): ResponseEntity<PgWebhookResponse> {
        log.info("[Webhook 수신] provider={}", provider)
        log.debug("[Webhook Payload] {}", rawPayload)

        val providerEnum = try {
            Provider.valueOf(provider.uppercase())
        } catch (e: IllegalArgumentException) {
            log.error("[잘못된 Provider] provider={}", provider, e)
            return ResponseEntity.badRequest().body(
                PgWebhookResponse(
                    success = false,
                    message = "Invalid provider: $provider"
                )
            )
        }

        val payment = pgWebhookService.handleWebhook(providerEnum, rawPayload)

        return if (payment != null) {
            ResponseEntity.ok(
                PgWebhookResponse(
                    success = true,
                    message = "Payment processed successfully",
                    paymentId = payment.id
                )
            )
        } else {
            // 실패/취소 건 또는 중복 요청
            ResponseEntity.ok(
                PgWebhookResponse(
                    success = true,
                    message = "Webhook processed (no payment created)"
                )
            )
        }
    }

    /**
     * Health check 엔드포인트 (PG사 등록용)
     */
    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, String>> {
        return ResponseEntity.ok(mapOf("status" to "ok"))
    }
}
