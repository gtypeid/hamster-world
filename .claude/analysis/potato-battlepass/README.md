# Potato World BattlePass & Ownership 패턴 분석

이 디렉토리는 Potato World 프로젝트의 BattlePass & Ownership 패턴에 대한 상세 분석을 포함합니다.

## 문서 구성

### 1. 최종 요약 (Executive Summary)
- **파일**: `03_executive_summary.md`
- **대상**: 모든 개발자
- **소요시간**: 15분
- **내용**:
  - 핵심 개념 30초 요약
  - 아키텍처 구조
  - 핵심 설계 패턴 3가지
  - Timeline과 불일치 시나리오
  - Hamster World 적용 사례

### 2. 시각적 가이드 (Visual Guide)
- **파일**: `02_visual_guide.md`
- **대상**: 시각적 이해가 필요한 개발자
- **소요시간**: 20분
- **내용**:
  - 아키텍처 다이어그램
  - 상세 흐름 타임라인
  - 상태 전이 다이어그램
  - 권한 체크 흐름
  - 멱등성 보장 메커니즘

### 3. 상세 분석 (Detailed Analysis)
- **파일**: `01_detailed_analysis.md`
- **대상**: 깊은 이해가 필요한 개발자/아키텍처
- **소요시간**: 1시간
- **내용**:
  - BattlePass 도메인 모델 구조
  - Ownership 패턴 상세 분석
  - 캐시 동기화 메커니즘
  - 불일치 발생 시나리오 & 복구
  - 구매→소유권→사용 흐름
  - 트랙별 보상 클레임 로직
  - Hamster World 적용 방안

## 빠른 시작

### 처음 접하는 사람
```
시간 제약 있음 (30분):
1. 03_executive_summary.md 읽기
2. 02_visual_guide.md에서 "아키텍처 개요" 섹션만 보기
```

### 구현 준비 (1-2시간)
```
1. 03_executive_summary.md 정독
2. 02_visual_guide.md 전체 보기
3. 01_detailed_analysis.md 섹션 3,4,5,6 읽기
```

### 완전한 이해 (3-4시간)
```
1. 03_executive_summary.md 정독
2. 02_visual_guide.md 전체 보기
3. 01_detailed_analysis.md 전체 정독
4. 코드 직접 분석:
   - Potato: /progression-service/.../BattlePass.kt
   - Potato: /progression-service/.../WalletEventConsumer.kt
   - Potato: /wallet-service/.../WalletService.kt
```

## 핵심 개념 요약

### BattlePass
사용자가 진행하는 시간 단위 콘텐츠
- Step: 1~50 (자동 진행)
- Cycle: 0~10 (유료 구매로만 진행)
- Track: 기본/추가/프리미엄 (구매 여부에 따라 언락)

### Ownership
유저가 소유한 상태를 나타내는 추상 개념
- Wallet에 저장 (balance = 소유 수량)
- Progression에 캐시 (maxUnlockedCycle 등)
- Kafka로 비동기 동기화

### 핵심 패턴
```
Wallet (진실의 원천)
  ↓ OwnershipGrantedEvent
Kafka Broker
  ↓
Progression (캐시)
  ↓ canAdvanceCycle() 체크
사용자 사이클 진입 가능
```

## 구현 체크리스트

### Wallet Service
- [ ] OwnershipGrantedEvent 발행
- [ ] currencyCode = "ownershipType:ownershipKey" 파싱
- [ ] isOwnershipCurrency() 체크
- [ ] newBalance를 이벤트에 포함

### Progression Service
- [ ] WalletEventConsumer 구현
- [ ] maxUnlockedCycle 캐시 필드
- [ ] advanceCycle() 권한 체크
- [ ] 트랙별 보상 클레임

### 운영
- [ ] Kafka Consumer Lag 모니터링
- [ ] Daily Reconciliation Job
- [ ] Admin API: /admin/cache/sync
- [ ] 감사 로그 (Audit Log)

## 자주 묻는 질문

### Q1. Ownership을 왜 Wallet에?
결제 시스템과 직결되기 때문. 구매, 환불, 거래 기록이 모두 Wallet에 있음.

### Q2. Progression이 캐시만 들고 있는 이유?
성능 최적화 (RPC 비용 감소) 및 느슨한 결합 (장애 격리).

### Q3. 불일치 시 대처?
다층 방어: 사전예방 → 자동복구 → 정기동기화 → 수동복구

### Q4. 구매 직후 즉시 사용 가능?
일반적으로 수 초 내 동기화. 최악 ~120ms (Kafka 지연 포함).

## 참고 자료

### 원본 코드 위치
```
Potato World (참조)
├── /progression-service/src/main/kotlin/
│  ├── BattlePass.kt
│  ├── BattlePassService.kt
│  ├── BattlePassMaster.kt
│  ├── WalletEventConsumer.kt
│  └── ...
│
└── /wallet-service/src/main/kotlin/
   ├── WalletService.kt
   ├── OwnershipGrantedEvent.kt
   ├── ProgressionEventConsumer.kt
   └── ...

Hamster World (적용)
└── /progression-service/src/main/kotlin/
   └── SeasonPromotion (BattlePass와 유사한 구조)
```

### 관련 마크다운
- `/아키텍처_설계_고민_정리.md`
- `/CROSS_VALIDATION_STRATEGY.md`
- `/README.md`

## 피드백 및 개선

이 분석이 명확하지 않거나 추가 정보가 필요하면:
1. GitHub Issue 생성
2. PR로 개선 사항 제안
3. Slack에서 질문

---

**마지막 업데이트**: 2026-02-08
**분석 대상**: Potato World BattlePass & Ownership 패턴
**응용 대상**: Hamster World SeasonPromotion
