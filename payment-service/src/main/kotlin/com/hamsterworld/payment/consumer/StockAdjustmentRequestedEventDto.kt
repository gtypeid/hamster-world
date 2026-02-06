package com.hamsterworld.payment.consumer

/**
 * StockAdjustmentRequestedEvent DTO (from E-commerce Service)
 *
 * E-commerce Service에서 발행한 StockAdjustmentRequestedEvent를 수신하기 위한 DTO
 *
 * ## 역할
 * - Kafka 메시지 역직렬화
 * - Payment Service ProductRecord 생성에 필요한 정보 포함
 *
 * @property productPublicId E-commerce Service Product의 Public ID (Snowflake Base62)
 * @property stock 재고 변경량 (+50: 입고, -10: 차감)
 * @property reason 재고 조정 사유
 */
data class StockAdjustmentRequestedEventDto(
    val productPublicId: String,
    val stock: Int,
    val reason: String
)
