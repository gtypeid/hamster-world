package com.hamsterworld.payment.app.product.response

import com.hamsterworld.payment.domain.productrecord.model.ProductRecord
import java.time.LocalDateTime

/**
 * ProductRecord 응답 DTO (Public ID만 노출)
 *
 * 재고 변동 이력 표시용
 */
data class ProductRecordResponse(
    val recordPublicId: String,
    val productPublicId: String,  // Product의 Public ID
    val stockDelta: Int,  // 재고 변화량 (양수: 증가, 음수: 감소)
    val reason: String,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(
            record: ProductRecord,
            productPublicId: String  // Product 조회 후 전달
        ): ProductRecordResponse {
            return ProductRecordResponse(
                recordPublicId = record.publicId,
                productPublicId = productPublicId,
                stockDelta = record.stock,
                reason = record.reason,
                createdAt = record.createdAt
            )
        }
    }
}
