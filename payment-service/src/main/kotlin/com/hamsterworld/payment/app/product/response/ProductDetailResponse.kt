package com.hamsterworld.payment.app.product.response

import com.hamsterworld.payment.domain.product.model.Product

/**
 * Product 상세 응답 DTO
 *
 * Detail API용 - Product + ProductRecord 목록 포함
 */
data class ProductDetailResponse(
    val product: ProductResponse,
    val records: List<ProductRecordResponse>  // 재고 변동 이력
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
