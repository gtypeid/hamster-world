import { ServiceDocLayout, DocBlock, DocParagraph, DocCard, DocCode, DocCallout } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';
import { ServiceFlowSection } from './ServiceFlowSection';
import type { ServiceFlowData } from './ServiceFlowSection';
import { BoundedContextSection } from './BoundedContextSection';
import type { BoundedContextData } from './BoundedContextSection';

const progressionFlow: ServiceFlowData = {
  publishTopic: 'progression-events',
  publishes: [
    { name: 'ArchiveClaimedEvent', desc: '아카이브 보상 클레임 (포인트/쿠폰 지급 요청)' },
    { name: 'QuotaClaimedEvent', desc: '쿼타 보상 클레임 (한도 달성 시 보상 지급 요청)' },
    { name: 'SeasonPromotionRewardClaimedEvent', desc: '시즌 프로모션 보상 클레임 (기본/VIP 별도 발행)' },
  ],
  consumes: [
    {
      topic: 'ecommerce-events',
      events: [
        { name: 'OrderCreatedEvent', action: '아카이브·쿼타·시즌 프로모션 진행도 업데이트' },
      ],
    },
  ],
};

const progressionContext: BoundedContextData = {
  contexts: [
    {
      name: 'Archive',
      service: 'progression',
      detail: '일회성 업적. 조건 달성 시 보상을 클레임할 수 있으며, 마스터 데이터(CSV)와 유저 진행 상태(DB)를 분리하여 코드 변경 없이 업적을 추가한다.',
      externals: [
        { service: 'ecommerce', desc: 'OrderCreatedEvent를 발행하여 아카이브 진행도 업데이트를 트리거하는 쪽' },
        { service: 'payment', desc: '클레임 이벤트에 반응하여 소비. 포인트/쿠폰을 지급한다' },
      ],
      children: [
        {
          name: 'UserArchiveProgress',
          service: 'progression',
          detail: '유저별 업적 진행 상태. 진행도, 완료 여부, 보상 클레임 여부를 추적한다.',
        },
      ],
    },
    {
      name: 'Quota',
      service: 'progression',
      detail: '반복 가능한 할당량. 일간·주간·월간 주기로 리셋되며, 한도 달성 시 보상 지급 또는 행동 제한을 수행한다.',
      externals: [
        { service: 'payment', desc: '보상 지급 처리자. 클레임 이벤트를 받아 포인트/쿠폰을 지급하는 쪽' },
        { service: 'ecommerce', desc: '주문 이벤트 발행자. 주문 생성 이벤트로 쿼타 소비량이 증가한다' },
      ],
    },
    {
      name: 'SeasonPromotion',
      service: 'progression',
      detail: '기간 한정 캠페인. 다단계 진행 구조이며, 기본 보상과 VIP 보너스를 별도로 발행한다.',
      externals: [
        { service: 'ecommerce', desc: 'OrderCreatedEvent를 발행하여 시즌 프로모션 진행도 업데이트를 트리거하는 쪽' },
        { service: 'payment', desc: '보상 이벤트에 반응하여 소비. VIP 상태의 진실의 원천', isSourceOfTruth: true },
      ],
    },
  ],
};

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    children: [
      { key: 'svc-intent', label: '서비스 의도' },
      { key: 'svc-desc', label: '서비스 설명' },
      { key: 'svc-design', label: '핵심 설계 및 코드' },
      { key: 'svc-aside', label: '여담' },
    ],
    content: (
      <div className="space-y-8">
        {/* 서비스 의도 */}
        <DocBlock id="svc-intent" title="서비스 의도">
          <DocParagraph>
            이커머스에 게이미피케이션을 도입하면 사용자 참여를 유도할 수 있습니다.
            그러나 게임 규칙은 자주 변경됩니다.
            새로운 업적을 추가하거나, 프로모션 보상을 조정하거나, 쿼타 주기를 바꾸는 일이 반복됩니다.
          </DocParagraph>
          <DocParagraph>
            이 문제를 해결하기 위해 게임 규칙(마스터 데이터)과 유저 진행 상태를 분리했습니다.
            마스터 데이터는 CSV 파일로 관리하며, 앱 시작 시 메모리에 로딩합니다.
            새 업적이나 프로모션을 추가할 때 코드를 변경할 필요 없이 CSV만 수정하면 됩니다.
          </DocParagraph>
          <DocParagraph>
            또한 아카이브, 쿼타, 시즌 프로모션 세 가지 도메인이 조건 매칭 로직을 공유합니다.
            MissionCondition이라는 공통 값 객체가 이벤트 타입 + 필터 조건을 캡슐화하여,
            동일한 매칭 로직을 세 곳에서 중복 없이 사용합니다.
          </DocParagraph>
          <DocCallout>
            보상 지급은 이 서비스가 직접 수행하지 않습니다.
            Progression은 "조건 달성"과 "보상 클레임"만 처리하고,
            실제 포인트 지급이나 쿠폰 발급은 Kafka 이벤트를 통해 Payment Service에 위임합니다.
            이 분리 덕분에 보상 타입이 늘어나도 Progression 코드를 수정할 필요가 없습니다.
          </DocCallout>
        </DocBlock>

        {/* 서비스 설명 */}
        <DocBlock id="svc-desc" title="서비스 설명">
          <DocParagraph>
            Progression Service는 Kafka ecommerce-events 토픽을 구독하고,
            progression-events 토픽으로 보상 클레임 이벤트를 발행합니다.
            REST API는 조회와 클레임 엔드포인트만 노출하며, 진행도 업데이트는 이벤트 드리븐으로 수행됩니다.
          </DocParagraph>
          <DocCard title="3가지 게이미피케이션 도메인">
            <DocCode>{`Archive (일회성 업적)
  "첫 구매 완료" — 1회 달성 → 100 포인트
  "10만원 이상 주문" — 금액 조건 필터 → 200 포인트
  "단골 고객" — 10회 주문 → 500 포인트
  → 진행도 추적, 완료 후 클레임 1회만 가능

Quota (반복 할당량)
  "일일 주문" — 매일 1회 → 50 포인트 (DAILY 리셋)
  "주간 쇼핑왕" — 주 5회 → 300 포인트 (WEEKLY 리셋)
  → ACTION_REWARD: 한도 달성 시 보상
  → ACTION_CONSTRAINT: 한도 달성 시 행동 제한 (보상 없음)

SeasonPromotion (기간 한정 캠페인)
  "봄맞이 프로모션" — 20단계 진행 (CREATE_ORDER마다 +1)
  → 기본 보상: 5단계 100pt, 10단계 200pt, ...
  → VIP 보너스: 5단계 +50pt, 10단계 +100pt, ...
  → 기간 외 클레임 불가 (isActive 검증)`}</DocCode>
          </DocCard>
          <DocCard title="마스터 데이터 — CSV 기반 인메모리 로딩">
            <DocParagraph>
              3종 CSV 파일이 앱 시작 시 @PostConstruct로 메모리에 로딩됩니다.
              로딩 실패 시 앱 기동이 중단됩니다(Fail-fast).
              시즌 프로모션은 2개 CSV(프로모션 기본 정보 + 단계별 보상)를 조합하여 구성합니다.
            </DocParagraph>
            <DocCode>{`master/archives.csv           → Map<archiveId, ArchiveMaster>
master/quotas.csv             → Map<quotaId, QuotaMaster>
master/season_promotions.csv  → ┐
master/season_promotion_rewards.csv → ┘ Map<promotionId, SeasonPromotionMaster>

CSV 레코드 예시 (archives.csv):
  archive_id | name       | progress_type | condition_type | requirement | reward_type | reward_amount
  1          | 첫 구매 완료  | EVENT_BASED   | CREATE_ORDER   | 1           | POINT       | 100
  2          | 고액 주문    | EVENT_BASED   | CREATE_ORDER   | 1           | POINT       | 200
             |            |               | (filter: minAmount=100000)    |             |`}</DocCode>
          </DocCard>
          <DocCard title="MissionCondition — 공유 조건 매칭 값 객체">
            <DocParagraph>
              Archive, Quota, SeasonPromotion이 공유하는 조건 매칭 모델입니다.
              이벤트 타입 매칭과 JSON 기반 필터 검증을 하나의 값 객체에서 처리합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`@Embeddable
data class MissionCondition(
    val type: MissionType,          // CREATE_ORDER, CREATE_PRODUCT, ...
    val requirement: Int = 1,       // 달성 기준 횟수
    val filtersJson: String? = null // {"minAmount": "100000"} (선택)
) {
    fun matchesEvent(eventType: String, eventFilters: Map<String, String>): Boolean {
        // 1. 이벤트 타입 매칭
        if (eventType != type.toEventType()) return false
        // 2. 필터 조건 매칭 (모든 조건이 일치해야 함)
        val conditionFilters = getFilters()
        return conditionFilters.all { (key, value) ->
            eventFilters[key] == value
        }
    }
}`}</DocCode>
          </DocCard>
        </DocBlock>

        {/* 핵심 설계 및 코드 */}
        <DocBlock id="svc-design" title="핵심 설계 및 코드">
          <DocCard title="이벤트 수신 → 진행도 업데이트 흐름">
            <DocParagraph>
              OrderCreatedEvent를 수신하면 3가지 도메인을 순차적으로 처리합니다.
              각 마스터 데이터를 순회하며 이벤트와 매칭되는 항목을 찾고,
              매칭되면 해당 유저의 진행도를 업데이트합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// EcommerceEventConsumer
private fun handleOrderCreated(parsedEvent: ParsedEvent) {
    val event = objectMapper.convertValue<OrderCreatedEventDto>(parsedEvent.payload)
    val eventFilters = mapOf("minAmount" to event.totalPrice.toLong().toString())

    // 1. Archive 처리: 모든 EVENT_BASED 아카이브 순회
    archiveMasterLoader.getEventBasedArchives().forEach { master ->
        if (!master.matchesEvent(parsedEvent.eventType, eventFilters)) return@forEach
        if (!master.condition?.matchesAmount(eventFilters["minAmount"]?.toLongOrNull() ?: 0)!!)
            return@forEach
        archiveService.updateArchiveProgress(event.userPublicId, master.archiveId, master)
    }

    // 2. Quota 처리: 모든 쿼타 순회
    quotaMasterLoader.getAllQuotaMasters().forEach { master ->
        if (!master.matchesEvent(parsedEvent.eventType, eventFilters)) return@forEach
        quotaService.consumeQuota(event.userPublicId, master)
    }

    // 3. SeasonPromotion 처리 (동일 패턴)
}`}</DocCode>
          </DocCard>

          <DocCard title="Lazy Reset 전략 — 스케줄러 없는 주기 리셋">
            <DocParagraph>
              쿼타의 주기 리셋(일간/주간/월간)에 별도 스케줄러를 사용하지 않습니다.
              쿼타에 접근할 때 needsReset()을 검사하여 주기가 경과했으면 즉시 리셋합니다.
              이 지연 리셋 전략 덕분에 외부 의존성 없이 자체적으로 주기를 관리합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// QuotaService — Lazy Reset 적용
private fun getOrCreateQuota(userPublicId: String, quotaMaster: QuotaMaster): Quota {
    val existing = quotaRepository.findByUserPublicIdAndQuotaKey(userPublicId, quotaMaster.quotaKey)
    if (existing != null) {
        if (existing.needsReset(LocalDateTime.now())) {
            existing.reset()                    // consumed=0, claimed=false
            return quotaRepository.save(existing)
        }
        return existing
    }
    return quotaRepository.save(Quota.create(userPublicId, quotaMaster))
}

// Quota 엔티티 — 주기 경과 판단
fun needsReset(now: LocalDateTime): Boolean {
    return when (cycleType) {
        DAILY   -> now.toLocalDate().isAfter(lastResetAt.toLocalDate())
        WEEKLY  -> {
            val currentWeek = now.toLocalDate().toEpochDay() / 7
            val lastWeek = lastResetAt.toLocalDate().toEpochDay() / 7
            currentWeek > lastWeek
        }
        MONTHLY -> now.month != lastResetAt.month || now.year != lastResetAt.year
        NEVER   -> false
    }
}`}</DocCode>
            <DocCallout>
              백그라운드 스케줄러로 전체 쿼타를 리셋하면 데이터가 많아질수록 부담이 커집니다.
              Lazy Reset은 실제로 접근하는 쿼타만 리셋하므로,
              사용하지 않는 유저의 쿼타는 리셋 비용이 발생하지 않습니다.
              멱등성도 자연스럽게 보장됩니다.
            </DocCallout>
          </DocCard>

          <DocCard title="시즌 프로모션 — 듀얼 트랙 보상">
            <DocParagraph>
              시즌 프로모션은 단계별 보상을 기본과 VIP 두 트랙으로 분리합니다.
              클레임 시 기본 보상은 항상 발행하고, VIP 보너스는 isVip가 true일 때만 추가 발행합니다.
              VIP 상태는 Payment Service가 소유하며, 이 서비스는 캐시만 보관합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// SeasonPromotion 엔티티 — 듀얼 트랙 클레임
fun claimReward(step: Int, master: SeasonPromotionMaster) {
    if (!canClaimStep(step))
        throw IllegalStateException("Cannot claim step $step")

    claimedSteps.add(step)

    // 기본 보상 (모든 유저)
    master.getBasicReward(step)?.let { reward ->
        registerEvent(SeasonPromotionRewardClaimedEvent(
            step = step, rewardType = reward.rewardType.name,
            rewardAmount = reward.rewardAmount, isVipBonus = false
        ))
    }

    // VIP 보너스 (VIP 유저만)
    if (isVip) {
        master.getVipBonus(step)?.let { reward ->
            registerEvent(SeasonPromotionRewardClaimedEvent(
                step = step, rewardType = reward.rewardType.name,
                rewardAmount = reward.rewardAmount, isVipBonus = true
            ))
        }
    }
}`}</DocCode>
          </DocCard>

          <DocCard title="Rich Domain Model — 엔티티에 비즈니스 로직">
            <DocParagraph>
              비즈니스 로직은 엔티티 내부에 위치합니다.
              Service는 오케스트레이션만 담당하고, 도메인 규칙(진행도 갱신, 완료 판단, 클레임 검증)은 엔티티가 소유합니다.
              Factory Method로 유효한 초기 상태를 보장합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// UserArchiveProgress — 진행도 업데이트
fun updateProgress(amount: Int, requirement: Int): Boolean {
    if (isCompleted) return true
    currentProgress = minOf(currentProgress + amount, requirement)
    if (currentProgress >= requirement) {
        markAsCompleted()
        return true
    }
    registerEvent(InternalArchiveProgressUpdatedEvent(...))
    return false
}

// 클레임 검증 + 이벤트 발행
fun claim(archiveMaster: ArchiveMaster): Boolean {
    if (!canClaim()) return false  // isCompleted && !isClaimed
    isClaimed = true
    claimedAt = LocalDateTime.now()
    registerEvent(ArchiveClaimedEvent(
        rewardType = archiveMaster.rewardType.name,
        rewardAmount = archiveMaster.rewardAmount
    ))
    return true
}

// Quota 소비 로직
fun consume(amount: Int = 1): Boolean {
    if (consumed >= maxLimit) return false
    consumed = minOf(consumed + amount, maxLimit)
    registerEvent(InternalQuotaConsumedEvent(...))
    return true
}`}</DocCode>
          </DocCard>
        </DocBlock>

        {/* 여담 */}
        <DocBlock id="svc-aside" title="여담">
          <DocParagraph>
            Progression Service는 Kafka 토픽 1개만 구독하고 1개만 발행하는 가장 단순한 토폴로지를 가졌지만,
            내부적으로는 3가지 도메인(Archive, Quota, SeasonPromotion)을 관리합니다.
            하나의 OrderCreatedEvent가 도착하면 3가지 도메인 모두에서 매칭을 시도하므로,
            실질적인 처리 범위는 이벤트 수보다 훨씬 넓습니다.
          </DocParagraph>
        </DocBlock>
      </div>
    ),
  },
  {
    key: 'flow',
    label: '카프카 토폴로지',
    content: <ServiceFlowSection data={progressionFlow} />,
    doc: true,
  },
  {
    key: 'context',
    label: '바운디드 컨텍스트',
    content: <BoundedContextSection data={progressionContext} />,
    doc: true,
  },
];

export function ProgressionTab() {
  return (
    <ServiceDocLayout
      title="프로그레션"
      sections={sections}
    />
  );
}
