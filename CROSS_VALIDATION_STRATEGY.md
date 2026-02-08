# Cross Validation Strategy
> Potato World (상용) ↔ Hamster World (검증 실험실)

## 🎯 핵심 철학

**"상용 서비스 전에, 학습 프로젝트에서 먼저 검증한다"**

**"온전한 애플리케이션도 중요하지만, 실제 장애 발생 시 추적 및 복구가 용이하도록 먼저 디자인한다"**

```
Potato World (Unity 게임 백엔드)
    → 실제 상용 서비스
    → 안정성/보안/성능 Critical
    → 장애 허용 불가

Hamster World (결제 플랫폼)
    → 학습/검증 목적
    → 실험적 시도 가능
    → Potato 선검증 실험실
```

---

## 📌 프로젝트 방향성 전환

### Before (기존 계획)
```
Hamster World = PG 재정산 플랫폼
핵심 도메인: 거래 + 정산 + 추적
목표: 결제 중개 플랫폼 구현
```

### After (현재 방향)
```
Hamster World = Potato World 선검증 실험실
핵심 목표:
  1. 장애 추적 (Distributed Tracing)
  2. 장애 대응 (Circuit Breaker, Retry)
  3. 장애 복구 (Outbox Pattern, Reconciliation)
  4. Potato 핵심 패턴 검증

목표: Potato World 상용 전 아키텍처 패턴 검증
```

**변경 이유:**
- Potato World는 실제 상용 서비스로 배포 예정
- 장애 발생 시 비즈니스 임팩트 큼
- Hamster World에서 아키텍처 패턴 선검증 후 Potato에 적용
- 특히 분산 시스템의 장애 추적/복구 메커니즘 우선 검증

---

## 🔄 검증 사이클

```
[1단계] Potato에서 기능 설계
    ↓
[2단계] Hamster로 도메인 변환
    - Potato: MonsterKilled → Hamster: DeliveryCompleted
    - Potato: Gacha → Hamster: Coupon
    ↓
[3단계] Hamster에서 검증
    - 로직 정확성
    - 장애 시나리오 (Kafka 장애, DB 장애, PG 장애)
    - 엣지 케이스
    - 성능 이슈
    - 보안 취약점
    ↓
[4단계] 피드백 → Potato 개선
    - 발견된 이슈 해결
    - 아키텍처 개선
    ↓
[5단계] Potato 상용 배포
```

---

## 📊 Potato World vs Hamster World 매핑

### 서비스 레벨 매핑

| Potato (게임) | Hamster (배달) | 검증 포인트 |
|--------------|---------------|-----------|
| **game-service** | **delivery-service** | 이벤트 발행 주체 |
| **wallet-service** | **payment-service** | 이벤트 소싱, Inbox, Gacha |
| **progression-service** | **progression-service** | Quota, Milestone, BattlePass, Archive |
| **live-service** | **notification-service** | Choreography 패턴 |

### 도메인 레벨 매핑

| Potato 도메인 | Hamster 도메인 | 핵심 검증 |
|--------------|---------------|----------|
| **MonsterKilled** | **DeliveryCompleted** | 이벤트 기반 진행도 |
| **Quota** | **Quota** (시간/지역 조건) | 주기별 리셋, Outbox |
| **BattlePass** | **SeasonPromotion** | Ownership 패턴 |
| **Archive** | **Badge** | 조건 달성 감지 |
| **Milestone** | **Milestone** | 다단계 사이클 |
| **Gacha** | **Coupon** | 확률 계산, 어뷰징 |
| **RewardInbox** | **SettlementInbox** | 상계, 환불 추적 |
| **Wallet** | **MerchantWallet/RiderWallet** | 이벤트 소싱, 멱등성 |

---

## 🏗️ Hamster World 서비스 확장 계획

### 기존 서비스 (유지)

#### 1. ecommerce-service (8081)
```
현재 도메인:
  - Order, OrderItem
  - Cart, CartItem
  - User
  - Product (읽기 전용)

역할:
  - 주문 생성 → OrderCreatedEvent 발행
  - 클라이언트 진입점

변경 사항: 없음 (간소화 유지)
```

#### 2. cash-gateway-service (8082)
```
현재 도메인:
  - Payment
  - PaymentProcess

역할:
  - 결제 중개
  - PG 연동

변경 사항: 없음
```

#### 3. hamster-pg-service (8083)
```
현재 도메인:
  - PgPayment
  - PgMid

역할:
  - 외부 PG 시뮬레이터

변경 사항: 없음
```

---

### 확장 서비스

#### 4. payment-service (8084) - 확장 ⭐⭐⭐

**기존 도메인:**
```
payment-service/domain/
├── product/           (재고 관리)
├── productrecord/     (이벤트 소싱)
└── ordersnapshot/
```

**추가 도메인:**
```
payment-service/domain/
├── product/ (기존)
├── productrecord/ (기존)
├── ordersnapshot/ (기존)
│
├── settlement/        ← 신규
│   ├── model/
│   │   ├── Settlement.kt
│   │   ├── SettlementInbox.kt
│   │   ├── SettlementItem.kt
│   │   └── RefundRecord.kt
│   ├── event/
│   │   ├── SettlementCreatedEvent.kt
│   │   └── SettlementWithdrawnEvent.kt
│   ├── repository/
│   ├── service/
│   ├── scheduler/
│   │   └── DailySettlementScheduler.kt
│   └── consumer/
│       └── PaymentEventConsumer.kt
│
├── merchantwallet/    ← 신규
│   ├── model/
│   │   ├── MerchantWallet.kt
│   │   ├── WalletTransaction.kt
│   │   └── Ownership.kt
│   ├── event/
│   │   ├── PointEarnedEvent.kt
│   │   └── OwnershipGrantedEvent.kt
│   ├── repository/
│   ├── service/
│   └── consumer/
│       ├── SettlementEventConsumer.kt
│       └── ProgressionEventConsumer.kt
│
├── riderwallet/       ← 신규
│   ├── model/
│   │   ├── RiderWallet.kt
│   │   └── RiderWalletTransaction.kt
│   ├── event/
│   ├── repository/
│   ├── service/
│   └── consumer/
│       ├── DeliveryEventConsumer.kt
│       └── ProgressionEventConsumer.kt
│
└── coupon/            ← 신규
    ├── model/
    │   ├── Coupon.kt
    │   └── CouponDraw.kt
    ├── event/
    │   └── CouponDrawnEvent.kt
    ├── repository/
    ├── service/
    │   ├── CouponService.kt
    │   └── ProbabilityCalculator.kt
    └── consumer/
```

**역할:**
- 재고 관리 (기존, 리액티브 전용)
- 정산 관리 (신규, 리액티브 전용)
- 지갑 관리 (신규, 리액티브 + Admin API)
- 쿠폰 관리 (신규, Admin API)
- Potato의 Wallet Service 역할

**Potato 대응:** wallet-service

---

#### 5. progression-service (8089) - 신규 ⭐⭐⭐

**전체 도메인:**
```
progression-service/domain/
├── quota/
│   ├── model/
│   │   ├── Quota.kt
│   │   └── QuotaMaster.kt
│   ├── event/
│   │   ├── QuotaConsumedEvent.kt
│   │   ├── QuotaClaimedEvent.kt
│   │   └── QuotaResetEvent.kt
│   ├── repository/
│   ├── service/
│   └── scheduler/
│       └── QuotaResetScheduler.kt
│
├── milestone/
│   ├── model/
│   │   ├── Milestone.kt
│   │   └── MilestoneMaster.kt
│   ├── event/
│   │   ├── MilestoneStepClaimedEvent.kt
│   │   └── MilestoneCycleAdvancedEvent.kt
│   ├── repository/
│   └── service/
│
├── seasonpromotion/   (BattlePass 대체)
│   ├── model/
│   │   ├── SeasonPromotion.kt
│   │   └── SeasonPromotionMaster.kt
│   ├── event/
│   │   ├── SeasonPromotionLevelUpEvent.kt
│   │   └── SeasonPromotionRewardClaimedEvent.kt
│   ├── repository/
│   └── service/
│
└── badge/             (Archive 대체)
    ├── model/
    │   ├── Badge.kt
    │   └── BadgeMaster.kt
    ├── event/
    │   └── BadgeEarnedEvent.kt
    ├── repository/
    ├── service/
    └── scheduler/
        └── BadgeCheckScheduler.kt

progression-service/consumer/
├── DeliveryEventConsumer.kt
├── PaymentEventConsumer.kt
├── OrderEventConsumer.kt
└── OwnershipEventConsumer.kt
```

**역할:**
- 외부 이벤트 구독 (Delivery, Payment, Order)
- 진행도 관리 (Quota, Milestone, SeasonPromotion, Badge)
- 조건 달성 시 ClaimEvent 발행 → Payment Service

**Potato 대응:** progression-service (동일)

---

#### 6. delivery-service (8092) - 신규 ⭐⭐⭐

**전체 도메인:**
```
delivery-service/domain/
├── rider/
│   ├── model/
│   │   └── Rider.kt
│   ├── repository/
│   └── service/
│
├── delivery/
│   ├── model/
│   │   ├── Delivery.kt
│   │   └── DeliveryStatus.kt
│   ├── event/
│   │   ├── DeliveryCompletedEvent.kt
│   │   └── DeliveryAssignedEvent.kt
│   ├── repository/
│   └── service/
│
└── region/
    ├── model/
    │   └── Region.kt
    └── repository/

delivery-service/consumer/
└── OrderEventConsumer.kt
```

**역할:**
- Order → Delivery 생성
- Rider 배정, 배달 완료 처리
- DeliveryCompletedEvent 발행 → Progression

**Potato 대응:** game-service (이벤트 발행 주체)

---

#### 7. notification-service (8095) - 신규 ⭐⭐

**전체 도메인:**
```
notification-service/domain/
├── notification/
│   ├── model/
│   │   ├── Notification.kt
│   │   └── NotificationStatus.kt
│   ├── repository/
│   └── service/
│       ├── NotificationService.kt
│       └── EmailService.kt
│
└── consumer/
    ├── EcommerceEventConsumer.kt
    ├── PaymentEventConsumer.kt
    ├── ProgressionEventConsumer.kt
    ├── DeliveryEventConsumer.kt
    └── SettlementEventConsumer.kt
```

**역할:**
- 모든 도메인 이벤트 구독
- Email/SMS 알림 발송
- Choreography 패턴 (서비스 간 결합도 0)

**Potato 대응:** live-service (WebSocket 대신 Email/SMS)

---

### 공통 모듈 확장

#### common module - 확장 ⭐⭐⭐

**추가 기능:**
```
common/
├── outbox/            ← 신규
│   ├── model/
│   │   └── OutboxEvent.kt
│   ├── repository/
│   │   └── OutboxEventRepository.kt
│   └── publisher/
│       └── OutboxEventPublisher.kt
│
├── tracing/           ← 신규
│   ├── config/
│   │   └── SleuthConfig.kt
│   └── propagator/
│       └── TraceContextPropagator.kt
│
├── resilience/        ← 신규
│   ├── config/
│   │   ├── CircuitBreakerConfig.kt
│   │   └── RetryConfig.kt
│   └── fallback/
│       └── FallbackHandler.kt
│
└── event/ (기존)
    └── BaseDomainEvent.kt
```

**역할:**
- Outbox: DB-Kafka 원자성 보장
- Tracing: 분산 추적 (Sleuth + Zipkin)
- Resilience: 장애 격리/복구

---

## 🎯 검증 우선순위

### 🔥🔥🔥 Priority 1: 장애 추적/복구 기반 (Week 1-2)

**목표:** 모든 서비스의 장애 추적/복구 메커니즘 구축

#### 1. Outbox Pattern 구현

**적용 대상:**
- Progression Service (모든 Claim 이벤트)
- Payment Service (Settlement, Wallet, Coupon 이벤트)
- Delivery Service (DeliveryCompleted 이벤트)

**구현 위치:**
```
common/outbox/
  - model/OutboxEvent.kt
  - repository/OutboxEventRepository.kt
  - publisher/OutboxEventPublisher.kt (Scheduler)

각 서비스 DB:
  CREATE TABLE outbox_events (
    id BIGINT PRIMARY KEY,
    aggregate_type VARCHAR(255),
    aggregate_id VARCHAR(255),
    event_type VARCHAR(255),
    payload JSON,
    created_at TIMESTAMP,
    published_at TIMESTAMP,
    status VARCHAR(50)
  );
```

**검증 포인트:**
- [ ] DB 커밋 성공 → Kafka 발행 보장 (Eventually)
- [ ] Kafka 장애 시 재시도
- [ ] 이벤트 누락 0건
- [ ] Dual Write Problem 완전 해결
- [ ] 스케줄러 성능 (1초 폴링 시 부하)

**장애 시나리오:**
```
Scenario 1: Kafka 브로커 장애
  1. Quota.claim() → DB 커밋 성공
  2. OutboxEvent INSERT 성공
  3. Kafka 발행 실패 (브로커 다운)
  4. OutboxEvent.status = PENDING
  5. Kafka 복구 후
  6. OutboxEventPublisher가 재발행
  7. OutboxEvent.status = PUBLISHED

  검증: Payment Service가 QuotaClaimedEvent 수신 확인
```

---

#### 2. Distributed Tracing 구현

**도구:**
- Spring Cloud Sleuth (TraceId 생성/전파)
- Zipkin (시각화)

**구현 위치:**
```
common/tracing/
  - config/SleuthConfig.kt
  - propagator/TraceContextPropagator.kt

각 서비스 application.yml:
  spring:
    sleuth:
      enabled: true
      sampler:
        probability: 1.0
    zipkin:
      base-url: http://localhost:9411
```

**검증 포인트:**
- [ ] TraceId 전파 (HTTP → Kafka → Service)
- [ ] 모든 로그에 TraceId 포함
- [ ] Zipkin UI에서 전체 체인 시각화
- [ ] 병목 구간 식별 (느린 서비스 찾기)
- [ ] 에러 발생 지점 추적

**추적 시나리오:**
```
Scenario 1: 배달 완료 → 인센티브 지급

  [TraceId: abc123]

  1. Delivery Service
     - DeliveryController.complete()
     - 로그: [abc123] Delivery completed: deliveryId=123

  2. Kafka (Header에 TraceId)
     - DeliveryCompletedEvent

  3. Progression Service
     - DeliveryEventConsumer.handleDeliveryCompleted()
     - 로그: [abc123] Quota consumed: quotaId=456
     - QuotaClaimedEvent

  4. Payment Service
     - ProgressionEventConsumer.handleQuotaClaimed()
     - 로그: [abc123] RiderWallet earned: 20000원

  Zipkin UI:
    - 전체 체인 시각화
    - 각 구간 소요 시간
      * Delivery Service: 50ms
      * Kafka: 10ms
      * Progression Service: 200ms ← 병목!
      * Kafka: 10ms
      * Payment Service: 100ms
    - 총 370ms
```

---

#### 3. Circuit Breaker + Retry 구현

**도구:**
- Resilience4j

**구현 위치:**
```
common/resilience/
  - config/CircuitBreakerConfig.kt
  - config/RetryConfig.kt
  - fallback/FallbackHandler.kt

적용 대상:
  - Cash Gateway → PG 호출
  - Notification Service → Email/SMS API
```

**Circuit Breaker 설정:**
```
resilience4j:
  circuitbreaker:
    instances:
      pg-service:
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 3
        sliding-window-size: 10
```

**Retry 설정:**
```
resilience4j:
  retry:
    instances:
      kafka-consumer:
        max-attempts: 5
        wait-duration: 1s
        exponential-backoff-multiplier: 2
```

**검증 포인트:**
- [ ] 실패 임계값 도달 → Circuit Open
- [ ] Fallback 로직 작동
- [ ] Exponential Backoff (1초, 2초, 4초, 8초)
- [ ] Half-Open → Closed 전환
- [ ] DLQ 이동 (Dead Letter Queue)

**장애 시나리오:**
```
Scenario 1: PG 장애

  1. Cash Gateway → PG 호출 (1차 실패)
     - Timeout 3초
     - Retry (2초 대기)

  2. PG 호출 (2차 실패)
     - Retry (4초 대기)

  3. PG 호출 (3차 실패)
     - 실패율 50% 도달
     - Circuit Open

  4. Fallback 처리
     - PaymentProcess.status = PENDING
     - 로그: "PG service is down, circuit opened"
     - 알림 발송 (운영팀)

  5. 10초 후 Half-Open
     - 3회 재시도 (테스트)

  6. PG 복구 → 성공
     - Circuit Closed

  검증:
    - 다른 서비스에 영향 없음
    - PaymentProcess는 PENDING 상태로 대기
    - 복구 후 수동/자동 재처리
```

---

#### 4. Reconciliation Job 구현

**목표:** 데이터 정합성 검증 및 자동 보정

**구현 위치:**
```
각 서비스의 scheduler 패키지:
  - payment-service/scheduler/ReconciliationScheduler.kt
  - progression-service/scheduler/ReconciliationScheduler.kt
```

**검증 대상:**
```
1. Settlement vs Payment
   - Settlement.amount = SUM(Payment.amount)?

2. Wallet vs WalletTransaction
   - Wallet.balance = SUM(WalletTransaction.amount)?

3. Quota vs Event Count
   - Quota.consumed = COUNT(DeliveryCompletedEvent)?
```

**검증 포인트:**
- [ ] 불일치 감지
- [ ] 자동 보정 (가능한 경우)
- [ ] 알림 발송 (불가능한 경우)
- [ ] 감사 로그 기록

**실행 주기:**
- 매일 새벽 3시 (트래픽 적은 시간)

---

### 🔥🔥 Priority 2: Delivery/Rider 도메인 (Week 3-4)

**목표:** Game Service 패턴 검증

#### 구현 순서

**1. Delivery Service 구현**
```
클래스 경로:
  delivery-service/domain/rider/model/Rider.kt
  delivery-service/domain/delivery/model/Delivery.kt
  delivery-service/domain/delivery/event/DeliveryCompletedEvent.kt

검증:
  - Order → Delivery 생성
  - Rider 배정
  - 배달 완료 → DeliveryCompletedEvent 발행 (Outbox 적용)
```

**2. Progression Service - Quota 구현**
```
클래스 경로:
  progression-service/domain/quota/model/Quota.kt
  progression-service/consumer/DeliveryEventConsumer.kt

검증:
  - DeliveryCompletedEvent 구독
  - 시간/지역 조건 필터링
    * regionCode = "성수동"
    * timeRangeStart = 18:00, timeRangeEnd = 21:00
  - Quota.consume()
  - maxLimit 도달 → Quota.claim()
  - QuotaClaimedEvent 발행 (Outbox 적용)
```

**3. Payment Service - RiderWallet 구현**
```
클래스 경로:
  payment-service/domain/riderwallet/model/RiderWallet.kt
  payment-service/domain/riderwallet/model/RiderWalletTransaction.kt
  payment-service/consumer/ProgressionEventConsumer.kt

검증:
  - QuotaClaimedEvent 구독
  - RiderWallet.earnPoint()
  - RiderWalletTransaction 생성 (이벤트 소싱)
  - externalTransactionId 멱등성
```

**검증 포인트:**
- [ ] E2E 플로우 (배달 완료 → 인센티브 지급)
- [ ] Outbox 적용 확인 (모든 이벤트)
- [ ] Tracing (전체 체인 추적)
- [ ] 시간/지역 조건 정확성
- [ ] 멱등성 (중복 이벤트 처리)

---

### 🔥🔥 Priority 3: Payment Wallet/Coupon (Week 5-6)

**목표:** Wallet, Gacha 패턴 검증

#### 구현 순서

**1. MerchantWallet 구현**
```
클래스 경로:
  payment-service/domain/merchantwallet/model/MerchantWallet.kt
  payment-service/domain/merchantwallet/model/WalletTransaction.kt

검증:
  - 이벤트 소싱 (balance = SUM(transactions))
  - 재집계 로직
  - 멱등성 (externalTransactionId UNIQUE)
```

**2. Coupon 구현 (Gacha 패턴)**
```
클래스 경로:
  payment-service/domain/coupon/model/Coupon.kt
  payment-service/domain/coupon/service/ProbabilityCalculator.kt

검증:
  - 확률 계산 정확성 (시뮬레이션 10000회)
  - Tier 기반 확률 조정
    * BRONZE: Legendary 1%
    * DIAMOND: Legendary 5%
  - 포인트 차감 원자성
  - 어뷰징 방지 (무한 뽑기 감지)
```

**3. Settlement 구현 (Inbox + 상계)**
```
클래스 경로:
  payment-service/domain/settlement/model/Settlement.kt
  payment-service/domain/settlement/model/SettlementInbox.kt
  payment-service/domain/settlement/model/RefundRecord.kt
  payment-service/scheduler/DailySettlementScheduler.kt

검증:
  - 일일 정산 집계 (스케줄러)
  - Payment 누락 없음 (Reconciliation)
  - 환불 추적 (RefundRecord)
  - 상계 처리 (즉시 차감 + 다음 정산 명시)
```

**검증 포인트:**
- [ ] Wallet 이벤트 소싱
- [ ] 확률 계산 정확성
- [ ] Settlement 집계 정확성
- [ ] 환불 상계 로직
- [ ] Outbox 적용 확인

---

### 🔥 Priority 4: Progression (Week 7-8)

**목표:** SeasonPromotion, Badge, Milestone 검증

#### 구현 순서

**1. SeasonPromotion (BattlePass 패턴)**
```
클래스 경로:
  progression-service/domain/seasonpromotion/model/SeasonPromotion.kt
  progression-service/consumer/OwnershipEventConsumer.kt

검증:
  - EXP 누적 → 자동 레벨업
  - Basic/Premium Track 분기
  - Ownership 패턴
    * Payment Service (주체) → Progression (로직)
    * 캐시 동기화 (premiumUnlocked)
    * 캐시 불일치 감지/복구
```

**2. Badge (Archive 패턴)**
```
클래스 경로:
  progression-service/domain/badge/model/Badge.kt
  progression-service/scheduler/BadgeCheckScheduler.kt

검증:
  - EVENT_BASED (이벤트 기반 자동 감지)
  - STAT_BASED (스케줄러 기반 체크)
  - 중복 수령 방지
```

**3. Milestone**
```
클래스 경로:
  progression-service/domain/milestone/model/Milestone.kt

검증:
  - 다단계 진행
  - 사이클 반복 로직
  - claimedSteps 형식 ("cycle_step")
```

**검증 포인트:**
- [ ] Ownership 캐시 동기화
- [ ] Badge 자동 감지
- [ ] Milestone 사이클 반복
- [ ] Outbox 적용 확인

---

### 🔥 Priority 5: Notification (Week 9)

**목표:** Choreography 패턴 검증

#### 구현

```
클래스 경로:
  notification-service/consumer/EcommerceEventConsumer.kt
  notification-service/consumer/PaymentEventConsumer.kt
  notification-service/consumer/ProgressionEventConsumer.kt
  notification-service/consumer/DeliveryEventConsumer.kt
  notification-service/consumer/SettlementEventConsumer.kt
```

**검증 포인트:**
- [ ] 모든 이벤트 구독
- [ ] 서비스 간 결합도 0
- [ ] Email/SMS 발송 확인
- [ ] Tracing (알림 발송까지 추적)

---

### 🔥🔥🔥 Priority 6: 통합 검증 (Week 10)

**목표:** E2E 시나리오 검증

#### E2E 시나리오 1: 배달 완료 → 인센티브 지급

```
[1] Delivery Service
    POST /api/deliveries/{id}/complete
    - Delivery.status = COMPLETED
    - DeliveryCompletedEvent (Outbox)
    - TraceId: abc123

[2] Kafka: delivery-events

[3] Progression Service (구독)
    - Quota.consume() (성수동 저녁 10건)
    - Quota.claim()
    - QuotaClaimedEvent (Outbox)

[4] Kafka: progression-events

[5] Payment Service (구독)
    - RiderWallet.earnPoint(20000)
    - RiderWalletTransaction 생성
    - externalTxId: "quota-{quotaId}"

[6] Kafka: wallet-events

[7] Notification Service (구독)
    - Email 발송: "인센티브 2만원 지급!"

검증:
  - [ ] TraceId 전파 (Zipkin 확인)
  - [ ] Outbox 적용 (모든 이벤트)
  - [ ] 멱등성 (중복 이벤트 무시)
  - [ ] 소요 시간 측정 (병목 구간)
```

#### E2E 시나리오 2: 정산 → 환불 상계

```
[1] Payment Service (스케줄러)
    - DailySettlementScheduler 실행
    - 2월 거래 집계
    - Settlement 생성 (97만원)
    - SettlementInbox 생성
    - SettlementCreatedEvent (Outbox)

[2] 벤더 출금
    POST /admin/settlements/{id}/withdraw
    - MerchantWallet.earnPoint(970000)
    - WalletTransaction 생성

[3] 환불 발생 (2월 주문)
    PaymentCancelledEvent
    - MerchantWallet.spendPoint(50000) ← 즉시 차감
    - RefundRecord 생성 (추적)

[4] 3월 정산 시
    - 정산서에 명시: "이전 환불 차감: -50,000원"

검증:
  - [ ] Settlement 집계 정확성
  - [ ] 환불 즉시 반영
  - [ ] RefundRecord 추적
  - [ ] Reconciliation (Payment vs Settlement)
```

#### E2E 시나리오 3: 장애 복구

```
[1] Kafka 장애 발생
    - Kafka 브로커 다운
    - Quota.claim() → DB 커밋 성공
    - OutboxEvent INSERT 성공
    - Kafka 발행 실패

[2] OutboxEventPublisher (스케줄러)
    - PENDING 상태 이벤트 조회
    - 재발행 시도 (Kafka 여전히 다운)
    - 계속 재시도 (1초마다)

[3] Kafka 복구
    - OutboxEventPublisher 재발행 성공
    - OutboxEvent.status = PUBLISHED

[4] Payment Service
    - QuotaClaimedEvent 수신
    - RiderWallet.earnPoint()

검증:
  - [ ] 이벤트 누락 0건
  - [ ] 최종 일관성 보장
  - [ ] 재시도 횟수 로그
```

---

## 📋 패턴별 검증 체크리스트

### Pattern 1: Outbox (DB-Kafka 원자성)

**구현 위치:**
- `common/outbox/OutboxEvent.kt`
- `common/outbox/OutboxEventPublisher.kt`

**검증 항목:**
- [ ] DB 커밋과 Outbox INSERT가 같은 트랜잭션
- [ ] OutboxEventPublisher 스케줄러 작동 (1초 폴링)
- [ ] Kafka 장애 시 PENDING 상태 유지
- [ ] Kafka 복구 후 자동 재발행
- [ ] 이벤트 누락 0건
- [ ] 중복 발행 방지 (status 체크)
- [ ] 발행 완료 후 published_at 업데이트

---

### Pattern 2: Event Sourcing

**구현 위치:**
- `payment-service/domain/merchantwallet/WalletTransaction.kt`
- `payment-service/domain/riderwallet/RiderWalletTransaction.kt`

**검증 항목:**
- [ ] Transaction 불변성 (INSERT만 가능)
- [ ] balance = SUM(transactions) 재집계 가능
- [ ] externalTransactionId UNIQUE 제약
- [ ] Duplicate INSERT 시 무시
- [ ] 재집계 로직 정확성
- [ ] Reconciliation Job 작동

---

### Pattern 3: Ownership (주체 A → 로직 B)

**구현 위치:**
- `payment-service/domain/merchantwallet/Ownership.kt` (주체)
- `progression-service/domain/seasonpromotion/SeasonPromotion.kt` (로직)

**검증 항목:**
- [ ] Ownership = Truth (Payment Service)
- [ ] OwnershipGrantedEvent 발행 (Outbox)
- [ ] Progression Service 구독
- [ ] Cache 필드 업데이트 (premiumUnlocked)
- [ ] Cache 불일치 감지 (Reconciliation)
- [ ] Cache 복구 로직

---

### Pattern 4: Quota (주기적 리셋)

**구현 위치:**
- `progression-service/domain/quota/Quota.kt`
- `progression-service/scheduler/QuotaResetScheduler.kt`

**검증 항목:**
- [ ] 이벤트 → consume 정확성
- [ ] 시간 조건 필터링 (timeRangeStart, timeRangeEnd)
- [ ] 지역 조건 필터링 (regionCode)
- [ ] maxLimit 캡 (자연 멱등성)
- [ ] claim 시 Outbox 발행
- [ ] 리셋 스케줄러 정확성 (DAILY, WEEKLY, MONTHLY)

---

### Pattern 5: Distributed Tracing

**구현 위치:**
- `common/tracing/SleuthConfig.kt`

**검증 항목:**
- [ ] TraceId 생성 (HTTP 요청 시)
- [ ] TraceId 전파 (HTTP → Service)
- [ ] TraceId 전파 (Kafka Message Header)
- [ ] TraceId 전파 (Service → Kafka → Service)
- [ ] 모든 로그에 TraceId 포함
- [ ] Zipkin UI 시각화
- [ ] 병목 구간 식별

---

### Pattern 6: Circuit Breaker

**구현 위치:**
- `common/resilience/CircuitBreakerConfig.kt`

**검증 항목:**
- [ ] 실패 임계값 도달 → Circuit Open
- [ ] Fallback 로직 작동
- [ ] Half-Open 전환 (wait-duration 후)
- [ ] Closed 전환 (성공 시)
- [ ] 다른 서비스 영향 없음 (격리)
- [ ] 메트릭 수집 (실패율, 응답 시간)

---

### Pattern 7: Settlement (상계)

**구현 위치:**
- `payment-service/domain/settlement/Settlement.kt`
- `payment-service/domain/settlement/RefundRecord.kt`

**검증 항목:**
- [ ] 일일 집계 정확성 (Payment 누락 없음)
- [ ] 환불 즉시 차감 (MerchantWallet)
- [ ] RefundRecord 추적 (originalSettlementId)
- [ ] 다음 정산서에 명시
- [ ] Reconciliation (Payment vs Settlement)

---

## 🗺️ 구현 로드맵

### Week 1-2: 장애 추적/복구 기반 🔥🔥🔥
```
목표: 모든 서비스의 장애 메커니즘 구축

Task:
  - [ ] Outbox 테이블 생성 (모든 서비스)
  - [ ] OutboxEventPublisher 구현
  - [ ] Sleuth 설정
  - [ ] Zipkin 서버 구동
  - [ ] Circuit Breaker 설정
  - [ ] Retry 설정
  - [ ] 장애 시뮬레이션
    * Kafka 브로커 다운
    * DB 연결 장애
    * PG 타임아웃

Deliverable:
  - 모든 서비스에 Outbox, Tracing, Circuit Breaker 적용
  - 장애 시나리오 테스트 결과 문서
```

### Week 3-4: Delivery/Rider + Quota 🔥🔥🔥
```
목표: Game Service 패턴 검증

Task:
  - [ ] Delivery Service 구현
  - [ ] Progression Service (Quota) 구현
  - [ ] Payment Service (RiderWallet) 구현
  - [ ] E2E 테스트 (배달 완료 → 인센티브)

Deliverable:
  - 배달 완료 → 인센티브 지급 E2E 성공
  - Tracing 확인 (Zipkin UI)
  - Outbox 적용 확인
```

### Week 5-6: Wallet/Coupon/Settlement 🔥🔥🔥
```
목표: Wallet, Gacha, Inbox 패턴 검증

Task:
  - [ ] MerchantWallet 구현
  - [ ] Coupon 구현 (확률 계산)
  - [ ] Settlement 구현 (정산 + 상계)
  - [ ] 확률 시뮬레이션 (10000회)

Deliverable:
  - 이벤트 소싱 검증
  - 확률 계산 정확성 리포트
  - 정산 → 환불 상계 E2E 성공
```

### Week 7-8: SeasonPromotion/Badge/Milestone 🔥🔥
```
목표: BattlePass, Archive, Milestone 패턴 검증

Task:
  - [ ] SeasonPromotion 구현
  - [ ] Badge 구현
  - [ ] Milestone 구현
  - [ ] Ownership 캐시 동기화 검증

Deliverable:
  - Ownership 패턴 검증 완료
  - Badge 자동 감지 확인
  - Milestone 사이클 반복 확인
```

### Week 9: Notification 🔥
```
목표: Choreography 패턴 검증

Task:
  - [ ] Notification Service 구현
  - [ ] 모든 이벤트 구독
  - [ ] Email/SMS 연동

Deliverable:
  - 모든 도메인 이벤트 알림 확인
  - 서비스 간 결합도 0 검증
```

### Week 10: 통합 검증 🔥🔥🔥
```
목표: E2E 시나리오 검증

Task:
  - [ ] E2E 시나리오 1: 배달 → 인센티브
  - [ ] E2E 시나리오 2: 정산 → 환불
  - [ ] E2E 시나리오 3: 장애 복구
  - [ ] 성능 테스트 (TPS 1000)
  - [ ] Reconciliation Job 검증

Deliverable:
  - 모든 E2E 시나리오 성공
  - 장애 복구 검증 완료
  - Potato World 적용 준비 완료
```

---

## 🎓 학습 및 개선 사항

### Potato World 피드백 항목

**검증 완료 후 Potato에 적용할 항목:**

1. **Outbox Pattern**
   - Progression Service의 모든 Claim 이벤트에 적용
   - Wallet Service의 모든 이벤트에 적용

2. **Distributed Tracing**
   - 전체 서비스에 Sleuth 적용
   - Zipkin 서버 구축

3. **Circuit Breaker**
   - 외부 API 호출에 적용 (Google/Apple IAP)

4. **Reconciliation Job**
   - Wallet vs Transaction
   - Quota vs Event Count

---

## 📊 성공 지표

### 검증 완료 기준

**아키텍처:**
- [ ] Outbox Pattern 적용 (모든 도메인 이벤트)
- [ ] Tracing 전파 (HTTP → Kafka → Service)
- [ ] Circuit Breaker 작동 (외부 장애 격리)
- [ ] 이벤트 누락 0건 (Kafka 장애 시뮬레이션)

**비즈니스:**
- [ ] 엣지 케이스 10개 이상 발견 및 해결
- [ ] 확률 계산 정확성 (오차 1% 이내)
- [ ] 정산 집계 정확성 (Payment 누락 0건)
- [ ] 멱등성 보장 (중복 이벤트 처리)

**성능:**
- [ ] TPS 1000 이상
- [ ] P99 응답 시간 500ms 이하
- [ ] Outbox Publisher 부하 측정

**보안:**
- [ ] Public ID 적용 (Long PK 노출 방지)
- [ ] 어뷰징 감지 (쿠폰 무한 뽑기 등)

---

## 🤝 협업 가이드

### 새 세션 시작 시

1. **이 문서 먼저 읽기**
2. **현재 진행 중인 Phase 확인**
3. **검증 대상 기능 파악**
4. **이전 검증 결과 리뷰**

### 기능 추가 시

1. **Potato에서 요구사항 정의**
2. **Hamster로 도메인 변환 설계**
3. **검증 포인트 명확화**
4. **Outbox/Tracing 적용 확인**
5. **구현 → 테스트 → 피드백**

---

## 📝 변경 이력

| 날짜 | 변경 내역 | 작성자 |
|------|----------|--------|
| 2026-02-08 | 문서 생성, 검증 전략 수립 | Claude |

---

**이 문서는 지속적으로 업데이트됩니다.**
**모든 의사결정과 검증 결과를 이곳에 기록하세요.**
