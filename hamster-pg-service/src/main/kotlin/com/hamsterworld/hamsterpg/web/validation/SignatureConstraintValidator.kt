package com.hamsterworld.hamsterpg.web.validation

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.hamsterworld.hamsterpg.app.payment.request.CancelPaymentRequest
import com.hamsterworld.hamsterpg.app.payment.request.CreatePaymentRequest
import com.hamsterworld.hamsterpg.app.payment.request.PaymentRequest
import com.hamsterworld.hamsterpg.domain.pgmid.model.PgMid
import com.hamsterworld.hamsterpg.domain.pgmid.service.PgMidService
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.util.*
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Component
class SignatureConstraintValidator(
    private val pgMidService: PgMidService
) : ConstraintValidator<ValidSignature, PaymentRequest> {

    private val log = LoggerFactory.getLogger(javaClass)
    private val objectMapper = ObjectMapper().registerKotlinModule()

    override fun isValid(request: PaymentRequest?, context: ConstraintValidatorContext): Boolean {
        if (request == null) return true

        val midId = request.midId
        val timestamp = request.timestamp
        val signature = request.signature

        try {
            // 1. Timestamp 검증 (5분 이내)
            if (!validateTimestamp(timestamp)) {
                context.disableDefaultConstraintViolation()
                context.buildConstraintViolationWithTemplate("Invalid or expired timestamp (must be within 5 minutes)")
                    .addPropertyNode("timestamp")
                    .addConstraintViolation()
                return false
            }

            // 2. PgMid 조회
            val pgMid = try {
                pgMidService.getMid(midId)
            } catch (e: Exception) {
                context.disableDefaultConstraintViolation()
                context.buildConstraintViolationWithTemplate("MID not found: $midId")
                    .addPropertyNode("midId")
                    .addConstraintViolation()
                return false
            }

            // 3. MID 활성화 체크
            if (!pgMid.isActive) {
                context.disableDefaultConstraintViolation()
                context.buildConstraintViolationWithTemplate("MID is not active: $midId")
                    .addPropertyNode("midId")
                    .addConstraintViolation()
                return false
            }

            // 4. Body 재구성 (signature 필드 제외)
            val bodyForSignature = when (request) {
                is CreatePaymentRequest -> request.copy(signature = "")
                is CancelPaymentRequest -> request.copy(signature = "")
            }

            val bodyJson = objectMapper.writeValueAsString(bodyForSignature)

            // 5. 시그니처 생성
            val expectedSignature = generateSignature(
                apiKey = pgMid.apiKey,
                midId = midId,
                timestamp = timestamp,
                body = bodyJson
            )

            // 6. 시그니처 검증
            if (signature != expectedSignature) {
                log.warn("Signature mismatch for MID: $midId")
                context.disableDefaultConstraintViolation()
                context.buildConstraintViolationWithTemplate("Signature mismatch")
                    .addPropertyNode("signature")
                    .addConstraintViolation()
                return false
            }

            // 7. Request scope에 pgMid 저장 (ArgumentResolver용)
            storeInRequestScope(pgMid)

            log.debug("Signature validation successful for MID: $midId")
            return true

        } catch (e: Exception) {
            log.error("Signature validation error for MID: $midId", e)
            context.disableDefaultConstraintViolation()
            context.buildConstraintViolationWithTemplate("Signature validation failed: ${e.message}")
                .addConstraintViolation()
            return false
        }
    }

    private fun validateTimestamp(timestamp: String, allowedWindowMs: Long = 300_000): Boolean {
        return try {
            val requestTime = timestamp.toLong()
            val currentTime = System.currentTimeMillis()
            val diff = Math.abs(currentTime - requestTime)
            diff <= allowedWindowMs
        } catch (e: NumberFormatException) {
            false
        }
    }

    private fun generateSignature(apiKey: String, midId: String, timestamp: String, body: String): String {
        val message = "$midId$timestamp$body"
        val mac = Mac.getInstance("HmacSHA256")
        val secretKeySpec = SecretKeySpec(apiKey.toByteArray(Charsets.UTF_8), "HmacSHA256")
        mac.init(secretKeySpec)
        val hash = mac.doFinal(message.toByteArray(Charsets.UTF_8))
        return Base64.getEncoder().encodeToString(hash)
    }

    private fun storeInRequestScope(pgMid: PgMid) {
        try {
            val attributes = RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes
            attributes?.request?.setAttribute("pgMid", pgMid)
        } catch (e: Exception) {
            log.warn("Failed to store pgMid in request scope", e)
        }
    }
}
