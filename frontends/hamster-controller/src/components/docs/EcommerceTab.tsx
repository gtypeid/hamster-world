import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocCode, DocPlaceholder } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        <DocHeading>E-Commerce Service</DocHeading>
        <DocParagraph>
          벤더(쇼핑몰 사업자)용 SaaS 이커머스 서비스. 상품 카탈로그, 장바구니, 주문을 관리하며,
          2가지 결제 경로(직접 PG / Hamster 중개)를 제공합니다.
        </DocParagraph>
        <DocCard title="Bounded Context">
          <div className="text-xs text-gray-400 space-y-1">
            <div><span className="text-blue-400">Product</span> - 상품 카탈로그 (Read Only, Payment에서 동기화)</div>
            <div><span className="text-blue-400">Cart</span> - 장바구니</div>
            <div><span className="text-blue-400">Order</span> - 주문 전표/영수증 (Source of Truth 아님)</div>
            <div><span className="text-blue-400">User</span> - CUSTOMER / VENDOR / MERCHANT 역할</div>
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
          Order는 Source of Truth가 아닌 전표/영수증 용도. 결제 상태의 실제 소스는 Cash Gateway의 PaymentProcess.
          재고는 읽기 전용 캐시로, Payment Service에서 이벤트로 동기화됩니다.
        </DocParagraph>
        <DocCard title="Order's Role">
          <DocCode>{`Order = 사용자 전표 (UI 표시용)
  ✅ 사용자가 주문 내역 조회
  ✅ Cash Gateway에 전달되는 메타데이터
  ❌ 재고 차감 기준 (X) ← Payment Service 담당
  ❌ 거래의 Source of Truth (X) ← Cash Gateway 담당`}</DocCode>
        </DocCard>
        <DocCard title="CQRS Pattern">
          <DocParagraph>
            Ecommerce = Read 모델 (상품 카탈로그, 주문 조회), Payment = Write 모델 (재고 변경, 정산).
            Kafka 이벤트를 통한 Eventual Consistency로 동기화.
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
          Public ID 정책 (Snowflake Base62) 적용. Internal PK를 클라이언트에 노출하지 않음.
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
          이 설계로 인해 Order와 Product를 독립적으로 변경할 수 있고, 결제 로직 변경이 이커머스에 영향을 주지 않습니다.
          Vendor가 직접 PG를 계약하든 Hamster를 통하든, 이커머스 코드는 동일합니다.
        </DocParagraph>
        <DocPlaceholder text="설계 결과 상세 (추후 작성)" />
      </div>
    ),
  },
  {
    key: 'screen',
    label: '화면',
    content: (
      <div className="space-y-4">
        <DocHeading>Screen</DocHeading>
        <DocParagraph>
          ecommerce 프론트엔드 - Shop (소비자), Merchant (판매자), Admin (관리자) 3가지 모드 제공.
        </DocParagraph>
        <DocPlaceholder text="스크린샷 (추후 추가)" />
      </div>
    ),
  },
];

export function EcommerceTab() {
  return (
    <ServiceDocLayout
      title="이커머스"
      badge="PUBLIC"
      badgeColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
      sections={sections}
    />
  );
}
