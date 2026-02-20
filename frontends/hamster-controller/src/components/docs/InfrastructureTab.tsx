import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocCode, DocPlaceholder } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        <DocHeading>Infrastructure</DocHeading>
        <DocParagraph>
          Terraform + GitHub Actions 기반 온디맨드 인프라. 프리티어 한도 내에서 8개 EC2 인스턴스를 자동으로 생성/삭제합니다.
        </DocParagraph>
        <DocCard title="Deployment Strategy">
          <DocCode title="Session Lifecycle">{`GitHub Actions (workflow_dispatch)
  → terraform apply (8x t3.micro)
  → 15min active runtime
  → terraform destroy (auto)
  → 5min cooldown`}</DocCode>
        </DocCard>
        <DocCard title="Why On-Demand?">
          <DocParagraph>
            AWS 프리티어 월 750시간 한도 내에서 데모를 제공하기 위함.
            항상 켜두면 한도 초과, 필요할 때만 올리고 자동 파괴.
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
        <DocHeading>Why: Design Intent</DocHeading>
        <DocParagraph>
          인프라를 코드로 관리하면서, 포트폴리오 시연을 위해 온디맨드 프로비저닝을 자동화한 이유와 설계 방향.
        </DocParagraph>
        <DocCard title="Lambda Proxy">
          <DocParagraph>
            GitHub PAT을 클라이언트에 노출하지 않기 위해 Lambda Function URL을 프록시로 사용.
            화이트리스트 기반 API 경로 필터링 + 일일 rate limit 적용.
          </DocParagraph>
          <DocCode>{`Client (Browser)
  → Lambda Function URL (proxy)
  → GitHub API (PAT stored in Lambda env)

Whitelist:
  GET  /repos/{owner}/{repo}/actions/variables/*
  POST /repos/{owner}/{repo}/actions/workflows/*/dispatches`}</DocCode>
        </DocCard>
        <DocCard title="State Management">
          <DocParagraph>
            Hamster Controller는 자체 상태를 갖지 않음. GitHub Repository Variable(INFRA_STATUS)을
            폴링하여 현재 인프라 상태를 판별합니다. Terraform의 실행 결과는 GitHub Actions 로그에 기록.
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
          Terraform 구성과 GitHub Actions 워크플로우의 핵심 코드를 설명합니다.
        </DocParagraph>
        <DocCard title="Terraform Configuration">
          <DocPlaceholder text="Terraform 설정 상세 (추후 작성)" />
        </DocCard>
        <DocCard title="GitHub Actions Workflow">
          <DocPlaceholder text="워크플로우 YAML 상세 (추후 작성)" />
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
          인프라 배포 과정에서 겪은 문제와 해결 과정을 기록합니다.
        </DocParagraph>
        <DocPlaceholder text="배포 관련 트러블슈팅 (추후 작성)" />
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
          온디맨드 인프라 전략으로 달성한 결과와 비용 효율성을 정리합니다.
        </DocParagraph>
        <DocPlaceholder text="인프라 성과/비용 분석 (추후 작성)" />
      </div>
    ),
  },
];

export function InfrastructureTab() {
  return (
    <ServiceDocLayout
      title="인프라"
      badge="TERRAFORM"
      badgeColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
      sections={sections}
    />
  );
}
