package com.hamsterworld.ecommerce.consumer

/**
 * OrderStockValidationFailedEvent DTO (Payment Service → Ecommerce Service)
 *
 * ## 수신 시점
 * - Payment Service에서 재고 검증 실패 시
 *
 * ## 처리 내용
 * - Order 상태를 PAYMENT_FAILED로 변경
 * - 재고 부족 사유 저장
 */
data class OrderStockValidationFailedEventDto(
    val orderPublicId: String,  // E-commerce Service의 Order Public ID (Snowflake Base62)
    val orderNumber: String,
    val failureReason: String,
    val insufficientProducts: List<InsufficientProductDto>
)

data class InsufficientProductDto(
    val productId: String,  // E-commerce Service의 Product Public ID (Snowflake Base62)
    val requestedQuantity: Int,
    val availableStock: Int
)
