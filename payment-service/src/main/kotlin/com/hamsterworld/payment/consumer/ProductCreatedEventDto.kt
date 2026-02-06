package com.hamsterworld.payment.consumer

import java.math.BigDecimal

/**
 * ProductCreatedEvent DTO (from E-commerce Service)
 *
 * E-commerce Service에서 발행한 ProductCreatedEvent를 수신하기 위한 DTO
 *
 * ## 역할
 * - Kafka 메시지 역직렬화
 * - Payment Service Product 생성에 필요한 최소 정보만 포함
 *
 * @property productPublicId E-commerce Service Product의 Public ID (Snowflake Base62)
 * @property sku 상품 SKU (UNIQUE, 멱등성 2차 체크용)
 * @property name 상품명 (로깅용)
 * @property price 가격
 * @property initialStock 초기 재고
 */
data class ProductCreatedEventDto(
    val productPublicId: String,
    val sku: String,
    val name: String,
    val price: BigDecimal,
    val initialStock: Int
)
