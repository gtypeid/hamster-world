# Hamster PG Service

> **🌐 EXTERNAL - 외부 PG 시뮬레이터 (Hamster World 소유 아님)**
> 메인 README 읽은 후 이 문서를 읽으세요.

**외부 PG(Payment Gateway) 시뮬레이터**

---

## 중요: 이 서비스는 Hamster World의 일부가 아닙니다

### 실제 서비스 환경

```
┌────────────────────────────────────────────┐
│  Hamster World (결제 중개 플랫폼)           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ├─ Ecommerce Service (벤더용 SaaS)       │
│  ├─ Cash Gateway Service (결제 방화벽)    │
│  └─ Payment Service (정산/재고)           │
└────────────────────────────────────────────┘
              ↓ PG 통신
┌────────────────────────────────────────────┐
│  외부 PG사 (Hamster 소유 아님)              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  - 토스페이먼츠 (https://tosspayments.com) │
│  - 이니시스 (https://www.inicis.com)      │
│  - NHN KCP (https://www.kcp.co.kr)        │
│  - ...                                     │
└────────────────────────────────────────────┘
```

### 이 프로젝트에서의 역할

**학습/테스트 목적으로만 포함:**
- ✅ 실제 PG사 API를 시뮬레이션
- ✅ 외부 PG로부터 Webhook을 받는 상황 재현
- ✅ 비동기 결제 처리 플로우 테스트
- ❌ 실제 운영 환경에선 **제거됨**
- ❌ Hamster World 소유/관리 서비스 **아님**

---

## 개요

실제 PG사(토스페이먼츠, 이니시스 등)를 시뮬레이션하는 더미 서비스입니다.
가맹점(cash-gateway)의 결제 요청을 받아 비동기로 처리하고 Webhook으로 결과를 전송합니다.

**핵심 특징:**
- ✅ HMAC-SHA256 서명 기반 인증 (실제 PG사와 동일)
- ✅ 비동기 처리 (202 Accepted 즉시 응답)
- ✅ Scheduler 기반 결제 승인 (1초 폴링 - 실제는 수 초~수 분)
- ✅ Fire-and-Forget Webhook (재시도 없음)
- ✅ 도메인 주도 설계 (Payment, PgMid)
- ✅ 성공/실패 랜덤 시뮬레이션 (성공 80%, 실패 20%)

---

## 도메인 구조

### 1. **Payment** (결제 처리)

```kotlin
data class Payment(
    val tid: String,              // 트랜잭션 ID
    val midId: String,            // 가맹점 ID
    val orderId: String,          // 주문 ID
    val amount: BigDecimal,       // 결제 금액
    val status: PaymentStatus,    // 결제 상태
    val approvalNo: String?,      // 승인 번호
    val failureReason: String?    // 실패 사유
)
```

**상태 전이:**
```
PENDING → COMPLETED (80% 확률)
        → FAILED (20% 확률)

PENDING/COMPLETED → CANCEL_PENDING → CANCELLED
```

### 2. **PgMid** (가맹점 관리)

```kotlin
data class PgMid(
    val midId: String,        // 가맹점 ID
    val merchantName: String, // 가맹점명
    val apiKey: String,       // API Key (HMAC 서명용)
    val isActive: Boolean     // 활성화 여부
)
```

**역할:**
- API Key 발급 및 관리
- HMAC-SHA256 서명 검증
- 가맹점 활성화/비활성화

---

## API 명세

### Payment API

#### 1. 결제 생성
```http
POST /api/payment
Content-Type: application/json

{
  "type": "PAYMENT",
  "midId": "MID_xxx",
  "timestamp": "20260128120000",
  "signature": "Base64(HMAC-SHA256(apiKey, message))",
  "orderId": "ORDER_12345",
  "amount": 10000.00,
  "callbackUrl": "https://merchant.com/webhook",
  "echo": "{\"userId\":\"user123\"}"
}

→ 202 Accepted
{
  "tid": "TID_20260128120000_abcd1234",
  "orderId": "ORDER_12345",
  "amount": 10000.00,
  "status": "PENDING"
}
```

**Signature 생성 방법:**
```kotlin
val message = "$midId$timestamp$body"  // body는 signature 필드 제외
val signature = Base64.encode(
    HMAC-SHA256(apiKey, message)
)
```

#### 2. 결제 취소
```http
POST /api/payment
Content-Type: application/json

{
  "type": "CANCEL",
  "midId": "MID_xxx",
  "timestamp": "20260128120100",
  "signature": "...",
  "tid": "TID_20260128120000_abcd1234"
}

→ 202 Accepted
{
  "tid": "TID_20260128120000_abcd1234",
  "orderId": "ORDER_12345",
  "amount": 10000.00,
  "status": "CANCEL_PENDING"
}
```

#### 3. 결제 내역 조회 (리스트)
```http
GET /api/payment/list?midId=MID_xxx&status=COMPLETED&from=2026-01-01&to=2026-01-31

→ 200 OK
[
  {
    "tid": "TID_xxx",
    "midId": "MID_xxx",
    "orderId": "ORDER_12345",
    "amount": 10000.00,
    "status": "COMPLETED",
    "approvalNo": "APV_xxx",
    "processedAt": "2026-01-28T12:00:01",
    ...
  }
]
```

**검색 필터:**
- `midId`: 가맹점 ID
- `tid`: 트랜잭션 ID (부분 검색)
- `orderId`: 주문 ID (부분 검색)
- `status`: 결제 상태 (PENDING, COMPLETED, FAILED, CANCEL_PENDING, CANCELLED)
- `notificationStatus`: 알림 상태 (NOT_SENT, SENT)
- `from/to`: 날짜 범위
- `sort`: 정렬 (ASC, DESC)

#### 4. 결제 내역 조회 (페이징)
```http
GET /api/payment/page?midId=MID_xxx&page=0&size=20&sort=DESC

→ 200 OK
{
  "content": [ ... ],
  "totalElements": 45,
  "totalPages": 3,
  "number": 0,
  "size": 20
}
```

#### 5. 결제 단건 조회
```http
GET /api/payment/TID_20260128120000_abcd1234

→ 200 OK
{
  "tid": "TID_20260128120000_abcd1234",
  "midId": "MID_xxx",
  "orderId": "ORDER_12345",
  "amount": 10000.00,
  "status": "COMPLETED",
  "approvalNo": "APV_20260128120001_789456",
  ...
}
```

---

### PgMid API

#### 1. 가맹점 생성
```http
POST /api/mid
Content-Type: application/json

{
  "merchantName": "Hamster Corp"
}

→ 201 Created
{
  "midId": "MID_d7f9e4b2-...",
  "merchantName": "Hamster Corp",
  "apiKey": "e5c3a8f1-...",
  "isActive": true,
  "createdAt": "2026-01-28T12:00:00"
}
```

#### 2. 가맹점 조회
```http
GET /api/mid/MID_xxx

→ 200 OK
{
  "midId": "MID_xxx",
  "merchantName": "Hamster Corp",
  "apiKey": "e5c3a8f1-...",
  "isActive": true,
  ...
}
```

#### 3. 가맹점 목록 조회
```http
GET /api/mid/list?merchantName=Hamster&isActive=true

→ 200 OK
[ ... ]
```

#### 4. 가맹점 페이징 조회
```http
GET /api/mid/page?page=0&size=10

→ 200 OK
{
  "content": [ ... ],
  "totalElements": 25,
  ...
}
```

#### 5. 가맹점 활성화/비활성화
```http
POST /api/mid/MID_xxx/activate
POST /api/mid/MID_xxx/deactivate

→ 200 OK
{
  "midId": "MID_xxx",
  "isActive": true,  // or false
  ...
}
```

---

## 비동기 처리 플로우

### 1. 결제 생성 플로우
```
[1] Client → POST /api/payment (PAYMENT)
              ↓
[2] @ValidSignature 검증 (HMAC-SHA256)
              ↓
[3] PaymentService.createPayment()
     - Payment.create() → PENDING
     - repository.save()
              ↓
[4] 202 Accepted 즉시 응답
              ↓
[5] PaymentScheduler (1초마다 폴링)
     - findPendingPayments(threshold = now - 1초)
     - processPayment() → COMPLETED (80%) or FAILED (20%)
     - repository.save()
              ↓
[6] NotificationService.sendWebhookAsync()
     - WebClient.post(callbackUrl)
     - Timeout: 5초
     - Fire-and-Forget (재시도 없음)
```

### 2. 결제 취소 플로우
```
[1] Client → POST /api/payment (CANCEL)
              ↓
[2] @ValidSignature 검증
              ↓
[3] PaymentService.requestCancelPayment()
     - payment.requestCancel() → CANCEL_PENDING
     - repository.save()
              ↓
[4] 202 Accepted 즉시 응답
              ↓
[5] PaymentScheduler (1초마다 폴링)
     - findCancelPendingPayments(threshold = now - 1초)
     - payment.cancel() → CANCELLED
     - repository.save()
              ↓
[6] NotificationService.sendWebhookAsync()
```

---

## 인증 메커니즘

### HMAC-SHA256 Signature

**요청 시 포함:**
```json
{
  "midId": "MID_xxx",
  "timestamp": "20260128120000",
  "signature": "Base64(HMAC-SHA256)",
  ...
}
```

**검증 과정:**
1. **Timestamp 검증** (5분 이내 요청만 허용)
2. **PgMid 조회** (midId로 apiKey 획득)
3. **Body 재구성** (signature 필드를 빈 문자열로)
4. **Message 생성:** `"$midId$timestamp$body"`
5. **Signature 생성:** `Base64(HMAC-SHA256(apiKey, message))`
6. **비교:** 요청의 signature와 생성한 signature 일치 여부

**구현 위치:**
- `@ValidSignature` - Bean Validation Constraint
- `SignatureConstraintValidator` - 실제 검증 로직
- Jackson 역직렬화 후 실행 (Body 재구성 가능)

### Request Scope 공유

```kotlin
// SignatureConstraintValidator
private fun storeInRequestScope(pgMid: PgMid) {
    val request = (RequestContextHolder.getRequestAttributes()
        as ServletRequestAttributes).request
    request.setAttribute("pgMid", pgMid)
}

// MidArgumentResolver
override fun resolveArgument(...): Any? {
    return webRequest.getAttribute("pgMid", SCOPE_REQUEST)
}

// PaymentController
fun processPayment(
    @Valid @RequestBody request: PaymentRequest,
    @CurrentMid pgMid: PgMid  // ← 자동 주입
)
```

---

## 주요 컴포넌트

### Domain Layer

| 컴포넌트 | 역할 |
|---------|------|
| **Payment** | 결제 도메인 모델 |
| **PgMid** | 가맹점 도메인 모델 |
| **PaymentStatus** | 결제 상태 Enum |
| **PaymentService** | 결제 비즈니스 로직 |
| **PgMidService** | 가맹점 비즈니스 로직 |
| **PaymentScheduler** | 1초마다 PENDING 처리 |
| **PaymentSchedulerService** | Scheduler 비즈니스 로직 |
| **NotificationService** | Webhook 전송 (@Async) |

### Event Layer

| 이벤트 | 발생 시점 |
|--------|---------|
| **PaymentCompletedEvent** | 결제 완료 시 |
| **PaymentFailedEvent** | 결제 실패 시 |
| **CancelRequestedEvent** | 취소 요청 시 |
| **PaymentCancelledEvent** | 취소 완료 시 |
| **NotificationSentEvent** | Webhook 전송 시 |

**이벤트 핸들러:**
- `PaymentEventHandler` - `@TransactionalEventListener(AFTER_COMMIT)`
- 현재는 로깅만 (Scheduler가 Webhook 전송)

### Infrastructure Layer

| 컴포넌트 | 역할 |
|---------|------|
| **PaymentEntity** | JPA Entity (@Table("payments")) |
| **PaymentRepository** | 도메인 Repository |
| **PaymentJpaRepository** | Spring Data JPA |
| **PaymentMapper** | Entity ↔ Domain 변환 |
| **PgMidEntity** | JPA Entity (@Table("pg_mids")) |
| **PgMidRepository** | 도메인 Repository |
| **PgMidMapper** | Entity ↔ Domain 변환 |

### Application Layer

| 컴포넌트 | 역할 |
|---------|------|
| **PaymentController** | REST API 엔드포인트 |
| **PgMidController** | 가맹점 REST API |
| **@ValidSignature** | 서명 검증 어노테이션 |
| **SignatureConstraintValidator** | Bean Validation 구현 |
| **@CurrentMid** | ArgumentResolver 어노테이션 |
| **MidArgumentResolver** | Request Scope에서 PgMid 주입 |

---

## 데이터베이스 스키마

### payments 테이블
```sql
CREATE TABLE `payments` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
    `tid` VARCHAR(50) NOT NULL COMMENT 'Payment 트랜잭션 고유 ID',
    `mid_id` VARCHAR(100) NOT NULL COMMENT '가맹점 ID',
    `order_id` VARCHAR(255) NOT NULL COMMENT '주문 ID',
    `amount` DECIMAL(19, 2) NOT NULL COMMENT '결제 금액',
    `callback_url` VARCHAR(500) NOT NULL COMMENT 'Webhook 콜백 URL',
    `echo` TEXT NULL COMMENT 'Echo 데이터 (JSON)',
    `status` VARCHAR(20) NOT NULL COMMENT '결제 상태',
    `approval_no` VARCHAR(50) NULL COMMENT '승인 번호',
    `notification_status` VARCHAR(20) NOT NULL,
    `notification_attempt_count` INT NOT NULL DEFAULT 0,
    `last_notification_at` DATETIME NULL,
    `notification_error_message` TEXT NULL,
    `failure_reason` VARCHAR(100) NULL,
    `processed_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL,
    `modified_at` DATETIME NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_payments_tid` (`tid`),
    KEY `idx_payments_status_created_at` (`status`, `created_at`),
    KEY `idx_payments_mid_id` (`mid_id`)
);
```

### pg_mids 테이블
```sql
CREATE TABLE `pg_mids` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
    `mid_id` VARCHAR(100) NOT NULL COMMENT '가맹점 ID',
    `merchant_name` VARCHAR(255) NOT NULL COMMENT '가맹점명',
    `api_key` VARCHAR(255) NOT NULL COMMENT 'API Key',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL,
    `modified_at` DATETIME NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_pg_mids_mid_id` (`mid_id`),
    UNIQUE KEY `uk_pg_mids_api_key` (`api_key`)
);
```

---

## 설정

### application.yml (주요 설정)
```yaml
server:
  port: 8083

spring:
  datasource:
    url: jdbc:mysql://localhost:3309/hamster_pg_db
    username: root
    password: 12555!@

  jpa:
    hibernate:
      ddl-auto: none
    properties:
      hibernate:
        format_sql: true

  task:
    scheduling:
      pool:
        size: 5

    execution:
      pool:
        core-size: 10
        max-size: 20
```

### 스케줄러 설정
```kotlin
@EnableScheduling
@EnableAsync
class HamsterPgApplication

@Scheduled(fixedDelay = 1000)  // 1초마다
fun processPending() {
    schedulerService.processPendingTransactions()
}
```

---

## 타임라인 예제

```
T+0ms:    Client → POST /api/payment (PAYMENT)
          └─ Validation (HMAC-SHA256)
          └─ Service (save PENDING)
          └─ 202 Accepted 응답

T+1000ms: Scheduler 실행
          └─ findPendingPayments(threshold = now - 1초)
          └─ processPayment() → COMPLETED (80%) or FAILED (20%)
          └─ save()
          └─ sendWebhookAsync() (비동기)

T+1100ms: Webhook 전송 시작
          └─ POST https://merchant.com/webhook
          └─ { "tid": "...", "status": "COMPLETED", ... }
          └─ markNotificationSent()

T+2000ms: Client → POST /api/payment (CANCEL)
          └─ Validation
          └─ Service (save CANCEL_PENDING)
          └─ 202 Accepted 응답

T+3000ms: Scheduler 실행
          └─ findCancelPendingPayments(threshold = now - 1초)
          └─ payment.cancel() → CANCELLED
          └─ save()
          └─ sendWebhookAsync() (비동기)

T+3100ms: Webhook 전송
          └─ POST https://merchant.com/webhook
          └─ { "tid": "...", "status": "CANCELLED", ... }
```

---

## 개선 가능한 부분

### 현재 구현 (Phase 1)
- ✅ 기본 결제/취소 플로우
- ✅ HMAC-SHA256 인증
- ✅ 비동기 처리 (Scheduler)
- ✅ Fire-and-Forget Webhook
- ✅ 랜덤 결제 승인 (80% 성공률)

### Phase 2 (개선)
- [ ] **Webhook 재시도** - Exponential Backoff
- [ ] **분산 락** - Redis 또는 ShedLock (다중 인스턴스 대비)
- [ ] **Dead Letter Queue** - 실패한 Webhook 처리
- [ ] **결제 승인 로직** - 실제 비즈니스 로직 (현재는 랜덤)

### Phase 3 (고도화)
- [ ] **Event Sourcing** - 모든 상태 변경 이벤트 저장
- [ ] **CQRS** - 조회/명령 분리
- [ ] **Saga Pattern** - 분산 트랜잭션 관리
- [ ] **Monitoring** - Prometheus/Grafana 연동

---

## 테스트 시나리오

### 성공 케이스
```bash
# 1. 가맹점 생성
curl -X POST http://localhost:8083/api/mid \
  -H "Content-Type: application/json" \
  -d '{"merchantName": "Test Merchant"}'

# Response에서 midId, apiKey 확인

# 2. Signature 생성 (Kotlin)
val message = "$midId$timestamp$body"
val signature = Base64.getEncoder().encodeToString(
    Mac.getInstance("HmacSHA256").apply {
        init(SecretKeySpec(apiKey.toByteArray(), "HmacSHA256"))
    }.doFinal(message.toByteArray())
)

# 3. 결제 생성
curl -X POST http://localhost:8083/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PAYMENT",
    "midId": "MID_xxx",
    "timestamp": "20260128120000",
    "signature": "generated_signature",
    "orderId": "ORDER_001",
    "amount": 10000.00,
    "callbackUrl": "https://webhook.site/xxx"
  }'

# 4. 1초 대기 후 상태 확인
sleep 1
curl http://localhost:8083/api/payment/TID_xxx

# 5. 취소 요청
curl -X POST http://localhost:8083/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CANCEL",
    "midId": "MID_xxx",
    "timestamp": "20260128120100",
    "signature": "generated_signature",
    "tid": "TID_xxx"
  }'
```

### 실패 케이스
```bash
# Signature 불일치
→ 400 Bad Request

# 이미 취소된 결제 재취소
→ 400 Bad Request "Payment already cancelled"

# FAILED 상태 결제 취소
→ 400 Bad Request "Payment cannot be cancelled"
```

---

## 로그 예제

```log
2026-01-28 12:00:00.000  INFO --- Payment request received: type=CreatePaymentRequest, midId=MID_xxx
2026-01-28 12:00:00.001  INFO --- Creating payment: orderId=ORDER_12345, amount=10000.00
2026-01-28 12:00:01.000  INFO --- Processing 1 pending payments
2026-01-28 12:00:01.050  INFO --- Payment completed event received: tid=TID_xxx, approvalNo=APV_xxx
2026-01-28 12:00:01.100  INFO --- Sending webhook asynchronously: ... to https://merchant.com/webhook
2026-01-28 12:00:01.500  INFO --- Webhook sent successfully: ...
2026-01-28 12:00:02.000  INFO --- Payment request received: type=CancelPaymentRequest
2026-01-28 12:00:02.001  INFO --- Requesting cancellation: tid=TID_xxx
2026-01-28 12:00:02.050  INFO --- Cancel requested event received: tid=TID_xxx
2026-01-28 12:00:03.000  INFO --- Processing 1 cancel pending payments
2026-01-28 12:00:03.050  INFO --- Payment cancelled event received: tid=TID_xxx
2026-01-28 12:00:03.100  INFO --- Sending webhook asynchronously: ...
2026-01-28 12:00:03.500  INFO --- Webhook sent successfully: ...
```

---

## 참고

- **전체 아키텍처:** [../README.md](../README.md)
- **데이터베이스 스키마:** `db/` 디렉토리
- **Gradle 빌드:** `./gradlew :hamster-pg-service:build`
