# Ownership & Cache Synchronization - 시각적 가이드

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  CLIENT (Mobile App)                                            │
│  ├─ 구매 버튼 클릭                                              │
│  ├─ 사이클 진입 요청                                            │
│  └─ 보상 클레임                                                 │
│                                                                 │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │  API Gateway / Auth   │
         │  (userId 검증)        │
         └───────────┬───────────┘
                     │
         ┌───────────┴─────────────────┐
         │                             │
         ↓                             ↓
   ┌──────────────┐           ┌──────────────────┐
   │Wallet Service│           │Progression Service
   │              │           │                  │
   │ (진실의      │           │  (캐시)          │
   │  원천)       │           │                  │
   │              │────────→  │ maxUnlockedCycle │
   │ Ownership    │ Kafka     │ (Currency 기반)  │
   │ Currency     │ Event     │                  │
   │ Balance      │           │ BattlePass Logic │
   │              │           │                  │
   │ WalletTx     │           │ Reward Claim     │
   │ Record       │           │ Step Progress    │
   └──────────────┘           └──────────────────┘
        │                            │
        └─────────────┬──────────────┘
                      │
                      ↓
            ┌──────────────────┐
            │   Kafka Broker   │
            │  (Topic: wallet- │
            │   events)        │
            └──────────────────┘
```

---

## 상세 흐름: 구매부터 사이클 진입까지

### 시간 흐름 (Timeline)

```
Timeline:

T=0ms ────────────────────────────────────────────────────────────
      Client: 사이클 3 구매 요청
      └─→ POST /purchase/battlepass-cycle?battlePassId=season_1&cycle=3

T=10ms ───────────────────────────────────────────────────────────
      Wallet Service: 결제 검증
      ├─ IAP 검증 ✅
      ├─ WalletTransaction 생성
      │  └─ "battlepass_cycle:season_1" amount=+1
      │     (2 → 3 증가)
      └─ DB 저장 완료

T=20ms ───────────────────────────────────────────────────────────
      Wallet Service: 이벤트 발행
      ├─ CurrencyEarnedEvent (Analytics)
      └─ OwnershipGrantedEvent (Progression)
         {
           userId: "user-123",
           ownershipType: "battlepass_cycle",
           ownershipKey: "season_1",
           newBalance: 3,
           amount: 1
         }

T=30ms ───────────────────────────────────────────────────────────
      Kafka Broker: 메시지 저장
      └─ wallet-events topic에 추가 ✅

T=50ms ───────────────────────────────────────────────────────────
      Progression Service: 이벤트 수신
      └─ WalletEventConsumer.handleBattlePassCycleUnlock()
         ├─ BattlePass 조회
         ├─ maxUnlockedCycle = 3 (업데이트)
         └─ save() → DB 커밋

T=60ms ───────────────────────────────────────────────────────────
      Progression Service: Kafka Offset 커밋 ✅

T=100ms ──────────────────────────────────────────────────────────
      Client: 사이클 진입 시도
      └─→ POST /progression/battlepass/advance-cycle?battlePassId=season_1

T=110ms ──────────────────────────────────────────────────────────
      Progression Service: 권한 체크
      ├─ BattlePass 조회 ✅
      ├─ currentStep >= maxStep? (50 >= 50) ✅
      ├─ currentCycle < maxUnlockedCycle? (1 < 3) ✅
      ├─ currentCycle < maxCycle? (1 < 10) ✅
      └─ advanceCycle() 실행
         ├─ currentCycle = 2
         ├─ currentStep = 1
         ├─ claimedRewards.clear()
         └─ 이벤트 발행

T=120ms ──────────────────────────────────────────────────────────
      Progression Service: 결과 반환
      └─→ RESPONSE 200 OK
          {
            battlePassId: "season_1",
            currentCycle: 2,
            currentStep: 1
          }

⏱️ 총 소요시간: ~120ms (네트워크 포함)
  ├─ 대부분은 Kafka 전송 + Consumer 처리 지연
  └─ 일반적으로 수 초 내 동기화
```

---

## 상태 전이 다이어그램

### BattlePass 사이클 상태

```
┌──────────────┐
│ 초기 상태     │
│ cycle=0      │
│ maxUnlocked=0│
└──────┬───────┘
       │
       │ 구매: "battlepass_cycle:season_1" 구매
       │ (balance = 1)
       │
       ↓
┌──────────────┐     ┌──────────────────────┐
│ 사이클 1     │────→│ 스텝 진행 (1~50)     │
│ 준비 상태    │     │ currentStep++       │
│ maxUnlocked=1│     │ (게임 이벤트 기반)  │
└──────┬───────┘     └──────┬───────────────┘
       │                    │
       │ advanceCycle()      │ 스텝 50 도달
       │ 호출 가능          │
       │                    │
       │←───────────────────┘
       │
       │ canAdvanceCycle() ✅
       ├─ currentStep >= 50 ✅
       ├─ currentCycle < maxUnlocked ✅
       └─ currentCycle < maxCycle ✅
       │
       ↓
┌──────────────┐     ┌──────────────────────┐
│ 사이클 2     │────→│ 스텝 진행 (1~50)     │
│ 준비 상태    │     │ currentStep++       │
│ maxUnlocked=1│     │ (게임 이벤트 기반)  │
│              │     └──────┬───────────────┘
│ ⚠️ 진입 불가!│             │
│ (maxUnlocked가         스텝 50 도달
│  아직 1)      │             │
└──────────────┘             │
                             ↓ (구매 후)
       구매: "battlepass_cycle:season_1"
       (balance = 2)
       ↓
    maxUnlocked = 2 업데이트
       ↓
    canAdvanceCycle() ✅
       ↓
┌──────────────┐     ┌──────────────────────┐
│ 사이클 2     │────→│ 스텝 진행 계속       │
│ 진입 가능!   │     │ ...                 │
│ maxUnlocked=2│     └─────────────────────┘
└──────────────┘
```

---

## Ownership 캐시 동기화 상태도

```
[Wallet Service - 진실의 원천]
│
├─ "battlepass_cycle:season_1" balance = 2
├─ "battlepass_premium:season_1" balance = 1
└─ "battlepass_enhanced:season_1" balance = 1

         │
         │ OwnershipGrantedEvent
         │ (Kafka 발행)
         │
         ↓
    [Kafka Topic: wallet-events]
    
         │
         │ WalletEventConsumer 수신
         │
         ↓
[Progression Service - 캐시]

├─ maxUnlockedCycle = 2          ← "battlepass_cycle:season_1" 기반
├─ premiumTrackUnlocked = true   ← "battlepass_premium:season_1" 기반
└─ enhancedTrackUnlocked = true  ← "battlepass_enhanced:season_1" 기반

    Synchronization Status:
    ✅ 동기화됨 (최신)
    
    또는
    
    ⏳ 동기화 중 (Kafka 지연)
    
    또는
    
    ❌ 불일치 (Kafka 유실 등)
       → Reconciliation Job에서 감지
       → Admin API로 수동 재동기화
```

---

## 권한 체크 흐름

```
┌─────────────────────────────────────┐
│ advanceCycle 요청                   │
│ (사용자가 다음 사이클 진입)         │
└────────────┬────────────────────────┘
             │
             ↓
     ┌───────────────────┐
     │ BattlePass 로드   │
     │ (DB에서 조회)    │
     └────────┬──────────┘
              │
              ↓
     ┌─────────────────────┐
     │ 체크 1: 스텝 완료?  │
     │ currentStep >= 50?  │
     └────────┬──────────┘
              │
      ┌───────┴────────┐
      │                │
    ❌│              ✅│
      │                │
      ↓                ↓
   실패            다음 체크
      │
      └─→ RESPONSE 400
          "Cannot advance:
           step not reached"

                      ┌──────────────────────┐
                      │ 체크 2: 언락됨?       │
                      │ currentCycle <       │
                      │ maxUnlockedCycle?    │
                      │                      │
                      │ ⭐ 여기가 캐시!      │
                      │ (Wallet 기반)       │
                      └────────┬─────────────┘
                               │
                       ┌───────┴────────┐
                       │                │
                     ❌│              ✅│
                       │                │
                       ↓                ↓
                    실패            다음 체크
                       │
                       └─→ RESPONSE 400
                           "Cannot advance:
                            cycle not unlocked"

                                      ┌──────────────────┐
                                      │ 체크 3: 최대?     │
                                      │ currentCycle <   │
                                      │ maxCycle?        │
                                      └────────┬─────────┘
                                               │
                                       ┌───────┴────────┐
                                       │                │
                                     ❌│              ✅│
                                       │                │
                                       ↓                ↓
                                    실패            advanceCycle()
                                       │            실행
                                       └─→ RESPONSE│
                                           400      │
                                           "Max     │
                                            cycle"  │
                                                    │
                                                    ↓
                                            ┌──────────────┐
                                            │ 상태 변경    │
                                            │ currentCycle+│
                                            │ currentStep=1│
                                            │ rewards.clr()│
                                            └────────┬─────┘
                                                     │
                                                     ↓
                                            RESPONSE 200 OK
```

---

## 멱등성 보장 메커니즘

```
시나리오: Kafka 메시지 중복 수신

Timeline:

T=50ms: 처음 메시지 수신
├─ OwnershipGrantedEvent 수신
├─ maxUnlockedCycle = 3 저장
└─ Offset 커밋 시도
   ├─ DB 커밋 성공 ✅
   └─ Offset 커밋 실패 ❌ (네트워크 오류)

T=100ms: Consumer 재부팅 (자동 재시도)
├─ 같은 메시지 다시 수신
├─ maxUnlockedCycle = 3 저장 (같은 값!)
│  └─ SQL: UPDATE battle_passes 
│     SET max_unlocked_cycle = 3
│     WHERE user_id = 'user-123' AND battle_pass_id = 'season_1'
│     └─ 결과: 1 row updated (같은 값이므로 no-op)
└─ Offset 커밋 성공 ✅

결과: ✅ 일관성 유지
      (같은 balance → 같은 maxUnlockedCycle)

vs

❌ 만약 externalTransactionId 없이 금액을 더하면:
   ├─ 1차: balance = 3
   ├─ 2차: balance = 4 (❌ 중복!)
   └─ 결과: 불일치 발생
```

---

## 캐시 불일치 시나리오

```
┌──────────────────────────────────────────────────────┐
│ 시나리오: Kafka 메시지 유실                          │
└────────────┬─────────────────────────────────────────┘
             │
             ↓
    ┌────────────────────┐
    │ Wallet Service     │
    │ balance 업데이트   │
    │ "balance": 3 ✅   │
    └────────┬───────────┘
             │
             ├─→ OwnershipGrantedEvent 발행
             │   └─ Kafka 브로커 장애! ❌
             │
             ↓ (사용자는 지갑이 업데이트됨)
    
    ┌──────────────────────┐
    │ Progression Service  │
    │ maxUnlockedCycle = 2 │
    │ (업데이트 안 됨) ❌  │
    └──────────────────────┘

결과:
├─ Wallet: "사이클 3까지 진입 가능"
├─ Progression: "사이클 2까지만 가능"
└─ ⚠️ 사용자 경험 저하 (구매했는데 사용 불가)

    │
    │ 복구 프로세스 시작...
    │
    ↓
    
┌──────────────────────────────────────────┐
│ 1. Daily Reconciliation Job 실행         │
├─ Wallet의 모든 Ownership 조회            │
├─ Progression의 캐시와 비교               │
├─ 불일치 감지: balance=3, maxUnlocked=2 │
├─ maxUnlockedCycle = 3으로 업데이트      │
└─ Alert 발생: "Cache mismatch detected"  │
│
│ 또는
│
├─ Admin이 수동 API 호출
│  POST /admin/cache/sync
│  {
│    userId: "user-123",
│    battlePassId: "season_1"
│  }
│  └─ Wallet 조회 → 캐시 업데이트
│
↓

✅ 불일치 해결
   maxUnlockedCycle = 3 (동기화됨)
   사용자가 다시 사이클 진입 가능
```

---

## 보상 클레임 분기 로직

```
┌────────────────────────────┐
│ claimReward 요청           │
│ (step=10, track=ENHANCED) │
└────────┬───────────────────┘
         │
         ↓
     ┌──────────────────────────┐
     │ 권한 체크 1              │
     │ currentStep >= 10?       │
     │                          │
     │ 도달한 스텝까지만        │
     │ 클레임 가능              │
     └────────┬─────────────────┘
              │
          ┌───┴────┐
          │         │
        ❌│       ✅│
          │         │
          ↓         ↓
       실패      다음 체크
          │
          └─→ RESPONSE│
              {"error":│
               "Step  │
                not   │
               reached"}

                     ┌─────────────────┐
                     │ 권한 체크 2      │
                     │ 트랙 언락?       │
                     │ enhancedTracked │
                     │ Unlocked?       │
                     │                 │
                     │ ⭐ 캐시 기반    │
                     │ WalletEvent에서│
                     │ 업데이트됨      │
                     └────────┬────────┘
                              │
                          ┌───┴────┐
                          │         │
                        ❌│       ✅│
                          │         │
                          ↓         ↓
                       실패     다음 체크
                          │
                          └─→ RESPONSE│
                              {"error":│
                               "Track │
                                not   │
                               unlocked"}

                                   ┌─────────────┐
                                   │ 권한 체크 3  │
                                   │ 중복 클레임? │
                                   │ "step_10_   │
                                   │ ENHANCED"   │
                                   │ in claimed? │
                                   └────────┬────┘
                                            │
                                        ┌───┴────┐
                                        │         │
                                      ❌│       ✅│
                                        │         │
                                        ↓         ↓
                                     실패      클레임
                                        │      실행
                                        └──→│
                                        RESPONSE│
                                        {"error":│
                                         "Already│
                                          claimed"}

                                              ↓
                                        ┌───────────┐
                                        │ 상태 변경  │
                                        │ claimed   │
                                        │ Rewards   │
                                        │ .add()    │
                                        └─────┬─────┘
                                              │
                                              ↓
                                        ┌─────────────┐
                                        │ 이벤트 발행 │
                                        │ Claim      │
                                        │ Event      │
                                        │ (Kafka)    │
                                        └─────┬─────┘
                                              │
                                              ↓
                                        ┌──────────────┐
                                        │ Wallet Svc   │
                                        │ 보상 지급    │
                                        │ +crystal    │
                                        └──────────────┘
```

---

## 다중 트랙 보상 체계

```
시간 진행: Step 1 → 10 → 20 → 30 → 40 → 50

┌─────────────────────────────────────────────────┐
│ 트랙: BASIC (누구나, 항상 언락됨)               │
├─────────────────────────────────────────────────┤
│                                                 │
│ Step 1    Step 10   Step 20   Step 30          │
│  gold     gold       gold      gold             │
│   100      1000       2000      3000            │
│   ✅       ✅        ✅         ✅              │
│ claimable  claimable  claimable  claimable      │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 트랙: ENHANCED (구매 필요)                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ ⭐ unlocked = false 상태                        │
│                                                 │
│ Step 1    Step 10   Step 20   Step 30          │
│ crystal  crystal    crystal   crystal           │
│   10      100       200       300               │
│   ❌      ❌        ❌        ❌                │
│ 클레임 불가 (미언락)                           │
│                                                 │
│ [구매: "battlepass_enhanced:season_1"]         │
│ └─ maxUnlockedCycle 업데이트 후                │
│    unlocked = true ✅                          │
│                                                 │
│ Step 1    Step 10   Step 20   Step 30          │
│ crystal  crystal    crystal   crystal           │
│   10      100       200       300               │
│   ✅      ✅        ✅        ✅                │
│ claimable  claimable  claimable  claimable      │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 트랙: PREMIUM (현금 + Enhanced 필수)            │
├─────────────────────────────────────────────────┤
│                                                 │
│ ⭐ unlocked = false 상태                        │
│ ⚠️ Enhanced가 먼저 언락되어야 함                │
│                                                 │
│ Step 1    Step 5    Step 10   Step 15         │
│ gem +     chest1    gem +      chest2           │
│ chest0    (cycle)   chest1    (cycle)           │
│ 1         special   10        special           │
│ ❌        ❌       ❌        ❌                 │
│                                                 │
│ [구매 1: "battlepass_enhanced:season_1"]      │
│ [구매 2: "battlepass_premium:season_1"]       │
│ └─ unlocked = true ✅                          │
│                                                 │
│ Step 1    Step 5    Step 10   Step 15         │
│ gem +     chest1    gem +      chest2           │
│ chest0    (cycle=0)  chest1    (cycle=0)        │
│ 1         common     10        rare             │
│ ✅        ✅        ✅        ✅                │
│                                                 │
│ [다음 사이클: cycle=1]                         │
│                                                 │
│ Step 5    Step 10   Step 15                   │
│ chest1    chest2    chest3                      │
│ advanced  advanced  advanced                    │
│ ✅        ✅        ✅                          │
│ (사이클별로 다른 아이템)                       │
│                                                 │
└─────────────────────────────────────────────────┘

레이어 구조:
Layer 1   ┌─────────────┐
(누구나)  │   BASIC     │ ← 모두 참여
          └─────────────┘
             ↓
Layer 2   ┌─────────────┐
(자원)    │  ENHANCED   │ ← 구매자만 참여
          └─────────────┘
             ↓
Layer 3   ┌─────────────┐
(현금)    │  PREMIUM    │ ← VIP 구매자만 참여
          └─────────────┘
             ↓
Extra     ┌─────────────┐
(특수)    │ STEP BONUS  │ ← Premium 전용
          │ (사이클별)  │
          └─────────────┘
```

---

## 구현 체크리스트

```
Wallet Service
├─ [✅] OwnershipGrantedEvent 발행
│  └─ currencyCode = "ownershipType:ownershipKey"
├─ [✅] isOwnershipCurrency() 체크
├─ [✅] parseOwnershipCurrency() 파싱
└─ [✅] newBalance를 이벤트에 포함

Progression Service
├─ [✅] WalletEventConsumer 구현
│  ├─ [✅] handleBattlePassCycleUnlock()
│  ├─ [✅] handleBattlePassPremiumUnlock()
│  └─ [✅] handleBattlePassEnhancedUnlock()
├─ [✅] maxUnlockedCycle 캐시 필드
├─ [✅] advanceCycle() 권한 체크
│  └─ currentCycle < maxUnlockedCycle
├─ [✅] BattlePass.canAdvanceCycle() 메서드
└─ [✅] 트랙별 보상 클레임

Monitoring
├─ [ ] Kafka Consumer Lag 모니터링
├─ [ ] Ownership 불일치 Alert
├─ [ ] Daily Reconciliation Job
├─ [ ] Admin API 구현
│  └─ POST /admin/cache/sync
└─ [ ] 감사 로그 (Audit Log)
```

