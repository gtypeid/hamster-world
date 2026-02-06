package com.hamsterworld.cashgateway.consumer

import java.math.BigDecimal

/**
 * OrderStockReservedEvent DTO (Payment Service → Cash-Gateway Service)
 *
 * ## 수신 시점
 * - Payment Service에서 재고 검증 + 차감 성공 시 (선차감 완료)
 *
 * ## 처리 내용
 * - PaymentAttempt 생성
 * - PG 결제 요청
 */
data class OrderStockReservedEventDto(
    val orderPublicId: String,  // E-commerce Service의 Order Public ID (Snowflake Base62)
    val userPublicId: String,   // E-commerce Service의 User Public ID (Snowflake Base62)
    val orderNumber: String,
    val totalPrice: BigDecimal,
    val items: List<OrderItemDto>
)

data class OrderItemDto(
    val productId: String,      // Product의 Public ID (Snowflake Base62)
    val quantity: Int,
    val price: BigDecimal
)
