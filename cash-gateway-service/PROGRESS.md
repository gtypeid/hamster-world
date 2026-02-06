# cash-gateway-service 작업 진행 상황

## 완료된 작업 ✅

### 1. 디렉토리 구조 생성
```
cash-gateway-service/
├── domain/
│   ├── payment/
│   │   ├── model/
│   │   ├── constant/
│   │   └── service/
│   └── paymentattempt/
│       ├── model/
│       ├── constant/
│       ├── converter/
│       └── dto/
├── infra/
│   ├── payment/
│   │   ├── entity/
│   │   ├── mapper/
│   │   └── repository/
│   └── paymentattempt/
│       ├── entity/
│       ├── mapper/
│       └── repository/
├── external/
│   └── paymentgateway/
│       ├── abs/
│       ├── client/
│       ├── provider/
│       ├── dto/
│       └── config/
├── app/
│   └── payment/
│       └── controller/
└── web/
    ├── config/
    └── filter/
```

### 2. Payment 도메인 생성 ✅
- ✅ PaymentStatus.kt (enum: APPROVED, CANCELLED)
- ✅ Payment.kt (model)
- ✅ PaymentEntity.kt
- ✅ PaymentMapper.kt
- ✅ PaymentJpaRepository.kt
- ✅ PaymentRepository.kt

### 3. PaymentProcess 도메인 생성 ✅
- ✅ PaymentProcessStatus.kt
- ✅ PaymentProcess.kt (model)
- ✅ PaymentProcessEntity.kt
- ✅ PaymentProcessMapper.kt
- ✅ PaymentProcessJpaRepository.kt
- ✅ PaymentProcessRepository.kt

### 4. PaymentProcess Converter & DTO 생성 ✅
**DTO:**
- ✅ PaymentApprovedRequestWithCtx.kt
- ✅ PaymentCancelledRequestWithCtx.kt
- ✅ PaymentRequestWithCtx.kt
- ✅ PaymentResponseWithCtx.kt

**Converter:**
- ✅ PaymentApprovedRequestToAttemptConverter.kt
- ✅ PaymentCancelledRequestToAttemptConverter.kt
- ✅ PaymentRequestToAttemptConverter.kt
- ✅ PaymentResponseToAttemptConverter.kt

### 5. PG 연동 복사 ✅
**external/paymentgateway/abs:**
- ✅ PaymentGatewayClient.kt
- ✅ PaymentGatewayClientProtocol.kt
- ✅ PaymentGatewayClientProtocolCore.kt
- ✅ PaymentGatewayClientRegistry.kt
- ✅ PaymentGatewayCoreService.kt
- ✅ PaymentGatewayProvider.kt

**external/paymentgateway/client:**
- ✅ DummyPaymentGatewayClient.kt

**external/paymentgateway/provider:**
- ✅ DummyPaymentGatewayProvider.kt

**external/paymentgateway/dto:**
- ✅ ApprovePaymentCtx.kt
- ✅ CancelPaymentCtx.kt
- ✅ PaymentCancelRequest.kt
- ✅ PaymentCtx.kt
- ✅ PaymentRequest.kt
- ✅ PaymentResponse.kt

**external/paymentgateway/config:**
- ✅ PaymentGatewayConfig.kt

### 6. 바운드 컨텍스트 격리 ✅
- ✅ cash-gateway-service/build.gradle: ecommerce-service 참조 금지
- ✅ ecommerce-service/build.gradle: cash-gateway-service 참조 금지
- ✅ 각 서비스는 common 모듈만 접근 가능

---

## 남은 작업 (다음 작업)

### 1. User 참조 제거 ⚠️
**현재 문제:**
```kotlin
// PaymentGatewayClient.kt
fun bind(user: User): PaymentGatewayClientProtocol  // ❌ User는 ecommerce 도메인
```

**해결 방안:**
```kotlin
fun bind(userId: Long): PaymentGatewayClientProtocol  // ✅ Long만 사용
```

### 2. Order 참조 제거 ⚠️
**현재 문제:**
```kotlin
// ApprovePaymentCtx.kt, CancelPaymentCtx.kt
val order: OrderWithItems  // ❌ Order는 ecommerce 도메인
```

**해결 방안:**
```kotlin
data class ApprovePaymentCtx(
    val userId: Long,
    val orderId: Long,
    val amount: BigDecimal,
    val orderNumber: String,
    val items: List<PaymentItemInfo>  // ✅ 최소한의 정보만
)

data class PaymentItemInfo(
    val productId: Long,
    val quantity: Int,
    val price: BigDecimal
)
```

### 3. PaymentGatewayCoreService 리팩토링 ⚠️
**현재 문제:**
```kotlin
// PaymentGatewayCoreService.kt (234-257라인)
private fun productStocks(event: PaymentProcess) {
    val order = orderRecordService.reloadOrder(event.orderId!!)  // ❌ Order 참조
    val product = recordRepository.readRecord(productId)  // ❌ Product 참조
    val updatedProduct = product.updateStock(quantity, msg)
    productRepository.saveAndPublish(updatedProduct)
}
```

**해결 방안:**
```kotlin
// 1. productStocks() 메서드 제거
// 2. 이벤트 발행으로 전환

// 결제 성공 시
publishEvent(PaymentCompletedEvent(
    paymentAttemptId = attemptId,
    orderId = event.orderId,
    items = event.items
))

// payment-system이 구독하여 재고 처리
```

### 4. OrderRecordService 의존성 제거 ⚠️
```kotlin
// PaymentGatewayCoreService.kt
class PaymentGatewayCoreService(
    private val orderRecordService: OrderRecordService  // ❌ 제거 필요
)
```

### 5. ProductRepository 의존성 제거 ⚠️
```kotlin
// PaymentGatewayCoreService.kt
class PaymentGatewayCoreService(
    private val productRepository: ProductRepository  // ❌ 제거 필요
)
```

### 6. Config 파일 생성 필요
- [ ] SecurityConfig.kt
- [ ] QueryDslConfig.kt
- [ ] KafkaConfig.kt (이벤트 발행용)

### 7. 이벤트 도메인 생성 필요
```kotlin
// domain/event/PaymentEvent.kt
sealed class PaymentEvent {
    data class PaymentCompletedEvent(
        val paymentAttemptId: Long,
        val orderId: Long,
        val userId: Long,
        val amount: BigDecimal
    ) : PaymentEvent()

    data class PaymentCancelledEvent(
        val paymentAttemptId: Long,
        val orderId: Long
    ) : PaymentEvent()
}
```

### 8. 컴파일 검증
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
./gradlew :cash-gateway-service:build -x test
```

---

## 작업 순서 (추천)

1. **ApprovePaymentCtx, CancelPaymentCtx 수정** (Order 제거)
2. **PaymentGatewayClient.bind() 수정** (User 제거)
3. **PaymentGatewayCoreService 수정** (Order/Product 참조 제거)
4. **Config 파일 생성** (SecurityConfig, QueryDslConfig)
5. **컴파일 검증**
6. **이벤트 발행 로직 추가** (나중에)

---

## 핵심 원칙 (재확인)

### ✅ 허용
- Payment, PaymentProcess 도메인 관리
- PG 연동 (외부 ISP 통신)
- orderId, userId는 **Long 타입으로만** 보유

### ❌ 절대 금지
- User 도메인 객체 참조
- Order 도메인 객체 참조
- Product 도메인 객체 참조
- 재고 직접 조작
- 주문 상태 직접 변경

### 📢 대신 해야 할 것
- **이벤트 발행**: PaymentProcess 상태 변경 시
- ecommerce가 Order 상태 변경 (이벤트 구독)
- payment-system이 재고 처리 (이벤트 구독)
