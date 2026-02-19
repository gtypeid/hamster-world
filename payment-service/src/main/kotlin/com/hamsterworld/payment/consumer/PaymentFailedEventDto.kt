package com.hamsterworld.payment.consumer

import java.math.BigDecimal

/**
 * Cash Gateway PaymentFailedEvent DTO
 *
 * Cash Gateway → Payment Service
 *
 * ## 처리 내용
 * - Payment는 생성하지 않음 (실패는 기록 안 함)
 * - PaymentProcessFailedEvent 발행 → Ecommerce Service (Order PAYMENT_FAILED)
 */
data class PaymentFailedEventDto(
    val processPublicId: String,    // PaymentProcess Public ID
    val orderPublicId: String?,     // nullable (외부 거래)
    val userKeycloakId: String?,     // nullable (외부 거래) - User의 Keycloak Subject ID
    val provider: String?,          // Provider.name
    val cashGatewayMid: String,     // Cash Gateway MID (≠ PG MID)
    val amount: BigDecimal,
    val orderNumber: String?,
    val code: String?,
    val message: String?,
    val reason: String?,
    val originSource: String
)
