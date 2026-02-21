import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocCode, DocKeyValueList, DocBulletList } from './ServiceDocLayout';
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
          <DocKeyValueList items={[
            { label: 'Cash Gateway', value: '결제 프로세스 추적, 이벤트 모니터링', color: 'text-amber-400' },
            { label: 'Payment', value: '재고 현황, 트랜잭션 이력, 정산', color: 'text-red-400' },
            { label: 'Ecommerce', value: '주문 관리 (Admin 뷰)', color: 'text-blue-400' },
            { label: 'Notification', value: 'Dead Letter Queue 모니터링, 토폴로지 뷰', color: 'text-purple-400' },
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
          분산된 마이크로서비스를 하나의 화면에서 통합 모니터링하기 위한 운영 도구.
          각 서비스의 API를 집약하여 운영자가 전체 결제 흐름을 추적할 수 있도록 합니다.
        </DocParagraph>
        <DocCard title="Key Views">
          <DocKeyValueList items={[
            { label: 'Order Flow', value: '주문 상태 추적 (Ecommerce)', color: 'text-blue-400' },
            { label: 'Payment Processes', value: '결제 프로세스 실시간 모니터링 (Cash Gateway)', color: 'text-amber-400' },
            { label: 'Resources', value: '상품/재고/계정 현황 (Payment)', color: 'text-red-400' },
            { label: 'Dead Letter', value: 'DLT 큐 뷰어, 재처리/무시/해결 (Notification)', color: 'text-purple-400' },
            { label: 'Topology', value: 'Kafka 이벤트 토폴로지 시각화 (Reactflow + Dagre)', color: 'text-green-400' },
          ]} />
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
          <DocCode>{`/dashboard          - 개요
/ecommerce/orders   - 주문 관리
/gateway/processes  - 결제 프로세스 추적
/gateway/payments   - 결제 내역
/gateway/events     - 이벤트 모니터링
/payment/*          - 리소스, 트랜잭션, 정산
/notification/deadletter  - DLQ 모니터링
/notification/topology    - 시스템 토폴로지`}</DocCode>
        </DocCard>
        <DocCard title="UI Features">
          <DocBulletList items={[
            'Split-panel 레이아웃 (메인 + 트레이서 패널)',
            'URL 기반 검색 하이라이팅',
            'Reactflow + Dagre 기반 인터랙티브 토폴로지 그래프',
            'TanStack React Query + Zustand 상태 관리',
          ]} />
        </DocCard>
      </div>
    ),
  },
];

export function InternalAdminTab() {
  return (
    <ServiceDocLayout
      title="어드민"
      sections={sections}
    />
  );
}
