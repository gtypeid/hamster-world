package com.hamsterworld.ecommerce.domain.product.service

import com.hamsterworld.ecommerce.app.product.request.ProductSearchRequest
import com.hamsterworld.ecommerce.domain.product.constant.ProductCategory
import com.hamsterworld.ecommerce.domain.product.model.Product
import com.hamsterworld.ecommerce.domain.product.repository.ProductRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Service
class ProductService(
    private val productRepository: ProductRepository,
    private val merchantRepository: com.hamsterworld.ecommerce.domain.merchant.repository.MerchantRepository,
    private val boardRepository: com.hamsterworld.ecommerce.domain.board.repository.BoardRepository
) {
    private val log = LoggerFactory.getLogger(ProductService::class.java)

    /**
     * 상품 생성
     *
     * ProductCreatedEvent를 발행하여 Payment Service에 알림
     * (이벤트는 Domain 모델에서 자동 발행)
     */
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
        // 1. SKU 중복 체크
        if (productRepository.existsBySku(sku)) {
            throw IllegalArgumentException("SKU already exists: $sku")
        }

        // 2. Product 생성 (초기 재고로 시작)
        var product = Product(
            merchantId = merchantId,
            sku = sku,
            name = name,
            description = description,
            imageUrl = imageUrl,
            category = category,
            price = price,
            stock = initialStock,
            isSoldOut = false  // 초기 재고가 있으므로 판매 가능
        )

        // 3. Product 저장 (먼저 저장하여 ID 할당)
        product = productRepository.save(product)

        // 4. 이벤트 등록 및 발행 (onCreate()가 이벤트 등록, repository.update()가 발행)
        product = product.onCreate(initialStock)
        product = productRepository.update(product)

        log.info(
            "Product 생성 완료: merchantId={}, productId={}, sku={}, name={}, initialStock={}",
            merchantId, product.id, product.sku, product.name, initialStock
        )

        return product
    }

    /**
     * 상품 메타데이터 업데이트
     *
     * 재고는 Payment Service에서만 관리하므로 여기서는 변경 안 함
     * Kafka 이벤트 발행 안 함 (Payment Service는 메타데이터에 관심 없음)
     */
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

    /**
     * 상품 메타데이터 업데이트 (Public ID 버전)
     */
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

    /**
     * 재고 조정 요청 (관리자)
     *
     * StockAdjustmentRequestedEvent를 발행하여 Payment Service에 요청
     * (이벤트는 Domain 모델에서 자동 발행)
     */
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

        // 이벤트 발행 (requestStockAdjustment()에서 등록한 이벤트가 save() 후 자동 발행됨)
        product.requestStockAdjustment(newStock, reason)
        productRepository.update(product)
    }

    /**
     * 재고 조정 요청 (Public ID 버전)
     */
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

        // 이벤트 발행 (requestStockAdjustment()에서 등록한 이벤트가 save() 후 자동 발행됨)
        product.requestStockAdjustment(newStock, reason)
        productRepository.update(product)
    }

    /**
     * 재고 동기화 (Payment Service로부터)
     *
     * ProductStockSynchronizedEvent를 수신했을 때 호출됨
     */
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

    /**
     * 상품 조회 (단건 - Internal ID)
     */
    @Transactional(readOnly = true)
    fun getProduct(id: Long): Product {
        return productRepository.findById(id)
    }

    /**
     * 상품 조회 (단건 - Public ID)
     */
    @Transactional(readOnly = true)
    fun getProductByPublicId(publicId: String): Product {
        return productRepository.findByPublicId(publicId)
    }

    /**
     * 상품 상세 조회 (Merchant 정보 포함)
     */
    @Transactional(readOnly = true)
    fun getProductDetailByPublicId(publicId: String): Pair<Product, com.hamsterworld.ecommerce.domain.merchant.model.Merchant> {
        val product = productRepository.findByPublicId(publicId)
        val merchant = merchantRepository.findById(product.merchantId)
        return Pair(product, merchant)
    }

    /**
     * 상품 일괄 조회 (Internal IDs)
     *
     * N+1 문제 방지를 위한 IN 쿼리
     */
    @Transactional(readOnly = true)
    fun getProductsByIds(ids: List<Long>): Map<Long, Product> {
        if (ids.isEmpty()) {
            return emptyMap()
        }
        return productRepository.findByIds(ids).associateBy { it.id!! }
    }

    /**
     * 상품 목록 조회 (검색) - 리뷰 통계 포함
     */
    @Transactional(readOnly = true)
    fun searchProducts(request: ProductSearchRequest): List<ProductWithReviewStats> {
        val products = productRepository.search(request)

        if (products.isEmpty()) {
            return emptyList()
        }

        // Batch 조회로 N+1 방지
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

    /**
     * 상품 페이지 조회 (검색 + 페이징) - 리뷰 통계 포함
     */
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

        // Batch 조회로 N+1 방지
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

    /**
     * 상품 상세 조회 (Merchant + Review 통계 포함)
     */
    @Transactional(readOnly = true)
    fun getProductDetailWithReviewStatsByPublicId(
        publicId: String
    ): Triple<Product, com.hamsterworld.ecommerce.domain.merchant.model.Merchant, ProductReviewStats> {
        val product = productRepository.findByPublicId(publicId)
        val merchant = merchantRepository.findById(product.merchantId)

        // 단건이므로 Map 조회
        val reviewStatsMap = boardRepository.getReviewStatsByProductIds(listOf(product.id!!))
        val stats = reviewStatsMap[product.id]
        val reviewStats = ProductReviewStats(
            averageRating = stats?.averageRating ?: 0.0,
            reviewCount = stats?.reviewCount ?: 0
        )

        return Triple(product, merchant, reviewStats)
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
}
