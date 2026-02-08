package com.hamsterworld.progression.consumer

import java.math.BigDecimal

/**
 * OrderCreatedEvent DTO (Ecommerce Service → Progression Service)
 *
 * ## 수신 시점
 * - Ecommerce Service에서 주문 생성 시
 *
 * ## 처리 내용
 * - Archive 진행도 업데이트 (CREATE_ORDER 타입 매칭)
 * - Quota 소비 (CREATE_ORDER 타입 매칭)
 */
data class OrderCreatedEventDto(
    val orderPublicId: String,
    val userPublicId: String,
    val orderNumber: String,
    val totalPrice: BigDecimal,
    val items: List<OrderItemDto>
)

data class OrderItemDto(
    val productPublicId: String,
    val quantity: Int,
    val price: BigDecimal
)
