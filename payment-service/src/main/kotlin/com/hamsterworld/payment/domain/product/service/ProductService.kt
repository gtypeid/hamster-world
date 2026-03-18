package com.hamsterworld.payment.domain.product.service

import com.hamsterworld.payment.app.product.response.ProductDetailResponse
import com.hamsterworld.payment.app.product.response.ProductRecordResponse
import com.hamsterworld.payment.app.product.response.ProductResponse
import com.hamsterworld.payment.domain.product.constant.ProductCategory
import com.hamsterworld.payment.domain.product.event.InsufficientProductDto
import com.hamsterworld.payment.domain.product.event.OrderStockValidationFailedEvent
import com.hamsterworld.payment.domain.product.model.Product
import com.hamsterworld.payment.domain.productrecord.model.ProductRecord
import com.hamsterworld.common.domain.eventsourcing.RecordRepository
import com.hamsterworld.payment.consumer.OrderItemDto
import com.hamsterworld.payment.domain.account.constant.AccountType
import com.hamsterworld.payment.domain.account.service.AccountService
import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshot
import com.hamsterworld.payment.domain.ordersnapshot.repository.OrderSnapshotRepository
import com.hamsterworld.payment.domain.product.dto.ProductSearchRequest
import com.hamsterworld.payment.domain.product.repository.ProductRepository
import com.hamsterworld.payment.domain.productrecord.repository.ProductRecordRepository
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Service
class ProductService(
    private val productRepository: ProductRepository,
    private val productRecordRepository: ProductRecordRepository,
    private val recordRepository: RecordRepository<Product>,
    private val eventPublisher: ApplicationEventPublisher,
    private val orderSnapshotRepository: OrderSnapshotRepository,
    private val accountService: AccountService
) {
    private val log = LoggerFactory.getLogger(ProductService::class.java)

    @Transactional
    fun createProduct(
        name: String,
        price: BigDecimal,
        description: String?,
        stock: Int,
        category: ProductCategory
    ): Product {
        val newProduct = Product(
            name = name,
            price = price,
            description = description,
            stock = stock,
            category = category
        )

        val saved = productRepository.save(newProduct)
        val initialRecord = ProductRecord(
            productId = saved.id!!,
            stock = saved.stock,
            reason = "상품 초기 수량"
        )

        productRecordRepository.save(initialRecord)

        return saved
    }

    @Transactional
    fun addProductRecord(
        productId: Long,
        quantityChange: Int,
        reason: String = "API, 레코드 추가"
    ) {
        val product = productRepository.findById(productId)
        val updatedProduct = product.updateStockByDelta(quantityChange, reason)
        productRepository.saveAndPublish(updatedProduct)
    }

    @Transactional(readOnly = true)
    fun findProduct(id: Long): Product {
        return productRepository.findById(id)
    }

    @Transactional
    fun findProductRecord(id: Long): Product {
        val product = recordRepository.writeRecord(id)
        return productRepository.findById(product.id!!)
    }

    @Transactional(readOnly = true)
    fun searchProducts(search: ProductSearchRequest): List<Product> {
        return productRepository.findAll(search)
    }

    @Transactional(readOnly = true)
    fun searchProductPage(
        search: ProductSearchRequest
    ): Page<Product> {
        val pagedSearch = search.copy(paged = true)
        return productRepository.findAllPage(pagedSearch)
    }

    @Transactional(readOnly = true)
    fun findProductDetailByPublicId(publicId: String): ProductDetailData {
        val product = productRepository.findByPublicId(publicId)
        val records = productRecordRepository.findByProductId(product.id!!)
        return ProductDetailData(product, records)
    }

    data class ProductDetailData(
        val product: Product,
        val records: List<ProductRecord>
    )

    @Transactional(readOnly = true)
    fun searchProductResponses(search: ProductSearchRequest): List<ProductResponse> {
        val products = productRepository.findAll(search)
        return products.map { ProductResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun searchProductResponsePage(search: ProductSearchRequest): Page<ProductResponse> {
        val pagedSearch = search.copy(paged = true)
        val productsPage = productRepository.findAllPage(pagedSearch)
        return productsPage.map { ProductResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun findProductDetailResponseByPublicId(publicId: String): ProductDetailResponse {
        val detailData = findProductDetailByPublicId(publicId)

        val recordResponses = detailData.records.map { record ->
            ProductRecordResponse.from(
                record = record,
                productPublicId = detailData.product.publicId
            )
        }

        return ProductDetailResponse.from(
            product = detailData.product,
            records = recordResponses
        )
    }

    @Transactional
    fun deleteProduct(id: Long) {

        productRepository.delete(id)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    fun initializeProductFromEvent(
        ecommerceProductPublicId: String,
        sku: String,
        name: String,
        price: BigDecimal,
        initialStock: Int
    ) {
        val product = Product(
            ecommerceProductId = ecommerceProductPublicId,
            sku = sku,
            name = name,
            price = price,
            stock = initialStock
        )

        val saved = productRepository.saveAndPublish(product)

        val initialRecord = ProductRecord(
            productId = saved.id!!,
            stock = initialStock,
            reason = "초기 재고 설정 (E-commerce 동기화)"
        )
        productRecordRepository.save(initialRecord)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    fun adjustStockFromEvent(
        ecommerceProductPublicId: String,
        stock: Int,
        reason: String
    ) {
        val product = productRepository.findByEcommerceProductId(ecommerceProductPublicId)

        val adjusted = product.updateStockByDelta(stock, reason)
        productRepository.saveAndPublish(adjusted)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    fun validateStockForOrder(
        orderPublicId: String,
        orderNumber: String,
        userPublicId: String,
        userKeycloakId: String,
        totalPrice: BigDecimal,
        couponDiscount: BigDecimal,
        pointsToUse: BigDecimal,
        items: List<OrderItemDto>
    ) {
        val sortedItems = items.sortedBy { it.productPublicId }
        val lockedProducts = mutableListOf<Pair<Product, Int>>()
        val insufficientProducts = mutableListOf<InsufficientProductDto>()

        sortedItems.forEach { item ->
            val product = productRepository.findByEcommerceProductId(item.productPublicId)

            val lockedProduct = recordRepository.writeRecord(product.id!!)

            if (lockedProduct.stock < item.quantity) {
                insufficientProducts.add(
                    InsufficientProductDto(
                        productId = item.productPublicId,
                        requestedQuantity = item.quantity,
                        availableStock = lockedProduct.stock
                    )
                )
            } else {
                lockedProducts.add(Pair(lockedProduct, item.quantity))
            }
        }

        if (insufficientProducts.isNotEmpty()) {
            val failureReason = "재고 부족: ${insufficientProducts.size}개 상품"
            val failureEvent = OrderStockValidationFailedEvent(
                orderPublicId = orderPublicId,
                orderNumber = orderNumber,
                failureReason = failureReason,
                insufficientProducts = insufficientProducts
            )
            eventPublisher.publishEvent(failureEvent)
            return
        }

        var actualPointsUsed = BigDecimal.ZERO
        if (pointsToUse.compareTo(BigDecimal.ZERO) > 0) {
            val account = accountService.findAccountByUserPublicIdAndType(userPublicId, AccountType.CONSUMER)

            if (account == null || account.balance < pointsToUse) {
                val availableBalance = account?.balance ?: BigDecimal.ZERO
                log.warn("[포인트 부족] orderPublicId={}, 요청={}, 잔액={}", orderPublicId, pointsToUse, availableBalance)
                val failureEvent = OrderStockValidationFailedEvent(
                    orderPublicId = orderPublicId,
                    orderNumber = orderNumber,
                    failureReason = "포인트 잔액 부족: 요청=${pointsToUse}, 잔액=${availableBalance}",
                    insufficientProducts = emptyList()
                )
                eventPublisher.publishEvent(failureEvent)
                return
            }

            accountService.updateBalanceFromEvent(
                userPublicId = userPublicId,
                accountType = AccountType.CONSUMER,
                delta = pointsToUse.negate(),
                reason = "[주문 포인트 사용] orderPublicId=$orderPublicId"
            )
            actualPointsUsed = pointsToUse
            log.info("[포인트 차감 완료] orderPublicId={}, userPublicId={}, amount={}", orderPublicId, userPublicId, pointsToUse)
        }

        val cashAmount = totalPrice.subtract(couponDiscount).subtract(actualPointsUsed)
        log.info("[결제 금액 계산] orderPublicId={}, totalPrice={}, couponDiscount={}, pointsUsed={}, cashAmount={}",
            orderPublicId, totalPrice, couponDiscount, actualPointsUsed, cashAmount)

        lockedProducts.forEach { (product, quantity) ->
            val delta = -quantity
            val reason = "[주문 차감] orderPublicId=$orderPublicId"
            val adjusted = product.updateStockByDelta(delta, reason)
            productRepository.saveAndPublish(adjusted)
        }

        val snapshot = OrderSnapshot.createCompleted(
            orderPublicId = orderPublicId,
            orderNumber = orderNumber,
            userPublicId = userPublicId,
            userKeycloakId = userKeycloakId,
            totalPrice = totalPrice,
            couponDiscount = couponDiscount,
            pointsUsed = actualPointsUsed,
            cashAmount = cashAmount,
            items = items
        )

        orderSnapshotRepository.save(snapshot, items)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    fun restoreStockForOrder(
        orderPublicId: String,
        items: List<OrderItemDto>,
        reason: String = "[결제 취소 복원] orderPublicId=$orderPublicId"
    ) {
        val sortedItems = items.sortedBy { it.productPublicId }

        sortedItems.forEach { item ->
            val product = productRepository.findByEcommerceProductId(item.productPublicId)
            val lockedProduct = recordRepository.writeRecord(product.id!!)

            val delta = +item.quantity
            val adjusted = lockedProduct.updateStockByDelta(delta, reason)
            productRepository.saveAndPublish(adjusted)
        }

        val snapshot = orderSnapshotRepository.findByOrderPublicId(orderPublicId)
        if (snapshot != null && snapshot.pointsUsed.compareTo(BigDecimal.ZERO) > 0) {
            accountService.updateBalanceFromEvent(
                userPublicId = snapshot.userPublicId,
                accountType = AccountType.CONSUMER,
                delta = snapshot.pointsUsed,
                reason = "[결제 취소 포인트 환원] orderPublicId=$orderPublicId"
            )
            log.info("[포인트 환원 완료] orderPublicId={}, userPublicId={}, amount={}",
                orderPublicId, snapshot.userPublicId, snapshot.pointsUsed)
        }
    }
}
