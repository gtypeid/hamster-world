import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocCode, DocPlaceholder } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        <DocHeading>Cash Gateway Service</DocHeading>
        <DocParagraph>
          결제 방화벽 + 중개 플랫폼. 모든 결제 이벤트의 집합점이며,
          <span className="text-amber-400 font-semibold"> PaymentProcess가 거래의 Source of Truth</span>입니다.
        </DocParagraph>
        <DocCard title="3 Operating Modes">
          <DocCode>{`1. Active Mode (PG 대행 - 경로 B)
   Ecommerce → Cash Gateway → PG → Webhook → Payment

2. Webhook Mode (외부 거래 - 경로 A)
   외부 PG → Webhook → Cash Gateway → Payment

3. Passive Mode (정산 기록)
   Partner → /record API → Cash Gateway → Payment`}</DocCode>
        </DocCard>
      </div>
    ),
  },
  {
    key: 'design',
    label: '설계 의도',
    content: (
      <div className="space-y-4">
        <DocHeading>Why: Payment Firewall</DocHeading>
        <DocParagraph>
          외부 PG는 본질적으로 비동기. 동기 응답이 성공이어도 최종 확정은 Webhook으로 와야 함.
          Cash Gateway는 이 비동기성을 흡수하는 방화벽 역할로, 내부에는 일관된 이벤트만 발행합니다.
        </DocParagraph>
        <DocCard title="PaymentProcess Evolution">
          <DocCode>{`Phase 1 (Monolithic): PaymentAttempt = "사후 이력(History)"
  - REQUIRES_NEW (별도 트랜잭션, 항상 기록)
  - 문제: 원자성 깨짐, Kafka 재시도와 불일치

Phase 2 (Event-Driven): PaymentProcess = "상태 관리(State)" ✅
  - MANDATORY (부모 트랜잭션 참여, 원자성 보장)
  - 상태 전이: UNKNOWN → SUCCESS/FAILED/CANCELLED (CAS)
  - Webhook 전용: PG 응답 성공해도 Payment 미생성, Webhook에서만 생성`}</DocCode>
        </DocCard>
        <DocCard title="Why Webhook-Only Policy">
          <DocParagraph>
            PG 동기 응답을 신뢰하지 않음. 3일 뒤에 오는 지연 노티도 동일한 플로우로 처리.
            이후 외부 파트너의 비동기 노티에 대해서도 동일 패턴으로 확장 가능.
          </DocParagraph>
        </DocCard>
      </div>
    ),
  },
  {
    key: 'code',
    label: '핵심 코드',
    content: (
      <div className="space-y-4">
        <DocHeading>How: Key Code</DocHeading>
        <DocParagraph>
          Domain Event Pattern (AbstractAggregateRoot), CAS 기반 상태 전이, gatewayReferenceId 기반 매칭.
        </DocParagraph>
        <DocPlaceholder text="핵심 코드 블록 (추후 작성)" />
      </div>
    ),
  },
  {
    key: 'outcome',
    label: '결과',
    content: (
      <div className="space-y-4">
        <DocHeading>So What: Outcome</DocHeading>
        <DocParagraph>
          이 설계로 인해: 외부 PG가 동기든 비동기든 내부는 동일한 이벤트 플로우.
          3일 전 누락된 노티가 와도 Cash Gateway가 이벤트 발행 → Payment Service가 재고 조정 → 재집계로 정합성 보장.
          새로운 PG 추가 시 Provider 구현체만 추가하면 됨.
        </DocParagraph>
        <DocPlaceholder text="설계 결과 상세 (추후 작성)" />
      </div>
    ),
  },
];

export function CashGatewayTab() {
  return (
    <ServiceDocLayout
      title="캐시 게이트웨이"
      badge="SOURCE OF TRUTH"
      badgeColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
      sections={sections}
    />
  );
}
