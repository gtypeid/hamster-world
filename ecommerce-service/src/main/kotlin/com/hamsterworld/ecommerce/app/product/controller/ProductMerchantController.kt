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
@RestController
@RequestMapping("/api/merchant/products")
class ProductMerchantController(
    private val productService: ProductService
) {
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
