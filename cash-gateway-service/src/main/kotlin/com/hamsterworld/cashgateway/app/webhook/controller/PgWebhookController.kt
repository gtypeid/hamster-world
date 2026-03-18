package com.hamsterworld.cashgateway.app.webhook.controller

import com.hamsterworld.cashgateway.app.webhook.dto.PgWebhookResponse
import com.hamsterworld.cashgateway.app.webhook.service.PgWebhookService
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/webhook/pg")
class PgWebhookController(
    private val pgWebhookService: PgWebhookService
) {
    private val log = LoggerFactory.getLogger(PgWebhookController::class.java)

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

        pgWebhookService.handleWebhook(providerEnum, rawPayload)

        return ResponseEntity.ok(
            PgWebhookResponse(
                success = true,
                message = "Webhook processed successfully"
            )
        )
    }

    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, String>> {
        return ResponseEntity.ok(mapOf("status" to "ok"))
    }
}
