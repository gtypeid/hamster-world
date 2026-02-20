import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocCode, DocPlaceholder } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        <DocHeading>Hamster World</DocHeading>
        <DocParagraph>
          Hamster World는 <span className="text-amber-400 font-semibold">결제 중개 플랫폼 (PG Aggregator)</span> 아키텍처의
          이벤트 드리븐 이커머스 시스템입니다. 토스페이먼츠, 이니시스와 같은 결제 대행 서비스를 모델링합니다.
        </DocParagraph>
        <DocCard title="Business Model">
          <DocCode>{`Vendor (쇼핑몰 사업자)
  ├─ 선택 1: 직접 PG 계약 (낮은 수수료) → 경로 A
  │          Ecommerce → 외부 PG → Cash Gateway (노티)
  │
  └─ 선택 2: Hamster 중개 (높은 수수료) → 경로 B
             Ecommerce → Cash Gateway → 외부 PG`}</DocCode>
        </DocCard>
        <DocCard title="System Composition">
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded px-3 py-2 text-blue-400 text-center font-semibold">
              6 Microservices
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-red-400 text-center font-semibold">
              Event-Driven (Kafka)
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded px-3 py-2 text-green-400 text-center font-semibold">
              AWS Free Tier
            </div>
          </div>
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
          PG Aggregator라는 도메인을 선택한 이유: 결제 시스템은 트랜잭션 정합성, 비동기 이벤트 처리, 멱등성,
          보상 트랜잭션 등 백엔드 핵심 과제를 자연스럽게 포함하기 때문입니다.
        </DocParagraph>
        <DocCard title="Architecture Principles">
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-semibold shrink-0">DDD</span>
              <span>Aggregate Root + Domain Events 기반 바운디드 컨텍스트 분리</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 font-semibold shrink-0">CQRS</span>
              <span>Ecommerce (Read) vs Payment (Write) 역할 분리</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400 font-semibold shrink-0">EDA</span>
              <span>Kafka 기반 비동기 이벤트 통신, Eventual Consistency</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400 font-semibold shrink-0">Reactive</span>
              <span>Payment Service는 HTTP 노출 없이 Kafka 구독만으로 동작</span>
            </div>
          </div>
        </DocCard>
        <DocCard title="Service Boundaries">
          <DocCode>{`ecommerce-service    → 상품/주문 전표 (Read Model)
cash-gateway-service → 결제 프로세스 오케스트레이션 (Source of Truth)
payment-service      → 재고/정산 (Write Model, Reactive)
hamster-pg-service   → PG 시뮬레이터 (외부 시스템 대체)
progression-service  → 아카이브/쿼터
notification-service → DLT 모니터링`}</DocCode>
        </DocCard>
      </div>
    ),
  },
  {
    key: 'troubleshooting',
    label: '트러블슈팅',
    content: (
      <div className="space-y-4">
        <DocHeading>Troubleshooting</DocHeading>
        <DocParagraph>
          프로젝트 전반에서 겪은 문제와 해결 과정을 기록합니다.
        </DocParagraph>
        <DocPlaceholder text="프로젝트 전반 트러블슈팅 (추후 작성)" />
      </div>
    ),
  },
  {
    key: 'outcome',
    label: '결과',
    content: (
      <div className="space-y-4">
        <DocHeading>So What: Outcome</DocHeading>
        <DocCard title="Hamster Controller">
          <DocParagraph>
            이 대시보드가 존재하는 이유: AWS 인스턴스를 프리티어 내에서 온디맨드로 제어하기 위함.
            상태를 가지고 있지 않으며, GitHub Repository Variable을 통해 인프라 상태를 폴링합니다.
            Lambda Proxy를 통해 GitHub PAT을 클라이언트에 노출하지 않습니다.
          </DocParagraph>
        </DocCard>
        <DocPlaceholder text="프로젝트 전체 성과/회고 (추후 작성)" />
      </div>
    ),
  },
];

export function OverviewTab() {
  return (
    <ServiceDocLayout
      title="개요"
      badge="프로젝트"
      badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      sections={sections}
    />
  );
}
