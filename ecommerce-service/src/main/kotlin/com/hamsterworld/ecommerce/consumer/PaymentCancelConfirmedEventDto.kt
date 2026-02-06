package com.hamsterworld.ecommerce.consumer

import java.math.BigDecimal

/**
 * Payment Service PaymentCancelConfirmedEvent DTO
 *
 * Payment Service → Ecommerce Service
 *
 * ## 처리 내용
 * - Order 상태 → CANCELED
 * - Payment Service가 취소 확정 완료 (Payment 생성 + 재고 복원 완료)
 */
data class PaymentCancelConfirmedEventDto(
    val paymentPublicId: String,        // Payment Service Payment Public ID (취소 Payment)
    val orderPublicId: String,          // Ecommerce Order Public ID
    val amount: BigDecimal,             // 취소 금액
    val originPaymentPublicId: String,  // 원본 Payment Public ID
    val status: String                  // CANCELLED
)
