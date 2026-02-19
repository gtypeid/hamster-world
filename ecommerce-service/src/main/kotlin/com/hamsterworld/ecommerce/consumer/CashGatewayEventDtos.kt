package com.hamsterworld.ecommerce.consumer

import java.math.BigDecimal

/**
 * PaymentApprovedEvent DTO
 *
 * Cash Gateway에서 발행하는 결제 승인 이벤트
 */
data class PaymentApprovedEventDto(
    val paymentPublicId: String,  // Cash Gateway Payment Public ID (Snowflake Base62)
    val orderPublicId: String?,  // nullable (외부 거래) - Order의 Public ID (Snowflake Base62)
    val userKeycloakId: String?,  // User의 Keycloak Subject ID
    val provider: String,
    val cashGatewayMid: String,  // Cash Gateway MID (≠ PG MID)
    val amount: BigDecimal,
    val pgTransaction: String,
    val pgApprovalNo: String,
    val gatewayPaymentPublicId: String,  // Cash Gateway Payment Public ID
    val originSource: String
)

/**
 * PaymentFailedEvent DTO
 *
 * Cash Gateway에서 발행하는 결제 실패 이벤트
 */
data class PaymentFailedEventDto(
    val attemptPublicId: String,  // PaymentAttempt Public ID (Snowflake Base62)
    val orderPublicId: String?,  // nullable (외부 거래) - Order의 Public ID (Snowflake Base62)
    val userKeycloakId: String?,  // User의 Keycloak Subject ID
    val provider: String?,
    val cashGatewayMid: String,  // Cash Gateway MID (≠ PG MID)
    val amount: BigDecimal,
    val code: String?,
    val message: String?,
    val reason: String?,  // nullable (실패 사유가 없을 수도 있음)
    val originSource: String
)

/**
 * PaymentCancelledEvent DTO
 *
 * Cash Gateway에서 발행하는 결제 취소 이벤트
 */
data class PaymentCancelledEventDto(
    val paymentPublicId: String,  // 취소 Payment Public ID (Snowflake Base62)
    val originPaymentPublicId: String,  // 원본 Payment Public ID (Snowflake Base62)
    val orderPublicId: String?,  // nullable (외부 거래) - Order의 Public ID (Snowflake Base62)
    val userKeycloakId: String?,  // User의 Keycloak Subject ID
    val provider: String,
    val cashGatewayMid: String,  // Cash Gateway MID (≠ PG MID)
    val amount: BigDecimal,
    val pgTransaction: String,
    val pgApprovalNo: String,
    val gatewayPaymentPublicId: String,  // Cash Gateway Payment Public ID
    val originSource: String
)
