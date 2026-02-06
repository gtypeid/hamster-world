# Cash Gateway Service

> **🔒 INTERNAL ADMIN - Hamster World 운영진 전용**
> 메인 README 읽은 후 이 문서를 읽으세요.

**결제 방화벽 + 중개 플랫폼 (Source of Truth ⭐)**

> **핵심 책임**:
> - 결제 중개 (PG Aggregator)
> - 복잡한 결제 로직/검증 처리
> - 모든 결제 이벤트의 집합점
> - 정산 수수료 계산
> - 외부 파트너 정산 기록

---

## 목차
1. [개요](#개요)
2. [비즈니스 모델](#비즈니스-모델)
3. [아키텍처 원칙](#아키텍처-원칙)
4. [도메인 모델](#도메인-모델)
5. [운영 모드](#운영-모드)
6. [PG 통신 플로우](#pg-통신-플로우)
7. [멱등성 전략](#멱등성-전략)
8. [Frontend (Internal Admin)](#frontend-internal-admin)
9. [API 명세](#api-명세)

---

## 개요

Cash Gateway Service는 **Hamster World의 핵심 결제 중개 서비스**로,
모든 결제 이벤트의 **집합점**이자 **진실의 원천(Source of Truth)**입니다.

### 서비스 위치

```
┌────────────────────────────────────────────┐
│  Hamster World (결제 중개 플랫폼)           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ├─ Ecommerce Service (벤더용 SaaS)       │
│  ├─ Cash Gateway Service (이 서비스) ⭐    │
│  └─ Payment Service (정산/재고)           │
└────────────────────────────────────────────┘
```

### 주요 기능
- ✅ 결제 중개 (PG Aggregator): 벤더가 PG 직접 계약 없이도 결제 가능
- ✅ 결제 방화벽: 복잡한 결제 로직/검증 처리
- ✅ PG 결제 대행 (Active Mode - 경로 B)
- ✅ PG Webhook 수신 (경로 A + B 모두)
- ✅ 외부 파트너 정산 기록 (Passive Mode)
- ✅ 비동기 PG 지원 (폴링 서비스)
- ✅ 멱등성 보장 (중복 처리 방지)
- ✅ 정산 수수료 계산 및 처리

### 포트 정보
- **Application**: 8082
- **Database**: 3307 (cash_gateway_db)
- **노출 대상**: 🔒 **INTERNAL ADMIN** (운영진만 접근)

---

## 비즈니스 모델

### 2가지 결제 경로 모두 처리

#### 경로 A: 벤더 직접 PG 계약 (낮은 수수료)
```
Ecommerce → 외부 PG → Webhook → Cash Gateway
                                     ↓
                              Payment 생성
```
- 벤더가 PG사와 직접 계약
- Cash Gateway는 Webhook만 수신
- 낮은 수수료 (모니터링/정산만)

#### 경로 B: Hamster 중개 (높은 수수료)
```
Ecommerce → Cash Gateway → 외부 PG → Webhook → Cash Gateway
                                                     ↓
                                              Payment 생성
```
- Hamster World가 PG사와 직접 통신
- 벤더는 PG 계약 불필요
- 높은 수수료 부과 (결제 대행 + 정산)

### 모든 결제 이벤트 집합
- 경로 A + B 모두 Cash Gateway로 집합
- 통합된 정산/모니터링
- MID 기반 거래 출처 자동 판별

---

## 아키텍처 진화

### Monolithic → Event-Driven 전환

#### **Phase 1: Monolithic (과거)**
```kotlin
// REQUIRES_NEW: 언제나 이력 남김
@Transactional(propagation = Propagation.REQUIRES_NEW)
fun recordAttempt(attempt: PaymentProcess) {
    // 별도 트랜잭션 → 항상 커밋 (부모 롤백되어도 기록 유지)
    paymentAttemptRepository.save(attempt)
}
```

**개념**: PaymentProcess = **"사후 이력(History)"**
- PG 통신 결과를 사후에 기록
- 실패해도 항상 기록 남김 (REQUIRES_NEW)
- 감사 로그(Audit Log) 성격

**문제점**:
- ❌ 원자성 깨짐 (일부 커밋, 일부 롤백)
- ❌ Kafka 재시도 vs DB 커밋 불일치
- ❌ 중복 처리 위험 (PaymentProcess는 커밋, ProcessedEvent는 롤백)

---

#### **Phase 2: Event-Driven (현재)**
```kotlin
// MANDATORY: 부모 트랜잭션 참여
@Transactional(propagation = Propagation.MANDATORY)
fun recordProcess(process: PaymentProcess) {
    // 부모 트랜잭션과 함께 커밋/롤백
    // gatewayReferenceId는 생성 시점부터 존재 (NOT NULL)
    paymentProcessRepository.save(process)
}
```

**개념**: PaymentProcess = **"상태 관리(State)"**
- 결제 시도의 현재 상태를 실시간 추적
- 생성 시점부터 `gatewayReferenceId` 보유 (mandatory)
- 상태 전이: `UNKNOWN → SUCCESS/FAILED/CANCELLED`
- Source of Truth (진실의 원천)

**장점**:
- ✅ 원자성 보장 (모두 성공 or 모두 롤백)
- ✅ Kafka 재시도와 일관성 유지
- ✅ 멱등성: ProcessedEvent (eventId 중복 체크)

---

### 객체 분리 설계 철학

```
┌─────────────────────────────────────────────┐
│  PaymentProcess (Mutable, CAS)              │  ← "지저분한" 상태 관리
│  - 상태 전이 (UNKNOWN → SUCCESS)            │
│  - CAS 업데이트 (동시성 제어)               │
│  - gatewayReferenceId (생성 시점부터 존재)  │
└─────────────────┬───────────────────────────┘
                  │ 1:1
                  ↓
┌─────────────────────────────────────────────┐
│  Payment (Immutable)                        │  ← "깨끗한" 불변 기록
│  - 완전 불변 (INSERT만)                     │
│  - 취소도 새 레코드 (originPaymentId)       │
│  - Source of Truth의 확정본                 │
└─────────────────────────────────────────────┘
```

**왜 분리했는가?**
1. **Payment의 불변성 보장**: 거래 기록은 절대 변경되면 안 됨
2. **상태 관리 격리**: "지저분한" 상태 전이는 PaymentProcess가 담당
3. **책임 분리**: Process = 진행 중 상태, Payment = 확정 기록

**진짜 이력(History)이 필요하다면?**
- `PaymentLog` 같은 별도 객체 사용
- `PaymentProcess`는 상태 관리 용도

---

## 아키텍처 원칙

### 1. PaymentProcess와 Payment의 관계

```
PaymentProcess (1) ───────→ Payment (1)
     ↑                           ↑
   Mutable                   Immutable
  (CAS 업데이트)              (INSERT만)
   상태 관리                  거래 기록
```

**핵심 규칙**:
- **모든 Payment는 반드시 PaymentProcess가 먼저 존재**
- **1:1 관계 엄격히 유지** (processId FK)
- **PaymentProcess**: 결제 프로세스 상태 관리 (Mutable, Source of Truth)
- **Payment**: 확정된 거래 기록 (Immutable, 불변 스냅샷)

---

### 2. Event Sourcing이 아닌 이유

```kotlin
// ❌ Event Sourcing이 아닙니다
Payment는 "상태를 가진 Aggregate"가 아닌 "독립적인 거래 기록"

// ✅ Product + ProductRecord (Event Sourcing 예시)
Product {
    stock: 100  // Aggregate (상태 보유)
}
ProductRecord 1: delta=+100
ProductRecord 2: delta=-10
// stock = SUM(delta)

// ✅ Payment (독립 거래)
Payment 1: amount=10000, status=APPROVED
Payment 2: amount=-3000, status=CANCELLED, originPaymentId=1
// 현재 잔액 = SUM(amount) WHERE id=1 OR originPaymentId=1
```

**Payment는**:
- 위에 "집계할 Aggregate" 없음
- 그 자체가 최종 거래 기록
- 상태 변할 일 없음 (불변)

---

## 도메인 모델

### PaymentProcess (Mutable State)

**역할**: 결제 프로세스 상태 관리 (Source of Truth ⭐)

**개념**: "이력"이 아닌 "상태"
- ❌ 사후에 기록하는 이력(History)
- ✅ 실시간으로 추적하는 상태(State)
- ✅ 생성 시점부터 `gatewayReferenceId` 보유 (mandatory)
- ✅ 상태 전이를 CAS 업데이트로 관리

```kotlin
@Entity
@Table(
    name = "payment_processes",  // 테이블명 변경
    indexes = [
        Index(name = "idx_gateway_reference_id", columnList = "gatewayReferenceId", unique = true),
        Index(name = "idx_pg_tid", columnList = "pgTransaction", unique = true),
        Index(name = "idx_order_public_id", columnList = "orderPublicId"),
        Index(name = "idx_provider_mid_status", columnList = "provider,mid,status")
    ]
)
class PaymentProcess(
    @Column(nullable = false)  // ✅ NOT NULL (mandatory)
    var gatewayReferenceId: String,  // Cash Gateway 고유 식별자 (생성 시점부터 존재)

    var orderPublicId: String?,  // nullable (외부 거래)
    var userPublicId: String?,

    @Enumerated(EnumType.STRING)
    var provider: Provider?,  // TOSS, NICE, etc.

    var mid: String,  // MID (Merchant ID)

    var amount: BigDecimal,

    @Enumerated(EnumType.STRING)
    var status: PaymentProcessStatus,  // UNKNOWN, SUCCESS, FAILED, CANCELLED

    var pgTransaction: String?,  // 멱등성 키 (PG tid or externalTxnId)
    var pgApprovalNo: String?,

    var orderNumber: String?,

    var originProcessId: Long?,  // 취소 시 원본 Process 참조

    // 외부 거래 관련
    var originSource: String?,  // null = 내부, "partner-a" = 외부

    @Column(columnDefinition = "json")
    var requestPayload: String?,  // 외부 거래는 null

    @Column(columnDefinition = "json")
    var responsePayload: String?
) : AbsDomain()

enum class PaymentProcessStatus {
    UNKNOWN,    // 프로세스 생성됨 (PG 요청 전)
    PENDING,    // PG 요청 전송됨 (응답 대기중)
    SUCCESS,    // 프로세스 성공
    FAILED,     // 프로세스 실패
    CANCELLED   // 프로세스 취소
}
```

**생명주기 (상태 머신)**:
```
[생성] gatewayReferenceId 자동 부여 (생성 시점)
   ↓
[상태: UNKNOWN] PaymentProcess 생성됨
   ↓
[폴링 서비스] PG 요청 전송
   ↓
[상태: PENDING] PG 응답 대기중
   ↓
[Webhook 수신] 최종 결과 수신
   ↓
[상태 전이] CAS 업데이트
   ├─ PENDING → SUCCESS   (PG 승인)
   ├─ PENDING → FAILED    (PG 실패)
   └─ PENDING → CANCELLED (PG 취소)
   ↓
[Payment 생성] 불변 거래 기록 생성
```

**특징**:
- ✅ **Source of Truth**: 결제 프로세스의 유일한 진실
- ✅ **Mutable**: 상태 전이 가능 (CAS 업데이트)
- ✅ **Mandatory ID**: `gatewayReferenceId`는 생성 시점부터 존재
- ✅ **동시성 제어**: CAS(Compare-And-Swap)로 안전한 상태 전이

---

### Payment (Immutable)

**역할**: 확정된 거래 기록 (불변 스냅샷)

**개념**: PaymentProcess의 "확정본"
- PaymentProcess가 SUCCESS/CANCELLED 상태가 되면 Payment 생성
- Payment = PaymentProcess 상태의 불변 스냅샷
- 거래 기록은 절대 변경되지 않음 (완전 불변)

```kotlin
@Entity
@Table(name = "payments")
class Payment(
    var processId: Long,  // PaymentProcess FK (1:1, NOT NULL)

    var orderPublicId: String?,
    var userPublicId: String?,

    var mid: String?,  // MID (Merchant ID)

    var amount: BigDecimal,  // 양수(승인) or 음수(취소)

    @Enumerated(EnumType.STRING)
    var status: PaymentStatus,  // APPROVED, CANCELLED

    var provider: String?,
    var pgTransaction: String?,
    var pgApprovalNo: String?,

    var originPaymentId: Long?,  // 취소건이면 원본 Payment 참조

    var originSource: String?  // null = 내부, "partner-a" = 외부
) : AbsDomain()

enum class PaymentStatus {
    APPROVED,   // 승인
    CANCELLED   // 취소
}
```

**특징**:
- ✅ **완전 불변** (INSERT만 발생, UPDATE 없음)
- ✅ **취소도 새 레코드** (originPaymentId로 연결)
- ✅ **금액**: 양수(승인), 음수(취소)
- ✅ **스냅샷**: PaymentProcess 확정 시점의 불변 기록

**현재 잔액 조회**:
```sql
SELECT SUM(amount) as balance
FROM payments
WHERE id = :paymentId OR origin_payment_id = :paymentId;
```

**PaymentProcess vs Payment 비교**:
| 구분 | PaymentProcess | Payment |
|------|----------------|---------|
| **성격** | 상태 관리 (Mutable) | 거래 기록 (Immutable) |
| **변경** | CAS 업데이트 가능 | 절대 변경 불가 |
| **역할** | Source of Truth | 확정본 스냅샷 |
| **생성 시점** | 프로세스 시작 | 프로세스 완료 |

---

### PgMerchantMapping (MID 관리)

**역할**: MID와 거래 출처 매핑 관리

```kotlin
@Entity
@Table(
    name = "pg_merchant_mappings",
    indexes = [
        Index(name = "uq_provider_mid", columnList = "provider,mid", unique = true),
        Index(name = "idx_origin_source", columnList = "originSource")
    ]
)
class PgMerchantMapping(
    @Enumerated(EnumType.STRING)
    val provider: Provider,  // TOSS, NICE, etc.

    val mid: String,  // Merchant ID

    val originSource: String?,  // null = Cash Gateway 자체, "partner-a" = 파트너

    val description: String?,

    val isActive: Boolean = true
) : AbsDomain()
```

**사용 방법**:
```kotlin
// Webhook 수신 시 MID 추출
val mid = extractMidFromPayload(webhookPayload)

// MID → originSource 조회
val mapping = pgMerchantMappingRepository.findByProviderAndMid(provider, mid)

// 거래 출처 판별
val originSource = mapping?.originSource  // null = 내부, "partner-a" = 외부
val isInternal = (originSource == null)
```

**샘플 데이터**:
```sql
-- Cash Gateway 자체 MID
INSERT INTO pg_merchant_mappings (provider, mid, origin_source, description)
VALUES ('TOSS', 'hamster_toss_mid_001', NULL, 'Cash Gateway 자체 토스 MID');

-- 파트너 A MID
INSERT INTO pg_merchant_mappings (provider, mid, origin_source, description)
VALUES ('TOSS', 'partner_a_toss_mid', 'partner-a', 'Partner A 토스 MID');
```

---

## 운영 모드

### 1. Active Mode (PG 대행)

**플로우**:
```
Ecommerce Service
    ↓ HTTP
Cash Gateway (PaymentProcess INSERT - UNKNOWN)
    ↓ HTTP
PG사 (200 OK - 동기 or 202 Accepted - 비동기)
    ↓ Webhook
Cash Gateway (PaymentProcess UPDATE - SUCCESS via CAS)
    ↓
Payment 생성 (Immutable)
```

**PaymentProcess 생성 시점**:
- PG 요청 직전 (UNKNOWN 상태)
- `gatewayReferenceId` 자동 부여 (mandatory)

**Payment 생성 시점**:
- 동기 PG: PG 응답 즉시
- 비동기 PG: Webhook 수신 시

---

### 2. Webhook Mode (외부 거래)

**플로우**:
```
PG 관리자 (수동 승인) or 파트너사 거래
    ↓ Webhook
Cash Gateway
    ├─ MID 추출 (webhookPayload에서)
    ├─ PgMerchantMapping 조회 (provider + mid)
    ├─ tid로 PaymentProcess 조회
    │   ├─ 없음 → 외부 거래
    │   │   ├─ PaymentProcess INSERT (SUCCESS)
    │   │   ├─ gatewayReferenceId 자동 생성 ✅
    │   │   ├─ mid = webhook에서 추출한 MID
    │   │   ├─ originSource = mapping.originSource
    │   │   └─ isExternal 계산됨 (orderPublicId IS NULL)
    │   │
    │   └─ 있음 → 내부 요청
    │       └─ PaymentProcess UPDATE (UNKNOWN → SUCCESS via CAS)
    │
    └─ Payment 생성
```

**PaymentProcess 생성 시점**:
- Webhook 수신 시 (즉시 SUCCESS 상태)
- `gatewayReferenceId` 자동 부여 (mandatory)

**특징**:
- `orderPublicId = null` → `isExternal = true` (자동 계산)
- `mid` = Webhook payload에서 추출
- `originSource` = PgMerchantMapping에서 조회
  - null: Cash Gateway 자체 거래
  - "partner-a": 파트너사 거래

**MID 기반 거래 출처 자동 판별**:
```kotlin
// 1. Webhook에서 MID 추출
val mid = extractMidFromPayload(webhookPayload)

// 2. MID → originSource 매핑 조회
val mapping = pgMerchantMappingRepository.findByProviderAndMid(provider, mid)

// 3. 거래 출처 자동 설정
val originSource = mapping?.originSource
val isInternal = (originSource == null)

// 4. PaymentProcess 생성
val attempt = PaymentProcess(
    mid = mid,
    originSource = originSource,
    isExternal = !isInternal,
    ...
)
```

---

### 3. Passive Mode (정산 기록)

**플로우**:
```
Partner Service (이미 PG 호출 완료)
    ↓ HTTP POST /api/external-payment/record
Cash Gateway
    ├─ PaymentProcess INSERT (SUCCESS)
    └─ Payment 생성
```

**사용 케이스**:
- A 서비스가 자체 PG 보유
- Cash Gateway 정산 기능만 사용

**PaymentProcess 생성 시점**:
- /record API 요청 시 (즉시 SUCCESS 상태)

---

## PG 통신 플로우

### 비동기 PG 처리 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  Cash Gateway Service                     │
│                                                          │
│  ┌────────────┐        ┌─────────────┐                  │
│  │ Kafka      │────────>│  Ecommerce  │                  │
│  │ Consumer   │ Event   │  Consumer   │                  │
│  └────────────┘        └─────────────┘                  │
│        │                      │                          │
│        ▼                      ▼                          │
│  ┌────────────┐        ┌─────────────┐                  │
│  │PaymentProc │ UNKNOWN │   Polling   │                  │
│  │ Repository │<────────│   Service   │                  │
│  └────────────┘        └─────────────┘                  │
│        │                      │                          │
│        │                      ▼                          │
│        │              ┌─────────────┐                    │
│        └──────────────>│  External   │──── HTTP ───>     │
│         PENDING       │  PG Client  │                    │
│                      └─────────────┘                    │
│                             │                            │
│                             ▼                            │
│                      ┌─────────────┐                    │
│                      │   Webhook   │<─── Webhook ───     │
│                      │  Controller │                     │
│                      └─────────────┘                    │
│                             │                            │
│                             ▼                            │
│                      ┌─────────────┐                    │
│                      │   Payment   │                     │
│                      │  Repository │                     │
│                      └─────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### 폴링 서비스 (UNKNOWN → PENDING)

```kotlin
@Service
@ConditionalOnProperty(
    prefix = "payment.gateway.polling",
    name = ["enabled"],
    havingValue = "true"
)
class PaymentGatewayPgPollingService {

    @Scheduled(fixedDelay = 5000, initialDelay = 10000)
    fun pollAndRequest() {
        // 1. UNKNOWN 상태 조회
        val unknownProcesses = paymentProcessRepository
            .findByStatusWithLimit(UNKNOWN, PageRequest.of(0, BATCH_SIZE))

        // 2. 각 프로세스별 PG 요청
        unknownProcesses.forEach { process ->
            // 3. PG 요청 전송
            val response = pgRestTemplate.postForEntity(...)

            // 4. Acknowledgement 응답 파싱
            val ackResponse = provider.parseAcknowledgementResponse(
                responseBody, httpStatusCode
            )

            // 5. CAS 업데이트: UNKNOWN → PENDING
            paymentProcessRepository.casUpdateToPending(
                id = process.id,
                expectedStatus = UNKNOWN,
                newStatus = PENDING,
                pgTransaction = ackResponse.getPgTransaction()
            )
        }
    }
}
```

### Webhook 처리 (PENDING → SUCCESS/FAILED)

```kotlin
@Transactional
fun handleWebhook(rawPayload: String): Payment? {
    // 1. Payload 파싱
    val response = provider.parsePaymentResponse(rawPayload)

    // 2. tid로 PaymentProcess 조회
    val process = paymentGatewayCoreService.findAttemptByTid(tid)

    // 3. PENDING 상태 검증
    if (process.status != PENDING) {
        log.warn("Not PENDING state: {}", process.status)
        return null  // 이미 처리됨
    }

    // 4. CAS 업데이트: PENDING → SUCCESS/FAILED
    if (response.isSuccess()) {
        paymentGatewayCoreService.handleResponseSuccess(process)
    } else {
        paymentGatewayCoreService.handleResponseFailure(process)
    }
}
```

---

## 멱등성 전략

### 키: pgTransaction (UNIQUE)

```kotlin
// PaymentProcess 테이블
@Table(indexes = [
    Index(name = "idx_pg_tid", columnList = "pgTransaction", unique = true)
])
```

### Active Mode
```kotlin
// 요청 시: pgTransaction = null
val attempt = PaymentProcess(pgTransaction = null, ...)

// 응답 시: pgTransaction = PG tid
val updated = attempt.copy(pgTransaction = "T-001", status = SUCCESS)
paymentAttemptRepository.casUpdatedMarking(updated)  // CAS
```

### Webhook Mode
```kotlin
// Webhook 수신
val tid = extractTid(payload)

// 중복 체크
val existing = paymentAttemptRepository.findByPgTransaction(tid)
if (existing != null) {
    log.info("Already processed: tid=$tid")
    return existing.paymentId
}

// 신규 처리
val attempt = PaymentProcess(pgTransaction = tid, status = SUCCESS, ...)
```

### Passive Mode
```kotlin
// externalTransactionId를 pgTransaction으로 사용
val attempt = PaymentProcess(
    pgTransaction = request.externalTransactionId,  // A-TXN-12345
    status = SUCCESS,
    isExternal = true,
    externalSource = "service-a"
)

// UNIQUE 제약으로 중복 방지
```

---

## CAS (Compare-And-Swap) 업데이트

### 동시성 제어

```kotlin
// PaymentProcessRepository
fun casUpdatedMarking(event: PaymentProcess): Optional<Long> {
    val updated = jpaRepository.updateAttempt(
        id = event.id,
        expectedStatus = PaymentProcessStatus.UNKNOWN,  // 조건
        newStatus = event.status,
        pgTransaction = event.pgTransaction,
        responsePayload = event.responsePayload
    )

    return if (updated > 0) Optional.of(event.id) else Optional.empty()
}

// Query
@Modifying
@Query("""
    UPDATE PaymentProcess pa
    SET pa.status = :newStatus,
        pa.pgTransaction = :pgTransaction,
        pa.responsePayload = :responsePayload
    WHERE pa.id = :id
      AND pa.status = :expectedStatus
""")
fun updateAttempt(
    @Param("id") id: Long,
    @Param("expectedStatus") expectedStatus: PaymentProcessStatus,
    @Param("newStatus") newStatus: PaymentProcessStatus,
    @Param("pgTransaction") pgTransaction: String?,
    @Param("responsePayload") responsePayload: String?
): Int
```

**장점**:
- 낙관적 락 (Optimistic Lock)
- Deadlock 없음
- 중복 응답 처리 방지

---

## API 명세

### 1. PG Webhook 수신

```
POST /api/webhook/pg/{provider}
```

**Path Parameter**:
- `provider`: TOSS, NICE, KCP 등

**Request Body**: PG사별 Webhook 포맷

**처리 로직**:
1. tid 추출
2. PaymentProcess 조회 (tid 기반)
3. 없으면: 외부 거래 (INSERT)
4. 있으면: 내부 요청 (CAS UPDATE)
5. Payment 생성
6. 이벤트 발행

---

### 2. 외부 결제 기록 API

```
POST /api/external-payment/record
```

**Request**:
```json
{
  "externalTransactionId": "A-TXN-12345",
  "source": "service-a",
  "userId": 999,
  "amount": 50000,
  "status": "APPROVED"
}
```

**Response**:
```json
{
  "paymentId": 123,
  "attemptId": 456,
  "success": true
}
```

**처리 로직**:
1. 멱등성 체크 (externalTransactionId)
2. PaymentProcess 생성 (SUCCESS)
3. Payment 생성
4. 정산 이벤트 발행

---

## 디렉토리 구조

```
cash-gateway-service/
├── src/main/kotlin/.../cashgateway/
│   ├── domain/
│   │   ├── payment/
│   │   │   ├── model/Payment.kt
│   │   │   ├── constant/PaymentStatus.kt
│   │   │   ├── repository/PaymentRepository.kt
│   │   │   └── event/
│   │   │       ├── PaymentApprovedEvent.kt
│   │   │       ├── PaymentCancelledEvent.kt
│   │   │       └── PaymentFailedEvent.kt
│   │   │
│   │   └── paymentprocess/
│   │       ├── model/PaymentProcess.kt
│   │       ├── constant/PaymentProcessStatus.kt (PENDING 추가)
│   │       └── repository/PaymentProcessRepository.kt
│   │
│   ├── external/
│   │   └── paymentgateway/
│   │       ├── abs/
│   │       │   ├── PaymentGatewayProvider.kt
│   │       │   ├── PaymentGatewayClientProtocolCore.kt
│   │       │   └── PaymentGatewayCoreService.kt
│   │       │
│   │       ├── dto/
│   │       │   ├── abs/
│   │       │   │   ├── AcknowledgementResponse.kt ✨ NEW
│   │       │   │   └── PaymentResponse.kt
│   │       │   └── dummy/
│   │       │       └── DummyAcknowledgementResponse.kt ✨ NEW
│   │       │
│   │       ├── polling/
│   │       │   └── PaymentGatewayPgPollingService.kt ✨ NEW
│   │       │
│   │       └── provider/
│   │           └── DummyPaymentGatewayProvider.kt
│   │
│   ├── consumer/
│   │   └── PaymentEventConsumer.kt  # OrderStockReservedEvent 수신
│   │
│   └── app/
│       └── webhook/
│           └── PgWebhookController.kt  # TODO
│
├── db/
│   ├── payment_processes.sql (메타데이터 컬럼 추가)
│   └── payments.sql
│
└── src/main/resources/
    └── application.yml (polling 설정 추가)
```

---

## 다음 작업

### ✅ 완료 (2026-02-05): 비동기 PG 처리 플로우 구현
1. ✅ **PaymentProcessStatus에 PENDING 상태 추가**
   - UNKNOWN: PaymentProcess 생성됨 (PG 요청 전)
   - PENDING: PG 요청 전송됨 (응답 대기중)
   - SUCCESS/FAILED: 최종 결과

2. ✅ **PaymentGatewayPgPollingService 구현**
   - @Scheduled로 UNKNOWN 상태 폴링
   - PG 요청 전송 후 UNKNOWN → PENDING 전환
   - CAS 업데이트로 동시성 제어
   - 배치 처리 (BATCH_SIZE = 10)

3. ✅ **AcknowledgementResponse 인터페이스 구현**
   - PG 요청 승인 응답 파싱 (202 Accepted, 200 OK)
   - PaymentResponse와 분리된 초기 응답 처리
   - Provider별 확장 가능한 구조

4. ✅ **Webhook 처리 로직 개선**
   - tid 기반 PaymentProcess 조회
   - PENDING 상태 검증 추가
   - PENDING → SUCCESS/FAILED CAS 업데이트

5. ✅ **PaymentProcess 메타데이터 추가**
   - requested_at: PG 요청 시작 시각
   - ack_received_at: PG 승인 응답 시각
   - last_request_attempt_at: 마지막 재시도 시각
   - request_attempt_count: 총 요청 시도 횟수
   - last_pg_response_code: 마지막 PG 응답 코드

6. ✅ **application.yml 폴링 설정 추가**
   ```yaml
   payment.gateway.polling:
     enabled: true
     fixedDelay: 5000
     initialDelay: 10000
     batchSize: 10
   ```

### ✅ 완료 (2026-02-01): Domain Event Pattern 적용 + Webhook 전용 정책
1. ✅ **CashGatewayDomainEvent 기본 클래스 생성**
   - `BaseDomainEvent` 상속
   - Kafka 토픽: `cash-gateway-events`

2. ✅ **Payment 이벤트 클래스 재설계**
   - `PaymentApprovedEvent`: Payment 데이터 포함 (paymentId, orderId, userId, amount 등)
   - `PaymentCancelledEvent`: 취소 Payment 데이터 + originPaymentId
   - `PaymentFailedEvent`: PaymentProcess 데이터 포함 (Payment 없음!)
   - 모두 `CashGatewayDomainEvent` 상속
   - `companion object fun from()` 팩토리 메서드 추가

3. ✅ **Payment 엔티티에 이벤트 등록 메서드 추가**
   ```kotlin
   fun onCreate(): Payment {
       registerEvent(PaymentApprovedEvent.from(this))
       return this
   }

   fun onCancel(originPaymentId: Long): Payment {
       registerEvent(PaymentCancelledEvent.from(this, originPaymentId))
       return this
   }
   ```

4. ✅ **PaymentGatewayCoreService 수정**
   - `createApprovePayment()`: `.onCreate()` 호출 → save 시 자동 이벤트 발행
   - `createCancelPayment()`: `.onCancel()` 호출 → save 시 자동 이벤트 발행
   - `handleResponseFailure()`: `PaymentFailedEvent.from()` 직접 발행 (Payment 없음)

5. ✅ **Webhook 전용 정책 적용**
   - `PaymentGatewayClientProtocolCore.payment()`: 응답 성공해도 `return null`
   - Payment 생성은 Webhook에서만 (handleWebhook)
   - 내부 거래 Webhook: Provider + orderNumber + MID 기반 조회
   - 외부 거래 Webhook: tid 중복 체크 후 신규 생성

6. ✅ **orderNumber 자동 생성**
   - 형식: `CGW_{PROVIDER}_{MID}_{TIMESTAMP}_{RANDOM}`
   - PaymentProcess 생성 시 자동 할당
   - Webhook에서 내부 거래 조회 키로 사용

7. ✅ **PaymentProcessRepository 확장**
   - `findByProviderAndOrderNumberAndMid()` 추가
   - Webhook에서 내부 거래 조회용

8. ✅ **DB 스키마 업데이트**
   - `payment_processes.is_external`: GENERATED ALWAYS AS (order_id IS NULL) STORED
   - `payment_processes.origin_source`: NOT NULL (거래 출처 필수)

### ✅ 완료 (2026-02-01 이전): MID 기반 Webhook 준비
1. ✅ PaymentProcess 모델 확장 (mid, originSource)
2. ✅ Payment 모델 확장 (mid, originSource)
3. ✅ PgMerchantMapping 테이블 생성
4. ✅ PaymentGatewayProvider.getMid() 추가
5. ✅ PaymentCtx에 mid 필드 추가
6. ✅ 모든 Converter 업데이트
7. ✅ DB 마이그레이션 파일 업데이트
8. ✅ PaymentGatewayProvider.extractMid(), extractOrderNumber() 추가
9. ✅ DummyProvider echo 필드 활용 구현
10. ✅ 컴파일 테스트 성공

### 우선순위 1: Kafka Producer 설정 + Event Consumer 구현
1. ⏳ **Kafka Producer 설정**
   - Kafka Event Publisher 설정
   - DomainEventPublisher 구현 (`@TransactionalEventListener`)

2. ⏳ **Ecommerce-Service Consumer**
   ```kotlin
   @KafkaListener(topics = ["cash-gateway-events"])
   fun consume(message: String) {
       when (eventType) {
           "PaymentApprovedEvent" -> {
               // Order.status = PAYMENT_APPROVED
               orderService.updateStatus(orderId, PAYMENT_APPROVED)
           }
           "PaymentFailedEvent" -> {
               // Order.status = PAYMENT_FAILED
               orderService.updateStatus(orderId, PAYMENT_FAILED)
           }
           "PaymentCancelledEvent" -> {
               // Order.status = CANCELED
               orderService.updateStatus(orderId, CANCELED)
           }
       }
   }
   ```

3. ⏳ **Payment-Service Consumer**
   ```kotlin
   @KafkaListener(topics = ["cash-gateway-events"])
   fun consume(message: String) {
       when (eventType) {
           "PaymentApprovedEvent" -> {
               // 재고 차감 (이미 선차감 완료라면 로그만)
               log.info("Payment approved: paymentId=$paymentId")
           }
           "PaymentCancelledEvent" -> {
               // 재고 복원
               productService.restoreStock(items)
           }
       }
   }
   ```

### 우선순위 2: Passive Mode API
1. ⏳ ExternalPaymentController 구현
2. ⏳ ExternalPaymentService 구현
3. ⏳ 멱등성 처리

### 우선순위 3: 취소 플로우
1. ⏳ PaymentProcess 취소 생성 (originAttemptId)
2. ⏳ Payment 취소 생성 (originPaymentId, amount 음수)
3. ⏳ 재고 복원 이벤트 발행

---

## Frontend (Internal Admin)

**Internal Admin Portal - Cash Gateway 섹션:**

```
Internal Admin Portal (통합 관리 도구)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cash Gateway 섹션
├─ 💳 결제 모니터링 (실시간)
│  ├─ 전체 결제 현황 (경로 A/B 통합)
│  ├─ PaymentProcess 상태별 조회
│  │  └─ UNKNOWN / SUCCESS / FAILED / CANCELLED
│  ├─ 결제 성공률 통계
│  └─ 실시간 알림 (실패 건 발생 시)
│
├─ 🔧 PG 설정 관리
│  ├─ PG Provider 등록/수정
│  │  └─ HAMSTER_PG / TOSS / IAMPORT 등
│  ├─ MID (Merchant ID) 관리
│  │  ├─ MID 등록/수정/삭제
│  │  ├─ MID별 거래 내역 조회
│  │  └─ 정산 계좌 정보 관리
│  ├─ API Key/Secret 관리
│  └─ Webhook URL 설정
│
├─ 📊 정산 처리
│  ├─ 벤더별 정산 내역
│  │  ├─ 거래 금액 합계
│  │  ├─ 수수료 계산 (경로별 차등)
│  │  └─ 정산 예정 금액
│  ├─ 수수료 계산 규칙 관리
│  │  ├─ 경로 A: 낮은 수수료 (모니터링만)
│  │  └─ 경로 B: 높은 수수료 (결제 대행)
│  ├─ 정산 승인/처리
│  └─ 정산 이력 조회
│
├─ 🔍 Webhook 로그 조회
│  ├─ 수신 시각/Payload
│  ├─ 처리 결과 (성공/실패/중복)
│  ├─ 재전송 (실패 시)
│  └─ Webhook 시그니처 검증 로그
│
└─ 🏪 가맹점(MID) 관리
   ├─ MID 목록 조회
   ├─ MID별 거래 통계
   ├─ 정산 계좌 관리
   └─ 수수료율 설정

Payment 섹션 (Payment Service 관리)
├─ 📦 재고 관리 (전체 재고 현황)
├─ 📝 재고 조정 이력 (Event Sourcing)
├─ 💰 정산 계산 관리
└─ 🔐 권한 설정
```

### 주요 화면 설명

#### 1. 결제 모니터링 대시보드
```
┌────────────────────────────────────────────┐
│ 💳 결제 모니터링 (실시간)                   │
├────────────────────────────────────────────┤
│ 📊 오늘의 결제 현황                         │
│   - 총 결제: 1,234건 (성공: 1,100 / 실패: 134)  │
│   - 총 금액: ₩123,456,789                  │
│   - 성공률: 89.1%                          │
│                                            │
│ 📈 결제 경로별 현황                         │
│   - 경로 A (직접): 600건                    │
│   - 경로 B (중개): 634건                    │
│                                            │
│ ⚠️ 최근 실패 건                            │
│   - INSUFFICIENT_BALANCE: 50건             │
│   - INVALID_CARD: 30건                     │
│   - TIMEOUT: 20건                          │
└────────────────────────────────────────────┘
```

#### 2. 정산 처리 화면
```
┌────────────────────────────────────────────┐
│ 📊 정산 처리 (2024년 1월)                   │
├────────────────────────────────────────────┤
│ 벤더별 정산 내역                            │
│                                            │
│ Vendor A (경로 B - 중개)                   │
│   - 거래 금액: ₩10,000,000                 │
│   - 수수료 (3%): ₩300,000                  │
│   - 정산 예정: ₩9,700,000                  │
│   [정산 승인] 버튼                          │
│                                            │
│ Vendor B (경로 A - 직접)                   │
│   - 거래 금액: ₩5,000,000                  │
│   - 수수료 (0.5%): ₩25,000                 │
│   - 정산 예정: ₩4,975,000                  │
│   [정산 승인] 버튼                          │
└────────────────────────────────────────────┘
```

### 사용자 권한
- 🔒 **ADMIN**: 모든 기능 접근
- 🔒 **FINANCE**: 정산 처리만
- 🔒 **SUPPORT**: 조회만 (읽기 전용)

---

## 참고 자료

- **메인 README**: [../README.md](../README.md)
- **Ecommerce Service**: [../ecommerce-service/README.md](../ecommerce-service/README.md)
- **Payment Service**: [../payment-service/README.md](../payment-service/README.md)
- **Hamster PG**: [../hamster-pg-service/README.md](../hamster-pg-service/README.md)
- **기존 구현 (참고용)**: `/Users/mac/IdeaProjects/payment-system/src/main/kotlin/com/payment/system/external/paymentgateway/`
- **전체 README**: `/Users/mac/IdeaProjects/hamster-world/README.md`
