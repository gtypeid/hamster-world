package com.hamsterworld.ecommerce.domain.product.service
import com.hamsterworld.ecommerce.app.product.dto.ProductCouponInfo
import com.hamsterworld.ecommerce.app.product.dto.ProductDetailResponse
import com.hamsterworld.ecommerce.app.product.dto.ProductResponse
import com.hamsterworld.ecommerce.app.product.request.ProductSearchRequest
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponStatus
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponPolicyProductRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponPolicyRepository
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import com.hamsterworld.ecommerce.domain.product.constant.ProductCategory
import com.hamsterworld.ecommerce.domain.product.model.Product
import com.hamsterworld.ecommerce.domain.product.repository.ProductRepository
import com.hamsterworld.ecommerce.domain.merchant.repository.MerchantRepository
import com.hamsterworld.ecommerce.domain.board.repository.BoardRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime
@Service
class ProductService(
    private val productRepository: ProductRepository,
    private val merchantRepository: MerchantRepository,
    private val boardRepository: BoardRepository,
    private val couponPolicyProductRepository: CouponPolicyProductRepository,
    private val couponPolicyRepository: CouponPolicyRepository
) {
    private val log = LoggerFactory.getLogger(ProductService::class.java)
    @Transactional
    fun createProduct(
        merchantId: Long,
        sku: String,
        name: String,
        description: String?,
        imageUrl: String?,
        category: ProductCategory,
        price: BigDecimal,
        initialStock: Int
    ): Product {
        if (productRepository.existsBySku(sku)) {
            throw IllegalArgumentException("SKU already exists: $sku")
        }
        var product = Product(
            merchantId = merchantId,
            sku = sku,
            name = name,
            description = description,
            imageUrl = imageUrl,
            category = category,
            price = price,
            stock = initialStock,
            isSoldOut = false
        )
        product = productRepository.save(product)
        product = product.onCreate(initialStock)
        product = productRepository.update(product)
        log.info(
            "Product 생성 완료: merchantId={}, productId={}, sku={}, name={}, initialStock={}",
            merchantId, product.id, product.sku, product.name, initialStock
        )
        return product
    }
    @Transactional
    fun updateProductMetadata(
        id: Long,
        name: String,
        description: String?,
        imageUrl: String?,
        category: ProductCategory,
        price: BigDecimal
    ): Product {
        val product = productRepository.findById(id)
        val updated = product.updateMetadata(
            name = name,
            description = description,
            imageUrl = imageUrl,
            category = category,
            price = price
        )
        val saved = productRepository.update(updated)
        log.info(
            "Product 메타데이터 업데이트 완료: productId={}, name={}",
            saved.id, saved.name
        )
        return saved
    }
    @Transactional
    fun updateProductMetadataByPublicId(
        publicId: String,
        name: String,
        description: String?,
        imageUrl: String?,
        category: ProductCategory,
        price: BigDecimal
    ): Product {
        val product = productRepository.findByPublicId(publicId)
        val updated = product.updateMetadata(
            name = name,
            description = description,
            imageUrl = imageUrl,
            category = category,
            price = price
        )
        val saved = productRepository.update(updated)
        log.info(
            "Product 메타데이터 업데이트 완료: publicId={}, name={}",
            saved.publicId, saved.name
        )
        return saved
    }
    @Transactional
    fun requestStockAdjustment(
        id: Long,
        newStock: Int,
        reason: String
    ) {
        val product = productRepository.findById(id)
        log.info(
            "재고 조정 요청: productId={}, sku={}, stock={}, reason={}",
            product.id, product.sku, newStock, reason
        )
        product.requestStockAdjustment(newStock, reason)
        productRepository.update(product)
    }
    @Transactional
    fun requestStockAdjustmentByPublicId(
        publicId: String,
        newStock: Int,
        reason: String
    ) {
        val product = productRepository.findByPublicId(publicId)
        log.info(
            "재고 조정 요청: publicId={}, sku={}, stock={}, reason={}",
            product.publicId, product.sku, newStock, reason
        )
        product.requestStockAdjustment(newStock, reason)
        productRepository.update(product)
    }
    @Transactional(propagation = Propagation.MANDATORY)
    fun syncStock(productPublicId: String, stock: Int, isSoldOut: Boolean) {
        val product = productRepository.findByPublicId(productPublicId)
        val synced = product.syncStock(stock, isSoldOut)
        productRepository.update(synced)
        log.info(
            "재고 동기화 완료: productPublicId={}, stock={}, isSoldOut={}",
            productPublicId, stock, isSoldOut
        )
    }
    @Transactional(readOnly = true)
    fun getProduct(id: Long): Product {
        return productRepository.findById(id)
    }
    @Transactional(readOnly = true)
    fun getProductByPublicId(publicId: String): Product {
        return productRepository.findByPublicId(publicId)
    }
    @Transactional(readOnly = true)
    fun getProductDetailByPublicId(publicId: String): Pair<Product, Merchant> {
        val product = productRepository.findByPublicId(publicId)
        val merchant = merchantRepository.findById(product.merchantId)
        return Pair(product, merchant)
    }
    @Transactional(readOnly = true)
    fun getProductsByIds(ids: List<Long>): Map<Long, Product> {
        if (ids.isEmpty()) {
            return emptyMap()
        }
        return productRepository.findByIds(ids).associateBy { it.id!! }
    }
    @Transactional(readOnly = true)
    fun searchProducts(request: ProductSearchRequest): List<ProductWithReviewStats> {
        val products = productRepository.search(request)
        if (products.isEmpty()) {
            return emptyList()
        }
        val productIds = products.map { it.id!! }.distinct()
        val reviewStatsMap = boardRepository.getReviewStatsByProductIds(productIds)
        return products.map { product ->
            val stats = reviewStatsMap[product.id]
            ProductWithReviewStats(
                product = product,
                averageRating = stats?.averageRating ?: 0.0,
                reviewCount = stats?.reviewCount ?: 0
            )
        }
    }
    @Transactional(readOnly = true)
    fun searchProductsPage(request: ProductSearchRequest): Page<ProductWithReviewStats> {
        val productsPage = productRepository.searchPage(request)
        if (productsPage.isEmpty) {
            return productsPage.map {
                ProductWithReviewStats(
                    product = it,
                    averageRating = 0.0,
                    reviewCount = 0
                )
            }
        }
        val productIds = productsPage.content.map { it.id!! }.distinct()
        val reviewStatsMap = boardRepository.getReviewStatsByProductIds(productIds)
        return productsPage.map { product ->
            val stats = reviewStatsMap[product.id]
            ProductWithReviewStats(
                product = product,
                averageRating = stats?.averageRating ?: 0.0,
                reviewCount = stats?.reviewCount ?: 0
            )
        }
    }
    @Transactional(readOnly = true)
    fun getProductDetailWithReviewStatsByPublicId(
        publicId: String
    ): ProductDetailResult {
        val product = productRepository.findByPublicId(publicId)
        val merchant = merchantRepository.findById(product.merchantId)
        val reviewStatsMap = boardRepository.getReviewStatsByProductIds(listOf(product.id!!))
        val stats = reviewStatsMap[product.id]
        val reviewStats = ProductReviewStats(
            averageRating = stats?.averageRating ?: 0.0,
            reviewCount = stats?.reviewCount ?: 0
        )
        val now = LocalDateTime.now()
        val productSpecificCoupons = couponPolicyProductRepository.findByProductId(product.id!!)
            .mapNotNull { cpp ->
                try {
                    couponPolicyRepository.findById(cpp.couponPolicyId)
                } catch (e: Exception) {
                    null
                }
            }
            .filter { it.status == CouponStatus.ACTIVE && now in it.validFrom..it.validUntil }
        val universalCoupons = couponPolicyRepository.findUniversalActivePolicies()
        val coupons = (productSpecificCoupons + universalCoupons)
            .distinctBy { it.id }
            .map { ProductCouponInfo.from(it) }
        return ProductDetailResult(
            product = product,
            merchant = merchant,
            reviewStats = reviewStats,
            coupons = coupons
        )
    }
    @Transactional(readOnly = true)
    fun getProductDetailResponseByPublicId(publicId: String): ProductDetailResponse {
        val detail = getProductDetailWithReviewStatsByPublicId(publicId)
        return ProductDetailResponse.from(
            detail.product,
            detail.merchant,
            detail.reviewStats.averageRating,
            detail.reviewStats.reviewCount,
            detail.coupons
        )
    }
    @Transactional(readOnly = true)
    fun searchProductsAsDtoList(request: ProductSearchRequest): List<ProductResponse> {
        val productsWithStats = searchProducts(request)
        return productsWithStats.map {
            ProductResponse.from(it.product, it.averageRating, it.reviewCount)
        }
    }
    @Transactional(readOnly = true)
    fun searchProductsAsDtoPage(request: ProductSearchRequest): Page<ProductResponse> {
        val pageWithStats = searchProductsPage(request)
        return pageWithStats.map {
            ProductResponse.from(it.product, it.averageRating, it.reviewCount)
        }
    }
    @Transactional
    fun createProductAndReturnDto(
        merchantId: Long,
        sku: String,
        name: String,
        description: String?,
        imageUrl: String?,
        category: ProductCategory,
        price: BigDecimal,
        initialStock: Int
    ): ProductResponse {
        val product = createProduct(merchantId, sku, name, description, imageUrl, category, price, initialStock)
        return ProductResponse.from(product, 0.0, 0)
    }
    @Transactional
    fun updateProductMetadataByPublicIdAndReturnDto(
        publicId: String,
        name: String,
        description: String?,
        imageUrl: String?,
        category: ProductCategory,
        price: BigDecimal
    ): ProductResponse {
        val product = updateProductMetadataByPublicId(publicId, name, description, imageUrl, category, price)
        return ProductResponse.from(product, 0.0, 0)
    }
    data class ProductWithReviewStats(
        val product: Product,
        val averageRating: Double,
        val reviewCount: Int
    )
    data class ProductReviewStats(
        val averageRating: Double,
        val reviewCount: Int
    )
    data class ProductDetailResult(
        val product: Product,
        val merchant: Merchant,
        val reviewStats: ProductReviewStats,
        val coupons: List<ProductCouponInfo>
    )
}
