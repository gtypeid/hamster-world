package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

/**
 * Payment Context (PG 요청 컨텍스트)
 *
 * ## 변경 사항
 * - 기존: payment: Payment? 필드 포함
 * - 변경: Payment 제거 (Cash Gateway는 PaymentProcess만 관리)
 * - 이유: Payment는 Payment Service의 Business Truth, Cash Gateway는 Communication Truth
 *
 * ## MID 정책
 * - cashGatewayMid: Cash Gateway가 발급한 가맹점 식별자 (≠ PG MID)
 * - Cash Gateway MID → PG MID 변환은 Provider 내부에서 수행
 * - 외부 서비스는 MID를 직접 지정하지 않음 (userKeycloakId 기반으로 Cash Gateway가 결정)
 */
abstract class PaymentCtx(
    val paymentStatus: PaymentStatus,
    val userKeycloakId: String,    // User의 Keycloak Subject ID (외부 시스템 UUID)
    val orderPublicId: String,    // E-commerce Service의 Order Public ID (Snowflake Base62)
    val orderNumber: String,
    val amount: BigDecimal,
    val cashGatewayMid: String  // Cash Gateway MID (Cash Gateway가 발급한 가맹점 식별자, ≠ PG MID)
)
