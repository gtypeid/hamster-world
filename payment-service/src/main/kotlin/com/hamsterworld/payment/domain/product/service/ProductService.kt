package com.hamsterworld.payment.domain.product.service

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

// TODO: AttachmentService 제거 (바운드 컨텍스트 분리)
// TODO: ProductWithAttachments DTO 제거 (간소화)
// TODO: Request DTO들은 API 레이어 추가 시 구현

@Service
class ProductService(
    private val productRepository: ProductRepository,
    private val productRecordRepository: ProductRecordRepository,
    private val recordRepository: RecordRepository<Product>,
    private val eventPublisher: ApplicationEventPublisher,
    private val orderSnapshotRepository: com.hamsterworld.payment.domain.ordersnapshot.repository.OrderSnapshotRepository,
    private val accountService: AccountService
) {
    private val log = LoggerFactory.getLogger(ProductService::class.java)

    // TODO: ProductCreateRequest 대신 직접 파라미터로 변경 (임시)
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

        // TODO: Attachment 기능 제거 (바운드 컨텍스트 분리)
        // val uploadFiles = attachmentService.convertToUploadFiles(request.files)
        // val attachments = attachmentService.createAttachments(...)

        return saved
    }

    // TODO: ProductRecordRequest 대신 직접 파라미터로 변경
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
        // 이벤트 소싱: ProductRecord 이력으로부터 재고 재집계
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

    /**
     * Product 상세 조회 (Public ID로 조회, ProductRecord 포함)
     *
     * @param publicId Product Public ID
     * @return Product + ProductRecord 목록
     */
    @Transactional(readOnly = true)
    fun findProductDetailByPublicId(publicId: String): ProductDetailData {
        val product = productRepository.findByPublicId(publicId)
        val records = productRecordRepository.findByProductId(product.id!!)
        return ProductDetailData(product, records)
    }

    /**
     * Service 레이어 DTO - Product Detail 데이터
     */
    data class ProductDetailData(
        val product: Product,
        val records: List<ProductRecord>
    )

    @Transactional
    fun deleteProduct(id: Long) {
        // TODO: Attachment 삭제 기능 제거
        // attachmentService.deleteAttachments(AttachmentType.PRODUCT, product.attachments)

        productRepository.delete(id)
    }

    // ========== Kafka Event Handlers ==========

    /**
     * ProductCreatedEvent 처리 (from E-commerce Service)
     *
     * ## 처리 내용
     * 1. Product 생성 (최소 메타데이터)
     * 2. ProductRecord INSERT (초기 재고)
     * 3. ProductStockChangedEvent 발행 → E-commerce Service 동기화
     *
     * ## 트랜잭션
     * - MANDATORY: BaseKafkaConsumer의 트랜잭션에 참여
     * - Product 저장 + ProcessedEvent 저장이 하나의 트랜잭션으로 보장됨
     *
     * @param ecommerceProductId E-commerce Service의 Product ID
     * @param sku 상품 SKU
     * @param name 상품명
     * @param price 가격
     * @param initialStock 초기 재고
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun initializeProductFromEvent(
        ecommerceProductPublicId: String,
        sku: String,
        name: String,
        price: BigDecimal,
        initialStock: Int
    ) {
        // Product 생성 (Domain Model)
        val product = Product(
            ecommerceProductId = ecommerceProductPublicId,
            sku = sku,
            name = name,
            price = price,
            stock = initialStock
        )

        // Product 저장 (Domain Event 발행: ProductStockChangedEvent)
        val saved = productRepository.saveAndPublish(product)

        // ProductRecord 생성 (초기 재고)
        val initialRecord = ProductRecord(
            productId = saved.id!!,
            stock = initialStock,
            reason = "초기 재고 설정 (E-commerce 동기화)"
        )
        productRecordRepository.save(initialRecord)
    }

    /**
     * StockAdjustmentRequestedEvent 처리 (from E-commerce Service)
     *
     * ## 처리 내용
     * 1. ecommerceProductId로 Product 조회
     * 2. ProductStockChangedEvent 발행 → ProductEventHandler가 ProductRecord 생성
     * 3. Product.stock 재집계 (ProductEventHandler)
     * 4. ProductStockChangedEvent → E-commerce Service 동기화 (Kafka)
     *
     * ## 트랜잭션
     * - MANDATORY: BaseKafkaConsumer의 트랜잭션에 참여
     * - 재고 조정 + ProcessedEvent 저장이 하나의 트랜잭션으로 보장됨
     *
     * ## 이벤트 소싱
     * - ProductStockChangedEvent → ProductEventHandler → ProductRecord 생성
     * - ProductRecord를 직접 생성하지 않음 (중복 방지)
     *
     * @param ecommerceProductId E-commerce Service의 Product ID
     * @param stock 재고 변경량
     * @param reason 재고 조정 사유
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun adjustStockFromEvent(
        ecommerceProductPublicId: String,
        stock: Int,
        reason: String
    ) {
        // ecommerceProductPublicId로 Product 조회
        val product = productRepository.findByEcommerceProductId(ecommerceProductPublicId)

        // 재고 조정 (delta 방식)
        // → ProductEventHandler가 ProductRecord 생성 (delta 저장) 및 재집계 수행
        val adjusted = product.updateStockByDelta(stock, reason)
        productRepository.saveAndPublish(adjusted)
    }

    /**
     * OrderCreatedEvent 처리 (재고 검증 + 포인트 차감)
     *
     * ## 처리 내용
     * 1. 모든 주문 항목의 재고 검증
     * 2. 포인트 사용 요청 시 잔액 검증 및 차감
     * 3. cashAmount 계산 (= totalPrice - couponDiscount - pointsToUse)
     * 4. 성공: OrderStockReservedEvent 발행 (cashAmount 포함)
     * 5. 실패: OrderStockValidationFailedEvent 발행
     *
     * ## 트랜잭션
     * - MANDATORY: BaseKafkaConsumer의 트랜잭션에 참여
     *
     * @param orderPublicId E-commerce Service의 Order Public ID (Snowflake Base62)
     * @param orderNumber 주문 번호
     * @param userPublicId User Public ID (Snowflake Base62)
     * @param totalPrice 총 주문 금액
     * @param couponDiscount 쿠폰 할인 금액 (ecommerce가 계산한 값, 신뢰)
     * @param pointsToUse 사용할 포인트 금액
     * @param items 주문 항목 리스트
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun validateStockForOrder(
        orderPublicId: String,
        orderNumber: String,
        userPublicId: String,
        totalPrice: BigDecimal,
        couponDiscount: BigDecimal,
        pointsToUse: BigDecimal,
        items: List<OrderItemDto>
    ) {
        // Phase 1: ID 정렬 후 락 획득 + 검증 (Deadlock 방지)
        val sortedItems = items.sortedBy { it.productPublicId }
        val lockedProducts = mutableListOf<Pair<Product, Int>>()
        val insufficientProducts = mutableListOf<InsufficientProductDto>()

        sortedItems.forEach { item ->
            // ecommerceProductPublicId로 Product 조회
            val product = productRepository.findByEcommerceProductId(item.productPublicId)

            // 비관 락 획득 + 재고 재집계 (writeRecord = 락 + 재집계 + 저장)
            val lockedProduct = recordRepository.writeRecord(product.id!!)

            // 재고 검증
            if (lockedProduct.stock < item.quantity) {
                insufficientProducts.add(
                    InsufficientProductDto(
                        productId = item.productPublicId,
                        requestedQuantity = item.quantity,
                        availableStock = lockedProduct.stock
                    )
                )
            } else {
                // 재고 충분 → 차감할 목록에 추가
                lockedProducts.add(Pair(lockedProduct, item.quantity))
            }
        }

        // Phase 2: 검증 결과 처리
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

        // Phase 3: 포인트 검증 및 차감
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

            // 포인트 차감 (Event Sourcing)
            accountService.updateBalanceFromEvent(
                userPublicId = userPublicId,
                accountType = AccountType.CONSUMER,
                delta = pointsToUse.negate(),
                reason = "[주문 포인트 사용] orderPublicId=$orderPublicId"
            )
            actualPointsUsed = pointsToUse
            log.info("[포인트 차감 완료] orderPublicId={}, userPublicId={}, amount={}", orderPublicId, userPublicId, pointsToUse)
        }

        // Phase 4: cashAmount 계산
        val cashAmount = totalPrice.subtract(couponDiscount).subtract(actualPointsUsed)
        log.info("[결제 금액 계산] orderPublicId={}, totalPrice={}, couponDiscount={}, pointsUsed={}, cashAmount={}",
            orderPublicId, totalPrice, couponDiscount, actualPointsUsed, cashAmount)

        // Phase 5: 모든 재고 차감 (선차감)
        lockedProducts.forEach { (product, quantity) ->
            val delta = -quantity
            val reason = "[주문 차감] orderPublicId=$orderPublicId"
            val adjusted = product.updateStockByDelta(delta, reason)
            productRepository.saveAndPublish(adjusted)
        }

        // Phase 6: OrderSnapshot 생성 및 저장
        val snapshot = OrderSnapshot.createCompleted(
            orderPublicId = orderPublicId,
            orderNumber = orderNumber,
            userPublicId = userPublicId,
            totalPrice = totalPrice,
            couponDiscount = couponDiscount,
            pointsUsed = actualPointsUsed,
            cashAmount = cashAmount,
            items = items
        )

        orderSnapshotRepository.save(snapshot, items)
    }

    /**
     * PaymentCancelledEvent / PaymentFailedEvent 처리 (재고 복원 + 포인트 환원)
     *
     * ## 처리 내용
     * 1. 재고 복원 (ProductRecord 생성: delta = +quantity)
     * 2. 포인트 환원 (OrderSnapshot.pointsUsed > 0이면 AccountRecord 생성: delta = +pointsUsed)
     * 3. ProductStockChangedEvent 발행 → E-commerce Service 동기화
     *
     * ## 트랜잭션
     * - MANDATORY: BaseKafkaConsumer의 트랜잭션에 참여
     *
     * @param orderPublicId E-commerce Service의 Order Public ID (Snowflake Base62)
     * @param items 주문 항목 리스트 (복원할 재고)
     * @param reason 복원 사유
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun restoreStockForOrder(
        orderPublicId: String,
        items: List<OrderItemDto>,
        reason: String = "[결제 취소 복원] orderPublicId=$orderPublicId"
    ) {
        // Phase 1: 재고 복원 (ID 정렬 후 락 획득 - Deadlock 방지)
        val sortedItems = items.sortedBy { it.productPublicId }

        sortedItems.forEach { item ->
            val product = productRepository.findByEcommerceProductId(item.productPublicId)
            val lockedProduct = recordRepository.writeRecord(product.id!!)

            val delta = +item.quantity
            val adjusted = lockedProduct.updateStockByDelta(delta, reason)
            productRepository.saveAndPublish(adjusted)
        }

        // Phase 2: 포인트 환원 (OrderSnapshot에서 pointsUsed 조회)
        val snapshot = orderSnapshotRepository.findByOrderPublicId(orderPublicId)
        if (snapshot != null && snapshot.pointsUsed.compareTo(BigDecimal.ZERO) > 0) {
            accountService.updateBalanceFromEvent(
                userPublicId = snapshot.userPublicId,
                accountType = AccountType.CONSUMER,
                delta = snapshot.pointsUsed,  // 양수: 환원
                reason = "[결제 취소 포인트 환원] orderPublicId=$orderPublicId"
            )
            log.info("[포인트 환원 완료] orderPublicId={}, userPublicId={}, amount={}",
                orderPublicId, snapshot.userPublicId, snapshot.pointsUsed)
        }
    }
}
