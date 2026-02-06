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
 */
abstract class PaymentCtx(
    val paymentStatus: PaymentStatus,
    val userPublicId: String,     // E-commerce Service의 User Public ID (Snowflake Base62)
    val orderPublicId: String,    // E-commerce Service의 Order Public ID (Snowflake Base62)
    val orderNumber: String,
    val amount: BigDecimal,
    val mid: String  // MID (Merchant ID)
)
