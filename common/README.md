# Common Module

> **다음 Claude 세션을 위한 문서**
> 전체 프로젝트에서 공유되는 공통 모듈입니다.

---

## 📋 개요

이 모듈은 모든 서비스에서 공통으로 사용되는 컴포넌트를 제공합니다.

### 주요 책임
- ✅ **도메인 이벤트 패턴** (AbsDomainRoot, DomainEvent)
- ✅ **Kafka 인프라** (BaseKafkaConsumer, KafkaDomainEventPublisher)
- ✅ **Condition Filter/Emitter 패턴** (정책 기반 처리)
- ✅ **공통 유틸리티** (QueryDSL Extension, Snowflake ID 등)
- ✅ **공통 DTO/Exception**

---

## 🎯 핵심 패턴: Condition Filter/Emitter

> **2026-02-08 세션 추가**
>
> 모든 정책 기반 처리(Mission, Coupon, 미래의 모든 정책)에 적용되는 표준 패턴입니다.

### 개념

```
Input → ConditionFilter (진입 필터) → Process → ConditionEmitter (결과 생성) → Output
```

**ConditionFilter**: "이 입력이 처리될 조건을 만족하는가?" (큐 진입 여부)
**ConditionEmitter**: "처리 결과로 무엇을 생성할 것인가?" (큐 출력 형태)

### 적용 사례

#### 1. Progression Service - Mission
```
Event 수신 → MissionConditionFilter 필터 → currentProgress++ → 달성? → MissionConditionEmitter → 보상 발행
```

**Filter**: "이 이벤트가 카운트될 조건인가?"
- type: MissionType (CREATE_ORDER, COMPLETE_DELIVERY)
- requirement: 몇 번 달성해야 하는가
- filtersJson: 이벤트 필터 (카테고리, 상품 등)

**Emitter**: "달성 시 무엇을 emit할 것인가?"
- rewardType: POINT or COUPON
- rewardAmount: 포인트 양
- rewardContent: 쿠폰 정보

#### 2. Ecommerce Service - Coupon
```
Order 생성 → CouponUsageConditionFilter 필터 → 통과? → DiscountConditionEmitter → 할인 금액 계산
```

**Filter**: "이 주문이 쿠폰 사용 가능한가?"
- minOrderAmount: 최소 주문 금액
- filtersJson: 주문 필터 (카테고리, 판매자 등)

**Emitter**: "사용 시 얼마를 할인할 것인가?"
- discountType: FIXED_AMOUNT or PERCENTAGE
- discountValue: 할인 값
- maxDiscountAmount: 최대 할인 금액 (정률 할인 시)

### 아키텍처

```
┌─────────────────────────────────────────────────────┐
│  Common Module (외벽 + 계약)                          │
├─────────────────────────────────────────────────────┤
│  • ConditionFilterRequest (DTO)                     │
│  • ConditionEmitterRequest (DTO)                    │
│  • ConditionFilter<T> (인터페이스)                   │
│  • ConditionEmitter<I,O> (인터페이스)                │
│  • ConditionFilterUtils (공통 유틸)                  │
└─────────────────────────────────────────────────────┘
               ↓                    ↓
┌──────────────────────┐  ┌──────────────────────┐
│ Progression Service  │  │ Ecommerce Service    │
├──────────────────────┤  ├──────────────────────┤
│ 내부 로직 (각자 구현) │  │ 내부 로직 (각자 구현) │
├──────────────────────┤  ├──────────────────────┤
│ MissionCondition     │  │ CouponUsage          │
│   Filter             │  │   ConditionFilter    │
│   .matches() {       │  │   .matches() {       │
│     // Mission 로직  │  │     // Coupon 로직   │
│   }                  │  │   }                  │
│                      │  │                      │
│ MissionCondition     │  │ DiscountCondition    │
│   Emitter            │  │   Emitter            │
│   .emit() {          │  │   .emit() {          │
│     // Reward 로직   │  │     // Discount 로직 │
│   }                  │  │   }                  │
└──────────────────────┘  └──────────────────────┘
```

---

## 📦 주요 컴포넌트

### 1. Condition Filter/Emitter

#### 인터페이스
```kotlin
// common/domain/condition/ConditionFilter.kt
interface ConditionFilter<T> {
    /**
     * 입력이 조건을 만족하는가?
     */
    fun matches(input: T): Boolean

    /**
     * 필터 정보 (JSON)
     */
    val filtersJson: String?
}

// common/domain/condition/ConditionEmitter.kt
interface ConditionEmitter<I, O> {
    /**
     * 입력을 받아 결과 생성
     */
    fun emit(input: I): O
}
```

#### Request DTO (공통 외벽)
```kotlin
// common/admin/dto/ConditionFilterRequest.kt
data class ConditionFilterRequest(
    // Mission 전용
    val missionType: String? = null,
    val requirement: Int? = null,

    // Coupon 전용
    val minOrderAmount: BigDecimal? = null,

    // 공통
    val filtersJson: String? = null
)

// common/admin/dto/ConditionEmitterRequest.kt
data class ConditionEmitterRequest(
    // Reward 전용
    val rewardType: String? = null,
    val rewardAmount: Int? = null,
    val rewardContent: String? = null,

    // Discount 전용
    val discountType: String? = null,
    val discountValue: BigDecimal? = null,
    val maxDiscountAmount: BigDecimal? = null
)
```

#### 공통 유틸리티
```kotlin
// common/domain/condition/ConditionFilterUtils.kt
object ConditionFilterUtils {
    /**
     * filtersJson 파싱
     */
    fun parseFilters(filtersJson: String): Map<String, Any>

    /**
     * 카테고리 필터 매칭
     */
    fun matchesCategories(
        inputCategories: Set<String>,
        filters: Map<String, Any>
    ): Boolean

    /**
     * Product ID 필터 매칭
     */
    fun matchesProductIds(
        inputProductIds: Set<Long>,
        filters: Map<String, Any>
    ): Boolean

    /**
     * Merchant ID 필터 매칭
     */
    fun matchesMerchantIds(
        inputMerchantId: Long,
        filters: Map<String, Any>
    ): Boolean
}
```

### filtersJson 공통 스펙

모든 서비스의 `filtersJson`은 동일한 스펙을 따릅니다:

```json
{
  "categories": ["ELECTRONICS", "FASHION"],
  "productIds": [123, 456],
  "merchantIds": [789]
}
```

**필드 설명:**
- `categories`: 상품 카테고리 목록 (String 배열)
- `productIds`: 특정 상품 ID 목록 (Long 배열)
- `merchantIds`: 특정 판매자 ID 목록 (Long 배열)

---

## 🔄 사용 예시

### Progression Service - Mission 생성 API

```http
POST /api/admin/missions
Content-Type: application/json

{
  "archiveId": "ARCHIVE_001",
  "title": "전자제품 5회 구매 미션",
  "filter": {
    "missionType": "CREATE_ORDER",
    "requirement": 5,
    "filtersJson": "{\"categories\": [\"ELECTRONICS\"]}"
  },
  "emitter": {
    "rewardType": "POINT",
    "rewardAmount": 100
  },
  "startAt": "2025-03-01T00:00:00",
  "endAt": "2025-03-31T23:59:59"
}
```

### Ecommerce Service - Coupon 생성 API

```http
POST /api/admin/coupons
Content-Type: application/json

{
  "code": "SPRING2025",
  "title": "봄맞이 10% 할인 쿠폰",
  "filter": {
    "minOrderAmount": 30000,
    "filtersJson": "{\"categories\": [\"ELECTRONICS\"]}"
  },
  "emitter": {
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "maxDiscountAmount": 5000
  },
  "validFrom": "2025-03-01T00:00:00",
  "validUntil": "2025-03-31T23:59:59"
}
```

**공통점**:
- 두 API 모두 `filter`, `emitter` 구조 사용
- `filter.filtersJson` 스펙 동일
- 프론트엔드는 동일한 타입으로 처리 가능

---

## 📁 프로젝트 구조

```
common/
├── src/main/kotlin/com/hamsterworld/common/
│   │
│   ├── domain/
│   │   ├── condition/                    # ⭐ Condition Filter/Emitter 패턴
│   │   │   ├── ConditionFilter.kt        # 인터페이스
│   │   │   ├── ConditionEmitter.kt       # 인터페이스
│   │   │   └── ConditionFilterUtils.kt   # 공통 유틸
│   │   │
│   │   ├── AbsDomainRoot.kt              # 도메인 루트
│   │   ├── DomainEvent.kt                # 도메인 이벤트 기본
│   │   └── ...
│   │
│   ├── admin/
│   │   └── dto/                          # ⭐ Admin API 공통 DTO
│   │       ├── ConditionFilterRequest.kt
│   │       └── ConditionEmitterRequest.kt
│   │
│   ├── web/
│   │   ├── kafka/
│   │   │   ├── BaseKafkaConsumer.kt      # Kafka Consumer 기본
│   │   │   ├── KafkaDomainEventPublisher.kt
│   │   │   └── ...
│   │   │
│   │   ├── QuerydslExtension.kt          # QueryDSL 유틸
│   │   └── ...
│   │
│   ├── app/
│   │   ├── AppSearchQuery.kt
│   │   └── AppPagedSearchQuery.kt
│   │
│   └── ...
```

---

## 🚀 다음 서비스에서 패턴 적용하기

새로운 정책 기반 처리를 추가할 때:

### 1. Request DTO 정의 (공통 DTO 사용)
```kotlin
data class CreateYourPolicyRequest(
    val policyId: String,
    val title: String,

    val filter: ConditionFilterRequest,    // ✅ 공통 사용
    val emitter: ConditionEmitterRequest,  // ✅ 공통 사용

    // 정책별 메타데이터
    val validFrom: LocalDateTime,
    val validUntil: LocalDateTime
)
```

### 2. Domain Model 정의 (인터페이스 구현)
```kotlin
@Embeddable
data class YourConditionFilter(
    // 정책별 전용 필드
    val yourSpecificField: String?,

    // 공통 필드
    @Column(name = "filters_json")
    override val filtersJson: String?
) : ConditionFilter<YourInput> {

    override fun matches(input: YourInput): Boolean {
        // 정책별 로직 구현
        if (filtersJson != null) {
            val filters = ConditionFilterUtils.parseFilters(filtersJson)
            // ConditionFilterUtils 활용
        }
        return true
    }
}

@Embeddable
data class YourConditionEmitter(
    // 정책별 출력 필드
    val outputType: String,
    val outputValue: Any
) : ConditionEmitter<YourInput, YourOutput> {

    override fun emit(input: YourInput): YourOutput {
        // 정책별 결과 생성 로직
    }
}
```

### 3. DTO → Domain 변환
```kotlin
fun CreateYourPolicyRequest.toFilter(): YourConditionFilter {
    return YourConditionFilter(
        yourSpecificField = filter.yourSpecificField,
        filtersJson = filter.filtersJson
    )
}

fun CreateYourPolicyRequest.toEmitter(): YourConditionEmitter {
    return YourConditionEmitter(
        outputType = emitter.outputType!!,
        outputValue = emitter.outputValue!!
    )
}
```

---

## 🎨 프론트엔드 통합

프론트엔드는 공통 타입 하나만 알면 됩니다:

```typescript
// @common/types
interface ConditionFilterRequest {
  // Mission
  missionType?: string
  requirement?: number

  // Coupon
  minOrderAmount?: number

  // 공통
  filtersJson?: string
}

interface ConditionEmitterRequest {
  // Reward
  rewardType?: string
  rewardAmount?: number
  rewardContent?: string

  // Discount
  discountType?: string
  discountValue?: number
  maxDiscountAmount?: number
}

// Mission 폼
<Form<CreateMissionRequest>>
  <Select name="filter.missionType" />
  <Input name="filter.requirement" />
  <FilterBuilder name="filter.filtersJson" />  {/* 공통 컴포넌트 */}

  <Select name="emitter.rewardType" />
  <Input name="emitter.rewardAmount" />
</Form>

// Coupon 폼
<Form<CreateCouponRequest>>
  <Input name="filter.minOrderAmount" />
  <FilterBuilder name="filter.filtersJson" />  {/* 동일한 공통 컴포넌트 */}

  <Select name="emitter.discountType" />
  <Input name="emitter.discountValue" />
</Form>
```

---

## 📝 기타 공통 컴포넌트

### Domain Events
- `AbsDomainRoot`: 도메인 이벤트 등록/발행
- `DomainEvent`: 도메인 이벤트 기본 인터페이스
- `@DomainEvents`, `@AfterDomainEventPublication`

### Kafka Infrastructure
- `BaseKafkaConsumer`: 멱등성 보장 Consumer
- `KafkaDomainEventPublisher`: 도메인 이벤트 → Kafka 발행
- `ProcessedEventRepository`: 중복 이벤트 체크

### QueryDSL Extension
- `QuerydslExtension.eqOrNull()`
- `QuerydslExtension.inOrNullSafe()`
- `QuerydslExtension.between()`
- `QuerydslExtension.match()`
- `QuerydslExtension.applySorts()`

### Snowflake ID
- Public ID 생성 (Base62 인코딩)

---

## 📌 주의사항

### Condition Filter/Emitter 패턴 사용 시
1. **외벽 DTO는 공통 사용**: `ConditionFilterRequest`, `ConditionEmitterRequest`
2. **내부 로직은 각자 구현**: `.matches()`, `.emit()` 메서드
3. **filtersJson 스펙 준수**: categories, productIds, merchantIds
4. **공통 유틸 활용**: `ConditionFilterUtils` 사용

### 도메인 이벤트 패턴 사용 시
- `AbsDomainRoot` 상속 필수
- `registerEvent()` 호출 후 Repository save 필수
- `@TransactionalEventListener(AFTER_COMMIT)` 보장

---

## 🔗 관련 문서

- [Progression Service README](../progression-service/README.md) - Mission 패턴 구현 예시
- [Ecommerce Service README](../ecommerce-service/README.md) - Coupon 패턴 구현 예시
- [메인 README](../README.md) - 전체 프로젝트 구조
