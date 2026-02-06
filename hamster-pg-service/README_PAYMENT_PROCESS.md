# Payment Process (Hamster PG Service)

Hamster PG Service의 결제 처리 프로세스입니다.
Cash Gateway Service와 통신하여 비동기 결제 처리를 수행합니다.

## 아키텍처

```
Cash Gateway Service              Hamster PG Service
─────────────────                ──────────────────
PaymentProcess                   PaymentProcess
(UNKNOWN → PENDING               (PENDING → PROCESSING
 → SUCCESS/FAILED)                → SUCCESS/FAILED)

Payment (최종 결과)               Payment (최종 결과)
```

## 특징

- ✅ 요청 접수 시 즉시 202 Accepted 응답 (비동기)
- ✅ 폴링 스케줄러로 자동 처리 (3초 주기)
- ✅ 80% 성공, 20% 실패 랜덤 처리
- ✅ 모든 거래 내역 DB 저장
- ✅ Webhook 자동 전송 (Cash Gateway로)
- ✅ CAS 업데이트로 동시성 제어
- ✅ 수동 Webhook 트리거 기능 (테스트용)

## API 엔드포인트

### 1. 결제 요청 접수
```
POST http://localhost:8083/api/payment

Request:
{
  "userPublicId": "USR_123",
  "orderId": "ORD_456",
  "amount": 10000,
  "echo": {
    "mid": "hamster_dummy_mid_001",
    "orderNumber": "CGW_DUMMY_...",
    "gatewayReferenceId": "CGW_DUMMY_..."
  }
}

Response (202 Accepted):
{
  "status": "PENDING",
  "code": "ACK_OK",
  "transactionId": "DUMMY_20260205_12345678",
  "amount": 10000,
  "echo": { ... },
  "message": "Payment request received and processing"
}
```

### 2. 트랜잭션 조회 (디버깅용)
```
GET http://localhost:8083/api/payment/transaction/{tid}

Response:
{
  "tid": "DUMMY_20260205_12345678",
  "orderId": "ORD_456",
  "amount": 10000,
  "status": "SUCCESS",
  "approvalNo": "AP1738742800000",
  "failReason": null,
  "requestedAt": "2026-02-05T10:00:00",
  "processedAt": "2026-02-05T10:00:05",
  "webhookSentAt": "2026-02-05T10:00:05"
}
```

### 3. 수동 Webhook 트리거 (테스트용)
```
POST http://localhost:8083/api/payment/webhook/trigger/{tid}?status=SUCCESS
POST http://localhost:8083/api/payment/webhook/trigger/{tid}?status=FAILED
```

## Webhook 동작

### 자동 Webhook (폴링 스케줄러)
```
POST http://127.0.0.1:8082/api/webhook/pg/DUMMY

성공 시:
{
  "status": "SUCCESS",
  "code": "0000",
  "transactionId": "DUMMY_20260205_12345678",
  "approvalNo": "AP1738742800000",
  "amount": 10000,
  "echo": { ... },
  "message": "Payment approved successfully"
}

실패 시:
{
  "status": "FAILED",
  "code": "E001",
  "transactionId": "DUMMY_20260205_12345678",
  "amount": 10000,
  "echo": { ... },
  "message": "Payment failed: INSUFFICIENT_BALANCE"
}
```

## 처리 플로우

```
Cash Gateway                    Hamster PG                    Cash Gateway
     │                              │                              │
     ├──────── POST /payment ──────>│                              │
     │                              │ (PENDING 저장)               │
     │<──── 202 Accepted (tid) ─────┤                              │
     │                              │                              │
     │                              │ (폴링 스케줄러 3초 주기)      │
     │                              ├──── CAS: PENDING→PROCESSING  │
     │                              │                              │
     │                              ├──── 랜덤 성공/실패 결정      │
     │                              │                              │
     │                              ├──── CAS: PROCESSING→SUCCESS  │
     │                              │                              │
     │                              ├──── POST /webhook ──────────>│
     │                              │                              │
     │                              │<──── 200 OK ─────────────────┤
```

## 상태 전이

```
PENDING
   ↓ (폴링 스케줄러 - CAS 업데이트)
PROCESSING
   ↓ (랜덤 성공/실패)
SUCCESS / FAILED
   ↓ (Webhook 전송)
(완료)
```

## DB 테이블

### payment_processes
- id: PK
- public_id: Snowflake Base62
- tid: Transaction ID (DUMMY_YYYYMMDD_랜덤)
- order_id: 주문 ID
- user_public_id: 사용자 ID
- amount: 거래 금액
- status: PENDING, PROCESSING, SUCCESS, FAILED
- approval_no: 승인번호 (성공 시)
- fail_reason: 실패 사유
- echo: Cash Gateway 메타데이터 (JSON)
- webhook_url: Webhook URL
- webhook_sent_at: Webhook 전송 시각
- webhook_response_code: Webhook 응답 코드
- requested_at: 요청 접수 시각
- processing_started_at: 처리 시작 시각
- processed_at: 최종 처리 시각

## 설정

### application.yml
```yaml
# 폴링 스케줄러 활성화/비활성화
payment:
  process:
    polling:
      enabled: true  # 기본값: true
```

### 스케줄러 설정
- `fixedDelay`: 3000ms (3초)
- `initialDelay`: 5000ms (5초)
- `BATCH_SIZE`: 10 (한 번에 처리할 최대 개수)
- `SUCCESS_RATE`: 80% (성공률)

## 실패 사유 (랜덤)
- INSUFFICIENT_BALANCE: 잔액 부족
- INVALID_CARD: 유효하지 않은 카드
- EXPIRED_CARD: 만료된 카드
- LIMIT_EXCEEDED: 한도 초과
- SYSTEM_ERROR: 시스템 오류

## 테스트 방법

1. **Cash Gateway 시작** (port 8082)
2. **Hamster PG 시작** (port 8083)
3. **결제 요청** (Cash Gateway → Hamster PG)
   ```bash
   curl -X POST http://localhost:8083/api/payment \
     -H "Content-Type: application/json" \
     -d '{
       "userPublicId": "USR_123",
       "orderId": "ORD_456",
       "amount": 10000,
       "echo": {
         "mid": "hamster_dummy_mid_001",
         "orderNumber": "TEST_ORDER",
         "gatewayReferenceId": "CGW_REF_123"
       }
     }'
   ```
4. **3초 대기** (폴링 스케줄러 자동 처리)
5. **Webhook 자동 수신 확인**

## 주의사항

- 테스트 전용 구현 (운영 사용 불가)
- Webhook URL 하드코딩 (127.0.0.1:8082)
- 실제 PG 인증/보안 없음
- 랜덤 성공/실패 처리 (80% 성공)

## Cash Gateway와의 관계

Hamster PG Service는 Cash Gateway Service의 DummyPaymentGatewayProvider와 통신합니다:

**Cash Gateway:**
```kotlin
// DummyPaymentGatewayProvider.kt
private const val ENDPOINT = "http://localhost:8083/api/payment"
```

**Hamster PG:**
```kotlin
// PaymentProcessController.kt
@PostMapping("/api/payment")
fun acceptPayment(@RequestBody request: ProcessPaymentRequest)
```

## 폴링 vs 이벤트 기반

현재 구현은 **폴링 기반**입니다:

- ✅ Cash Gateway와 패턴 일치 (일관성)
- ✅ 서버 재시작 시에도 안전 (DB 영속성)
- ✅ 모니터링/디버깅 용이
- ✅ 실제 PG 동작 방식과 유사

이벤트 기반 대신 폴링을 선택한 이유는 Cash Gateway의 `PaymentGatewayPgPollingService`와 동일한 패턴을 유지하기 위함입니다.
