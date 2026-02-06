package com.hamsterworld.ecommerce.consumer

import java.math.BigDecimal

/**
 * Payment Service PaymentConfirmedEvent DTO
 *
 * Payment Service → Ecommerce Service
 *
 * ## 처리 내용
 * - Order 상태 → PAID
 * - Payment Service가 Business Truth 확정 완료
 */
data class PaymentConfirmedEventDto(
    val paymentPublicId: String,           // Payment Service Payment Public ID
    val orderPublicId: String,             // Ecommerce Order Public ID
    val amount: BigDecimal,                // 결제 금액
    val status: String,                    // APPROVED, CANCELLED
    val gatewayPaymentPublicId: String     // Cash Gateway Payment Public ID (Communication Truth)
)
