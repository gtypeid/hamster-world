import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocPlaceholder } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        <DocHeading>Internal Admin</DocHeading>
        <DocParagraph>
          시스템 전체 운영 대시보드. Cash Gateway, Payment, Ecommerce를 하나의 화면에서 모니터링합니다.
          DEVELOPER 역할 (Keycloak) 필요.
        </DocParagraph>
        <DocCard title="Connected Services">
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-mono w-28 shrink-0">Cash Gateway</span>
              <span>결제 프로세스 추적, 이벤트 모니터링</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400 font-mono w-28 shrink-0">Payment</span>
              <span>재고 현황, 트랜잭션 이력, 정산</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 font-mono w-28 shrink-0">Ecommerce</span>
              <span>주문 관리 (Admin 뷰)</span>
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
          분산된 마이크로서비스를 하나의 화면에서 통합 모니터링하기 위한 운영 도구.
          각 서비스의 API를 집약하여 운영자가 전체 결제 흐름을 추적할 수 있도록 합니다.
        </DocParagraph>
        <DocCard title="Key Views">
          <div className="space-y-2 text-xs text-gray-400">
            <div>Order Flow - 주문 상태 추적</div>
            <div>Payment Processes - 결제 프로세스 실시간 모니터링</div>
            <div>Resources - 상품/재고 현황</div>
            <div>Dead Letter - DLT 큐 뷰어</div>
            <div>Topology - 시스템 토폴로지</div>
          </div>
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
        <DocPlaceholder text="Internal Admin 스크린샷 (추후 추가)" />
      </div>
    ),
  },
];

export function InternalAdminTab() {
  return (
    <ServiceDocLayout
      title="어드민"
      badge="DEVELOPER"
      badgeColor="text-pink-400 bg-pink-500/10 border-pink-500/20"
      sections={sections}
    />
  );
}
