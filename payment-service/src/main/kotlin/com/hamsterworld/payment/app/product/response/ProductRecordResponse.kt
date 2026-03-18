package com.hamsterworld.payment.app.product.response

import com.hamsterworld.payment.domain.productrecord.model.ProductRecord
import java.time.LocalDateTime

data class ProductRecordResponse(
    val recordPublicId: String,
    val productPublicId: String,
    val stockDelta: Int,
    val reason: String,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(
            record: ProductRecord,
            productPublicId: String
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
