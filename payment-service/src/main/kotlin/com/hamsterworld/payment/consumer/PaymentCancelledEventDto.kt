package com.hamsterworld.payment.consumer

import java.math.BigDecimal

/**
 * PaymentCancelledEvent DTO
 *
 * Cash Gateway에서 발행하는 결제 취소 이벤트
 */
data class PaymentCancelledEventDto(
    val paymentPublicId: String,
    val originPaymentPublicId: String,
    val orderPublicId: String?,  // nullable (외부 거래) - Order의 Public ID (Snowflake Base62)
    val userKeycloakId: String?,       // nullable (외부 거래) - User의 Keycloak Subject ID
    val provider: String,
    val cashGatewayMid: String,        // Cash Gateway MID (≠ PG MID)
    val amount: BigDecimal,
    val pgTransaction: String,
    val pgApprovalNo: String,
    val gatewayPaymentPublicId: String,  // Cash Gateway Payment Public ID
    val originSource: String
)
