package com.hamsterworld.cashgateway.app.payment.dto

/**
 * Cash Gateway 공통 응답 DTO
 *
 * PG 요청 등 비동기 처리 응답에 사용
 */
data class CashGatewayResponse(
    val success: Boolean,
    val message: String,
    val orderPublicId: String? = null,  // Order의 Public ID (Snowflake Base62)
    val attemptPublicId: String? = null  // PaymentAttempt의 Public ID (Snowflake Base62)
)
