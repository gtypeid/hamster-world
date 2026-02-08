package com.hamsterworld.progression.consumer

import java.math.BigDecimal

/**
 * ProductCreatedEvent DTO (Ecommerce Service → Progression Service)
 *
 * ## 수신 시점
 * - Ecommerce Service에서 상품 생성 시
 *
 * ## 처리 내용
 * - Archive 진행도 업데이트 (CREATE_PRODUCT 타입 매칭)
 * - Quota 소비 (CREATE_PRODUCT 타입 매칭)
 *
 * ## 주의사항
 * - ProductCreatedEvent에는 userPublicId가 없음
 * - 상품 생성자 정보가 필요한 경우 별도 처리 필요
 */
data class ProductCreatedEventDto(
    val productPublicId: String,
    val sku: String,
    val name: String,
    val price: BigDecimal,
    val initialStock: Int
)
