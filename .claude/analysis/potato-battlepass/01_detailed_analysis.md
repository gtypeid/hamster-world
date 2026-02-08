# Potato World BattlePass & Ownership 패턴 상세 분석

## 1. BattlePass 도메인 모델 구조

### 1.1 핵심 엔티티: BattlePass 클래스

```
BattlePass
├── userId: String (유저 식별자)
├── battlePassId: String (시즌 식별자, e.g., "season_1")
├── currentCycle: Int (현재 사이클, 0~maxCycle)
├── currentStep: Int (현재 스텝, 1~maxStep, 자동 진행)
├── maxStep: Int (최대 스텝, 50)
├── maxCycle: Int (최대 사이클, 10)
│
├── maxUnlockedCycle: Int ⭐ [핵심 캐시]
│   ├── 진실의 원천: Wallet Service
│   ├── 용도: 사이클 진입 권한 체크
│   ├── 값: balance of "battlepass_cycle:season_X"
│   └── 주기: WalletEventConsumer가 OwnershipGrantedEvent 수신 시 업데이트
│
├── 트랙 언락 상태 (3개 독립 트랙)
│   ├── basicTrackUnlocked: Boolean = true (기본, 누구나)
│   ├── enhancedTrackUnlocked: Boolean = false (자원 구매)
│   └── premiumTrackUnlocked: Boolean = false (현금 구매, 추가 필수)
│
├── 보상 클레임 상태
│   ├── claimedRewards: Set<String> (형식: "step_5_BASIC")
│   └── claimedStepRewards: Set<Int> (5, 10, 15, ... 프리미엄 전용)
```

### 1.2 보상 트랙 체계

| 트랙 | 언락 조건 | 보상 종류 | 설명 |
|------|---------|---------|------|
| BASIC | 항상 언락 | 일반 재화 (gold) | 모든 유저 자동 지급 |
| ENHANCED | 자원 구매 | 고급 재화 (crystal) | "battlepass_enhanced:season_X" 구매 |
| PREMIUM | 현금 구매 | 귀중 재화 (gem) + 스텝 보상 | "battlepass_premium:season_X" 구매 + Enhanced 필수 |

### 1.3 스텝 진행 로직

```
자동 진행 (조건 달성 시)
├── 게임 이벤트 감지
├── BattlePassExpSource 조회
├── BattlePass.advanceStep() 호출
│   └── registerEvent(BattlePassStepAdvancedEvent)
└── 저장

진행 불가 조건:
├── currentStep >= maxStep (이미 완료)
└── 조건 미달성
```

### 1.4 사이클 진행 로직

```
다음 사이클 진입
├── currentStep >= maxStep (스텝 완료 필수)
├── currentCycle < maxUnlockedCycle (언락된 사이클 필요) ⭐
├── currentCycle < maxCycle (시즌 최대치 미도달)
└── advanceCycle() 수행:
    ├── currentCycle++
    ├── currentStep = 1 (초기화)
    ├── claimedRewards.clear() (초기화)
    ├── claimedStepRewards.clear() (초기화)
    └── registerEvent(BattlePassCycleAdvancedEvent)
```

---

## 2. Ownership 패턴 분석

### 2.1 Ownership이란?

**정의**: 유저가 특정 기능/상품을 "소유"하거나 "사용 가능한 상태"를 나타내는 추상 개념

**특징**:
- 소유권은 "Wallet 잔액"으로 표현
- 0 = 소유하지 않음, >0 = 소유함
- 이진 상태 (Boolean)가 아닌 **수량 기반**
  - `battlepass_cycle:season_1` = 3 → 사이클 3까지 진입 가능
  - `battlepass_premium:season_1` = 1 → 프리미엄 언락됨

### 2.2 Ownership Currency 구조

```
currencyCode = "ownershipType:ownershipKey"

예시:
├── "battlepass_premium:season_1" (프리미엄 언락)
├── "battlepass_enhanced:season_1" (추가 트랙 언락)
├── "battlepass_cycle:season_1" (사이클 진입 권한)
├── "vip:30day" (VIP 멤버십)
└── "region_delivery:seoul" (특정 지역 배송 프로모션)
```

### 2.3 Wallet Service의 역할 (진실의 원천)

```
Wallet Service
├── 모든 Ownership Currency 저장 (DB)
├── 잔액 계산 (레코드 기반)
├── OwnershipGrantedEvent 발행 (Kafka)
└── 권한 관리의 진정한 주인

설계 이유:
1. 결제 시스템과 직결
2. 사용자의 구매 이력과 1:1 매핑
3. 환불/취소 처리 용이
4. 감사(Audit) 추적 필요
5. 외부 결제 서비스 연동 (IAP, 마이페이 등)
```

### 2.4 Progression Service의 역할 (캐시)

```
Progression Service
├── maxUnlockedCycle: Int (캐시)
├── premiumTrackUnlocked: Boolean (캐시)
├── enhancedTrackUnlocked: Boolean (캐시)
└── 로컬 비즈니스 로직 수행

목적:
1. 빠른 조회 (Wallet 호출 안 함)
2. 사이클 진입 권한 체크
3. 트랙별 보상 필터링
```

---

## 3. 캐시 동기화 메커니즘

### 3.1 흐름도

```
구매 요청
  ↓
[Wallet Service]
├─ 1. 결제 처리 (IAP 검증)
├─ 2. Ownership Currency 지급
│  └─ "battlepass_cycle:season_1" balance 증가 (2→3)
├─ 3. WalletTransaction 레코드 생성
├─ 4. Wallet 잔액 재계산 (writeRecord)
├─ 5. CurrencyEarnedEvent 발행 ✅ (Analytics용)
└─ 6. OwnershipGrantedEvent 발행 ✅ (Progression용)
       ├─ userId: "user-123"
       ├─ ownershipType: "battlepass_cycle"
       ├─ ownershipKey: "season_1"
       ├─ newBalance: 3 (언락된 사이클 레벨)
       └─ (Kafka로 발행)
       
  ↓ Kafka 브로커

[Progression Service - WalletEventConsumer]
├─ OwnershipGrantedEvent 수신
├─ 이벤트 타입별 처리:
│  ├─ handleBattlePassCycleUnlock()
│  ├─ battlePass.maxUnlockedCycle = 3 (캐시 업데이트)
│  └─ battlePassRepository.save()
```

### 3.2 이벤트 처리 상세 로직

```kotlin
// Progression Service - WalletEventConsumer.kt:198-224

private fun handleBattlePassCycleUnlock(event: OwnershipGrantedEvent) {
    val battlePassId = event.ownershipKey  // "season_1"
    
    val battlePass = battlePassRepository.findByUserIdAndBattlePassId(
        event.userId,
        battlePassId
    ) ?: return  // 없으면 무시 (아직 구매 안 함)
    
    // 캐시 업데이트: Wallet의 balance = 언락된 사이클 레벨
    val previousMaxCycle = battlePass.maxUnlockedCycle
    battlePass.maxUnlockedCycle = event.newBalance.toInt()
    
    battlePassRepository.save(battlePass)
    
    logger.info(
        "BattlePass cycle unlocked: previousMax={}, newMax={}",
        previousMaxCycle, battlePass.maxUnlockedCycle
    )
}
```

### 3.3 멱등성 보장

```
문제 상황:
├─ Kafka 재전송 (Consumer 처리 실패 후 복구)
├─ Consumer Group Rebalancing
└─ 중복 메시지 수신

해결 방법:
├─ WalletEventConsumer에는 UNIQUE 제약이 없음 (멱등성 자동)
├─ 이유: 같은 balance를 반복 저장해도 결과 동일
├─ maxUnlockedCycle = 3 저장
│  ├─ 1차 처리: maxUnlockedCycle = 3 ✅
│  ├─ 2차 처리: maxUnlockedCycle = 3 ✅ (같음)
│  └─ 결과: 일관성 유지
```

---

## 4. 불일치 발생 시나리오 & 복구

### 4.1 시나리오 1: Kafka 메시지 유실

```
상황:
1. Wallet: "battlepass_cycle:season_1" balance = 3으로 업데이트 ✅
2. OwnershipGrantedEvent 발행 (Kafka 브로커 장애)
3. Progression: maxUnlockedCycle = 2 (업데이트 안 됨) ❌

결과:
- Wallet이 사이클 3까지 진입 가능
- Progression은 사이클 2까지만 가능
- 사용자가 3사이클 진입 불가

복구:
1. Wallet의 소유권이 진실의 원천
2. 정기적으로 Wallet 조회 → Progression 캐시 동기화
3. Admin API: "재동기화" 기능
```

### 4.2 시나리오 2: 환불 처리

```
상황:
1. 구매: "battlepass_premium:season_1" balance 1 증가
2. Progression: premiumTrackUnlocked = true ✅
3. 환불 처리: balance 다시 0으로
4. Wallet: OwnershipGrantedEvent 발행 (balance=0, 언락 해제)
5. Progression: premiumTrackUnlocked = false로 복구 ✅

복구 로직:
```kotlin
// WalletEventConsumer.kt:130-157

private fun handleBattlePassPremiumUnlock(event: OwnershipGrantedEvent) {
    val battlePass = battlePassRepository.findByUserIdAndBattlePassId(...) ?: return
    
    // balance > 0 = 언락, balance = 0 = 언락 해제
    battlePass.premiumTrackUnlocked = (event.newBalance > 0)
    battlePassRepository.save(battlePass)
}
```

### 4.3 시나리오 3: 구매 전 캐시 조회

```
상황:
1. 사용자: "사이클 진입하고 싶음"
2. Client: POST /battlepass/advance-cycle (요청)
3. Progression: 권한 체크
   └─ currentCycle < maxUnlockedCycle?
   
문제: maxUnlockedCycle이 아직 업데이트 안 됨!

해결:
1. 최적화: Wallet 직접 조회 (캐시 사용 X)
2. 또는 보상 Transactional Outbox로 신뢰도 높임

현재 코드의 가정:
├─ 구매 완료 후 충분한 시간 경과
├─ Kafka 메시지 수신 보장 (at-least-once)
└─ 일반적으로 수 초 내 동기화 (SLA)
```

---

## 5. 구매 → 소유권 부여 → 사용 가능 흐름

### 5.1 end-to-end 흐름

```
[1] 사용자 구매 시작
    Client: POST /purchase/battlepass-cycle?battlePassId=season_1&cycle=3

[2] Wallet Service 처리
    POST /wallet/purchase
    ├─ 결제 게이트웨이 검증 (IAP)
    ├─ WalletTransaction 생성
    │  └─ "battlepass_cycle:season_1" +1
    ├─ Wallet 잔액 업데이트: 2 → 3
    ├─ CurrencyEarnedEvent 발행 (Analytics)
    └─ OwnershipGrantedEvent 발행
       {
         userId: "user-123",
         ownershipType: "battlepass_cycle",
         ownershipKey: "season_1",
         newBalance: 3,
         aggregateId: "wallet-user-123-battlepass_cycle:season_1"
       }

[3] Kafka 전달
    Topic: wallet-events
    ├─ Partition: 선택됨 (userId hash)
    └─ Offset: 자동 증가

[4] Progression Service 수신 (WalletEventConsumer)
    ├─ Offset 커밋 전 처리 (at-least-once)
    ├─ maxUnlockedCycle 업데이트: 2 → 3
    ├─ BattlePassRepository.save()
    └─ Offset 커밋 ✅

[5] 사용자 사이클 진입 요청
    POST /progression/battlepass/advance-cycle?battlePassId=season_1
    
    Progression Service:
    ├─ GET /battlepass/{userId}/{battlePassId}
    ├─ 권한 체크:
    │  └─ currentCycle < maxUnlockedCycle? (1 < 3? ✅)
    ├─ canAdvanceCycle() 호출
    │  ├─ currentStep >= maxStep? ✅
    │  ├─ currentCycle < maxUnlockedCycle? ✅ (2 < 3)
    │  └─ currentCycle < maxCycle? ✅
    ├─ battlePass.advanceCycle()
    │  ├─ currentCycle = 2
    │  ├─ currentStep = 1 (초기화)
    │  ├─ claimedRewards.clear()
    │  └─ registerEvent(BattlePassCycleAdvancedEvent)
    └─ RESPONSE 200 OK

[6] 성공!
    Client: 사이클 2 진입 완료 → UI 업데이트
```

### 5.2 타이밍 이슈 처리

```
시나리오: 구매 직후 즉시 사이클 진입 시도

타임라인:
T0: 구매 요청 완료 (Wallet 저장 ✅)
T1: OwnershipGrantedEvent 발행 (Kafka 전송)
T2: 사용자가 즉시 사이클 진입 시도
     └─ Progression: maxUnlockedCycle 아직 업데이트 안 됨 ❌
     └─ 권한 체크 실패: "사이클 3 사용 불가"
T3: WalletEventConsumer 처리 (maxUnlockedCycle 업데이트)
T4: 재시도 성공 ✅

완화 방법:
1. 구매 응답에 구매 결과 포함 (Wallet balance 직접 반환)
2. Client 캐시 업데이트 (로컬)
3. 사용자에게 안내: "구매 적용까지 잠깐 기다려주세요"
4. 자동 재시도 (Client에서 3초 후 재시도)
```

---

## 6. 트랙별 보상 클레임 로직

### 6.1 BASIC 트랙 (누구나)

```
조건:
├─ currentStep >= targetStep (도달해야 함)
├─ basicTrackUnlocked == true (항상 true)
├─ "step_X_BASIC" not in claimedRewards (중복 방지)

클레임:
├─ claimedRewards.add("step_5_BASIC")
├─ registerEvent(BattlePassRewardClaimedEvent)
└─ Wallet Service → 보상 지급
```

### 6.2 ENHANCED 트랙 (구매)

```
조건:
├─ currentStep >= targetStep
├─ enhancedTrackUnlocked == true
│  └─ WalletEventConsumer가 handleBattlePassEnhancedUnlock() 수행
├─ "step_X_ENHANCED" not in claimedRewards

클레임:
├─ claimedRewards.add("step_5_ENHANCED")
├─ registerEvent(BattlePassRewardClaimedEvent)
└─ Wallet Service → 보상 지급 (더 좋은 재화)
```

### 6.3 PREMIUM 트랙 (현금)

```
조건:
├─ currentStep >= targetStep
├─ premiumTrackUnlocked == true (필요)
├─ enhancedTrackUnlocked == true (필수!)
│  └─ "ENHANCED track must be unlocked before PREMIUM"
├─ "step_X_PREMIUM" not in claimedRewards

추가 보상 (스텝 보상):
├─ targetStep이 5의 배수 (5, 10, 15, ...)
├─ step not in claimedStepRewards
└─ 사이클별 다른 아이템 (cycleStepRewards)

예시:
┌─ 사이클 0, step 5:
│  └─ claimStepReward(5)
│     └─ cycleStepRewards[0][5] = "common_chest"
│        ├─ event에 포함
│        └─ Wallet Service에서 아이템 생성

└─ 사이클 1, step 5:
   └─ claimStepReward(5)
      └─ cycleStepRewards[1][5] = "advanced_common_chest"
         └─ 다른 아이템!
```

---

## 7. Hamster World 적용 방안

### 7.1 매핑 관계

| Potato | Hamster | 용도 |
|--------|---------|------|
| BattlePass | SeasonPromotion | 시즌별 프로모션 |
| Cycle | Layer/Phase | 프로모션 단계 |
| Step | MissionProgress | 미션 진행 |
| Track | Tier/Level | 사용자 등급별 |
| Ownership | PromotionAccess | 프로모션 접근 권한 |
| Wallet Currency | Zone/RegionAccess | 지역별 접근 |

### 7.2 시나리오: "특정 지역 배송 완료 시 추가 리워드" 프로모션

```
SeasonPromotion: "Seoul_Spring_2024"
├─ 기본 (무조건 참여)
│  └─ 모든 라이더: 배송 10회 완료 시 1000 포인트
│
├─ 확장 (지역 구매)
│  └─ Seoul 라이더만: 배송 15회 완료 시 추가 500 포인트
│     (구매: "region_delivery:seoul" ownership)
│
└─ 프리미엄 (결제)
   └─ Seoul VIP 라이더: 배송 20회 완료 시 추가 특수 보상
      ├─ 구매: "region_premium:seoul" ownership
      ├─ 필수: region_delivery:seoul 먼저 구매

구현 구조:
┌─ Wallet Service
│  └─ Ownership 관리
│     ├─ "region_delivery:seoul" balance = 1 (구매됨)
│     └─ "region_premium:seoul" balance = 1 (구매됨)
│
└─ Progression Service
   └─ SeasonPromotion
      ├─ maxUnlockedTier (캐시)
      ├─ baseReward: 1000 points (step 10)
      ├─ extendedReward: 500 points (step 15, if region_delivery)
      └─ premiumReward: special_reward (step 20, if region_premium)
```

### 7.3 캐시 동기화 적용

```kotlin
// Progression Service - WalletEventConsumer

private fun handleRegionDeliveryUnlock(event: OwnershipGrantedEvent) {
    val regionKey = event.ownershipKey  // "seoul"
    
    val promotion = seasonPromotionRepository.findByUserIdAndRegion(
        event.userId,
        regionKey
    ) ?: return
    
    // 캐시 업데이트
    promotion.isExtendedUnlocked = (event.newBalance > 0)
    promotionRepository.save(promotion)
    
    logger.info(
        "Region delivery unlocked: region={}, unlocked={}",
        regionKey, promotion.isExtendedUnlocked
    )
}
```

---

## 8. 설계 의도 분석

### 8.1 왜 Wallet Service에 Ownership을 둬야 하나?

```
이유 1: 결제 시스템의 핵심
├─ 구매 = Wallet balance 증가
├─ 환불 = Wallet balance 감소
└─ 모든 거래 기록이 Wallet에 있음

이유 2: 진실의 원천 (Single Source of Truth)
├─ Progression이 캐시를 잃어도 Wallet에서 복구 가능
├─ Wallet이 손상되면 전체 시스템 장애
└─ 따라서 Wallet이 더 중요 → 다중화, 백업 필요

이유 3: 외부 연동
├─ Apple IAP, Google Play와 직결
├─ 환불 정책 준수 필요
├─ Audit trail 필수

이유 4: 권한 관리 집중화
├─ 여러 서비스가 소유권 확인 가능
├─ Wallet API만 호출하면 됨
└─ Progression은 "신뢰만 함" (캐시)
```

### 8.2 왜 Progression이 캐시만 둬야 하나?

```
이유 1: 성능
├─ 매 요청마다 Wallet 조회 X (RPC 비용)
├─ 로컬 캐시로 빠른 응답
└─ P95 latency 감소

이유 2: 느슨한 결합 (Loose Coupling)
├─ Wallet 장애 → Progression 영향 X
├─ Progression 장애 → Wallet 영향 X
├─ 각 서비스 독립적 배포 가능

이유 3: 비즈니스 로직 독립성
├─ Progression = "진행도 관리" 전담
├─ Ownership 확인은 "캐시에서만"
├─ 복잡한 BattlePass 로직에 집중
```

### 8.3 불일치 발생 시 복구 전략

```
거의 발생하지 않는 이유:
1. Kafka at-least-once 보장
2. Kafka 보존 기간이 충분함 (7일+)
3. Consumer lag 모니터링

발생했을 때 대처:
1. 단기 (실시간)
   └─ 자동 재시도: Consumer가 처리 실패 시 1시간 후 재시도

2. 중기 (하루)
   └─ Daily Reconciliation Job
      ├─ Wallet → Progression 동기화
      ├─ 불일치 감지 시 Progression 업데이트
      └─ Alert 발생

3. 장기 (CS 요청)
   └─ Admin API: "캐시 동기화" 기능
      ├─ Wallet 조회
      └─ Progression 업데이트
```

---

## 9. 핵심 질문 답변

### Q1. Ownership은 왜 Wallet Service에 있어야 하나?

A. **결제 시스템과 직결되기 때문**
- 구매 = Ownership balance 증가
- 환불 = Ownership balance 감소
- Wallet이 진정한 진실의 원천
- Progression은 성능 최적화를 위한 캐시일 뿐

### Q2. Progression Service는 왜 캐시만 들고 있나?

A. **성능과 독립성**
- 매 요청마다 Wallet 조회하면 느림 (RPC 오버헤드)
- Wallet 장애가 Progression 영향 주지 않음
- BattlePass 비즈니스 로직에 집중 가능
- Kafka로 비동기 동기화 (최종 일관성)

### Q3. 불일치 발생 시 어떻게 복구하나?

A. **다층 방어**
1. 사전 예방: Kafka at-least-once + 충분한 retention
2. 자동 복구: Consumer 실패 시 자동 재시도
3. 정기 동기화: Daily reconciliation job
4. 수동 복구: Admin API로 강제 재동기화

### Q4. 구매 → 소유권 부여 → 사용 가능 흐름이 어떻게 보장되나?

A. **이벤트 기반 파이프라인 + 멱등성**
1. 구매 완료 → WalletTransaction 저장 (DB)
2. OwnershipGrantedEvent 발행 (Kafka)
3. WalletEventConsumer 수신 (Progression)
4. maxUnlockedCycle 캐시 업데이트
5. 멱등성: 같은 이벤트 재전송 → 같은 결과

최악의 경우 (구매 직후 즉시 사용):
- T0: 구매 완료
- T1-3ms: Kafka 지연
- T3ms-100ms: Consumer 처리
- T100ms: 사용자가 사용 가능

일반적으로 수 초 내 동기화 (SLA)

---

## 10. 추가 팁

### 10.1 주의할 점

```
1. Ownership 유실 금지
   └─ Wallet 백업/복제 필수

2. 이중 처리 방지
   └─ externalTransactionId로 멱등성 보장

3. 권한 체크 위치
   ├─ BattlePass.advanceCycle(): 로컬 캐시만 사용
   ├─ 수요 많은 작업은 캐시 활용
   └─ 환불 같은 중요 작업은 Wallet 직접 조회

4. 로그 관리
   └─ Ownership 변화는 반드시 로그 (감사)
```

### 10.2 테스트 전략

```
1. 단위 테스트
   └─ BattlePass.advanceCycle() 권한 체크

2. 통합 테스트
   └─ Wallet 구매 → Progression 캐시 업데이트 → 사용 가능

3. E2E 테스트
   └─ 전체 플로우 (구매부터 사이클 진입까지)

4. 혼돈 테스트
   └─ Kafka 메시지 지연/손실 시뮬레이션
   └─ 캐시 불일치 상황
```

