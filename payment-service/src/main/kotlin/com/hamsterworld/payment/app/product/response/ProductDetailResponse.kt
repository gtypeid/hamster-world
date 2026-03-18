package com.hamsterworld.payment.app.product.response

import com.hamsterworld.payment.domain.product.model.Product

data class ProductDetailResponse(
    val product: ProductResponse,
    val records: List<ProductRecordResponse>
) {
    companion object {
        fun from(
            product: Product,
            records: List<ProductRecordResponse>
        ): ProductDetailResponse {
            return ProductDetailResponse(
                product = ProductResponse.from(product),
                records = records
            )
        }
    }
}
