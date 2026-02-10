package com.hamsterworld.payment.consumer

import java.math.BigDecimal

/**
 * OrderCreatedEvent DTO (from E-commerce Service)
 *
 * E-commerce Service에서 발행한 OrderCreatedEvent를 수신하기 위한 DTO
 *
 * ## 역할
 * - Kafka 메시지 역직렬화
 * - Payment Service에서 재고 차감 및 ProductRecord 생성에 필요한 정보 포함
 *
 * @property orderPublicId E-commerce Service Order의 Public ID
 * @property userPublicId User의 Public ID (Snowflake Base62)
 * @property orderNumber 주문 번호
 * @property totalPrice 총 주문 금액
 * @property items 주문 항목 리스트
 */
data class OrderCreatedEventDto(
    val orderPublicId: String,
    val userPublicId: String,
    val orderNumber: String,
    val totalPrice: BigDecimal,
    val items: List<OrderItemDto>,
    // 쿠폰/포인트 (nullable: ecommerce가 아직 안 보내면 null → 0 처리)
    val couponDiscount: BigDecimal? = null,
    val pointsToUse: BigDecimal? = null
)

/**
 * 주문 항목 DTO
 *
 * @property productPublicId E-commerce Service Product의 Public ID
 * @property quantity 주문 수량
 * @property price 단가
 */
data class OrderItemDto(
    val productPublicId: String,
    val quantity: Int,
    val price: BigDecimal
)
