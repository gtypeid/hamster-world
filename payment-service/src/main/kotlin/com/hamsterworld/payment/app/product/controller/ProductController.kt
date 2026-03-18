package com.hamsterworld.payment.app.product.controller

import com.hamsterworld.payment.app.product.response.ProductDetailResponse
import com.hamsterworld.payment.app.product.response.ProductResponse
import com.hamsterworld.payment.domain.product.dto.ProductSearchRequest
import com.hamsterworld.payment.domain.product.service.ProductService
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/products")
class ProductController(
    private val productService: ProductService
) {

    @GetMapping("/list")
    fun getProductList(
        request: ProductSearchRequest
    ): ResponseEntity<List<ProductResponse>> {
        return ResponseEntity.ok(productService.searchProductResponses(request))
    }

    @GetMapping("/page")
    fun getProductPage(
        request: ProductSearchRequest
    ): ResponseEntity<Page<ProductResponse>> {
        return ResponseEntity.ok(productService.searchProductResponsePage(request))
    }

    @GetMapping("/{publicId}")
    fun getProductDetail(
        @PathVariable publicId: String
    ): ResponseEntity<ProductDetailResponse> {
        return ResponseEntity.ok(productService.findProductDetailResponseByPublicId(publicId))
    }
}
