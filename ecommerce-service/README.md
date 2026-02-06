# E-commerce Service

> **다음 Claude 세션을 위한 문서**
> 메인 README 읽은 후 이 문서를 읽으세요.

---

## ⚠️ **CRITICAL: Public ID 정책 (절대 압축/스킵 금지!)** ⚠️

> **🚨 다음 Claude 세션에게:**
>
> **이 섹션은 절대로 요약하거나 압축하거나 스킵하지 마세요!**
>
> 이 정책을 위반하면 클라이언트에 Internal PK가 노출되어 보안 문제가 발생합니다.
> 모든 Response DTO 작성 시 반드시 이 규칙을 따라야 합니다.

### 📋 규칙: 서버 → 클라이언트 응답 시 Long ID 노출 금지

**절대 원칙:**
```
✅ 서버 → 클라이언트: Public ID (Snowflake Base62)만 반환
❌ 서버 → 클라이언트: Long Internal PK 노출 금지
```

**이 서비스의 모든 Response DTO는:**
- ✅ `publicId: String` (자신의 Public ID)
- ✅ `xxxPublicId: String` (FK 참조는 상대의 Public ID)
- ❌ `id: Long` (절대 금지)
- ❌ `xxxId: Long` (절대 금지)

### 🔍 이 서비스에서 적용된 예시

#### ✅ BoardResponse (올바른 구현)
```kotlin
data class BoardResponse(
    val publicId: String,           // ✅ Board Public ID
    val productPublicId: String,    // ✅ Product의 Public ID
    val authorPublicId: String,     // ✅ User의 Public ID
    val commentCount: Int,
    // ... (Long ID 없음)
) {
    companion object {
        // Service에서 이미 변환된 Public ID를 받음
        fun from(
            board: Board,
            productPublicId: String,
            authorPublicId: String,
            commentCount: Int
        ): BoardResponse = ...
    }
}
```

#### ✅ CommentResponse (올바른 구현)
```kotlin
data class CommentResponse(
    val publicId: String,           // ✅ Comment Public ID
    val boardPublicId: String,      // ✅ Board의 Public ID
    val authorPublicId: String,     // ✅ User의 Public ID
    val parentPublicId: String?,    // ✅ Parent Comment의 Public ID (nullable)
    // ... (Long ID 없음)
) {
    companion object {
        fun from(
            comment: Comment,
            boardPublicId: String,
            authorPublicId: String,
            parentPublicId: String?
        ): CommentResponse = ...
    }
}
```

### 🛠️ Service 레이어에서 Public ID 변환 패턴

**BoardService 예시:**
```kotlin
@Service
class BoardService(
    private val boardRepository: BoardRepository,
    private val productRepository: ProductRepository,
    private val userRepository: UserRepository,
    private val commentRepository: CommentRepository
) {

    @Transactional(readOnly = true)
    fun searchPage(request: BoardSearchRequest): Page<BoardWithPublicIds> {
        val boardsPage = boardRepository.searchPage(request)

        // Batch 조회로 N+1 방지
        val boardIds = boardsPage.content.map { it.id!! }.distinct()
        val productIds = boardsPage.content.map { it.productId }.distinct()
        val authorIds = boardsPage.content.map { it.authorId }.distinct()

        val products = productRepository.findByIds(productIds).associateBy { it.id!! }
        val users = userRepository.findByIds(authorIds).associateBy { it.id!! }
        val commentCounts = commentRepository.countByBoardIds(boardIds)

        return boardsPage.map { board ->
            BoardWithPublicIds(
                board = board,
                productPublicId = products[board.productId]!!.publicId,
                authorPublicId = users[board.authorId]!!.publicId,
                commentCount = commentCounts[board.id] ?: 0
            )
        }
    }

    data class BoardWithPublicIds(
        val board: Board,
        val productPublicId: String,
        val authorPublicId: String,
        val commentCount: Int
    )
}
```

**CommentService 예시:**
```kotlin
@Service
class CommentService(...) {

    @Transactional(readOnly = true)
    fun getCommentsByBoardPublicIdWithPublicIds(
        boardPublicId: String
    ): List<CommentWithPublicIds> {
        val board = boardRepository.findByPublicId(boardPublicId)
        val comments = commentRepository.findByBoardId(board.id!!)

        if (comments.isEmpty()) return emptyList()

        // Batch 조회로 N+1 방지
        val authorIds = comments.map { it.authorId }.distinct()
        val parentIds = comments.mapNotNull { it.parentId }.distinct()

        val authors = userRepository.findByIds(authorIds).associateBy { it.id!! }
        val parentComments = if (parentIds.isNotEmpty()) {
            commentRepository.findByIds(parentIds).associateBy { it.id!! }
        } else {
            emptyMap()
        }

        return comments.map { comment ->
            CommentWithPublicIds(
                comment = comment,
                boardPublicId = board.publicId,
                authorPublicId = authors[comment.authorId]!!.publicId,
                parentPublicId = comment.parentId?.let { parentComments[it]?.publicId }
            )
        }
    }

    data class CommentWithPublicIds(
        val comment: Comment,
        val boardPublicId: String,
        val authorPublicId: String,
        val parentPublicId: String?
    )
}
```

### 📝 체크리스트 (새로운 Response DTO 작성 시)

**반드시 확인:**
- [ ] Long 타입 ID/FK 필드가 **하나도 없는가**?
- [ ] 모든 FK는 `xxxPublicId: String` 형태인가?
- [ ] `from()` 팩토리 메서드에서 필요한 Public ID를 모두 파라미터로 받는가?
- [ ] Service 레이어에서 Batch 조회로 N+1을 방지하는가?
- [ ] Repository에 `findByIds()` 메서드가 있는가?

### 📚 참고 파일 (이 서비스 내)

**올바르게 구현된 예시:**
- `app/board/response/BoardResponse.kt`
- `app/comment/response/CommentResponse.kt`
- `domain/board/service/BoardService.kt`
- `domain/comment/service/CommentService.kt`
- `domain/user/repository/UserRepository.kt` (findByIds 메서드)
- `domain/comment/repository/CommentRepository.kt` (findByIds, countByBoardIds 메서드)

---

## 서비스 개요

**역할:** Product Catalog 관리 + Order 생성 및 상태 관리

### 책임 범위
- ✅ 상품 카탈로그 관리 (Product CRUD)
- ✅ 재고 캐시 (Payment Service로부터 동기화)
- ✅ 재고 조정 요청 (Admin)
- ✅ **주문(Order) 생성 및 상태 관리** (2026-02-01 세션 추가)
- ✅ **Cart 관리** (CartItem 추가/삭제, 주문 생성)
- ✅ **Cash Gateway 결제 이벤트 수신** (결제 승인/실패/취소)
- ❌ 실제 재고 관리 (Payment Service 담당)
- ❌ 결제 처리 (Cash Gateway Service 담당)

### 아키텍처 위치
```
External Client
   ↓ HTTP
E-commerce Service (이 서비스)
   ↓ Kafka (ProductCreatedEvent, StockAdjustmentRequestedEvent, OrderCreatedEvent)
Payment Service (재고 검증)
   ↓ Kafka (OrderStockReservedEvent / OrderStockValidationFailedEvent)
Cash Gateway Service (결제 요청)
   ↓ PG HTTP 요청
   ↓ Webhook 수신
   ↓ Kafka (PaymentApprovedEvent / PaymentFailedEvent / PaymentCancelledEvent)
E-commerce Service (주문 상태 업데이트)
```

**전체 플로우 (2026-02-01 세션 완성):**
```
[1] Cart → Order 생성
    - orderNumber 자동 생성: "ORD_20260201123045_A1B2C3D4"
    - status: CREATED
    ↓ OrderCreatedEvent 발행

[2] Payment Service: 재고 검증
    - 성공: OrderStockReservedEvent 발행
    - 실패: OrderStockValidationFailedEvent 발행 → Order.status = PAYMENT_FAILED
    ↓

[3] Cash Gateway: PG 요청
    - gatewayReferenceId 자동 생성: "CGW_DUMMY_MID_001_20260201..."
    - PG HTTP 요청 (Webhook으로 결과 수신 대기)
    ↓

[4] Webhook 수신 (Cash Gateway)
    - gatewayReferenceId로 PaymentAttempt 찾기
    - Payment 생성 (승인 시)
    ↓ PaymentApprovedEvent / PaymentFailedEvent / PaymentCancelledEvent 발행

[5] Ecommerce Consumer (CashGatewayEventConsumer)
    - PaymentApprovedEvent:
      * order.status = PAYMENT_APPROVED
      * order.gatewayReferenceId = event.gatewayReferenceId
    - PaymentFailedEvent:
      * order.status = PAYMENT_FAILED
    - PaymentCancelledEvent:
      * order.status = CANCELED
```

---

## 📁 프로젝트 구조

```
ecommerce-service/
├── db/
│   ├── products.sql                        # Product 테이블
│   ├── orders.sql                          # ⭐ Order 테이블 (2026-02-01 추가)
│   ├── order_items.sql                     # OrderItem 테이블
│   ├── carts.sql                           # Cart 테이블
│   └── cart_items.sql                      # CartItem 테이블
│
└── src/main/kotlin/com/hamsterworld/ecommerce/
    │
    ├── domain/
    │   │
    │   ├── product/                        # Product 도메인
    │   │   ├── model/Product.kt            # Aggregate Root
    │   │   ├── event/ProductCreatedEvent.kt
    │   │   ├── service/ProductService.kt
    │   │   └── constant/ProductCategory.kt
    │   │
    │   ├── order/                          # ⭐ Order 도메인 (2026-02-01 추가)
    │   │   ├── model/
    │   │   │   ├── Order.kt                # Aggregate Root
    │   │   │   │   - orderNumber: String?  # 고객용 주문번호 (자동 생성)
    │   │   │   │   - gatewayReferenceId: String?  # Cash Gateway 거래 ID
    │   │   │   │   - status: OrderStatus   # CREATED/PAYMENT_APPROVED/PAYMENT_FAILED/CANCELED
    │   │   │   │   - publishCreatedEvent() # OrderCreatedEvent 등록
    │   │   │   │
    │   │   │   └── OrderItem.kt            # OrderItem (Value Object)
    │   │   │
    │   │   ├── event/
    │   │   │   └── OrderCreatedEvent.kt    # 주문 생성 이벤트
    │   │   │
    │   │   ├── service/
    │   │   │   └── OrderService.kt         # 주문 생성 로직
    │   │   │
    │   │   ├── repository/
    │   │   │   └── OrderRepository.kt      # ⭐ generateOrderNumber() 메서드
    │   │   │       - saveOrderRecord()     # Order + OrderItems 저장 + 이벤트 발행
    │   │   │       - casUpdateStatus()     # CAS 상태 업데이트
    │   │   │
    │   │   └── constant/
    │   │       └── OrderStatus.kt          # CREATED/PAYMENT_APPROVED/PAYMENT_FAILED/CANCELED
    │   │
    │   ├── cart/                           # Cart 도메인
    │   │   ├── model/
    │   │   │   ├── Cart.kt                 # Aggregate Root
    │   │   │   └── CartItem.kt             # CartItem (Entity)
    │   │   ├── service/CartService.kt
    │   │   └── repository/CartRepository.kt
    │   │
    │   └── ...
    │
    ├── consumer/                           # ⭐ Kafka Consumers (2026-02-01 추가)
    │   ├── CashGatewayEventConsumer.kt     # Cash Gateway 이벤트 수신
    │   │   - handlePaymentApproved()       # Order.status → PAYMENT_APPROVED
    │   │   - handlePaymentFailed()         # Order.status → PAYMENT_FAILED
    │   │   - handlePaymentCancelled()      # Order.status → CANCELED
    │   │
    │   ├── CashGatewayEventDtos.kt         # ⭐ Cash Gateway 이벤트 DTOs
    │   │   - PaymentApprovedEventDto
    │   │   - PaymentFailedEventDto
    │   │   - PaymentCancelledEventDto
    │   │
    │   └── PaymentEventConsumer.kt         # Payment Service 이벤트 수신
    │       - handleOrderStockReserved()    # 재고 선차감 성공
    │       - handleOrderStockValidationFailed()  # 재고 부족
    │
    ├── infra/
    │   ├── product/
    │   │   ├── entity/ProductEntity.kt
    │   │   ├── repository/ProductRepository.kt
    │   │   └── mapper/ProductMapper.kt
    │   │
    │   ├── order/                          # Order Infrastructure
    │   │   ├── entity/OrderEntity.kt
    │   │   ├── repository/OrderJpaRepository.kt
    │   │   └── mapper/OrderMapper.kt
    │   │
    │   └── ...
    │
    └── app/
        ├── product/
        │   ├── controller/ProductController.kt
        │   └── service/ProductApplicationService.kt
        │
        ├── order/                          # Order Application
        │   ├── controller/OrderController.kt
        │   ├── dto/OrderWithItems.kt       # Order + List<OrderItem>
        │   └── service/OrderApplicationService.kt
        │
        └── cart/
            ├── controller/CartController.kt
            └── service/CartApplicationService.kt
```

---

## 🎯 핵심 구현: DDD + Domain Events

---

## 🛒 Order 도메인 (2026-02-01 세션 완성)

### 1. Order Model

```kotlin
// domain/order/model/Order.kt
data class Order(
    override val id: Long? = null,
    override val publicId: String? = null,
    var userId: Long? = null,
    var orderNumber: String? = null,           // ⭐ 고객용 주문번호 (자동 생성: "ORD_20260201123045_A1B2C3D4")
    var gatewayReferenceId: String? = null,    // ⭐ Cash Gateway 거래 ID (결제 승인 후 저장)
    var price: BigDecimal? = null,
    var status: OrderStatus = OrderStatus.CREATED,
    override val createdAt: LocalDateTime? = null,
    override val modifiedAt: LocalDateTime? = null
) : AbsDomain, AbsDomainRoot<Order>() {

    /**
     * OrderCreatedEvent 등록
     * (OrderRepository.saveOrderRecord()에서 호출)
     */
    fun publishCreatedEvent(event: OrderCreatedEvent): Order {
        registerEvent(event)
        return this
    }
}
```

**주요 필드:**
- `orderNumber`: 고객용 주문번호 (Ecommerce Service 자체 생성)
  - 형식: `ORD_20260201123045_A1B2C3D4`
  - OrderRepository.generateOrderNumber()에서 자동 생성

- `gatewayReferenceId`: Cash Gateway 거래 ID (결제 매칭용)
  - Cash Gateway에서 생성한 고유 거래 식별자
  - PaymentApprovedEvent 수신 시 저장됨
  - 이를 통해 Order ↔ Payment 매칭 가능

### 2. OrderStatus (상태 전이)

```kotlin
// domain/order/constant/OrderStatus.kt
enum class OrderStatus {
    CREATED,              // 주문 생성 (초기 상태)
    PAYMENT_APPROVED,     // 결제 승인
    PAYMENT_FAILED,       // 결제 실패 (재고 부족 또는 PG 거절)
    CANCELED;             // 결제 취소

    fun canTransitionTo(newStatus: OrderStatus): Boolean {
        return when (this) {
            CREATED -> newStatus in setOf(PAYMENT_APPROVED, PAYMENT_FAILED)
            PAYMENT_APPROVED -> newStatus == CANCELED
            PAYMENT_FAILED -> false
            CANCELED -> false
        }
    }
}
```

**상태 전이 규칙:**
```
CREATED
  ├─→ PAYMENT_APPROVED (PaymentApprovedEvent)
  └─→ PAYMENT_FAILED (PaymentFailedEvent or OrderStockValidationFailedEvent)

PAYMENT_APPROVED
  └─→ CANCELED (PaymentCancelledEvent)

PAYMENT_FAILED (종료 상태)
CANCELED (종료 상태)
```

### 3. OrderRepository (핵심 메서드)

```kotlin
// domain/order/repository/OrderRepository.kt
@Repository
class OrderRepository(...) {

    /**
     * Order + OrderItems 저장 및 OrderCreatedEvent 발행
     * REQUIRES_NEW: 별도 트랜잭션으로 항상 커밋
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun saveOrderRecord(orderWithItems: OrderWithItems): OrderWithItems {
        // 1. Order 저장 (PK 할당)
        var order = orderWithItems.order

        // 2. orderNumber 자동 생성
        if (order.orderNumber == null) {
            order.orderNumber = generateOrderNumber()
        }

        var savedOrder = orderJpaRepository.save(order)

        // 3. OrderItem 저장
        val savedItems = orderItemJpaRepository.saveAll(...)

        // 4. OrderCreatedEvent 등록 및 발행
        savedOrder = savedOrder.publishCreatedEvent(OrderCreatedEvent(...))
        savedOrder = orderJpaRepository.save(savedOrder)

        return OrderWithItems(order = savedOrder, items = savedItems)
    }

    /**
     * CAS (Compare-And-Swap) 상태 업데이트
     * 멱등성 보장 + 동시성 제어
     */
    fun casUpdateStatus(order: Order, newStatus: OrderStatus): Boolean {
        val currentStatus = order.status

        if (!currentStatus.canTransitionTo(newStatus)) {
            throw CustomRuntimeException("전환 불가 상태: $currentStatus -> $newStatus")
        }

        val updated = jpaQueryFactory
            .update(qOrder)
            .set(qOrder.status, newStatus)
            .set(qOrder.modifiedAt, LocalDateTime.now())
            .where(
                qOrder.id.eq(order.id),
                qOrder.status.eq(currentStatus)  // ⭐ CAS 조건
            )
            .execute()

        if (updated > 0) {
            order.status = newStatus
            orderJpaRepository.save(order)
            return true
        }
        return false
    }

    /**
     * orderNumber 자동 생성
     * 형식: ORD_{TIMESTAMP}_{RANDOM}
     */
    private fun generateOrderNumber(): String {
        val timestamp = LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
        val random = UUID.randomUUID().toString()
            .substring(0, 8)
            .uppercase()
        return "ORD_${timestamp}_${random}"
    }
}
```

### 4. CashGatewayEventConsumer (핵심 구현)

```kotlin
// consumer/CashGatewayEventConsumer.kt
@Component
class CashGatewayEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    private val orderRepository: OrderRepository
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
            "PaymentApprovedEvent" -> handlePaymentApproved(parsedEvent)
            "PaymentFailedEvent" -> handlePaymentFailed(parsedEvent)
            "PaymentCancelledEvent" -> handlePaymentCancelled(parsedEvent)
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }

    /**
     * PaymentApprovedEvent 처리
     * - Order 상태 → PAYMENT_APPROVED
     * - Order.gatewayReferenceId 저장 (Payment 매칭용)
     */
    private fun handlePaymentApproved(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentApprovedEventDto>(parsedEvent.payload)

        // 외부 거래는 orderId 없음 → 무시
        if (event.orderId == null) {
            logger.debug("외부 거래 무시: paymentId={}", event.paymentId)
            return
        }

        val order = orderRepository.findById(event.orderId)

        // gatewayReferenceId 저장 (Payment 매칭용)
        order.gatewayReferenceId = event.gatewayReferenceId

        // CAS 상태 업데이트
        val updated = orderRepository.casUpdateStatus(order, OrderStatus.PAYMENT_APPROVED)

        if (updated) {
            logger.info(
                "[결제 승인 성공] orderId={} | paymentId={} | gatewayReferenceId={}",
                event.orderId, event.paymentId, event.gatewayReferenceId
            )
        } else {
            logger.warn(
                "[결제 승인 실패] CAS 업데이트 실패 | orderId={} | currentStatus={}",
                event.orderId, order.status
            )
        }
    }

    private fun handlePaymentFailed(parsedEvent: ParsedEvent) {
        // Order.status → PAYMENT_FAILED
    }

    private fun handlePaymentCancelled(parsedEvent: ParsedEvent) {
        // Order.status → CANCELED
    }
}
```

**멱등성 보장:**
- `eventId` 기반 중복 체크 (BaseKafkaConsumer, processed_events 테이블)
- CAS (Compare-And-Swap) 상태 업데이트
- 동일 이벤트 재처리 시 CAS 실패 → 로그만 남기고 무시

### 5. CashGatewayEventDtos

```kotlin
// consumer/CashGatewayEventDtos.kt
data class PaymentApprovedEventDto(
    val paymentId: Long,
    val orderId: Long?,               // nullable (외부 거래)
    val userId: Long?,
    val provider: String,
    val mid: String,
    val amount: BigDecimal,
    val pgTransaction: String,
    val pgApprovalNo: String,
    val gatewayReferenceId: String,   // ⭐ Cash Gateway 거래 ID
    val originSource: String
)

data class PaymentFailedEventDto(
    val attemptId: Long,
    val orderId: Long?,
    val userId: Long?,
    val provider: String?,
    val mid: String,
    val amount: BigDecimal,
    val code: String?,
    val message: String?,
    val reason: String,
    val originSource: String
)

data class PaymentCancelledEventDto(
    val paymentId: Long,
    val originPaymentId: Long,
    val orderId: Long?,
    val userId: Long?,
    val provider: String,
    val mid: String,
    val amount: BigDecimal,
    val pgTransaction: String,
    val pgApprovalNo: String,
    val gatewayReferenceId: String,
    val originSource: String
)
```

---

## 🛍️ Product 도메인

### 1. Aggregate Root: Product

```kotlin
// domain/product/model/Product.kt
data class Product(
    override val id: Long? = null,
    val sku: String,                      // Stock Keeping Unit (상품 코드)
    val name: String,
    val description: String?,
    val imageUrl: String?,
    val category: ProductCategory,
    val price: BigDecimal,
    var stock: Int = 0,                   // ⭐ 캐시 (Payment Service 동기화)
    var isSoldOut: Boolean = false,
    var lastStockSyncedAt: LocalDateTime? = null,
    override val createdAt: LocalDateTime? = null,
    override val modifiedAt: LocalDateTime? = null
) : AbsDomain, AbsDomainRoot<Product>() {

    /**
     * 상품 생성 (Factory Method)
     * ProductCreatedEvent를 등록하여 Payment Service에 알림
     */
    fun onCreate(initialStock: Int): Product {
        registerEvent(
            ProductCreatedEvent(
                productId = id!!,
                sku = sku,
                name = name,
                price = price,
                initialStock = initialStock
            )
        )
        return this
    }

    /**
     * 재고 조정 요청 (Admin)
     * StockAdjustmentRequestedEvent를 등록하여 Payment Service에 요청
     */
    fun requestStockAdjustment(amount: Int, reason: String): Product {
        registerEvent(
            StockAdjustmentRequestedEvent(
                productId = id!!,
                amount = amount,
                reason = reason
            )
        )
        return this
    }

    /**
     * 메타데이터 업데이트
     * (재고는 Payment Service에서만 관리)
     */
    fun updateMetadata(
        name: String,
        description: String?,
        imageUrl: String?,
        category: ProductCategory,
        price: BigDecimal
    ): Product {
        return this.copy(
            name = name,
            description = description,
            imageUrl = imageUrl,
            category = category,
            price = price,
            modifiedAt = LocalDateTime.now()
        )
    }

    /**
     * 재고 동기화 (Payment Service로부터)
     * ProductStockChangedEvent를 수신했을 때 호출됨
     */
    fun syncStock(stock: Int, isSoldOut: Boolean): Product {
        return this.copy(
            stock = stock,
            isSoldOut = isSoldOut,
            lastStockSyncedAt = LocalDateTime.now()
        )
    }
}
```

### 2. Domain Events

#### ProductCreatedEvent
```kotlin
// domain/product/event/ProductCreatedEvent.kt
data class ProductCreatedEvent(
    val productId: Long,
    val sku: String,
    val name: String,
    val price: BigDecimal,
    val initialStock: Int,
    // DomainEvent 메타데이터
    override val eventId: String = UUID.randomUUID().toString(),
    override val traceId: String? = null,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : EcommerceDomainEvent(
    aggregateId = productId.toString(),
    eventId = eventId,
    traceId = traceId,
    occurredAt = occurredAt
)
```

**발행 시점:** Product 생성 후
**토픽:** `ecommerce-events` (자동)
**수신자:** Payment Service

**Kafka 메시지 구조:**
```json
{
  "eventType": "ProductCreatedEvent",
  "aggregateId": "123",
  "payload": {
    "productId": 123,
    "sku": "PROD-001",
    "name": "상품명",
    "price": 10000,
    "initialStock": 100
  },
  "metadata": {
    "eventId": "uuid",
    "traceId": "trace-uuid",
    "occurredAt": "2026-01-30T12:34:56"
  }
}
```

#### StockAdjustmentRequestedEvent
```kotlin
// domain/product/event/StockAdjustmentRequestedEvent.kt
data class StockAdjustmentRequestedEvent(
    val productId: Long,
    val amount: Int,        // +50 (입고), -10 (조정)
    val reason: String,     // "추가 입고", "재고 조정" 등
    // DomainEvent 메타데이터
    override val eventId: String = UUID.randomUUID().toString(),
    override val traceId: String? = null,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : EcommerceDomainEvent(
    aggregateId = productId.toString(),
    eventId = eventId,
    traceId = traceId,
    occurredAt = occurredAt
)
```

**발행 시점:** Admin이 재고 조정 요청 시
**토픽:** `ecommerce-events` (자동)
**수신자:** Payment Service

### 3. Service Layer

```kotlin
// domain/product/service/ProductService.kt
@Service
class ProductService(
    private val productRepository: ProductRepository
) {

    /**
     * 상품 생성
     * (이벤트는 Domain 모델에서 자동 발행)
     */
    @Transactional
    fun createProduct(
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

        // 2. Product 생성 (재고는 0, Payment Service에서 초기화될 때까지)
        var product = Product(
            sku = sku,
            name = name,
            description = description,
            imageUrl = imageUrl,
            category = category,
            price = price,
            stock = 0,
            isSoldOut = true
        )

        // 3. Product 저장 (ID 할당)
        product = productRepository.save(product)

        // 4. 이벤트 등록 및 발행
        product = product.onCreate(initialStock)
        product = productRepository.update(product)

        log.info(
            "Product 생성 완료: productId={}, sku={}, initialStock={}",
            product.id, product.sku, initialStock
        )

        return product
    }

    /**
     * 재고 조정 요청 (Admin)
     * (이벤트는 Domain 모델에서 자동 발행)
     */
    @Transactional
    fun requestStockAdjustment(id: Long, amount: Int, reason: String) {
        val product = productRepository.findById(id)

        log.info(
            "재고 조정 요청: productId={}, sku={}, amount={}, reason={}",
            product.id, product.sku, amount, reason
        )

        // 이벤트 발행 (requestStockAdjustment()가 이벤트 등록, update()가 발행)
        product.requestStockAdjustment(amount, reason)
        productRepository.update(product)
    }

    /**
     * 재고 동기화 (Payment Service로부터)
     * PaymentEventConsumer에서 호출됨
     */
    @Transactional
    fun syncStock(productId: Long, stock: Int, isSoldOut: Boolean) {
        val product = productRepository.findById(productId)

        val synced = product.syncStock(stock, isSoldOut)
        productRepository.update(synced)

        log.info(
            "재고 동기화 완료: productId={}, stock={}, isSoldOut={}",
            productId, stock, isSoldOut
        )
    }
}
```

### 4. Repository Layer (Infrastructure)

```kotlin
// infra/product/repository/ProductRepository.kt
@Repository
class ProductRepository(
    private val productJpaRepository: ProductJpaRepository,
    private val productMapper: ProductMapper,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(product: Product): Product {
        val entity = productMapper.toEntity(product)
            .withDomainEvents<ProductEntity>(product)  // ⭐ 도메인 이벤트 전달
        val saved = productJpaRepository.save(entity)
        return productMapper.toDomain(saved)
    }

    fun update(product: Product): Product {
        val entity = productJpaRepository.findById(product.id!!)
            .orElseThrow { CustomRuntimeException("상품을 찾을 수 없습니다. ID: ${product.id}") }

        productMapper.updateEntity(entity, product)
        val updated = productJpaRepository.save(
            entity.withDomainEvents<ProductEntity>(product)  // ⭐ 도메인 이벤트 전달
        )
        return productMapper.toDomain(updated)
    }

    fun findById(id: Long): Product {
        return productJpaRepository.findById(id)
            .map { productMapper.toDomain(it) }
            .orElseThrow { CustomRuntimeException("상품을 찾을 수 없습니다. ID: $id") }
    }

    // QueryDSL 검색
    fun search(request: ProductSearchRequest): List<Product> {
        val query = jpaQueryFactory.selectFrom(productEntity)
            .where(*searchListConditions(request).toTypedArray())
            // ... 정렬, 페이징 등
        return query.fetch().map { productMapper.toDomain(it) }
    }
}
```

### 5. 이벤트 발행 플로우

```
1. Controller: HTTP 요청 수신
   ↓
2. Service: 비즈니스 로직 실행
   var product = Product(...)
   product = productRepository.save(product)  // ID 할당
   product = product.onCreate(initialStock)    // ← 이벤트 등록 (registerEvent)
   product = productRepository.update(product) // ← 저장 + 발행 트리거
   ↓
3. Repository: Domain → Entity 변환 + 이벤트 전달
   entity.withDomainEvents<ProductEntity>(product)
   ↓
4. JPA save() 호출
   ↓
5. Spring Data: @DomainEvents 메서드 자동 호출
   ↓
6. ApplicationEventPublisher: 이벤트 발행
   ↓
7. KafkaDomainEventPublisher: @TransactionalEventListener(AFTER_COMMIT)
   ↓
8. Kafka: ecommerce-events 토픽으로 전송
```

---

## 🔌 API 엔드포인트

### Customer API (ProductController)

```
GET    /api/products/{id}           # 상품 상세 조회
GET    /api/products/list           # 상품 목록 (검색)
GET    /api/products/page           # 상품 페이지 (검색 + 페이징)
```

### Admin API (AdminProductController)

```
POST   /api/admin/products          # 상품 생성
PUT    /api/admin/products/{id}     # 상품 메타데이터 수정
POST   /api/admin/products/{id}/stock-adjustment  # 재고 조정 요청
```

#### 예시: 상품 생성
```bash
curl -X POST http://localhost:8081/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "테스트 상품",
    "description": "상품 설명",
    "category": "ELECTRONICS",
    "price": 10000,
    "initialStock": 100
  }'
```

**응답:**
```json
{
  "id": 1,
  "sku": "PROD-001",
  "name": "테스트 상품",
  "description": "상품 설명",
  "category": "ELECTRONICS",
  "price": 10000,
  "stock": 0,              // Payment Service 동기화 전
  "isSoldOut": true,
  "createdAt": "2026-01-30T12:34:56"
}
```

**Kafka 발행:**
- Topic: `ecommerce-events`
- EventType: `ProductCreatedEvent`
- Payload: `{productId: 1, sku: "PROD-001", ..., initialStock: 100}`

#### 예시: 재고 조정 요청
```bash
curl -X POST http://localhost:8081/api/admin/products/1/stock-adjustment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "reason": "추가 입고"
  }'
```

**Kafka 발행:**
- Topic: `ecommerce-events`
- EventType: `StockAdjustmentRequestedEvent`
- Payload: `{productId: 1, amount: 50, reason: "추가 입고"}`

---

## 📊 데이터베이스

### Schema: orders (2026-02-01 추가)

```sql
-- db/orders.sql
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `user_id` BIGINT(20) NOT NULL COMMENT '주문자 ID',
    `order_number` VARCHAR(255) DEFAULT NULL COMMENT '고객용 주문번호 (저장 시 자동 생성)',
    `gateway_reference_id` VARCHAR(255) DEFAULT NULL COMMENT 'Cash Gateway 거래 ID (Payment 생성 후 채워짐)',
    `price` decimal(15, 3) NOT NULL COMMENT '주문 금액',
    `status` VARCHAR(20) NOT NULL COMMENT '주문 상태',
    `created_at` DATETIME NOT NULL COMMENT '생성 일시',
    `modified_at` DATETIME NULL COMMENT '수정 일시',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_orders_public_id` (`public_id`) USING BTREE,
    KEY `idx_orders_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**주요 필드:**
- `order_number`: 고객용 주문번호 (Ecommerce Service 자체 생성)
  - 저장 시 자동 생성 (OrderRepository.generateOrderNumber())
  - 형식: `ORD_20260201123045_A1B2C3D4`

- `gateway_reference_id`: Cash Gateway 거래 ID
  - 초기값: NULL
  - PaymentApprovedEvent 수신 시 저장
  - Order ↔ Payment 매칭용

- `status`: 주문 상태
  - `CREATED`: 초기 상태
  - `PAYMENT_APPROVED`: 결제 승인
  - `PAYMENT_FAILED`: 결제 실패
  - `CANCELED`: 결제 취소

### Schema: products

```sql
CREATE TABLE IF NOT EXISTS products (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE COMMENT '상품 코드 (Stock Keeping Unit)',
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,

    -- 재고 캐시 (Payment Service 동기화)
    stock INT NOT NULL DEFAULT 0,
    is_sold_out BOOLEAN NOT NULL DEFAULT TRUE,
    last_stock_synced_at DATETIME,

    -- Audit
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_product_sku (sku),
    INDEX idx_product_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**포인트:**
- `stock`, `is_sold_out`: Payment Service로부터 동기화된 캐시 (읽기 전용)
- `last_stock_synced_at`: 마지막 동기화 시각

---

## 🔄 Payment Service 이벤트 소비 (TODO - Phase 3)

> **다음 작업:** Payment Service 구현 후 이 Consumer 구현

```kotlin
// infra/kafka/PaymentEventConsumer.kt (작성 필요)
@Component
class PaymentEventConsumer(
    objectMapper: ObjectMapper,
    private val productService: ProductService
) : BaseKafkaConsumer(objectMapper) {

    @KafkaListener(
        topics = [KafkaTopics.PAYMENT_EVENTS],
        groupId = KafkaTopics.ECOMMERCE_SERVICE_GROUP
    )
    fun consumeEvent(message: String, ack: Acknowledgment) {
        consumeEvent(message, ack)
    }

    override fun handleEvent(parsedEvent: ParsedEvent) {
        when (parsedEvent.eventType) {
            "ProductStockChangedEvent" -> handleProductStockChanged(parsedEvent)
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }

    private fun handleProductStockChanged(event: ParsedEvent) {
        val payload = objectMapper.convertValue(event.payload, ProductStockChangedPayload::class.java)

        productService.syncStock(
            productId = payload.productId,
            stock = payload.stock,
            isSoldOut = payload.isSoldOut
        )

        logger.info("Stock synced: productId={}, stock={}", payload.productId, payload.stock)
    }
}

data class ProductStockChangedPayload(
    val productId: Long,
    val stock: Int,
    val isSoldOut: Boolean
)
```

---

## ⚙️ 설정

### application.yml

```yaml
server:
  port: 8081

spring:
  application:
    name: ecommerce-service

  datasource:
    url: jdbc:mysql://localhost:3306/ecommerce_db
    username: root
    password: 12555!@

  jpa:
    hibernate:
      ddl-auto: none  # 수동 DDL 관리
    show-sql: true

  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
    consumer:
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      auto-offset-reset: earliest
```

---

## 🚀 실행

### 1. DB 준비
```bash
# Docker Compose로 MySQL 실행
docker-compose up -d mysql-ecommerce

# 스키마 생성
mysql -h 127.0.0.1 -P 3306 -u root -p'12555!@' ecommerce_db < db/products.sql
```

### 2. Kafka 준비
```bash
# Docker Compose로 Kafka 실행
docker-compose up -d kafka
```

### 3. 애플리케이션 실행
```bash
./gradlew :ecommerce-service:bootRun
```

### 4. 동작 확인
```bash
# Health Check
curl http://localhost:8081/actuator/health

# 상품 생성
curl -X POST http://localhost:8081/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-001",
    "name": "테스트 상품",
    "description": "테스트",
    "category": "ELECTRONICS",
    "price": 10000,
    "initialStock": 100
  }'

# Kafka 메시지 확인
# → ecommerce-events 토픽에 ProductCreatedEvent 발행 확인
```

---

## 🐛 트러블슈팅

### 1. `withDomainEvents()` 타입 추론 오류
```kotlin
// ❌ 오류
entity.withDomainEvents(product)

// ✅ 해결
entity.withDomainEvents<ProductEntity>(product)
```

### 2. 이벤트가 발행되지 않음
- `AbsDomainRoot` 상속 확인
- `registerEvent()` 호출 확인
- `repository.save()` 후 발행 확인
- `@TransactionalEventListener` Bean 등록 확인 (Common 모듈)

### 3. Kafka 연결 실패
```bash
# Kafka 상태 확인
docker-compose ps kafka

# 로그 확인
docker-compose logs kafka

# 토픽 목록 확인
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list
```

---

## 📝 다음 세션을 위한 메모

### 완료된 작업 ✅ (2026-02-01 세션 최종)

#### Product 도메인 (Phase 1 완료)
- Product 도메인 모델 (DDD + Aggregate Root)
- ProductCreatedEvent, StockAdjustmentRequestedEvent 발행
- Product CRUD API (Customer + Admin)
- QueryDSL 검색 (searchListConditions 패턴)
- withDomainEvents() 패턴 적용
- **Domain Event Pattern** (Dual Write 해결)

#### Order 도메인 (Phase 2 완료 - 2026-02-01)
- ✅ Order 모델 (orderNumber, gatewayReferenceId 필드 추가)
- ✅ OrderStatus (CREATED/PAYMENT_APPROVED/PAYMENT_FAILED/CANCELED)
- ✅ OrderRepository
  - `saveOrderRecord()`: Order + OrderItems 저장 + OrderCreatedEvent 발행 (REQUIRES_NEW)
  - `generateOrderNumber()`: 주문번호 자동 생성 ("ORD_20260201123045_A1B2C3D4")
  - `casUpdateStatus()`: CAS 패턴으로 상태 업데이트 (멱등성 보장)
- ✅ CashGatewayEventConsumer (Cash Gateway 이벤트 수신)
  - `handlePaymentApproved()`: Order.status → PAYMENT_APPROVED, gatewayReferenceId 저장
  - `handlePaymentFailed()`: Order.status → PAYMENT_FAILED
  - `handlePaymentCancelled()`: Order.status → CANCELED
- ✅ CashGatewayEventDtos (PaymentApprovedEventDto, PaymentFailedEventDto, PaymentCancelledEventDto)
- ✅ DB 스키마: orders.sql (orderNumber, gatewayReferenceId 필드)

#### 전체 플로우 완성 (Cart → Order → Payment → Webhook → Order Update)
```
[1] Cart → Order 생성 (orderNumber 자동 생성) → OrderCreatedEvent
[2] Payment Service 재고 검증 → OrderStockReservedEvent / OrderStockValidationFailedEvent
[3] Cash Gateway PG 요청 (gatewayReferenceId 자동 생성)
[4] Webhook 수신 → Payment 생성 → PaymentApprovedEvent / PaymentFailedEvent / PaymentCancelledEvent
[5] Ecommerce Consumer → Order 상태 업데이트 (gatewayReferenceId 저장)
```

### 다음 작업 (Phase 3) 🔥

#### Payment Service Consumer (재고 복원)
1. PaymentEventConsumer 구현
   - `handlePaymentCancelled()`: ProductRecord 재고 복원 로직
2. ProductStockChangedEvent 소비 (Product 재고 캐시 동기화)
3. E2E 테스트

#### Kafka Producer 설정
1. Kafka Producer 설정 완료
2. Kafka Topic 설정 (ecommerce-events, cash-gateway-events, payment-events)

#### 통합 테스트
1. Cart → Order → Payment → Webhook → Order Update 전체 플로우 테스트
2. 재고 부족 케이스 테스트 (OrderStockValidationFailedEvent)
3. 결제 취소 케이스 테스트 (재고 복원)
4. 멱등성 테스트 (동일 이벤트 재처리)

### 주요 파일 위치 (다음 세션 참고)

**Order 도메인:**
- `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/domain/order/model/Order.kt`
- `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/domain/order/repository/OrderRepository.kt`
- `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/domain/order/constant/OrderStatus.kt`
- `ecommerce-service/db/orders.sql`

**Cash Gateway Event Consumer:**
- `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/consumer/CashGatewayEventConsumer.kt`
- `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/consumer/CashGatewayEventDtos.kt`

**Cash Gateway Service (orderNumber → gatewayReferenceId 변경):**
- `cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/domain/payment/model/Payment.kt`
- `cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/domain/paymentattempt/model/PaymentAttempt.kt`
- `cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/external/paymentgateway/abs/PaymentGatewayCoreService.kt`
- `cash-gateway-service/db/payment_attempts.sql`, `payments.sql`

**Transaction Propagation 수정:**
- `cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/app/payment/service/PaymentService.kt` (MANDATORY)
- `cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/external/paymentgateway/abs/PaymentGatewayClientProtocolCore.kt` (MANDATORY)
- `cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/app/webhook/controller/PgWebhookController.kt` (REQUIRES_NEW)
- `cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/app/webhook/service/PgWebhookService.kt` (MANDATORY)

### 주의사항
- Product.stock은 **읽기 전용 캐시** (직접 수정 금지)
- 재고 변경은 반드시 Payment Service를 통해서만
- 이벤트 발행은 Domain 모델에서 자동 (Service는 관여 안 함)
- **MANDATORY vs REQUIRES_NEW 원칙:**
  - REQUIRES_NEW: Kafka Consumer, HTTP Controller (Entry Point)
  - MANDATORY: 모든 비즈니스 로직 (85-90%)
- **gatewayReferenceId**: Cash Gateway 고유 거래 식별자 (Order ↔ Payment 매칭용)
- **orderNumber**: Ecommerce Service 고객용 주문번호 (사용자에게 보여지는 번호)

---

## ✅ 완료된 작업 (2026-02-02 세션 - 최신)

### 1. Public ID 마이그레이션 (Response DTO)

**목적**: Internal PK 노출 방지, 외부 API에서 Public ID만 사용

#### 변경된 Response DTO

**MerchantResponse** (`app/merchant/response/MerchantResponse.kt`)
```kotlin
// Before
data class MerchantResponse(
    val id: Long,           // ❌ Internal PK 노출
    val userId: Long,       // ❌ Internal FK 노출
    val publicId: String,
    // ...
)

// After
data class MerchantResponse(
    val publicId: String,        // ✅ Public ID만 노출
    val userPublicId: String,    // ✅ User Public ID 참조
    // ... (id, userId 제거)
)

companion object {
    fun from(merchant: Merchant, user: User): MerchantResponse {
        return MerchantResponse(
            publicId = merchant.publicId,
            userPublicId = user.publicId,  // User의 Public ID 사용
            // ...
        )
    }
}
```

**주요 변경점:**
- `id` → 제거 (Internal PK 노출 방지)
- `userId` → `userPublicId` (User의 Public ID 참조)
- `from()` 팩토리 메서드에서 User 엔티티를 받아 Public ID 변환

---

### 2. QueryDSL Repository 패턴 통일

**목적**: 전체 서비스에서 일관된 QueryDSL 검색 패턴 적용

#### 표준 패턴 (공통 모듈 기반)

**공통 모듈:**
- `common/src/main/kotlin/com/hamsterworld/common/app/AppSearchQuery.kt`
- `common/src/main/kotlin/com/hamsterworld/common/app/AppPagedSearchQuery.kt`
- `common/src/main/kotlin/com/hamsterworld/common/web/QuerydslExtension.kt`

**패턴 구조:**
```kotlin
// 1. SearchRequest는 AppPagedSearchQuery 상속
data class OrderSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,
    val status: OrderStatus? = null  // 도메인 특화 필드
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)

// 2. Repository: baseQuery + searchConditions 패턴
@Repository
class OrderRepository(...) {

    private fun baseQuery(request: OrderSearchRequest): JPAQuery<Order> {
        return jpaQueryFactory
            .selectFrom(qOrder)
            .where(*searchConditions(request).toTypedArray())
    }

    private fun searchConditions(request: OrderSearchRequest): List<BooleanExpression> {
        return listOfNotNull(
            QuerydslExtension.eqOrNull(qOrder.status, request.status),
            QuerydslExtension.inOrNullSafe(qOrder.publicId, request.publicIds),
            QuerydslExtension.between(qOrder.createdAt, request.from, request.to)
        )
    }

    fun searchList(request: OrderSearchRequest): List<Order> {
        val query = baseQuery(request)
        return QuerydslExtension.applySorts(query, qOrder.createdAt, request.sort)
            .fetch()
    }

    fun searchPage(request: OrderSearchRequest): Page<Order> {
        val baseQuery = baseQuery(request)

        // Count query (deprecated fetchCount() 제거)
        val total = jpaQueryFactory
            .select(qOrder.count())
            .from(qOrder)
            .where(*searchConditions(request).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset((request.page * request.size).toLong())
            .limit(request.size.toLong())

        val entities = QuerydslExtension.applySorts(pagedQuery, qOrder.createdAt, request.sort)
            .fetch()

        return PageImpl(entities, PageRequest.of(request.page, request.size), total)
    }
}
```

---

### 3. Ecommerce Service 리팩토링 목록

#### SearchRequest 모델 수정

**OrderSearchRequest** (`app/order/request/OrderSearchRequest.kt`)
- ✅ `AppPagedSearchQuery` 상속
- ✅ `LocalDateTime` → `LocalDate` 변경 (from, to 필드)
- ✅ 커스텀 페이징 필드 제거 (page, size는 부모 클래스 사용)

#### Repository 리팩토링

**1. OrderRepository** (`domain/order/repository/OrderRepository.kt`)
- ✅ `baseUserOrderQuery()` / `baseVendorOrderQuery()` 메서드 추가
- ✅ `searchUserOrderConditions()` / `searchVendorOrderConditions()` 조건 분리
- ✅ `searchUserOrders()` / `searchUserOrdersPage()` 메서드 (일반 사용자 주문 조회)
- ✅ `searchVendorOrders()` / `searchVendorOrdersPage()` 메서드 (판매자 주문 조회)
- ✅ Vendor 주문 조회 시 `countDistinct()` 사용 (JOIN으로 인한 중복 카운트 방지)
- ✅ Deprecated `fetchCount()` 제거 → `select(count())` / `select(countDistinct())`

**2. ProductRepository** (`infra/product/repository/ProductRepository.kt`)
- ✅ `baseQuery()` 메서드 추가
- ✅ `searchConditions()` 조건 분리
- ✅ Deprecated `fetchCount()` 제거
- ✅ `.fetch().size` → `select(count())` 변경

**3. CartRepository** (`domain/cart/repository/CartRepository.kt`)
- ✅ `findAllPage()` 메서드에서 deprecated `fetchCount()` 제거
- ✅ `findAllItemsByUserIdPage()` 메서드에서 deprecated `fetchCount()` 제거
- ✅ 총 2개 메서드 수정

**4. BoardRepository** (`domain/board/repository/BoardRepository.kt`)
- ✅ `baseQuery()` 메서드 추가
- ✅ `.fetch().size` → `select(count())` 변경
- ✅ 비효율적인 카운트 로직 개선

**5. UserRepository** (`domain/user/repository/UserRepository.kt`)
- ✅ `baseQuery()` 메서드 추가
- ✅ `searchConditions()` 조건 분리
- ✅ 중복된 WHERE 조건 제거 (3곳에서 중복 → 1곳으로 통합)
- ✅ Deprecated `fetchCount()` 제거

---

### 4. QuerydslExtension 유틸리티 활용

**공통 Extension 메서드:**
```kotlin
// common/web/QuerydslExtension.kt
object QuerydslExtension {
    // Null-safe equals
    fun <T> eqOrNull(path: Path<T>, value: T?): BooleanExpression?

    // IN 조건 (빈 컬렉션 처리)
    fun <T> inOrNullSafe(path: Path<T>, values: Collection<T>?): BooleanExpression?

    // 날짜 범위 검색 (LocalDate → LocalDateTime 변환)
    fun between(path: DateTimePath<LocalDateTime>, from: LocalDate?, to: LocalDate?): BooleanExpression?

    // LIKE 검색 (match: true = contains, false = equals)
    fun match(path: StringPath, value: String?, match: Boolean): BooleanExpression?

    // 정렬 적용
    fun <T> applySorts(query: JPAQuery<T>, defaultPath: DateTimePath<LocalDateTime>, sort: SortDirection): JPAQuery<T>
}
```

**활용 예시:**
```kotlin
private fun searchConditions(request: OrderSearchRequest): List<BooleanExpression> {
    return listOfNotNull(
        QuerydslExtension.eqOrNull(qOrder.status, request.status),
        QuerydslExtension.inOrNullSafe(qOrder.publicId, request.publicIds),
        QuerydslExtension.between(qOrder.createdAt, request.from, request.to)
    )
}
```

---

### 5. 주요 개선 사항

#### 1) Deprecated API 제거
- ❌ `JPAQuery.fetchCount()` (deprecated)
- ✅ `jpaQueryFactory.select(qEntity.count()).from(qEntity).fetchOne()`

#### 2) 중복 코드 제거
- UserRepository: WHERE 조건이 3곳에서 중복 → `searchConditions()` 메서드로 통합
- OrderRepository: User/Vendor 조회 조건을 각각 분리하여 가독성 향상

#### 3) 효율적인 카운트 쿼리
- `fetch().size` → `select(count())` (메모리 사용량 감소)
- JOIN이 있는 경우 `countDistinct()` 사용 (중복 카운트 방지)

#### 4) 일관된 패턴
- 모든 Repository가 동일한 패턴 사용
- baseQuery() + searchConditions() 분리
- QuerydslExtension 유틸리티 활용

#### 5) 타입 안정성
- LocalDate vs LocalDateTime 명확히 구분
- QuerydslExtension.between()이 자동 변환 처리

---

### 6. 빌드 확인

```bash
./gradlew :ecommerce-service:build

# 결과: SUCCESS (Deprecated 경고 없음)
```

---

### 7. 다음 세션 참고 사항

#### 새로운 SearchRequest 작성 시
1. `AppPagedSearchQuery` 상속 필수
2. `from`, `to` 필드는 `LocalDate` 타입 사용
3. 도메인 특화 필드만 추가 (page, size 등은 부모 클래스 사용)

#### 새로운 Repository 작성 시
1. `baseQuery(request)` 메서드 작성
2. `searchConditions(request)` 메서드로 조건 분리
3. `QuerydslExtension` 유틸리티 활용
4. Count 쿼리는 `select(count())` 또는 `select(countDistinct())` 사용
5. `fetchCount()` 사용 금지 (deprecated)

#### 관련 파일 위치
- **OrderSearchRequest**: `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/app/order/request/OrderSearchRequest.kt`
- **OrderRepository**: `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/domain/order/repository/OrderRepository.kt`
- **ProductRepository**: `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/infra/product/repository/ProductRepository.kt`
- **CartRepository**: `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/domain/cart/repository/CartRepository.kt`
- **BoardRepository**: `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/domain/board/repository/BoardRepository.kt`
- **UserRepository**: `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/domain/user/repository/UserRepository.kt`
- **MerchantResponse**: `ecommerce-service/src/main/kotlin/com/hamsterworld/ecommerce/app/merchant/response/MerchantResponse.kt`
