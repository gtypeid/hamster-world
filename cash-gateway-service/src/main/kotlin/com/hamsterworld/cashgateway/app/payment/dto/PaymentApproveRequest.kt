package com.hamsterworld.cashgateway.app.payment.dto

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import java.math.BigDecimal

/**
 * 내부 결제 승인 요청 DTO (ecommerce → cash-gateway → PG)
 *
 * Case 1: 이커머스에서 결제 요청
 * - ecommerce가 Cash Gateway를 통해 PG에 결제 요청
 * - PG 요청 후 Webhook으로 최종 결과 수신
 */
data class PaymentApproveRequest(
    val orderPublicId: String,      // E-commerce Service의 Order Public ID (Snowflake Base62)
    val userPublicId: String,       // E-commerce Service의 User Public ID (Snowflake Base62)
    val amount: BigDecimal,         // 결제 금액
    val provider: Provider,         // PG사 (DUMMY, TOSS, etc.)
    val orderNumber: String,        // 주문 번호 (문자열)
    val cashGatewayMid: String      // Cash Gateway 발급 MID (PgMerchantMapping 조회용)
)
