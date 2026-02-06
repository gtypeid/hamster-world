package com.hamsterworld.ecommerce.consumer

import java.math.BigDecimal

/**
 * Payment Service PaymentProcessFailedEvent DTO
 *
 * Payment Service → Ecommerce Service
 *
 * ## 처리 내용
 * - Order 상태 → PAYMENT_FAILED
 * - Payment Service가 실패 확정 완료 (재고 복원도 완료됨)
 */
data class PaymentProcessFailedEventDto(
    val processPublicId: String,    // PaymentProcess Public ID
    val orderPublicId: String,      // Ecommerce Order Public ID
    val amount: BigDecimal,         // 결제 시도 금액
    val reason: String?,            // 실패 사유
    val code: String?,              // 실패 코드
    val message: String?            // 실패 메시지
)
