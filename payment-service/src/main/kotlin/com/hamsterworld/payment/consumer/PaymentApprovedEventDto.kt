package com.hamsterworld.payment.consumer

import java.math.BigDecimal

/**
 * Cash Gateway PaymentApprovedEvent DTO
 *
 * Cash Gateway → Payment Service
 *
 * ## 처리 내용
 * - OrderSnapshot 조회 (orderPublicId)
 * - Payment 생성 (Payment + OrderSnapshot 트랜잭션)
 * - PaymentConfirmedEvent 발행 → Ecommerce Service
 */
data class PaymentApprovedEventDto(
    val paymentPublicId: String,          // PaymentProcess Public ID
    val orderPublicId: String?,           // nullable (외부 거래)
    val userKeycloakId: String?,           // nullable (외부 거래) - User의 Keycloak Subject ID
    val provider: String,                 // Provider.name
    val cashGatewayMid: String,           // Cash Gateway MID (≠ PG MID)
    val amount: BigDecimal,
    val pgTransaction: String,            // PG 거래번호
    val pgApprovalNo: String,             // PG 승인번호
    val gatewayPaymentPublicId: String,   // Cash Gateway Payment Public ID
    val originSource: String              // 거래 출처
)
