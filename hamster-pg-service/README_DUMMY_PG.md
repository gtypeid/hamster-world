# Dummy PG API (테스트용)

Hamster PG Service 내에 구현된 더미 PG 엔드포인트입니다.
Cash Gateway Service의 비동기 PG 처리 테스트를 위한 간단한 구현입니다.

## 특징

- ✅ 요청 받으면 즉시 202 Accepted 응답 (비동기)
- ✅ 3-5초 후 자동으로 Webhook 전송
- ✅ 80% 성공, 20% 실패 랜덤 처리
- ✅ 모든 거래 내역 DB 저장
- ✅ 수동 Webhook 트리거 기능 (테스트용)

## API 엔드포인트

### 1. 결제 요청
```
POST http://localhost:8083/api/dummy-pg/payment

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

### 2. 거래 조회 (디버깅용)
```
GET http://localhost:8083/api/dummy-pg/transaction/{tid}
```

### 3. 수동 Webhook 트리거 (테스트용)
```
POST http://localhost:8083/api/dummy-pg/webhook/trigger/{tid}?status=SUCCESS
```

## Webhook 동작

### 자동 Webhook (3-5초 후)
```
POST http://127.0.0.1:8082/api/webhook/pg/DUMMY

성공 시:
{
  "status": "SUCCESS",
  "code": "0000",
  "transactionId": "DUMMY_20260205_12345678",
  "approvalNo": "AP12345678",
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
Cash Gateway                    Dummy PG                    Cash Gateway
     │                              │                              │
     ├──────── POST /payment ──────>│                              │
     │                              │                              │
     │<──── 202 Accepted (tid) ─────│                              │
     │                              │                              │
     │         (3-5초 대기)          │                              │
     │                              ├──── 내부 처리 (랜덤) ────>    │
     │                              │                              │
     │                              ├──── POST /webhook ──────────>│
     │                              │                              │
     │                              │<──── 200 OK ─────────────────│
```

## DB 테이블

### dummy_transactions
- tid: Transaction ID (자동 생성)
- order_id: 주문 ID
- amount: 거래 금액
- status: PENDING → SUCCESS/FAILED
- approval_no: 승인번호 (성공 시)
- fail_reason: 실패 사유
- echo: Cash Gateway가 보낸 메타데이터 (JSON)
- webhook_sent_at: Webhook 전송 시각
- webhook_response_code: Webhook 응답 코드

## 설정

### application.yml
```yaml
# 기본 Webhook URL (하드코딩)
# http://127.0.0.1:8082/api/webhook/pg/DUMMY

# 비동기 처리 스레드 풀
# corePoolSize: 5
# maxPoolSize: 10
# queueCapacity: 100
```

## 실패 사유 (랜덤)
- INSUFFICIENT_BALANCE: 잔액 부족
- INVALID_CARD: 유효하지 않은 카드
- EXPIRED_CARD: 만료된 카드
- LIMIT_EXCEEDED: 한도 초과
- SYSTEM_ERROR: 시스템 오류

## 테스트 방법

1. **Cash Gateway 시작** (port 8082)
2. **Hamster PG 시작** (port 8083)
3. **결제 요청** (Cash Gateway → Dummy PG)
4. **3-5초 대기**
5. **Webhook 자동 수신 확인**

## 주의사항

- 테스트 전용 구현 (운영 사용 불가)
- Webhook URL 하드코딩 (127.0.0.1:8082)
- 실제 PG 인증/보안 없음
- 랜덤 성공/실패 처리