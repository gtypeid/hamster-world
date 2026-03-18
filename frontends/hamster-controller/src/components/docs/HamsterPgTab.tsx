import { ServiceDocLayout, DocBlock, DocParagraph, DocCallout } from './ServiceDocLayout';
import { DocMiniFlow } from './DocMiniFlow';
import type { MiniFlowNode, MiniFlowEdge } from './DocMiniFlow';
import type { DocSection } from './ServiceDocLayout';

/* ── 결제 흐름 토폴로지 데이터 ── */

const cgwStyle = { bg: '#92400e', color: '#fef3c7', border: '1px solid #d97706' };
const hpgStyle = { bg: '#831843', color: '#fbbf24', border: '1px solid #be185d' };
const webhookStyle = { bg: '#4a044e', color: '#f0abfc', border: '1px solid #a855f7' };
const entityStyle = { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 180 };
const schedulerStyle = { bg: '#0c4a6e', color: '#7dd3fc', border: '1px solid #0284c7' };

// Line 1: Cash Gateway → REST → 햄스터 PG (ACK)
// Line 2: 햄스터 PG 내부 — PaymentProcess → Scheduler → Payment
// Line 3: Payment → Webhook → Cash Gateway
const PG_FLOW_NODES: MiniFlowNode[] = [
  // Line 1
  { id: 'cgw', label: 'Cash Gateway', x: 0, y: 0, style: cgwStyle, sourcePosition: 'right' },
  { id: 'hpg-api', label: '햄스터 PG\nREST API (ACK)', x: 250, y: 0, style: hpgStyle, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'pp', label: 'PaymentProcess\n(PENDING)', x: 500, y: 0, style: entityStyle, targetPosition: 'left', sourcePosition: 'right' },
  // Line 2
  { id: 'scheduler', label: '폴링 스케줄러\n(2초 간격)', x: 500, y: 110, style: schedulerStyle, targetPosition: 'top', sourcePosition: 'right' },
  { id: 'pp-final', label: 'PaymentProcess\n(SUCCESS / FAILED)', x: 750, y: 110, style: entityStyle, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'payment', label: 'Payment\n(확정 결과)', x: 1000, y: 110, style: entityStyle, targetPosition: 'left', sourcePosition: 'bottom' },
  // Line 3
  { id: 'webhook', label: 'Webhook\n전송', x: 1000, y: 220, style: webhookStyle, targetPosition: 'top', sourcePosition: 'left' },
  { id: 'cgw2', label: 'Cash Gateway', x: 750, y: 220, style: cgwStyle, targetPosition: 'right' },
];

const PG_FLOW_EDGES: MiniFlowEdge[] = [
  // Line 1
  { source: 'cgw', target: 'hpg-api', animated: true, label: 'HTTP' },
  { source: 'hpg-api', target: 'pp', animated: true, label: '202 ACK' },
  // Line 1 → Line 2
  { source: 'pp', target: 'scheduler', dashed: true, color: '#334155' },
  // Line 2
  { source: 'scheduler', target: 'pp-final', animated: true, label: 'CAS 상태 전이' },
  { source: 'pp-final', target: 'payment', animated: true, label: '이벤트' },
  // Line 2 → Line 3
  { source: 'payment', target: 'webhook', dashed: true, color: '#334155' },
  // Line 3
  { source: 'webhook', target: 'cgw2', animated: true, label: 'HTTP POST' },
];

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    children: [
      { key: 'svc-intent', label: '서비스 의도' },
      { key: 'svc-desc', label: '서비스 설명' },
    ],
    content: (
      <div className="space-y-8">
        {/* 서비스 의도 */}
        <DocBlock id="svc-intent" title="서비스 의도">
          <DocParagraph>
            햄스터 PG는 외부 PG 더미 시뮬레이터입니다.
            햄스터 월드의 일부가 아닌, 독립된 외부 서비스로 간주하였으며,
            결제 플로우 전체를 테스트할 수 있도록 만들었습니다.
          </DocParagraph>
          <DocCallout>
            Kafka를 사용하지 않습니다.
            REST API로 결제 요청을 접수하고,
            결과를 비동기로서 Webhook으로 Cash Gateway에 전달합니다.
          </DocCallout>
        </DocBlock>

        {/* 서비스 설명 */}
        <DocBlock id="svc-desc" title="서비스 설명">
          <DocParagraph>
            Cash Gateway로부터 결제 요청을 REST API로 ACK 접수하고,
            Cash Gateway와 동일하게 PaymentProcess, Payment로서 트랜잭션 라이프사이클을 분리하여
            스케줄러로 비동기 처리한 뒤, 결과를 Webhook으로 Cash Gateway에 전달합니다.
            80% 확률로 성공, 20% 확률로 실패를 시뮬레이션합니다.
          </DocParagraph>
          <DocMiniFlow
            nodes={PG_FLOW_NODES}
            edges={PG_FLOW_EDGES}
            ownerService="햄스터 PG"
          />
        </DocBlock>
      </div>
    ),
  },
];

export function HamsterPgTab() {
  return (
    <ServiceDocLayout
      title="햄스터 PG"
      sections={sections}
    />
  );
}
