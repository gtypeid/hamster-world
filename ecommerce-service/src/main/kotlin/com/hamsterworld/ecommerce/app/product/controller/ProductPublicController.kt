package com.hamsterworld.ecommerce.app.product.controller

import com.hamsterworld.ecommerce.app.product.dto.ProductDetailResponse
import com.hamsterworld.ecommerce.app.product.dto.ProductResponse
import com.hamsterworld.ecommerce.app.product.request.ProductSearchRequest
import com.hamsterworld.ecommerce.domain.product.service.ProductService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Product Public API (비로그인 사용자 접근 가능)
 *
 * ## 책임
 * - 상품 조회 (목록, 단건, 검색)
 * - JWT 인증 불필요 (Public API)
 *
 * ## 엔드포인트
 * - GET /api/public/products/{id}   → 상품 단건 조회
 * - GET /api/public/products/list   → 상품 목록 조회 (검색)
 * - GET /api/public/products/page   → 상품 페이지 조회 (검색 + 페이징)
 */
@RestController
@RequestMapping("/api/public/products")
@Tag(name = "상품 (Public)", description = "상품 조회 Public API")
class ProductPublicController(
    private val productService: ProductService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Operation(summary = "상품 상세 조회", description = "상품 Public ID로 상품 상세 정보를 조회합니다 (판매자 정보 + 리뷰 통계 포함)")
    @GetMapping("/{publicId}")
    fun getProduct(
        @PathVariable publicId: String
    ): ResponseEntity<ProductDetailResponse> {
        log.info("Getting product detail: publicId=$publicId")

        return ResponseEntity.ok(productService.getProductDetailResponseByPublicId(publicId))
    }

    @Operation(summary = "상품 목록 조회", description = "검색 조건에 맞는 상품 목록을 조회합니다 (리뷰 통계 포함)")
    @GetMapping("/list")
    fun searchProductList(
        @ModelAttribute search: ProductSearchRequest
    ): ResponseEntity<List<ProductResponse>> {
        log.info(
            "Searching products (list): sku={}, name={}, category={}, onlyAvailable={}",
            search.sku, search.name, search.category, search.onlyAvailable
        )

        val responses = productService.searchProductsAsDtoList(search)

        log.info("Found ${responses.size} products")

        return ResponseEntity.ok(responses)
    }

    @Operation(summary = "상품 페이지 조회", description = "검색 조건에 맞는 상품을 페이징하여 조회합니다 (리뷰 통계 포함)")
    @GetMapping("/page")
    fun searchProductPage(
        @ModelAttribute search: ProductSearchRequest
    ): ResponseEntity<Page<ProductResponse>> {
        log.info("Searching products (page): page=${search.page}, size=${search.size}")

        val responses = productService.searchProductsAsDtoPage(search)

        log.info("Found ${responses.totalElements} products (page ${responses.number}/${responses.totalPages})")

        return ResponseEntity.ok(responses)
    }
}
