import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocCode, DocPlaceholder } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        <DocHeading>Payment Service</DocHeading>
        <DocParagraph>
          <span className="text-red-400 font-semibold">완전 리액티브</span> 서비스.
          HTTP API를 노출하지 않으며, Kafka 이벤트 구독만으로 동작합니다.
          재고 관리, Event Sourcing (ProductRecord), 정산을 담당합니다.
        </DocParagraph>
        <DocCard title="What This Service Knows / Doesn't Know">
          <DocCode>{`알고 있는 것:
  ✅ paymentAttemptId
  ✅ productId, quantity (이벤트로 전달받음)
  ✅ Product, Stock

모르는 것:
  ❌ Order
  ❌ User
  ❌ Cart`}</DocCode>
        </DocCard>
      </div>
    ),
  },
  {
    key: 'design',
    label: '설계 의도',
    content: (
      <div className="space-y-4">
        <DocHeading>Why: Reactive + Event Sourcing</DocHeading>
        <DocParagraph>
          재고/정산은 결제 결과에 반응만 하면 됨. HTTP를 열 이유가 없음.
          Cash Gateway가 앞단에서 결제 상태를 관리하고, Payment는 그 이벤트를 소비하여 재고를 조정.
        </DocParagraph>
        <DocCard title="Event Sourcing (Delta)">
          <DocCode>{`ProductRecord (변화량 저장)
  INSERT (product_id=1, stock=+100, reason='초기 재고')
  INSERT (product_id=1, stock=-5,   reason='[선차감] attemptId=123')
  INSERT (product_id=1, stock=+5,   reason='[복구] attemptId=123')

Product.stock = SUM(ProductRecord.stock) = 100
→ 재집계 가능, 어떤 시점이든 정합성 검증 가능`}</DocCode>
        </DocCard>
        <DocCard title="Why Event Sourcing Matters">
          <DocParagraph>
            3일 전 누락된 노티가 뒤늦게 오면? Cash Gateway가 이벤트 발행 → Payment가 재고 조정 →
            delta 기반이므로 재집계하면 정합성 보장.
            멱등성(attemptId)으로 중복 처리도 안전.
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
          재고 선차감 (Pre-deduction) 전략, Two-Phase Locking (Deadlock 방지), 멱등성 보장.
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
          이 설계로 인해: 재고 이력 완전 추적 가능, 언제든 재집계로 정합성 검증,
          결제 실패/취소 시 자동 복구, 새로운 이벤트 타입 추가 시 Consumer만 추가하면 됨.
        </DocParagraph>
        <DocPlaceholder text="설계 결과 상세 (추후 작성)" />
      </div>
    ),
  },
];

export function PaymentTab() {
  return (
    <ServiceDocLayout
      title="페이먼트"
      badge="REACTIVE ONLY"
      badgeColor="text-red-400 bg-red-500/10 border-red-500/20"
      sections={sections}
    />
  );
}
