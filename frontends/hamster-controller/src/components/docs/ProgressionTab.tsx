import { ServiceDocLayout, DocBlock, DocParagraph, DocCard, DocCode, DocCallout } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';
import { ServiceFlowSection } from './ServiceFlowSection';
import type { ServiceFlowData } from './ServiceFlowSection';
import { BoundedContextSection } from './BoundedContextSection';
import type { BoundedContextData } from './BoundedContextSection';
import { DocMiniFlow } from './DocMiniFlow';
import type { MiniFlowNode, MiniFlowEdge } from './DocMiniFlow';

/* ── 공통 스타일 ── */

const paymentStyle  = { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 160 };
const kafkaStyle    = { bg: '#0c4a6e', color: '#7dd3fc', border: '1px solid #0284c7', width: 130 };
const pgrStyle      = { bg: '#4c1d95', color: '#ddd6fe', border: '1px solid #7c3aed', width: 190 };
const dimStyle      = { bg: '#1e293b', color: '#6b7280', border: '1px solid #374151' };
const ecStyle       = { bg: '#1e3a5f', color: '#93c5fd', border: '1px solid #3b82f6', width: 130 };
const consumerStyle = { bg: '#3b0764', color: '#e9d5ff', border: '1px solid #a855f7', width: 175 };
const domainStyle   = { bg: '#4c1d95', color: '#ddd6fe', border: '1px solid #7c3aed', width: 155 };
const vipStyle      = { bg: '#78350f', color: '#fcd34d', border: '1px solid #d97706', width: 155 };
const outboxStyle   = { bg: '#134e4a', color: '#5eead4', border: '1px solid #14b8a6', width: 170 };
const entityStyle   = { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 180 };
const condStyle     = { bg: '#312e81', color: '#c7d2fe', border: '1px solid #6366f1', width: 170 };
const claimStyle    = { bg: '#581c87', color: '#e9d5ff', border: '1px solid #a855f7', width: 155 };
const txBoundary    = { bg: '#0f172a', color: '#475569', border: '1px dashed #334155', width: 120 };

/* ── Flow 1: 소유권(Ownership) 캐싱 — Payment → Kafka → Progression 캐시 → 코레오그래피 ── */

const OWNERSHIP_NODES: MiniFlowNode[] = [
  // Row 0: 구매 행위 → Payment 소유권 확정
  { id: 'user-buy', label: '사용자\n(VIP 구매/획득)', x: 0,   y: 0,   style: dimStyle,     sourcePosition: 'right' },
  { id: 'pay-own',  label: 'Payment Service\n(VIP 원천 소유)',  x: 230, y: 0,   style: paymentStyle, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'kafka-1',  label: 'Kafka',                             x: 480, y: 0,   style: kafkaStyle,   targetPosition: 'left', sourcePosition: 'right' },
  { id: 'pgr-cache', label: 'Progression Service\n(isVip 캐시 갱신)', x: 660, y: 0, style: pgrStyle, targetPosition: 'left', sourcePosition: 'bottom' },
  // Row 1: 캐시된 소유권이 이후 클레임에 영향 — Progression 소유 로직
  { id: 'season',   label: 'Progression\nSeasonPromotion',     x: 660, y: 120, style: vipStyle,     targetPosition: 'top', sourcePosition: 'left' },
  { id: 'claim-br', label: 'Progression\n클레임 보상 분기',     x: 410, y: 120, style: domainStyle,  targetPosition: 'right', sourcePosition: 'bottom' },
  { id: 'basic',    label: 'Progression\n기본 보상',            x: 270, y: 240, style: domainStyle,  targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'vip-bonus', label: 'Progression\nVIP 보너스',         x: 540, y: 240, style: vipStyle,     targetPosition: 'top', sourcePosition: 'bottom' },
  // Row 2: Kafka → Payment 포인트 지급
  { id: 'kafka-2',  label: 'Kafka',                              x: 410, y: 360, style: kafkaStyle,   targetPosition: 'top', sourcePosition: 'right' },
  { id: 'pay-grant', label: 'Payment Service\n(포인트 지급)',    x: 660, y: 360, style: paymentStyle, targetPosition: 'left' },
];

const OWNERSHIP_EDGES: MiniFlowEdge[] = [
  // Row 0: 구매 → 소유권 확정 → Kafka → 캐시
  { source: 'user-buy', target: 'pay-own',   animated: true, label: '구매/획득' },
  { source: 'pay-own',  target: 'kafka-1',   animated: true, color: '#dc2626', label: 'VipActivatedEvent' },
  { source: 'kafka-1',  target: 'pgr-cache', animated: true, color: '#a855f7', label: 'activateVip()' },
  // Row 0 → Row 1: 캐시 → 시즌 프로모션 참조
  { source: 'pgr-cache', target: 'season',   dashed: true,   color: '#d97706', label: '캐시 참조' },
  { source: 'season',    target: 'claim-br', animated: true, color: '#a855f7', label: 'claimReward()' },
  // Row 1: 분기
  { source: 'claim-br',  target: 'basic',     animated: true, color: '#475569', label: '항상' },
  { source: 'claim-br',  target: 'vip-bonus', animated: true, color: '#f59e0b', label: 'isVip=true' },
  // Row 2: Kafka → Payment
  { source: 'basic',     target: 'kafka-2',   animated: true, color: '#475569' },
  { source: 'vip-bonus', target: 'kafka-2',   animated: true, color: '#f59e0b' },
  { source: 'kafka-2',   target: 'pay-grant', animated: true, color: '#dc2626' },
];

/* ── Flow 2: 이벤트 누적 → 조건 매칭 → 클레임 → 아웃박스 → Payment 포인트 증가 ── */

const ACCUMULATION_NODES: MiniFlowNode[] = [
  // Row 0: 외부 이벤트 진입
  { id: 'ec',       label: 'Ecommerce\nService',                       x: 0,   y: 0,   style: ecStyle,       sourcePosition: 'right' },
  { id: 'kafka-in', label: 'Kafka',                                    x: 180, y: 0,   style: kafkaStyle,    targetPosition: 'left', sourcePosition: 'right' },
  { id: 'consumer', label: 'Progression\nEvent Consumer',              x: 380, y: 0,   style: consumerStyle, targetPosition: 'left', sourcePosition: 'right' },
  // Row 0 → Row 1: 조건 매칭
  { id: 'master',   label: 'Progression\nMasterData 조건 매칭',        x: 620, y: 0,   style: condStyle,     targetPosition: 'left', sourcePosition: 'bottom' },
  // Row 1: 3가지 도메인 팬아웃 + 누적
  { id: 'archive',  label: 'Progression\nArchive',                     x: 470, y: 130, style: domainStyle,   targetPosition: 'top',  sourcePosition: 'bottom' },
  { id: 'quota',    label: 'Progression\nQuota',                       x: 650, y: 130, style: domainStyle,   targetPosition: 'top',  sourcePosition: 'bottom' },
  { id: 'season',   label: 'Progression\nSeasonPromotion',             x: 830, y: 130, style: domainStyle,   targetPosition: 'top',  sourcePosition: 'bottom' },
  // Row 2: 누적 상태 (DB)
  { id: 'db-prog',  label: 'Progression DB\ncurrentProgress++',       x: 650, y: 260, style: entityStyle,   targetPosition: 'top',  sourcePosition: 'bottom' },
  // Row 3: 사용자 클레임 요청
  { id: 'user-claim', label: '사용자\nREST 클레임 요청',               x: 370, y: 380, style: dimStyle,       sourcePosition: 'right' },
  { id: 'claim-chk',  label: 'Progression\n클레임 검증 (중복 방지)',    x: 570, y: 380, style: claimStyle,     targetPosition: 'left', sourcePosition: 'right' },
  // Row 3 → Row 4: 트랜잭션 경계
  { id: 'tx-bound',   label: 'Progression\n트랜잭션 경계',             x: 770, y: 380, style: txBoundary,     targetPosition: 'left', sourcePosition: 'bottom' },
  // Row 4: 아웃박스 + Kafka + Payment
  { id: 'outbox',     label: 'Progression Outbox\nisClaimed=true',     x: 770, y: 500, style: outboxStyle, targetPosition: 'top', sourcePosition: 'right' },
  { id: 'relay',      label: 'Progression\nOutboxProcessor',           x: 570, y: 610, style: outboxStyle,    targetPosition: 'top', sourcePosition: 'right' },
  { id: 'kafka-out',  label: 'Kafka',                                  x: 770, y: 610, style: kafkaStyle,     targetPosition: 'left', sourcePosition: 'right' },
  { id: 'payment',    label: 'Payment Service\n(Account 잔액 증가)',   x: 970, y: 610, style: paymentStyle, targetPosition: 'left' },
];

const ACCUMULATION_EDGES: MiniFlowEdge[] = [
  // Row 0: 이벤트 진입
  { source: 'ec',       target: 'kafka-in', animated: true, label: 'OrderCreatedEvent' },
  { source: 'kafka-in', target: 'consumer', animated: true, color: '#0284c7' },
  { source: 'consumer', target: 'master',   animated: true, label: 'matchesEvent()' },
  // Row 0 → Row 1: 매칭된 도메인으로 팬아웃
  { source: 'master',   target: 'archive',  animated: true, color: '#7c3aed', label: 'EVENT_BASED' },
  { source: 'master',   target: 'quota',    animated: true, color: '#7c3aed' },
  { source: 'master',   target: 'season',   animated: true, color: '#7c3aed' },
  // Row 1 → Row 2: 진행도 누적
  { source: 'archive',  target: 'db-prog',  animated: true, color: '#475569', label: 'updateProgress()' },
  { source: 'quota',    target: 'db-prog',  animated: true, color: '#475569', label: 'consume()' },
  { source: 'season',   target: 'db-prog',  animated: true, color: '#475569', label: 'advanceStep()' },
  // Row 3: 사용자 클레임
  { source: 'user-claim', target: 'claim-chk', animated: true, label: 'POST /claim' },
  { source: 'db-prog',    target: 'claim-chk', dashed: true,   color: '#334155', label: 'isCompleted?\n!isClaimed?' },
  // Row 3 → Row 4: 트랜잭션 경계
  { source: 'claim-chk',  target: 'tx-bound',  animated: true, color: '#a855f7', label: 'canClaim()' },
  { source: 'tx-bound',   target: 'outbox',    dashed: true,   color: '#334155' },
  // Row 4: 아웃박스 → Kafka → Payment
  { source: 'outbox',     target: 'relay',     dashed: true,   color: '#14b8a6', label: 'PENDING → PUBLISHED' },
  { source: 'relay',      target: 'kafka-out', animated: true, color: '#14b8a6', label: 'kafkaTemplate.send()' },
  { source: 'kafka-out',  target: 'payment',   animated: true, color: '#dc2626', label: 'ClaimedEvent' },
];

const progressionFlow: ServiceFlowData = {
  publishTopic: 'progression-events',
  publishes: [
    { name: 'ArchiveClaimedEvent', desc: '아카이브 보상 클레임 (포인트/쿠폰 지급 요청)' },
    { name: 'QuotaClaimedEvent', desc: '반복 보상 보상 클레임 (한도 달성 시 보상 지급 요청)' },
    { name: 'SeasonPromotionRewardClaimedEvent', desc: '시즌 프로모션 보상 클레임 (기본/VIP 별도 발행)' },
  ],
  consumes: [
    {
      topic: 'ecommerce-events',
      events: [
        { name: 'OrderCreatedEvent', action: '아카이브·반복 보상·시즌 프로모션 진행도 업데이트' },
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
        { service: 'ecommerce', desc: '주문 이벤트 발행자. 주문 생성 이벤트로 반복 보상 소비량이 증가한다' },
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
    ],
    content: (
      <div className="space-y-8">
        {/* 서비스 의도 */}
        <DocBlock id="svc-intent" title="서비스 의도">
          <DocParagraph>
            이 서비스는 사실 적합한 도메인이 아닐 수 있습니다. 시도해보고 싶은 방향성이 있어 진행해보았습니다.
          </DocParagraph>
          <DocParagraph>
            햄스터 월드에서 발생하는 다수의 이벤트들을 소비하고, 기록 및 진행도를 추적하는 서비스입니다.
          </DocParagraph>
          <DocParagraph>
            조건에 의거한 보상 지급을 원자적으로 처리하려면, 본래 하나의 서비스 안에서 모두 수행하는 것이 적합할 것이라 생각합니다.
            그렇지 않다면 사가 오케스트레이션 패턴을 도입해야 하며, 그만큼 복잡성이 증가한다고 판단했습니다.
          </DocParagraph>
          <DocParagraph>
            다만 사가 오케스트레이션 없이도, 사가 코레오그래피 + 아웃박스 패턴을 통해 단방향으로 결과를 전파할 수 있다면,
            책임을 분리하면서도 최종 일관성을 보장하는 구조가 가능하지 않을까 하는 시도입니다.
          </DocParagraph>
        </DocBlock>

        {/* 서비스 설명 */}
        <DocBlock id="svc-desc" title="서비스 설명">
          <DocParagraph>
            VIP와 같은 특수 소유권(Ownership)은 Payment Service가 보유합니다.
            Progression Service는 이를 직접 소유하지 않고, Kafka를 통해 전파된 상태를 캐시로만 보관합니다.
          </DocParagraph>

          <DocCard title="소유권 캐싱과 코레오그래피 : VIP 상태의 전파와 사용">
            <DocParagraph>
              사용자가 VIP를 구매하거나 획득하면, Payment Service가 이를 확정하고 Kafka로 발행합니다.
              Progression Service는 이 이벤트를 수신하여 SeasonPromotion 엔티티의 isVip 필드를 캐시합니다.
              이후 사용자가 시즌 프로모션 보상을 클레임하면, 캐시된 isVip 여부에 따라 기본 보상과 VIP 보너스를 분기 발행합니다.
              발행된 이벤트는 다시 Kafka를 통해 Payment Service로 전달되어 실제 포인트가 지급됩니다.
            </DocParagraph>
            <DocMiniFlow
              nodes={OWNERSHIP_NODES}
              edges={OWNERSHIP_EDGES}
              ownerService="Progression"
            />
            <DocCallout>
              VIP 소유권의 진실의 원천은 Payment Service입니다.
              Progression Service는 캐시만 보관하므로, 소유권 변경 시 Kafka 이벤트 하나로 동기화됩니다.
              중앙 오케스트레이터 없이 이벤트 흐름만으로 두 서비스의 책임 경계가 유지되는 사가 코레오그래피 구조입니다.
            </DocCallout>
          </DocCard>

          <DocCard title="이벤트 누적 → 조건 매칭 → 클레임 → 아웃박스 → 포인트 지급">
            <DocParagraph>
              햄스터 월드에서 발생하는 다수의 이벤트가 유입되면 조건(MissionCondition)을 매칭합니다.
              매칭된 도메인(Archive, Quota, SeasonPromotion)의 진행도가 누적됩니다.
            </DocParagraph>
            <DocParagraph>
              이후 사용자가 REST API로 클레임을 요청하면, 완료 여부와 중복 수령 여부를 Progression Service가 검증합니다.
              검증을 통과하면 하나의 트랜잭션 안에서 isClaimed=true 상태 변경과 OutboxEvent 저장이 원자적으로 수행되고,
              OutboxProcessor가 비동기로 Kafka에 발행하여 최종적으로 Payment Service의 Account 잔액이 증가합니다.
            </DocParagraph>
            <DocMiniFlow
              nodes={ACCUMULATION_NODES}
              edges={ACCUMULATION_EDGES}
              ownerService="Progression"
            />
            <DocCallout>
              클레임 중복 방지(isClaimed, claimedSteps)와 진행도 누적은 Progression Service의 책임이며,
              실제 포인트 증가는 Payment Service의 책임입니다.
              트랜잭셔널 아웃박스 패턴으로 엔티티 상태 변경과 이벤트 발행의 원자성을 보장하고,
              Kafka 장애 시에도 outbox_events 테이블에 이벤트가 남아 재시도가 가능합니다.
            </DocCallout>
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

    // 2. Quota 처리: 모든 반복 보상 순회
    quotaMasterLoader.getAllQuotaMasters().forEach { master ->
        if (!master.matchesEvent(parsedEvent.eventType, eventFilters)) return@forEach
        quotaService.consumeQuota(event.userPublicId, master)
    }

    // 3. SeasonPromotion 처리 (동일 패턴)
}`}</DocCode>
          </DocCard>

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
