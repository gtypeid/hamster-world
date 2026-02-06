package com.hamsterworld.payment.app.product.controller

import com.hamsterworld.payment.app.product.response.ProductDetailResponse
import com.hamsterworld.payment.app.product.response.ProductRecordResponse
import com.hamsterworld.payment.app.product.response.ProductResponse
import com.hamsterworld.payment.domain.product.dto.ProductSearchRequest
import com.hamsterworld.payment.domain.product.service.ProductService
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Product API Controller
 *
 * Internal Admin용 Product 조회 API
 */
@RestController
@RequestMapping("/api/products")
class ProductController(
    private val productService: ProductService
) {

    /**
     * Product 목록 조회 (List)
     *
     * GET /api/products/list?name=...&from=...&to=...&sort=...
     */
    @GetMapping("/list")
    fun getProductList(
        request: ProductSearchRequest
    ): ResponseEntity<List<ProductResponse>> {
        val products = productService.searchProducts(request)
        val responses = products.map { ProductResponse.from(it) }
        return ResponseEntity.ok(responses)
    }

    /**
     * Product 목록 조회 (Page)
     *
     * GET /api/products/page?page=0&size=20&name=...&sort=...
     */
    @GetMapping("/page")
    fun getProductPage(
        request: ProductSearchRequest
    ): ResponseEntity<Page<ProductResponse>> {
        val productsPage = productService.searchProductPage(request)
        val responses = productsPage.map { ProductResponse.from(it) }
        return ResponseEntity.ok(responses)
    }

    /**
     * Product 상세 조회 (Product + ProductRecords)
     *
     * GET /api/products/{publicId}
     *
     * @param publicId Product Public ID (Snowflake Base62)
     * @return Product + ProductRecord 목록 (재고 변동 이력)
     */
    @GetMapping("/{publicId}")
    fun getProductDetail(
        @PathVariable publicId: String
    ): ResponseEntity<ProductDetailResponse> {
        val detailData = productService.findProductDetailByPublicId(publicId)

        // ProductRecord 변환 시 productPublicId 전달 필요
        val recordResponses = detailData.records.map { record ->
            ProductRecordResponse.from(
                record = record,
                productPublicId = detailData.product.publicId
            )
        }

        val response = ProductDetailResponse.from(
            product = detailData.product,
            records = recordResponses
        )

        return ResponseEntity.ok(response)
    }
}
