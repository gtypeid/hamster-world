package com.hamsterworld.ecommerce.consumer

/**
 * ProductStockSynchronizedEvent DTO (from Payment Service)
 *
 * Payment Service에서 발행하는 재고 동기화 이벤트를 역직렬화하기 위한 DTO
 *
 * ## 필드 설명
 * - productPublicId: Payment Service의 Product publicId (Snowflake Base62)
 * - ecommerceProductId: E-commerce Service의 Product publicId (Snowflake Base62)
 * - stock: 현재 재고 수량 (절대값)
 * - isSoldOut: 품절 여부
 * - reason: 재고 변경 사유
 */
data class ProductStockSynchronizedEventDto(
    val productPublicId: String,
    val ecommerceProductId: String,  // Changed from Long to String (Public ID)
    val stock: Int,
    val isSoldOut: Boolean,
    val reason: String
)

// Keep old DTO for backward compatibility during migration
@Deprecated("Use ProductStockSynchronizedEventDto instead")
data class ProductStockChangedEventDto(
    val productPublicId: String,
    val ecommerceProductId: String,
    val stock: Int,
    val isSoldOut: Boolean,
    val reason: String
)
