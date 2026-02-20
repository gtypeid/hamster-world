import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocPlaceholder } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        <DocHeading>Platform</DocHeading>
        <DocParagraph>
          Hamster World가 사용하는 플랫폼 도구들. 직접 개발한 것이 아닌, 가져다 쓴 인프라 서비스들입니다.
        </DocParagraph>
        <DocCard title="Keycloak 23.0 - Authentication">
          <div className="space-y-2 text-xs text-gray-400">
            <p>Realm: hamster-world / Self-registration + JWT 기반 인증</p>
            <p>Roles: MERCHANT, USER, DEVELOPER, VENDOR, SYSTEM</p>
            <div className="mt-3 bg-purple-500/5 border border-purple-500/20 rounded px-3 py-2">
              <span className="text-purple-400 font-mono text-[11px]">http://&#123;public_ip&#125;/keycloak</span>
            </div>
          </div>
        </DocCard>
        <DocCard title="Apache Kafka 7.5 - Event Broker">
          <div className="space-y-2 text-xs text-gray-400">
            <p>KRaft mode (Zookeeper 불필요). 서비스 간 비동기 이벤트 통신의 중심.</p>
            <p>이벤트 토폴로지는 뷰어 &rarr; 이벤트 플로우 탭에서 확인 가능.</p>
          </div>
        </DocCard>
        <DocCard title="Grafana - Monitoring">
          <div className="space-y-2 text-xs text-gray-400">
            <p>분산 트레이싱 및 서비스 모니터링 대시보드.</p>
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
          플랫폼 도구를 선택한 이유와 각 도구의 역할, 그리고 직접 구현 대신 도입한 이유를 설명합니다.
        </DocParagraph>
        <DocCard title="Why Keycloak?">
          <DocParagraph>
            인증/인가를 직접 구현하지 않고 Keycloak을 도입한 이유: OAuth2 / OIDC 표준 준수,
            역할 기반 접근 제어(RBAC), 멀티 테넌트 지원 등을 자체 구현하는 것은 프로젝트 범위를 벗어남.
            대신 Keycloak Realm 설정과 Role 매핑을 통해 도메인에 맞는 인증 체계를 구성.
          </DocParagraph>
        </DocCard>
        <DocCard title="Why KRaft?">
          <DocParagraph>
            Zookeeper 의존성 제거로 단일 인스턴스에서도 안정적 운영. 프리티어 환경에서의 리소스 절약.
          </DocParagraph>
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
          플랫폼 도구 설정 및 운영 중 겪은 문제와 해결 과정을 기록합니다.
        </DocParagraph>
        <DocPlaceholder text="Keycloak / Kafka / Grafana 트러블슈팅 (추후 작성)" />
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
          플랫폼 도구 도입으로 달성한 결과를 정리합니다.
        </DocParagraph>
        <DocPlaceholder text="플랫폼 도구 도입 성과 (추후 작성)" />
      </div>
    ),
  },
];

export function PlatformTab() {
  return (
    <ServiceDocLayout
      title="플랫폼"
      badge="도구"
      badgeColor="text-purple-400 bg-purple-500/10 border-purple-500/20"
      sections={sections}
    />
  );
}
