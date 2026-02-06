package com.hamsterworld.payment.domain.product.service

import com.hamsterworld.payment.domain.product.constant.ProductCategory
import com.hamsterworld.payment.domain.product.event.InsufficientProductDto
import com.hamsterworld.payment.domain.product.event.OrderStockValidationFailedEvent
import com.hamsterworld.payment.domain.product.model.Product
import com.hamsterworld.payment.domain.productrecord.model.ProductRecord
import com.hamsterworld.common.domain.eventsourcing.RecordRepository
import com.hamsterworld.payment.consumer.OrderItemDto
import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshot
import com.hamsterworld.payment.domain.product.dto.ProductSearchRequest
import com.hamsterworld.payment.domain.product.repository.ProductRepository
import com.hamsterworld.payment.domain.productrecord.repository.ProductRecordRepository
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
    private val orderSnapshotRepository: com.hamsterworld.payment.domain.ordersnapshot.repository.OrderSnapshotRepository
    // TODO: AttachmentService 제거
    // private val attachmentService: AttachmentService
) {

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
     * OrderCreatedEvent 처리 (재고 검증만)
     *
     * ## 처리 내용
     * 1. 모든 주문 항목의 재고 검증 (차감 안함!)
     * 2. 성공: OrderStockReservedEvent 발행
     * 3. 실패: OrderStockValidationFailedEvent 발행
     *
     * ## 트랜잭션
     * - MANDATORY: BaseKafkaConsumer의 트랜잭션에 참여
     *
     * @param orderPublicId E-commerce Service의 Order Public ID (Snowflake Base62)
     * @param orderNumber 주문 번호
     * @param userPublicId User Public ID (Snowflake Base62)
     * @param totalPrice 총 주문 금액
     * @param items 주문 항목 리스트
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun validateStockForOrder(
        orderPublicId: String,
        orderNumber: String,
        userPublicId: String,
        totalPrice: BigDecimal,
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
            // 실패: OrderStockValidationFailedEvent 발행
            // 트랜잭션 롤백 안함 (이벤트만 발행, 락은 트랜잭션 종료 시 자동 해제)
            val failureReason = "재고 부족: ${insufficientProducts.size}개 상품"
            val failureEvent = OrderStockValidationFailedEvent(
                orderPublicId = orderPublicId,
                orderNumber = orderNumber,
                failureReason = failureReason,
                insufficientProducts = insufficientProducts
            )
            eventPublisher.publishEvent(failureEvent)
        } else {
            // Phase 3: 모든 재고 차감 (선차감)
            lockedProducts.forEach { (product, quantity) ->
                val delta = -quantity
                val reason = "[주문 차감] orderPublicId=$orderPublicId"
                val adjusted = product.updateStockByDelta(delta, reason)
                productRepository.saveAndPublish(adjusted)
            }

            // Phase 4: OrderSnapshot 생성 및 저장
            // - OrderSnapshot.createCompleted()가 OrderStockReservedEvent 등록
            // - JPA save() 시 자동으로 이벤트 발행 → Cash Gateway로 전달
            val snapshot = OrderSnapshot.createCompleted(
                orderPublicId = orderPublicId,
                orderNumber = orderNumber,
                userPublicId = userPublicId,
                totalPrice = totalPrice,
                items = items
            )

            // OrderSnapshot 저장 (JPA save 시 자동으로 도메인 이벤트 발행)
            orderSnapshotRepository.save(snapshot, items)
        }
    }

    /**
     * PaymentCancelledEvent 처리 (재고 복원)
     *
     * ## 처리 내용
     * 1. orderPublicId로 주문 항목 조회
     * 2. 재고 복원 (ProductRecord 생성: delta = +quantity)
     * 3. ProductStockChangedEvent 발행 → E-commerce Service 동기화
     *
     * ## 트랜잭션
     * - MANDATORY: BaseKafkaConsumer의 트랜잭션에 참여
     *
     * ## TODO
     * - 현재는 items를 파라미터로 받음
     * - 추후 orderPublicId로 원본 주문 조회 로직 추가 가능
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
        // Phase 1: ID 정렬 후 락 획득 (Deadlock 방지)
        val sortedItems = items.sortedBy { it.productPublicId }

        sortedItems.forEach { item ->
            // ecommerceProductPublicId로 Product 조회
            val product = productRepository.findByEcommerceProductId(item.productPublicId)

            // 비관 락 획득 + 재집계
            val lockedProduct = recordRepository.writeRecord(product.id!!)

            // 재고 복원 (delta = +quantity)
            val delta = +item.quantity
            val adjusted = lockedProduct.updateStockByDelta(delta, reason)
            productRepository.saveAndPublish(adjusted)
        }
    }
}
