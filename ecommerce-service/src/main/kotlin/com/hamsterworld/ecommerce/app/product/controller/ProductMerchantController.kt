package com.hamsterworld.ecommerce.app.product.controller

import com.hamsterworld.ecommerce.app.product.dto.ProductResponse
import com.hamsterworld.ecommerce.app.product.request.AdjustStockRequest
import com.hamsterworld.ecommerce.app.product.request.CreateProductRequest
import com.hamsterworld.ecommerce.app.product.request.UpdateProductRequest
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import com.hamsterworld.ecommerce.domain.product.service.ProductService
import com.hamsterworld.ecommerce.web.resolver.AuthenticatedMerchant
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Product 판매자(Merchant) API
 *
 * ## 책임
 * - 상품 생성/수정
 * - 재고 조정 요청
 *
 * ## 엔드포인트
 * - POST   /api/merchant/products           → 상품 생성
 * - PUT    /api/merchant/products/{id}      → 상품 메타데이터 수정
 * - POST   /api/merchant/products/{id}/adjust-stock  → 재고 조정
 */
@RestController
@RequestMapping("/api/merchant/products")
class ProductMerchantController(
    private val productService: ProductService
) {

    /**
     * 상품 생성
     *
     * POST /api/merchant/products
     * {
     *   "sku": "PROD-001",
     *   "name": "노트북",
     *   "description": "고성능 노트북",
     *   "imageUrl": "https://example.com/image.jpg",
     *   "category": "ELECTRONICS",
     *   "price": 1500000,
     *   "initialStock": 100
     * }
     *
     * Response:
     * - 201 Created: 상품 생성 성공
     * - 400 Bad Request: SKU 중복 등
     * - 403 Forbidden: 머천트 등록 필요
     */
    @PostMapping
    fun createProduct(
        @AuthenticatedMerchant merchant: Merchant,
        @RequestBody request: CreateProductRequest
    ): ResponseEntity<ProductResponse> {
        val response = productService.createProductAndReturnDto(
            merchantId = merchant.id!!,
            sku = request.sku,
            name = request.name,
            description = request.description,
            imageUrl = request.imageUrl,
            category = request.category,
            price = request.price,
            initialStock = request.initialStock
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    /**
     * 상품 메타데이터 수정
     *
     * PUT /api/merchant/products/{publicId}
     * {
     *   "name": "고성능 노트북",
     *   "description": "업그레이드된 고성능 노트북",
     *   "imageUrl": "https://example.com/image2.jpg",
     *   "category": "ELECTRONICS",
     *   "price": 1600000
     * }
     *
     * Response:
     * - 200 OK: 수정 성공
     * - 404 Not Found: 상품 없음
     */
    @PutMapping("/{publicId}")
    fun updateProduct(
        @PathVariable publicId: String,
        @RequestBody request: UpdateProductRequest
    ): ResponseEntity<ProductResponse> {
        return ResponseEntity.ok(
            productService.updateProductMetadataByPublicIdAndReturnDto(
                publicId = publicId,
                name = request.name,
                description = request.description,
                imageUrl = request.imageUrl,
                category = request.category,
                price = request.price
            )
        )
    }

    /**
     * 재고 조정 요청
     *
     * POST /api/merchant/products/{publicId}/adjust-stock
     * {
     *   "amount": 50,
     *   "reason": "추가 입고"
     * }
     *
     * Response:
     * - 202 Accepted: 재고 조정 요청 접수 (Payment Service에서 처리)
     * - 404 Not Found: 상품 없음
     */
    @PostMapping("/{publicId}/adjust-stock")
    fun adjustStock(
        @PathVariable publicId: String,
        @RequestBody request: AdjustStockRequest
    ): ResponseEntity<Void> {
        productService.requestStockAdjustmentByPublicId(
            publicId = publicId,
            newStock = request.stock,
            reason = request.reason
        )

        return ResponseEntity.accepted().build()
    }
}
