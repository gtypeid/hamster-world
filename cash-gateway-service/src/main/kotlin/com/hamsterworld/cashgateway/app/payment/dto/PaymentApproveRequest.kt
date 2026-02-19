package com.hamsterworld.cashgateway.app.payment.dto

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import java.math.BigDecimal

/**
 * 내부 결제 승인 요청 DTO (ecommerce → cash-gateway → PG)
 *
 * ## MID 정책
 * - 외부 서비스가 Cash Gateway MID를 직접 지정하지 않음
 * - Cash Gateway가 userKeycloakId를 기반으로 CashGatewayMid를 자체 조회
 * - userKeycloakId: Keycloak이 발급한 유저 ID (범용 식별자)
 */
data class PaymentApproveRequest(
    val orderPublicId: String,      // E-commerce Service의 Order Public ID (Snowflake Base62)
    val userKeycloakId: String,     // Keycloak 유저 ID (Cash Gateway가 이 값으로 CashGatewayMid를 자체 조회)
    val amount: BigDecimal,         // 결제 금액
    val provider: Provider,         // PG사 (DUMMY, TOSS, etc.)
    val orderNumber: String         // 주문 번호 (문자열)
    // cashGatewayMid 제거됨: Cash Gateway가 userKeycloakId로 자체 조회
)
