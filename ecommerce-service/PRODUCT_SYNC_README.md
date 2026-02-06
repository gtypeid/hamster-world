# Product 동기화 구현 가이드

## 📖 개요

Payment Service의 Product(상품) 변경사항을 Ecommerce Service에 동기화하는 기능입니다.

**현재 단계**: Kafka 없이 REST API로 수동 동기화 테스트 가능
**다음 단계**: Kafka Consumer 추가하여 자동 동기화

---

## 🏗️ 아키텍처

### **바운드 컨텍스트 분리**

| 서비스 | 역할 | Product 소유 |
|--------|------|------------|
| **Payment Service** | 상품 관리 (재고 포함) | ✅ 원본 (Master) |
| **Ecommerce Service** | 주문/장바구니 관리 | 📄 읽기 전용 복사본 (Replica) |

### **동기화 흐름**

```
Payment Service (원본)
    ↓
ProductSyncService (Ecommerce)
    ↓
ProductRepository (Ecommerce)
    ↓
products 테이블 (읽기 전용)
```

**향후 Kafka 추가 시**:
```
Payment Service → Kafka (product-events) → ProductKafkaConsumer → ProductSyncService
```

---

## 📁 구조

```
ecommerce-service/
├── domain/
│   ├── product/
│   │   ├── model/Product.kt              # 도메인 모델 (읽기 전용)
│   │   ├── constant/ProductCategory.kt
│   │   └── service/ProductSyncService.kt # 동기화 로직
│   └── event/
│       └── model/ProcessedEvent.kt       # 멱등성 보장
├── infra/
│   ├── product/
│   │   ├── entity/ProductEntity.kt
│   │   ├── mapper/ProductMapper.kt
│   │   └── repository/
│   │       ├── ProductJpaRepository.kt
│   │       └── ProductRepository.kt
│   └── event/
│       ├── entity/ProcessedEventEntity.kt
│       ├── mapper/ProcessedEventMapper.kt
│       └── repository/
│           ├── ProcessedEventJpaRepository.kt
│           └── ProcessedEventRepository.kt
└── app/
    └── product/
        ├── dto/
        │   ├── ProductSyncRequest.kt
        │   └── ProductResponse.kt
        └── controller/
            └── ProductSyncController.kt  # 테스트용 API
```

---

## 🚀 설정 및 실행

### **1. DB 스키마 생성**

```bash
# Ecommerce DB에 테이블 생성
mysql -h 127.0.0.1 -P 3306 -u root -p'12555!@' ecommerce_db < ecommerce-service/db/products.sql
mysql -h 127.0.0.1 -P 3306 -u root -p'12555!@' ecommerce_db < ecommerce-service/db/processed_events.sql
```

### **2. Ecommerce Service 실행**

```bash
./gradlew :ecommerce-service:bootRun
```

---

## 🧪 테스트 방법

### **시나리오 1: Product 생성 동기화**

```bash
# 1. Product 생성 동기화
curl -X POST http://localhost:8081/api/product-sync/create \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt-001",
    "productId": 1,
    "weekId": "uuid-123",
    "name": "노트북",
    "price": 1500000,
    "description": "고성능 노트북",
    "category": "ELECTRONICS",
    "createdAt": "2024-01-29T10:00:00"
  }'

# 2. 동기화된 Product 조회
curl http://localhost:8081/api/product-sync/1
```

**응답 예시**:
```json
{
  "id": 1,
  "weekId": "uuid-123",
  "name": "노트북",
  "price": 1500000,
  "description": "고성능 노트북",
  "category": "ELECTRONICS",
  "syncedAt": "2024-01-29T10:05:00",
  "createdAt": "2024-01-29T10:00:00",
  "modifiedAt": null
}
```

---

### **시나리오 2: Product 수정 동기화**

```bash
# 1. Product 수정 동기화
curl -X POST http://localhost:8081/api/product-sync/update \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt-002",
    "productId": 1,
    "name": "고성능 노트북",
    "price": 1600000,
    "description": "업그레이드된 고성능 노트북",
    "category": "ELECTRONICS",
    "modifiedAt": "2024-01-29T11:00:00"
  }'

# 2. 수정된 Product 조회
curl http://localhost:8081/api/product-sync/1
```

---

### **시나리오 3: 멱등성 테스트 (중복 이벤트)**

```bash
# 1. 같은 eventId로 재요청
curl -X POST http://localhost:8081/api/product-sync/create \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt-001",
    "productId": 1,
    "weekId": "uuid-123",
    "name": "노트북",
    "price": 1500000,
    "description": "고성능 노트북",
    "category": "ELECTRONICS",
    "createdAt": "2024-01-29T10:00:00"
  }'

# 로그 확인: "[중복 이벤트 스킵] eventId=evt-001, productId=1"
```

---

### **시나리오 4: Product 삭제 동기화**

```bash
# 1. Product 삭제 동기화
curl -X POST http://localhost:8081/api/product-sync/delete \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt-003",
    "productId": 1,
    "deletedAt": "2024-01-29T12:00:00"
  }'

# 2. 삭제 확인 (404 에러)
curl http://localhost:8081/api/product-sync/1
```

---

### **시나리오 5: 전체 Product 조회**

```bash
# 전체 Product 목록
curl http://localhost:8081/api/product-sync
```

---

## 🔑 핵심 개념

### **1. 멱등성 (Idempotency)**

동일한 `eventId`로 여러 번 요청해도 결과가 동일합니다.

```kotlin
// ProcessedEvent 테이블에 eventId 기록
if (processedEventRepository.existsByEventId(eventId)) {
    log.warn("[중복 이벤트 스킵]")
    return
}
```

### **2. 읽기 전용 복사본**

Ecommerce Service의 Product는:
- ✅ 상품 정보만 복사 (id, name, price, category 등)
- ❌ 재고(stock)는 복사하지 않음 (Payment Service만 관리)
- ✅ `syncedAt` 필드로 마지막 동기화 시각 추적

### **3. ID 공유**

Payment Service의 Product ID를 Ecommerce Service에서도 **그대로 사용**합니다.
```kotlin
// ProductEntity.kt
@Id
var id: Long? = null  // Auto Increment 사용 안 함
```

---

## 🔮 다음 단계: Kafka 연동

### **추가할 컴포넌트**

1. **Payment Service**: `ProductKafkaEventPublisher`
   - Product CUD 시 Kafka로 이벤트 발행

2. **Ecommerce Service**: `ProductKafkaEventConsumer`
   - Kafka 이벤트 구독 → `ProductSyncService` 호출

3. **Common 모듈**: Kafka Event DTO
   - `ProductCreatedKafkaEvent`
   - `ProductUpdatedKafkaEvent`
   - `ProductDeletedKafkaEvent`

### **Kafka Consumer 예시**

```kotlin
@Component
class ProductKafkaEventConsumer(
    private val productSyncService: ProductSyncService
) {
    @KafkaListener(topics = ["product-events"])
    fun consume(@Payload event: ProductCreatedKafkaEvent) {
        productSyncService.syncProductCreated(
            eventId = event.eventId,
            productId = event.productId,
            weekId = event.weekId,
            name = event.name,
            price = event.price,
            description = event.description,
            category = event.category,
            createdAt = event.createdAt
        )
    }
}
```

---

## 📊 DB 스키마

### **products 테이블**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT (PK) | Payment Service의 Product ID |
| week_id | VARCHAR(100) UNIQUE | Product 고유 ID |
| name | VARCHAR(255) | 상품명 |
| price | DECIMAL(10,2) | 가격 |
| description | TEXT | 설명 |
| category | VARCHAR(50) | 카테고리 (ENUM) |
| synced_at | DATETIME | 마지막 동기화 시각 |
| created_at | DATETIME | 생성일 |
| modified_at | DATETIME | 수정일 |

### **processed_events 테이블**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT (PK, AUTO_INCREMENT) | - |
| event_id | VARCHAR(100) UNIQUE | 이벤트 ID (멱등성 키) |
| event_type | VARCHAR(50) | 이벤트 타입 |
| processed_at | DATETIME | 처리 시각 |

---

## 🐛 문제 해결

### **"Product not found" 에러**

**원인**: Product가 아직 동기화되지 않음
**해결**: `/api/product-sync/create` API로 먼저 동기화

### **멱등성이 작동하지 않음**

**확인**: `processed_events` 테이블에 eventId가 저장되었는지 확인
```sql
SELECT * FROM processed_events WHERE event_id = 'evt-001';
```

### **가격이 음수로 저장됨**

**확인**: `price` 필드가 `DECIMAL(10,2)`로 정의되었는지 확인

---

## ✅ 체크리스트

- [x] Product 도메인 모델 추가
- [x] ProductEntity, ProductMapper 구현
- [x] ProductRepository 구현
- [x] ProcessedEvent 엔티티 추가 (멱등성)
- [x] ProductSyncService 구현
- [x] 테스트용 Controller 추가
- [x] DB 스키마 파일 생성
- [ ] Kafka Producer 추가 (Payment Service)
- [ ] Kafka Consumer 추가 (Ecommerce Service)
- [ ] 통합 테스트

---

## 🎯 요약

현재 구현된 기능:
1. ✅ Product 동기화 Service 계층 완성
2. ✅ REST API로 수동 동기화 테스트 가능
3. ✅ 멱등성 보장 (중복 이벤트 처리 방지)
4. ✅ 읽기 전용 Product 복사본

다음 작업:
1. ⏳ Kafka Producer/Consumer 추가
2. ⏳ Payment Service에서 Product CUD 시 이벤트 자동 발행
3. ⏳ Ecommerce Service에서 자동 동기화
