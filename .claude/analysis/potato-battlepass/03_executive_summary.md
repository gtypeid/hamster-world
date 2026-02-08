# Potato World BattlePass & Ownership 패턴 - 최종 요약

## 핵심 개념 30초 설명

### BattlePass란?
**정의**: 사용자가 진행하는 시간 단위 콘텐츠로, 여러 "사이클"과 "스텝"으로 구성됨

**특징**:
- **Step**: 자동으로 진행되는 레벨 (1~50, 게임 조건 달성 시 증가)
- **Cycle**: 사이클 (0~10, 유료 구매로만 진행 가능)
- **Track**: 보상 트랙 (기본/추가/프리미엄, 구매 여부에 따라 언락)

### Ownership란?
**정의**: "유저가 소유한 상태"를 나타내는 추상 개념

**표현 방식**: Wallet의 balance (잔액)
- balance = 0 → 미소유
- balance > 0 → 소유 (수량만큼 소유)

**목적**: 구매 권한을 관리하면서 서비스 간 느슨한 결합 유지

---

## 아키텍처 구조

### 1. Wallet Service (진실의 원천)
```
역할: 모든 구매/소유권의 최종 결정권
┌─────────────────────┐
│ Ownership Currency  │
├─────────────────────┤
│ code: "battlepass_│
│ cycle:season_1"    │
│ balance: 3         │ ← 사이클 3까지 진입 가능
│                     │
│ code: "battlepass_│
│ premium:season_1"  │
│ balance: 1         │ ← 프리미엄 언락됨
└─────────────────────┘
       │
       ├─ OwnershipGrantedEvent 발행 (Kafka)
       └─ WalletEventConsumer가 수신
```

### 2. Progression Service (캐시)
```
역할: 빠른 조회를 위해 Ownership을 캐시
┌─────────────────────┐
│ BattlePass (Cache)  │
├─────────────────────┤
│ maxUnlockedCycle: 3 │ ← Wallet의 balance 캐시
│ premiumUnlocked: T  │ ← Wallet의 balance 캐시
│                     │
│ currentCycle: 1     │ ← 로컬 상태
│ currentStep: 30     │ ← 로컬 상태
└─────────────────────┘
```

### 3. 동기화 흐름
```
구매 요청
  ↓
Wallet: "battlepass_cycle:season_1" balance 증가 (2→3)
  ├─ DB 저장 ✅
  └─ OwnershipGrantedEvent 발행
       │
       ├→ Kafka Broker
       │    │
       ├→ WalletEventConsumer (Progression)
       │    │
       ├→ maxUnlockedCycle 업데이트 (2→3)
       │    │
       └→ DB 저장 ✅
              (캐시 동기화 완료)
```

---

## 핵심 설계 패턴 3가지

### 패턴 1: Ownership = Balance (수량 기반)
```
boolean 방식 (❌ 사용 안 함):
├─ premiumUnlocked: true/false
└─ 1가지 상태만 표현 가능

Balance 방식 (✅ 사용):
├─ "battlepass_cycle:season_1" = 0 → 미소유
├─ "battlepass_cycle:season_1" = 1 → 사이클 1 진입 가능
├─ "battlepass_cycle:season_1" = 3 → 사이클 3 진입 가능
└─ 더 높은 유연성 (환불 시 감소 가능)
```

### 패턴 2: Wallet = 진실의 원천, Progression = 캐시
```
장점:
├─ 결제 시스템과 직결 (신뢰도 높음)
├─ 환불 처리 용이 (balance 감소)
├─ 외부 IAP와 연동 쉬움
├─ 성능 최적화 (캐시로 빠른 조회)
└─ 느슨한 결합 (장애 격리)

위험:
└─ Kafka 메시지 유실 → 불일치 발생 가능
   (대처: Daily reconciliation job)
```

### 패턴 3: 멱등성 보장 (Idempotency)
```
문제: Kafka at-least-once → 중복 수신 가능

해결책:
├─ Wallet: externalTransactionId로 중복 방지
│  └─ UNIQUE 제약 있음
│
└─ Progression: balance 캐시 (자동 멱등성)
   └─ 같은 값 반복 저장 → 결과 동일
   
예: maxUnlockedCycle = 3 저장
├─ 1차: maxUnlockedCycle = 3 ✅
├─ 2차: maxUnlockedCycle = 3 ✅ (같음)
└─ 결과: 일관성 유지
```

---

## 구매부터 사이클 진입까지 (Timeline)

```
T=0ms   사용자 구매 요청 (Client)
T=10ms  Wallet Service: 결제 검증 + DB 저장
T=20ms  Wallet Service: OwnershipGrantedEvent 발행
T=30ms  Kafka Broker: 메시지 저장
T=50ms  Progression Service: 이벤트 수신 + 캐시 업데이트
T=60ms  Progression Service: Offset 커밋
T=100ms 사용자 사이클 진입 요청
T=110ms Progression Service: 권한 체크 (캐시 사용)
T=120ms RESPONSE 200 OK

⏱️ 최악: ~120ms, 일반: 수 초 내
```

---

## 불일치 시나리오 vs 복구

### 시나리오 1: Kafka 메시지 유실

```
상황:
├─ Wallet: balance = 3 ✅
├─ Event: 발행 ❌ (Kafka 장애)
└─ Progression: maxUnlockedCycle = 2 ❌

결과:
├─ 사용자: "사이클 3 구매함"
└─ Progression: "사이클 2까지만 진입 가능" ❌

복구:
├─ 자동: Daily Reconciliation Job
│  └─ 1일 1회 Wallet 조회 → Progression 비교
│     불일치 감지 → 업데이트 + Alert
│
├─ 수동: Admin API
│  └─ POST /admin/cache/sync
│     Wallet 직접 조회 → 캐시 강제 업데이트
│
└─ 결과: maxUnlockedCycle = 3 (복구됨)
```

### 시나리오 2: 환불 처리

```
상황:
├─ 구매: balance = 1 → premiumUnlocked = true
├─ 환불: balance = 0
├─ Event: OwnershipGrantedEvent (balance=0 발행)
└─ Progression: premiumUnlocked = false (복구됨)

코드:
```kotlin
private fun handleBattlePassPremiumUnlock(event: OwnershipGrantedEvent) {
    battlePass.premiumTrackUnlocked = (event.newBalance > 0)
    // balance > 0 = true, balance = 0 = false
    // 자동으로 올바르게 처리됨!
}
```
```

---

## 권한 체크 (사이클 진입)

### 조건
```
canAdvanceCycle() = 
    currentStep >= maxStep              AND  // 스텝 50 완료
    currentCycle < maxUnlockedCycle     AND  // 언락된 사이클 < 캐시
    currentCycle < maxCycle                  // 최대 사이클 < 10

예: 현재 상태
├─ currentStep = 50 ✅
├─ currentCycle = 1
├─ maxUnlockedCycle = 3 (Wallet 기반 캐시) ⭐
└─ maxCycle = 10

결과: 1 < 3 ✅ → 진입 가능
```

---

## 트랙별 보상 체계

### 3개 독립 트랙

```
BASIC (기본, 누구나)
├─ 언락: 항상 true
├─ 보상: gold (일반 재화)
├─ 예: step 10 → gold 1000
└─ ✅ 클레임 가능

ENHANCED (추가, 구매)
├─ 언락: Ownership "battlepass_enhanced:season_1" > 0
├─ 보상: crystal (고급 재화)
├─ 예: step 10 → crystal 100
└─ ❌ 미언락 시 클레임 불가

PREMIUM (프리미엄, 현금+Enhanced 필수)
├─ 언락: Ownership "battlepass_premium:season_1" > 0
├─ 보상: gem (귀중 재화) + 스텝 보상
├─ 예: step 10 → gem 10 + chest
├─ 추가: step 5, 10, 15... → 사이클별 다른 아이템
└─ ⚠️ Enhanced가 먼저 언락되어야 함
```

---

## Hamster World 적용 사례

### "Seoul 지역 배송 완료 시 추가 리워드" 프로모션

```
Mapping:
┌────────────────┬──────────────────┐
│ Potato         │ Hamster          │
├────────────────┼──────────────────┤
│ BattlePass     │ SeasonPromotion  │
│ Cycle          │ Layer/Phase      │
│ Step           │ MissionProgress  │
│ Track          │ Tier/Level       │
│ Ownership      │ PromotionAccess  │
└────────────────┴──────────────────┘

Ownership 예시:
├─ "region_delivery:seoul" = 1 → 지역 배송 미션 추가 참여
├─ "region_premium:seoul" = 1 → 지역 프리미엄 보상 언락
└─ "region_premium:seoul"은 "region_delivery:seoul"이 먼저 필요

구현:
├─ Wallet: Ownership 관리 (구매 처리)
└─ Progression: SeasonPromotion (캐시)
   ├─ isExtendedUnlocked (region_delivery 기반)
   └─ isPremiumUnlocked (region_premium 기반)
```

---

## 핵심 Q&A

### Q1. Ownership을 왜 Wallet에?
**A. 결제 시스템과 직결되기 때문**
- 구매 = balance 증가
- 환불 = balance 감소
- 모든 거래 기록이 Wallet에
- 진정한 진실의 원천

### Q2. 캐시를 왜 필요로?
**A. 성능과 독립성**
- 매 요청마다 Wallet 조회하면 느림 (RPC 오버헤드)
- Wallet 장애가 Progression 영향 주지 않음
- BattlePass 복잡 로직에 집중 가능

### Q3. 불일치 시 대처?
**A. 다층 방어**
1. 사전: Kafka at-least-once + 충분한 retention
2. 자동: Consumer 재시도
3. 정기: Daily reconciliation job
4. 수동: Admin API

### Q4. 구매 직후 즉시 사용 가능?
**A. 최악 ~120ms, 일반 수 초**
- Kafka 지연 있을 수 있음
- 대처: Client 자동 재시도 또는 안내

---

## 운영 체크리스트

### 배포 전
- [ ] Wallet 이벤트 발행 확인
- [ ] Progression Consumer 테스트
- [ ] 권한 체크 테스트 (캐시 기반)
- [ ] 멱등성 테스트 (중복 메시지)
- [ ] 환불 시나리오 테스트

### 배포 후
- [ ] Kafka Consumer Lag 모니터링
- [ ] Ownership 불일치 Alert 설정
- [ ] Daily Reconciliation Job 실행
- [ ] Admin API 검증
- [ ] 감사 로그 확인

---

## 파일 위치 요약

```
Potato World (참조)
├── Progression Service
│  ├── BattlePass.kt (도메인)
│  ├── BattlePassService.kt (비즈니스 로직)
│  ├── WalletEventConsumer.kt (Kafka 수신 + 캐시 동기화) ⭐
│  └── battlepass-master.csv (마스터 데이터)
│
└── Wallet Service
   ├── WalletService.kt (구매 처리)
   ├── OwnershipGrantedEvent.kt (이벤트 정의) ⭐
   └── ProgressionEventConsumer.kt (보상 지급)

Hamster World (적용)
└── Progression Service
   └── SeasonPromotion (BattlePass와 유사한 구조)
```

---

## 최종 요약

**BattlePass & Ownership 패턴은:**
1. **복잡성**: 사이클/스텝/트랙 3개 차원의 진행도 + 3개 트랙 보상
2. **신뢰성**: Wallet이 진실의 원천, Progression은 캐시 (최종 일관성)
3. **유연성**: 여러 구매 옵션 지원 (기본/추가/프리미엄)
4. **확장성**: Hamster World에 적용 가능한 패턴 제공

**핵심 메커니즘:**
- Wallet → OwnershipGrantedEvent → Kafka → Progression (비동기)
- maxUnlockedCycle = balance (Ownership을 캐시)
- 권한 체크 = 캐시 사용 (고성능)
- 불일치 → Reconciliation Job (자동 복구)

**운영 난이도: 중상**
- Kafka 동기화 관리 필요
- Daily reconciliation job 필수
- Ownership 불일치 모니터링 필요
