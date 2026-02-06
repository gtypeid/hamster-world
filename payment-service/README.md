# Payment Service

> **🔒 INTERNAL ONLY - HTTP API 노출 금지**
> 메인 README 읽은 후 이 문서를 읽으세요.

**정산/재고/권한 관리 (완전 내부 전용)**

---

## 서비스 개요

**역할:** 정산/재고/권한 관리 (INTERNAL ONLY - Kafka 리액티브 전용)

### 비즈니스 위치

```
┌────────────────────────────────────────────┐
│  Hamster World (결제 중개 플랫폼)           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ├─ Ecommerce Service (벤더용 SaaS)       │
│  ├─ Cash Gateway Service (결제 방화벽)    │
│  └─ Payment Service (이 서비스) ⭐         │
│     └─ 🔒 사용자는 존재조차 모르는 서비스  │
└────────────────────────────────────────────┘
```

### 핵심 특징
- 🔒 **INTERNAL ONLY**: HTTP API 노출 안 함!
- 📡 **리액티브 전용**: Kafka 이벤트만 구독
- 👻 **투명한 서비스**: 사용자는 Ecommerce를 통해 간접 사용
- 🎯 **단일 책임**: 재고 관리의 유일한 소유자 (Master)

### 책임 범위
- ✅ **재고 관리 (Master)**: Product + Stock의 유일한 소유자
- ✅ **Event Sourcing**: ProductRecord 기반 재고 이력 추적 (Delta 방식)
- ✅ **주문 재고 검증**: 선차감 (Pre-deduction) + Two-Phase Locking
- ✅ **재고 복원**: 결제 취소 시 재고 복원
- ✅ **OrderSnapshot**: 결제 취소 시 복원용 스냅샷 저장
- ✅ **정산 계산**: 수수료 계산 로직
- ✅ **권한 관리**: 벤더 권한 처리
- ❌ **HTTP API 금지**: PRIVATE 서비스, Kafka만 사용
- ❌ **Order 참조 금지**: Ecommerce Service 소유 도메인

### 아키텍처 위치
```
Ecommerce Service (벤더용 SaaS)
   ↓ Kafka (ProductCreatedEvent, StockAdjustmentRequestedEvent, OrderCreatedEvent)
Payment Service (이 서비스) ⭐ REACTIVE ONLY
   ↓ Kafka (ProductStockChangedEvent, OrderStockReservedEvent, OrderStockValidationFailedEvent)
   ↓
├─→ Ecommerce Service (재고 캐시 동기화)
└─→ Cash Gateway Service (PG 요청 진행)
```

**전체 플로우:**
```
[1] Ecommerce: OrderCreatedEvent 발행
    ↓
[2] Payment Service: 재고 검증 (validateStockForOrder)
    - Phase 1: ID 정렬 + 비관 락 획득 (Deadlock 방지)
    - Phase 2: 재고 검증 (재고 충분 여부)
    - Phase 3: 재고 차감 (선차감 - Product.updateStockByDelta)
    - Phase 4: OrderSnapshot 생성 및 저장
    ↓
[3-A] 재고 충분: OrderStockReservedEvent 발행 + OrderSnapshot 저장
      → Cash Gateway가 PG 요청 진행
[3-B] 재고 부족: OrderStockValidationFailedEvent 발행
      → Ecommerce가 Order.status = PAYMENT_FAILED 처리
    ↓
[4] Cash Gateway: PaymentCancelledEvent 발행 (PG 실패/취소 시)
    ↓
[5] Payment Service: 재고 복원 (restoreStockForOrder)
    - OrderSnapshot 조회 (findByOrderIdWithItems)
    - Product.updateStockByDelta (+수량)
```

---

## 📁 프로젝트 구조

```
payment-service/
├── db/
│   ├── products.sql                        # Product 테이블
│   ├── product_records.sql                 # ProductRecord 테이블 (Event Sourcing)
│   ├── product_order_snapshots.sql         # OrderSnapshot 테이블 (결제 취소용)
│   └── product_order_snapshot_items.sql    # OrderSnapshotItem 테이블
│
└── src/main/kotlin/com/hamsterworld/payment/
    │
    ├── domain/
    │   │
    │   ├── product/                        # Product 도메인
    │   │   ├── model/Product.kt            # Aggregate Root
    │   │   │   - updateStockByDelta()      # 재고 변경 (delta 방식)
    │   │   │   - completeOrder()           # ❌ 제거됨 (OrderSnapshot으로 이동)
    │   │   │
    │   │   ├── event/
    │   │   │   ├── ProductStockChangedEvent.kt      # 재고 변경 이벤트
    │   │   │   ├── OrderStockReservedEvent.kt       # 재고 확보 완료 (선차감)
    │   │   │   └── OrderStockValidationFailedEvent.kt  # 재고 부족 실패
    │   │   │
    │   │   ├── service/ProductService.kt
    │   │   │   - validateStockForOrder()   # 재고 검증 + 선차감
    │   │   │   - restoreStockForOrder()    # 재고 복원
    │   │   │
    │   │   ├── repository/ProductRepository.kt
    │   │   │   - writeRecord()             # 비관 락 + 재고 재집계
    │   │   │   - saveAndPublish()          # JPA save + 도메인 이벤트 발행
    │   │   │
    │   │   └── handler/ProductEventHandler.kt
    │   │       - handleProductStockChanged() # ProductRecord 생성
    │   │
    │   ├── productrecord/                  # ProductRecord 도메인 (Event Sourcing)
    │   │   ├── model/ProductRecord.kt      # 재고 변경 이력 (delta 저장)
    │   │   └── repository/ProductRecordRepository.kt
    │   │
    │   └── ordersnapshot/                  # OrderSnapshot 도메인 ⭐ NEW
    │       ├── model/
    │       │   ├── OrderSnapshot.kt        # 주문 스냅샷 (Rich Domain Model)
    │       │   │   - createCompleted()     # 팩토리 메서드 (OrderStockReservedEvent 발행)
    │       │   │
    │       │   └── OrderSnapshotItem.kt    # 주문 항목 스냅샷
    │       │
    │       ├── dto/
    │       │   └── OrderSnapshotWithItems.kt  # OrderSnapshot + items (명시적)
    │       │
    │       └── repository/
    │           ├── OrderSnapshotRepository.kt     # Domain Repository
    │           │   - save(snapshot, items)        # OrderSnapshot + Items 저장
    │           │   - findByOrderId()              # OrderSnapshot만 조회
    │           │   - findByOrderIdWithItems()     # OrderSnapshot + Items 조회
    │           │
    │           ├── OrderSnapshotJpaRepository.kt  # Spring Data JPA
    │           └── OrderSnapshotItemJpaRepository.kt
    │
    └── consumer/
        ├── EcommerceEventConsumer.kt       # Ecommerce 이벤트 수신
        │   - handleProductCreated()        # Product 초기화
        │   - handleStockAdjustmentRequested()  # 재고 조정
        │   - handleOrderCreated()          # 재고 검증 + 선차감 ⭐
        │
        └── CashGatewayEventConsumer.kt     # Cash Gateway 이벤트 수신
            - handlePaymentCancelled()      # 재고 복원 ⭐
```

---

## 🎯 핵심 구현: 재고 관리 (Stock Management)

### 1. Product 도메인 (Aggregate Root)

```kotlin
// domain/product/model/Product.kt
@Entity
@Table(name = "products")
class Product(
    @Column(name = "ecommerce_product_id")
    var ecommerceProductId: Long? = null,  // E-commerce Product ID (FK)

    @Column(nullable = false, unique = true, length = 100)
    var sku: String = "",

    @Column(nullable = false)
    var name: String = "",

    @Column(nullable = false)
    var price: BigDecimal = BigDecimal.ZERO,

    @Column(nullable = false)
    var stock: Int = 0,  // ⭐ 현재 재고 (재집계된 값)

    @Column(nullable = false)
    var isSoldOut: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var category: ProductCategory = ProductCategory.ELECTRONICS,

    var lastRecordedAt: LocalDateTime? = null
) : AbsDomain() {

    /**
     * 재고 변경 (이벤트 소싱 - Delta 방식)
     *
     * @param delta 재고 변화량 (양수: 증가, 음수: 감소)
     * @param reason 변경 사유
     * @return 변경된 Product
     */
    fun updateStockByDelta(delta: Int, reason: String): Product {
        // 현재 재고에 delta 적용
        val newStock = this.stock + delta
        this.stock = newStock
        this.isSoldOut = newStock <= 0
        this.lastRecordedAt = LocalDateTime.now()

        // ProductStockChangedEvent 발행 (delta 전달)
        // - ProductEventHandler가 수신하여 ProductRecord 생성
        // - Kafka 자동 발행 (PaymentDomainEvent)
        registerEvent(
            ProductStockChangedEvent(
                productPublicId = this.publicId,
                ecommerceProductId = this.ecommerceProductId!!,
                stockDelta = delta,  // 변화량 (delta)
                stock = newStock,    // 현재 재고 (캐시용)
                isSoldOut = this.isSoldOut,
                reason = reason
            )
        )

        return this
    }
}
```

**핵심 원칙:**
- **Delta 방식**: 변화량만 저장 (절대값 X)
- **이벤트 소싱**: ProductRecord에 delta 기록 → 재집계
- **도메인 이벤트**: registerEvent()로 등록 → JPA save 시 자동 발행

---

### 2. ProductRecord (Event Sourcing)

```kotlin
// domain/productrecord/model/ProductRecord.kt
@Entity
@Table(name = "product_records")
class ProductRecord(
    @Column(name = "product_id", nullable = false)
    var productId: Long,

    @Column(nullable = false)
    var stock: Int,  // ⭐ Delta 값 (양수/음수)

    @Column(nullable = false, length = 500)
    var reason: String  // 변경 사유
) : AbsDomain()
```

**DB 예시:**
```sql
-- 초기 재고 100
INSERT INTO product_records (product_id, stock, reason)
VALUES (1, +100, '초기 재고 설정');

-- 주문 차감 5개
INSERT INTO product_records (product_id, stock, reason)
VALUES (1, -5, '[주문 차감] orderId=123');

-- 결제 취소 복원 5개
INSERT INTO product_records (product_id, stock, reason)
VALUES (1, +5, '[결제 취소 복원] orderId=123');

-- 재집계: 100 - 5 + 5 = 100
SELECT SUM(stock) FROM product_records WHERE product_id = 1;
```

---

### 3. ProductRepository (비관 락 + 재집계)

```kotlin
// domain/product/repository/ProductRepository.kt
@Repository
class ProductRepository(
    private val productJpaRepository: ProductJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory,
    private val eventPublisher: ApplicationEventPublisher
) : RecordRepository<Product> {

    /**
     * ProductRecord 이력으로부터 재고를 재계산하고 DB에 저장 (쓰기)
     * 비관적 락으로 동시성 제어
     */
    @Transactional(propagation = Propagation.MANDATORY, isolation = Isolation.READ_COMMITTED)
    override fun writeRecord(id: Long): Product {
        // 1. 비관 락 획득 (FOR UPDATE)
        val lockedEntity = productJpaRepository.findByIdForUpdate(id)
            .orElseThrow { CustomRuntimeException("상품을 찾을 수 없습니다. ID: $id") }

        // 2. ProductRecord 이력 재집계
        val calculatedStock = jpaQueryFactory
            .select(productRecord.stock.sum())
            .from(productRecord)
            .where(productRecord.productId.eq(id))
            .fetchOne()

        val totalStock = calculatedStock ?: 0
        if (totalStock < 0) {
            throw CustomRuntimeException("재고 불일치: 음수 재고 (productId=$id, stock=$totalStock)")
        }

        // 3. 재집계된 재고로 업데이트
        lockedEntity.stock = totalStock
        lockedEntity.isSoldOut = totalStock <= 0
        lockedEntity.lastRecordedAt = LocalDateTime.now()

        return productJpaRepository.save(lockedEntity)
    }

    /**
     * Product 저장 + 도메인 이벤트 발행
     */
    @Transactional
    fun saveAndPublish(product: Product): Product {
        // JPA save → Spring Data가 @DomainEvents 메서드 자동 호출 → 이벤트 발행
        return productJpaRepository.save(product)
    }
}
```

**핵심 포인트:**
- `writeRecord()`: 비관 락 + 재고 재집계
- `saveAndPublish()`: Spring Data JPA가 자동으로 도메인 이벤트 발행
- `MANDATORY`: 부모 트랜잭션에 참여 (Kafka Consumer의 REQUIRES_NEW에 의존)

---

### 4. ProductService (재고 검증 + 선차감)

```kotlin
// domain/product/service/ProductService.kt
@Service
class ProductService(
    private val productRepository: ProductRepository,
    private val productRecordRepository: ProductRecordRepository,
    private val recordRepository: RecordRepository<Product>,
    private val eventPublisher: ApplicationEventPublisher,
    private val orderSnapshotRepository: OrderSnapshotRepository
) {

    /**
     * OrderCreatedEvent 처리 (재고 검증 + 선차감)
     *
     * ## 처리 내용
     * 1. 모든 주문 항목의 재고 검증 (차감 안함!)
     * 2. 성공: 재고 차감 + OrderSnapshot 저장 + OrderStockReservedEvent 발행
     * 3. 실패: OrderStockValidationFailedEvent 발행
     *
     * ## 트랜잭션
     * - MANDATORY: BaseKafkaConsumer의 트랜잭션에 참여
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun validateStockForOrder(
        orderId: Long,
        orderNumber: String,
        userId: Long,
        totalPrice: BigDecimal,
        items: List<OrderItemDto>
    ) {
        // Phase 1: ID 정렬 후 락 획득 + 검증 (Deadlock 방지)
        val sortedItems = items.sortedBy { it.productId }
        val lockedProducts = mutableListOf<Pair<Product, Int>>()
        val insufficientProducts = mutableListOf<InsufficientProductDto>()

        sortedItems.forEach { item ->
            // ecommerceProductId로 Product 조회
            val product = productRepository.findByEcommerceProductId(item.productId)

            // 비관 락 획득 + 재고 재집계 (writeRecord = 락 + 재집계 + 저장)
            val lockedProduct = recordRepository.writeRecord(product.id!!)

            // 재고 검증
            if (lockedProduct.stock < item.quantity) {
                insufficientProducts.add(
                    InsufficientProductDto(
                        productId = item.productId,
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
            val failureReason = "재고 부족: ${insufficientProducts.size}개 상품"
            val failureEvent = OrderStockValidationFailedEvent(
                orderId = orderId,
                orderNumber = orderNumber,
                failureReason = failureReason,
                insufficientProducts = insufficientProducts
            )
            eventPublisher.publishEvent(failureEvent)
        } else {
            // Phase 3: 모든 재고 차감 (선차감)
            lockedProducts.forEach { (product, quantity) ->
                val delta = -quantity
                val reason = "[주문 차감] orderId=$orderId"
                val adjusted = product.updateStockByDelta(delta, reason)
                productRepository.saveAndPublish(adjusted)
            }

            // Phase 4: OrderSnapshot 생성 및 저장
            // - OrderSnapshot.createCompleted()가 OrderStockReservedEvent 등록
            // - JPA save() 시 자동으로 이벤트 발행 → Cash Gateway로 전달
            val snapshot = OrderSnapshot.createCompleted(
                orderId = orderId,
                orderNumber = orderNumber,
                userId = userId,
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
     * 1. orderId로 OrderSnapshot 조회 (findByOrderIdWithItems)
     * 2. 재고 복원 (ProductRecord 생성: delta = +quantity)
     * 3. ProductStockChangedEvent 발행 → E-commerce Service 동기화
     *
     * ## 트랜잭션
     * - MANDATORY: BaseKafkaConsumer의 트랜잭션에 참여
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun restoreStockForOrder(
        orderId: Long,
        items: List<OrderItemDto>,
        reason: String = "[결제 취소 복원] orderId=$orderId"
    ) {
        // Phase 1: ID 정렬 후 락 획득 (Deadlock 방지)
        val sortedItems = items.sortedBy { it.productId }

        sortedItems.forEach { item ->
            // ecommerceProductId로 Product 조회
            val product = productRepository.findByEcommerceProductId(item.productId)

            // 비관 락 획득 + 재집계
            val lockedProduct = recordRepository.writeRecord(product.id!!)

            // 재고 복원 (delta = +quantity)
            val delta = +item.quantity
            val adjusted = lockedProduct.updateStockByDelta(delta, reason)
            productRepository.saveAndPublish(adjusted)
        }
    }
}
```

**Two-Phase Locking (Deadlock 방지):**
```kotlin
// Phase 1: ID 정렬 후 락 획득
val sortedItems = items.sortedBy { it.productId }  // ⭐ 모든 스레드가 동일한 순서로 락 획득

// 스레드 A: 상품 3 → 5 순서로 락
// 스레드 B: 상품 3 → 5 순서로 락 (A 대기)
// → 순환 대기 불가능 → Deadlock 없음 ✅
```

---

## 🛒 OrderSnapshot 도메인 (2026-02-01 세션 완성)

### 1. OrderSnapshot Model

```kotlin
// domain/ordersnapshot/model/OrderSnapshot.kt
@Entity
@Table(
    name = "product_order_snapshots",
    indexes = [
        Index(name = "idx_order_id", columnList = "order_id", unique = true),
        Index(name = "idx_order_number", columnList = "order_number")
    ]
)
class OrderSnapshot(
    @Column(name = "order_id", nullable = false)
    var orderId: Long,

    @Column(name = "order_number", nullable = false)
    var orderNumber: String,

    @Column(name = "user_id", nullable = false)
    var userId: Long,

    @Column(name = "total_price", nullable = false, precision = 15, scale = 3)
    var totalPrice: BigDecimal
) : AbsDomain() {

    companion object {
        /**
         * OrderSnapshot 생성 (재고 검증 및 차감 성공 후)
         *
         * ## 발행 이벤트
         * - OrderStockReservedEvent: Cash Gateway에 PG 요청 지시
         *
         * ## 도메인 의미
         * - OrderSnapshot 생성 = 재고 차감 완료 = 결제 진행 가능 상태
         * - 여러 상품의 재고 차감이 모두 성공했음을 하나로 묶어서 표현
         *
         * @return OrderSnapshot (이벤트 등록됨)
         */
        fun createCompleted(
            orderId: Long,
            orderNumber: String,
            userId: Long,
            totalPrice: BigDecimal,
            items: List<OrderItemDto>
        ): OrderSnapshot {
            val snapshot = OrderSnapshot(
                orderId = orderId,
                orderNumber = orderNumber,
                userId = userId,
                totalPrice = totalPrice
            )

            // OrderStockReservedEvent 발행 (Cash Gateway에 PG 요청 지시)
            snapshot.registerEvent(
                OrderStockReservedEvent(
                    orderId = orderId,
                    userId = userId,
                    orderNumber = orderNumber,
                    totalPrice = totalPrice,
                    items = items.map { item ->
                        com.hamsterworld.payment.domain.product.event.OrderItemDto(
                            productId = item.productId,
                            quantity = item.quantity,
                            price = item.price
                        )
                    }
                )
            )

            return snapshot
        }
    }
}
```

**핵심 설계 결정:**
- **OrderSnapshot이 주문 완료 책임**
  - Product는 재고 관리만 담당
  - OrderSnapshot은 "여러 상품의 재고 차감 완료"를 표현
  - OrderStockReservedEvent 발행 (결제 진행 지시)

- **items 필드 없음**
  - OrderSnapshot에는 items 필드를 포함하지 않음
  - OrderSnapshotWithItems DTO로 명시적으로 표현

---

### 2. OrderSnapshotWithItems DTO

```kotlin
// domain/ordersnapshot/dto/OrderSnapshotWithItems.kt
data class OrderSnapshotWithItems(
    val snapshot: OrderSnapshot,
    val items: List<OrderItemDto>
) {
    val orderId: Long get() = snapshot.orderId
    val orderNumber: String get() = snapshot.orderNumber
}
```

**왜 DTO가 필요한가?**
- `OrderSnapshot`에 `@Transient items` 필드가 있으면 "items가 로드되었는지 안되었는지" 불명확
- `OrderSnapshotWithItems`는 "items가 반드시 있음"을 명시적으로 표현
- 버그 방지: `snapshot.items`에 접근했는데 empty list인 경우 방지

---

### 3. OrderSnapshotRepository

```kotlin
// domain/ordersnapshot/repository/OrderSnapshotRepository.kt
@Repository
class OrderSnapshotRepository(
    private val orderSnapshotJpaRepository: OrderSnapshotJpaRepository,
    private val orderSnapshotItemJpaRepository: OrderSnapshotItemJpaRepository
) {

    /**
     * OrderSnapshot + OrderSnapshotItems 저장
     *
     * @param snapshot OrderSnapshot
     * @param items 주문 항목 리스트
     * @return 저장된 OrderSnapshot
     */
    fun save(snapshot: OrderSnapshot, items: List<OrderItemDto>): OrderSnapshot {
        // 1. OrderSnapshot 저장 (PK 할당)
        val savedSnapshot = orderSnapshotJpaRepository.save(snapshot)

        // 2. OrderSnapshotItems 저장
        val itemEntities = items.map { item ->
            OrderSnapshotItem(
                snapshotId = savedSnapshot.id!!,
                productId = item.productId,
                quantity = item.quantity,
                price = item.price
            )
        }
        orderSnapshotItemJpaRepository.saveAll(itemEntities)

        return savedSnapshot
    }

    /**
     * OrderSnapshot만 조회 (items 없음)
     */
    fun findByOrderId(orderId: Long): OrderSnapshot? {
        return orderSnapshotJpaRepository.findByOrderId(orderId)
    }

    /**
     * OrderSnapshot + Items 조회
     */
    fun findByOrderIdWithItems(orderId: Long): OrderSnapshotWithItems? {
        // 1. OrderSnapshot 조회
        val snapshot = orderSnapshotJpaRepository.findByOrderId(orderId) ?: return null

        // 2. OrderSnapshotItems 조회
        val itemEntities = orderSnapshotItemJpaRepository.findBySnapshotId(snapshot.id!!)

        // 3. OrderItemDto로 변환
        val items = itemEntities.map { item ->
            OrderItemDto(
                productId = item.productId,
                quantity = item.quantity,
                price = item.price
            )
        }

        return OrderSnapshotWithItems(
            snapshot = snapshot,
            items = items
        )
    }
}
```

**DB 구조:**
```
product_order_snapshots (부모)
  id (PK)
  order_id (UNIQUE)
  order_number
  user_id
  total_price

product_order_snapshot_items (자식)
  id (PK)
  snapshot_id (FK 아님! 물리적 관계 X)
  product_id
  quantity
  price
```

**왜 FK 관계가 없는가?**
- 유연성: 나중에 OrderSnapshot 삭제 시 Items만 남기는 등의 정책 변경 가능
- 성능: FK 제약 조건 없이 빠른 JOIN
- 논리적 관계: 필요할 때 JOIN으로 조회

---

## 🔄 Kafka Event Consumers

### EcommerceEventConsumer

```kotlin
// consumer/EcommerceEventConsumer.kt
@Component
class EcommerceEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    private val productService: ProductService
) : BaseKafkaConsumer(objectMapper, processedEventRepository) {

    @KafkaListener(
        topics = ["ecommerce-events"],
        containerFactory = "kafkaListenerContainerFactory"
    )
    fun consume(message: String, ack: Acknowledgment) {
        super.consumeEvent(message, ack)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    override fun handleEvent(parsedEvent: ParsedEvent) {
        when (parsedEvent.eventType) {
            "ProductCreatedEvent" -> handleProductCreated(parsedEvent)
            "StockAdjustmentRequestedEvent" -> handleStockAdjustmentRequested(parsedEvent)
            "OrderCreatedEvent" -> handleOrderCreated(parsedEvent)  // ⭐
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }

    /**
     * OrderCreatedEvent 처리 (재고 검증 + 선차감)
     */
    private fun handleOrderCreated(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<OrderCreatedEventDto>(parsedEvent.payload)

        productService.validateStockForOrder(
            orderId = event.orderId,
            orderNumber = event.orderNumber,
            userId = event.userId,
            totalPrice = event.totalPrice,
            items = event.items
        )
    }
}
```

---

### CashGatewayEventConsumer

```kotlin
// consumer/CashGatewayEventConsumer.kt
@Component
class CashGatewayEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    private val productService: ProductService,
    private val orderSnapshotRepository: OrderSnapshotRepository
) : BaseKafkaConsumer(objectMapper, processedEventRepository) {

    @KafkaListener(
        topics = ["cash-gateway-events"],
        containerFactory = "kafkaListenerContainerFactory"
    )
    fun consume(message: String, ack: Acknowledgment) {
        super.consumeEvent(message, ack)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    override fun handleEvent(parsedEvent: ParsedEvent) {
        when (parsedEvent.eventType) {
            "PaymentCancelledEvent" -> handlePaymentCancelled(parsedEvent)
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }

    /**
     * PaymentCancelledEvent 처리 (재고 복원)
     */
    private fun handlePaymentCancelled(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentCancelledEventDto>(parsedEvent.payload)

        // 외부 거래는 orderId 없음 → 무시
        if (event.orderId == null) {
            logger.debug("외부 거래 무시: paymentId={}", event.paymentId)
            return
        }

        // OrderSnapshot 조회 (items 포함)
        val snapshotWithItems = orderSnapshotRepository.findByOrderIdWithItems(event.orderId)
            ?: run {
                logger.warn("OrderSnapshot을 찾을 수 없습니다: orderId={}", event.orderId)
                return
            }

        // 재고 복원
        productService.restoreStockForOrder(
            orderId = event.orderId,
            items = snapshotWithItems.items,
            reason = "[결제 취소 복원] orderId=${event.orderId}"
        )

        logger.info(
            "[재고 복원 완료] orderId={} | items={}개",
            event.orderId, snapshotWithItems.items.size
        )
    }
}
```

---

## 📊 데이터베이스

### products 테이블

```sql
-- db/products.sql
CREATE TABLE `products` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
    `public_id` VARCHAR(20) NOT NULL,
    `ecommerce_product_id` BIGINT(20) NULL,
    `sku` VARCHAR(100) NOT NULL UNIQUE,
    `week_id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `price` DECIMAL(15, 3) NOT NULL,
    `description` TEXT NULL,
    `stock` INT NOT NULL DEFAULT 0,
    `is_sold_out` TINYINT(1) NOT NULL DEFAULT 0,
    `category` VARCHAR(50) NOT NULL,
    `last_recorded_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL,
    `modified_at` DATETIME NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_products_sku` (`sku`),
    KEY `idx_products_ecommerce_product_id` (`ecommerce_product_id`),
    UNIQUE KEY `idx_products_public_id` (`public_id`)
);
```

---

### product_records 테이블 (Event Sourcing)

```sql
-- db/product_records.sql
CREATE TABLE `product_records` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT(20) NOT NULL,
    `stock` INT NOT NULL COMMENT '재고 변화량 (delta)',
    `reason` VARCHAR(500) NOT NULL,
    `created_at` DATETIME NOT NULL,
    `modified_at` DATETIME NULL,
    PRIMARY KEY (`id`),
    KEY `idx_product_records_product_id` (`product_id`)
);
```

---

### product_order_snapshots 테이블

```sql
-- db/product_order_snapshots.sql
CREATE TABLE `product_order_snapshots` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
    `public_id` VARCHAR(20) NOT NULL,
    `order_id` BIGINT(20) NOT NULL,
    `order_number` VARCHAR(255) NOT NULL,
    `user_id` BIGINT(20) NOT NULL,
    `total_price` DECIMAL(15, 3) NOT NULL,
    `created_at` DATETIME NOT NULL,
    `modified_at` DATETIME NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_public_id` (`public_id`),
    UNIQUE KEY `idx_order_id` (`order_id`)
);
```

---

### product_order_snapshot_items 테이블

```sql
-- db/product_order_snapshot_items.sql
CREATE TABLE `product_order_snapshot_items` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
    `snapshot_id` BIGINT(20) NOT NULL,
    `product_id` BIGINT(20) NOT NULL,
    `quantity` INT NOT NULL,
    `price` DECIMAL(15, 3) NOT NULL,
    `created_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_snapshot_id` (`snapshot_id`),
    KEY `idx_product_id` (`product_id`)
);
```

**주의:** FK 제약 조건 없음 (논리적 관계만 존재)

---

## ⚙️ 설정

### application.yml

```yaml
server:
  port: 8084

spring:
  application:
    name: payment-service

  datasource:
    url: jdbc:mysql://localhost:3308/payment_db
    username: root
    password: 12555!@

  jpa:
    hibernate:
      ddl-auto: none
    show-sql: true

  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: payment-service-group
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
```

---

## 🚀 실행

### 1. DB 준비

```bash
# Docker Compose로 MySQL 실행
docker-compose up -d mysql-payment

# 스키마 생성
mysql -h 127.0.0.1 -P 3308 -u root -p'12555!@' payment_db < payment-service/db/products.sql
mysql -h 127.0.0.1 -P 3308 -u root -p'12555!@' payment_db < payment-service/db/product_records.sql
mysql -h 127.0.0.1 -P 3308 -u root -p'12555!@' payment_db < payment-service/db/product_order_snapshots.sql
mysql -h 127.0.0.1 -P 3308 -u root -p'12555!@' payment_db < payment-service/db/product_order_snapshot_items.sql
```

### 2. Kafka 준비

```bash
docker-compose up -d kafka
```

### 3. 애플리케이션 실행

```bash
./gradlew :payment-service:bootRun
```

---

## 📝 다음 세션을 위한 메모

### 완료된 작업 ✅ (2026-02-01 세션 최종)

#### Product 도메인 (Phase 1-3 완료)
- ✅ Product 모델 (updateStockByDelta - Delta 방식)
- ✅ ProductRecord (Event Sourcing)
- ✅ ProductRepository (writeRecord - 비관 락 + 재집계)
- ✅ ProductService
  - `validateStockForOrder()`: 재고 검증 + 선차감 (Two-Phase Locking)
  - `restoreStockForOrder()`: 재고 복원
- ✅ ProductEventHandler (ProductRecord 생성)
- ✅ Two-Phase Locking (Deadlock 방지)

#### OrderSnapshot 도메인 (2026-02-01 완성)
- ✅ OrderSnapshot 모델
  - `createCompleted()` 팩토리 메서드 (OrderStockReservedEvent 발행)
  - Product에서 분리 (도메인 책임 명확화)
- ✅ OrderSnapshotWithItems DTO (명시적 items 로드 표현)
- ✅ OrderSnapshotRepository
  - `save(snapshot, items)`: OrderSnapshot + Items 저장
  - `findByOrderId()`: OrderSnapshot만 조회
  - `findByOrderIdWithItems()`: OrderSnapshot + Items 조회
- ✅ OrderSnapshotItem 모델 (FK 관계 없음)
- ✅ DB 스키마: product_order_snapshots.sql, product_order_snapshot_items.sql

#### Kafka Consumers
- ✅ EcommerceEventConsumer
  - `handleProductCreated()`: Product 초기화
  - `handleStockAdjustmentRequested()`: 재고 조정
  - `handleOrderCreated()`: 재고 검증 + 선차감
- ✅ CashGatewayEventConsumer
  - `handlePaymentCancelled()`: 재고 복원 (OrderSnapshot 조회)

#### 이벤트 흐름 완성
```
[1] OrderCreatedEvent → validateStockForOrder()
    ├─ 재고 검증 (Two-Phase Locking)
    ├─ 재고 차감 (선차감 - Product.updateStockByDelta)
    └─ OrderSnapshot 생성 (OrderSnapshot.createCompleted → OrderStockReservedEvent)

[2] PaymentCancelledEvent → restoreStockForOrder()
    ├─ OrderSnapshot 조회 (findByOrderIdWithItems)
    └─ 재고 복원 (Product.updateStockByDelta +quantity)
```

### 다음 작업 (Phase 4) 🔥

#### 통합 테스트
1. 전체 플로우 테스트
   - Cart → Order → 재고 검증 → 선차감 → PG → Webhook → 재고 복원
2. 재고 부족 케이스
3. 동시성 테스트 (Two-Phase Locking 검증)
4. 멱등성 테스트 (eventId 중복 처리)

---

### 주의사항
- **HTTP API 금지**: Payment Service는 Kafka만 사용 (PRIVATE 서비스)
- **Order 직접 참조 금지**: orderId만 사용 (E-commerce Service 소유)
- **Delta 방식**: ProductRecord에는 변화량만 저장 (절대값 X)
- **Two-Phase Locking**: ID 정렬 후 락 획득 (Deadlock 방지)
- **MANDATORY vs REQUIRES_NEW**:
  - REQUIRES_NEW: Kafka Consumer (Entry Point)
  - MANDATORY: 모든 비즈니스 로직 (85-90%)
- **OrderSnapshot 책임**: 주문 완료 (여러 상품 재고 차감 완료)를 표현
- **OrderSnapshotWithItems**: items가 명시적으로 로드되었음을 표현 (버그 방지)

---

## Frontend (Internal Admin)

**Internal Admin Portal - Payment 섹션:**

```
Internal Admin Portal (통합 관리 도구)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Payment 섹션
├─ 📦 재고 관리 (전체 재고 현황)
│  ├─ 상품 목록 (Product)
│  │  ├─ 상품명, SKU, 카테고리
│  │  ├─ 현재 재고 (Product.stock)
│  │  └─ 품절 여부 (isSoldOut)
│  │
│  ├─ 재고 조정
│  │  ├─ 재고 증가 (입고)
│  │  ├─ 재고 감소 (조정)
│  │  └─ 사유 입력 필수
│  │
│  └─ 재고 알림 설정
│     ├─ 품절 임박 알림 (임계값 설정)
│     └─ 장기 품절 상품 알림
│
├─ 📝 재고 조정 이력 (Event Sourcing)
│  ├─ ProductRecord 조회
│  │  ├─ 상품별 재고 변동 이력
│  │  ├─ 변화량 (delta)
│  │  ├─ 사유 (reason)
│  │  └─ 타임스탬프
│  │
│  ├─ 재고 변동 통계
│  │  ├─ 주문 차감 합계
│  │  ├─ 취소 복원 합계
│  │  └─ 관리자 조정 합계
│  │
│  └─ 재집계 기능
│     └─ Product.stock = SUM(ProductRecord.stock)
│
├─ 📊 OrderSnapshot 관리
│  ├─ 주문 스냅샷 조회
│  │  ├─ OrderSnapshot + Items
│  │  ├─ 재고 차감 시점 데이터
│  │  └─ 결제 취소 시 복원용
│  │
│  └─ 복원 이력 조회
│     └─ PaymentCancelledEvent 연동
│
├─ 💰 정산 계산 관리 (미구현 예정)
│  ├─ 수수료 계산 로직
│  ├─ 벤더별 정산 금액
│  └─ 정산 승인 권한
│
└─ 🔐 권한 설정 (미구현 예정)
   ├─ 벤더 권한 관리
   ├─ API 접근 권한
   └─ 재고 조정 권한

Cash Gateway 섹션 (결제 모니터링/정산)
└─ (Cash Gateway README 참고)
```

### 주요 화면 설명

#### 1. 재고 관리 대시보드
```
┌────────────────────────────────────────────┐
│ 📦 재고 관리                                │
├────────────────────────────────────────────┤
│ 📊 재고 현황 (오늘)                         │
│   - 전체 상품: 1,234개                      │
│   - 품절 상품: 15개 ⚠️                      │
│   - 품절 임박: 30개 (재고 < 10)             │
│                                            │
│ 📋 상품 목록                                │
│ ┌────────────────────────────────────────┐ │
│ │ 노트북 (SKU: PROD-001)                 │ │
│ │ 현재 재고: 85개                        │ │
│ │ [재고 조정] 버튼                       │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ 마우스 (SKU: PROD-002) ⚠️ 품절 임박    │ │
│ │ 현재 재고: 5개                         │ │
│ │ [재고 조정] 버튼                       │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

#### 2. 재고 조정 이력 (Event Sourcing)
```
┌────────────────────────────────────────────┐
│ 📝 재고 조정 이력 - 노트북 (PROD-001)       │
├────────────────────────────────────────────┤
│ 2024-02-04 10:00  +100  초기 재고 설정     │
│ 2024-02-04 10:30   -5   [주문 차감] order=123 │
│ 2024-02-04 10:35   -3   [주문 차감] order=124 │
│ 2024-02-04 11:00   +5   [취소 복원] order=123 │
│ 2024-02-04 12:00  +50   관리자 재고 조정   │
│                                            │
│ 현재 재고: SUM(delta) = 100-5-3+5+50 = 147 │
│                                            │
│ [재집계 실행] 버튼                          │
└────────────────────────────────────────────┘
```

#### 3. OrderSnapshot 조회
```
┌────────────────────────────────────────────┐
│ 📊 OrderSnapshot - Order #123              │
├────────────────────────────────────────────┤
│ 주문 번호: ORD_20240204_A1B2C3D4           │
│ 사용자 ID: 456                             │
│ 총 금액: ₩55,000                           │
│ 생성 시각: 2024-02-04 10:30:00             │
│                                            │
│ 📦 주문 항목 (스냅샷)                       │
│   - 노트북 (PROD-001): 1개 × ₩50,000      │
│   - 마우스 (PROD-002): 1개 × ₩5,000       │
│                                            │
│ ⚠️ 이 스냅샷은 재고 차감 시점 데이터         │
│    결제 취소 시 이 데이터로 복원합니다.     │
└────────────────────────────────────────────┘
```

### 사용자 권한
- 🔒 **ADMIN**: 모든 기능 접근 (재고 조정 포함)
- 🔒 **STOCK_MANAGER**: 재고 조회/조정만
- 🔒 **VIEWER**: 조회만 (읽기 전용)

### 주의사항
- 이 서비스는 **HTTP API 없음**
- 모든 관리 기능은 **Internal Admin Portal**을 통해서만
- 실제 재고 변경은 **Kafka 이벤트**로만 처리됨
- Admin Portal은 **조회 + 관리자 조정**만 담당

---

## 참고 문서

- **메인 README**: [../README.md](../README.md)
- **Ecommerce Service**: [../ecommerce-service/README.md](../ecommerce-service/README.md)
- **Cash Gateway Service**: [../cash-gateway-service/README.md](../cash-gateway-service/README.md)
- **Hamster PG**: [../hamster-pg-service/README.md](../hamster-pg-service/README.md)
- **Cash Gateway Service**: [../cash-gateway-service/README.md](../cash-gateway-service/README.md)
