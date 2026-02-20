import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocCode, DocPlaceholder } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        <DocHeading>Hamster PG Service</DocHeading>
        <DocParagraph>
          외부 PG 시뮬레이터. 실제 서비스에서는 토스페이먼츠, 이니시스, NHN KCP 등이 이 자리를 대체합니다.
          <span className="text-gray-500"> Hamster World의 일부가 아닌, 독립된 외부 서비스로 간주.</span>
        </DocParagraph>
        <DocCard title="Why Separate">
          <DocParagraph>
            실제 PG 연동 없이도 결제 플로우 전체를 테스트/데모 가능.
            비동기 처리 (Scheduler 기반 1초 폴링), HMAC-SHA256 인증, Webhook 전송을 시뮬레이션.
          </DocParagraph>
        </DocCard>
      </div>
    ),
  },
  {
    key: 'design',
    label: '설계 의도',
    content: (
      <div className="space-y-4">
        <DocHeading>Why: PG Simulator</DocHeading>
        <DocParagraph>
          PG는 외부 서비스이므로 별도 프로젝트로 분리. 실제 PG API 스펙을 따라 구현하여
          Cash Gateway가 실제 PG와 통신하는 것과 동일한 코드로 시뮬레이터와 통신.
        </DocParagraph>
        <DocCode>{`결제 처리 시뮬레이션:
  POST /api/payment → 202 Accepted (PENDING)
  Scheduler 1초 후 → COMPLETED (80%) or FAILED (20%)
  → Webhook 전송: Cash Gateway`}</DocCode>
      </div>
    ),
  },
  {
    key: 'code',
    label: '핵심 코드',
    content: (
      <div className="space-y-4">
        <DocHeading>How: Key Code</DocHeading>
        <DocPlaceholder text="핵심 코드 블록 (추후 작성)" />
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
          hamster-pg 프론트엔드 - MID(가맹점) 관리 + 결제 내역 조회.
        </DocParagraph>
        <DocPlaceholder text="스크린샷 (추후 추가)" />
      </div>
    ),
  },
];

export function HamsterPgTab() {
  return (
    <ServiceDocLayout
      title="햄스터 PG"
      badge="EXTERNAL"
      badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      sections={sections}
    />
  );
}
