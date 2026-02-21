import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocCode, DocKeyValueList, DocBulletList } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        <DocHeading>Content Creator</DocHeading>
        <DocParagraph>
          프로모션/시즌/쿠폰 관리 도구. Progression, Payment, Ecommerce 서비스와 연동됩니다.
        </DocParagraph>
        <DocCard title="Connected Services">
          <DocKeyValueList items={[
            { label: 'Progression', value: '쿼타, 아카이브, 시즌 프로모션 관리', color: 'text-purple-400' },
            { label: 'Payment', value: '결제 관련 프로모션', color: 'text-red-400' },
            { label: 'Ecommerce', value: '쿠폰 정책 관리', color: 'text-blue-400' },
          ]} />
        </DocCard>
        <DocCard title="Progression Service">
          <DocParagraph>
            Progression Service는 게이미피케이션 엔진. CSV 마스터 데이터를 기반으로
            아카이브/쿼타/시즌 프로모션을 관리하고, 보상 이벤트를 Payment Service에 발행합니다.
          </DocParagraph>
          <div className="font-semibold text-gray-300 mt-2 mb-2 text-sm">Kafka Topology</div>
          <DocKeyValueList items={[
            { label: 'Consumes', value: 'ecommerce-events: OrderCreatedEvent', color: 'text-emerald-400' },
            { label: 'Produces', value: 'progression-events: QuotaClaimedEvent, ArchiveClaimedEvent, SeasonPromotionRewardClaimedEvent', color: 'text-amber-400' },
          ]} />
        </DocCard>
      </div>
    ),
  },
  {
    key: 'design',
    label: '설계 의도',
    content: (
      <div className="space-y-4">
        <DocHeading>Why: Design Intent</DocHeading>
        <DocParagraph>
          운영팀이 코드 변경 없이 프로모션/쿠폰/시즌 이벤트를 관리할 수 있는 도구.
          각 서비스의 프로모션 관련 API를 집약합니다.
        </DocParagraph>
        <DocCard title="Progression Concepts">
          <DocCode>{`Archive (아카이브)
  - 일회성 업적/수집 요소
  - 조건 달성 시 보상 클레임
  - progressType: STAT_BASED / EVENT_BASED

Quota (쿼타)
  - 반복 가능한 할당량 (일간/주간/월간)
  - ACTION_REWARD: 달성 시 보상
  - ACTION_CONSTRAINT: 달성 시 제한

SeasonPromotion (시즌 프로모션)
  - 기간 한정 캠페인, 다단계 진행
  - 기본 보상 + VIP 보너스 분리`}</DocCode>
        </DocCard>
        <DocCard title="Master Data Pattern">
          <DocParagraph>
            쿼타/아카이브/시즌 마스터 데이터는 CSV 파일로 관리하고, 서비스 시작 시 메모리에 로딩.
            DB에는 유저별 진행 상태만 저장합니다.
          </DocParagraph>
        </DocCard>
      </div>
    ),
  },
  {
    key: 'screen',
    label: '화면',
    content: (
      <div className="space-y-4">
        <DocHeading>Screen</DocHeading>
        <DocCard title="Route Map">
          <DocCode>{`/progression/quotas    - 쿼타 CRUD + CSV 내보내기
/progression/archives  - 아카이브 관리 + 조건 빌더
/progression/seasons   - 시즌 프로모션 (기간/단계/보상)
/ecommerce/coupons     - 쿠폰 정책 관리
/delivery/rider-promotions - 라이더 인센티브`}</DocCode>
        </DocCard>
        <DocCard title="UI Features">
          <DocBulletList items={[
            '조건 빌더 (아카이브/쿼타 조건 시각적 편집)',
            '단계별 보상 설정 (시즌 프로모션)',
            '사이클 타입 필터링 (DAILY/WEEKLY/MONTHLY)',
            'Keycloak OAuth2 인증',
          ]} />
        </DocCard>
      </div>
    ),
  },
];

export function ContentCreatorTab() {
  return (
    <ServiceDocLayout
      title="콘텐츠 크리에이터"
      sections={sections}
    />
  );
}
