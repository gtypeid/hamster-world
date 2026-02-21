import { ServiceDocLayout, DocBlock, DocParagraph, DocCard, DocCode, DocCallout, DocKeyValueList } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';
import { DocMiniFlow } from './DocMiniFlow';
import type { MiniFlowNode, MiniFlowEdge } from './DocMiniFlow';
import { TerraformContextSection } from './TerraformContextSection';
import type { TerraformContextData } from './TerraformContextSection';
import { InfraTopologySection } from './InfraTopologySection';
import type { InfraTopologyData } from './InfraTopologySection';
import { DocTimeline } from './DocTimeline';
import type { TimelineStory } from './DocTimeline';

/* ── Hamster Controller 아키텍처 ── */

export const ARCH_NODES: MiniFlowNode[] = [
  // 왼쪽: 정적 SPA
  { id: 'controller', label: 'Hamster Controller\n(GitHub Pages)', x: 0, y: 130,
    style: { bg: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb', width: 180 },
    sourcePosition: 'right' },
  // 위쪽: Lambda + PAT
  { id: 'lambda', label: 'Lambda Proxy', x: 300, y: 0,
    style: { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 150 },
    targetPosition: 'left', sourcePosition: 'right' },
  { id: 'pat', label: 'PAT Token', x: 560, y: 0,
    style: { bg: '#1e293b', color: '#94a3b8', border: '1px dashed #475569', width: 120 },
    targetPosition: 'left' },
  // 중앙: GitHub Repo
  { id: 'repo', label: 'GitHub Repository\n(INFRA_STATUS, Workflows)', x: 300, y: 130,
    style: { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 220 },
    targetPosition: 'left', sourcePosition: 'right' },
  // 오른쪽: Actions
  { id: 'actions', label: 'GitHub Actions\n(Terraform)', x: 640, y: 130,
    style: { bg: '#312e81', color: '#c4b5fd', border: '1px solid #6366f1', width: 170 },
    targetPosition: 'left', sourcePosition: 'bottom' },
  // 오른쪽 아래: EC2
  { id: 'ec2', label: 'AWS EC2\n8 x t3.micro', x: 640, y: 260,
    style: { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e', width: 170 },
    targetPosition: 'top' },
];

export const ARCH_EDGES: MiniFlowEdge[] = [
  { source: 'controller', target: 'repo', color: '#6366f1', animated: true },
  { source: 'controller', target: 'lambda', color: '#d97706', label: 'API 호출' },
  { source: 'lambda', target: 'pat', dashed: true, color: '#475569' },
  { source: 'lambda', target: 'repo', color: '#6366f1' },
  { source: 'repo', target: 'actions', color: '#6366f1', label: 'dispatch' },
  { source: 'actions', target: 'ec2', animated: true, color: '#22c55e', label: 'Apply / Destroy' },
];

/* ── 상태 복원 흐름 ── */

const RESTORE_NODES: MiniFlowNode[] = [
  // 왼쪽: Connect 클릭 (사용자 액션)
  { id: 'rs-click', label: 'Connect 클릭\n(사용자 수동)', x: 0, y: 130,
    style: { bg: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb', width: 160 },
    sourcePosition: 'right' },
  // 위쪽: Lambda (아키텍처와 동일)
  { id: 'rs-lambda', label: 'Lambda Proxy', x: 280, y: 0,
    style: { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 150 },
    targetPosition: 'left', sourcePosition: 'bottom' },
  // 중앙: GitHub Repo — 트리거 이력
  { id: 'rs-repo', label: 'GitHub Repository\n(Terraform 트리거 이력)', x: 280, y: 130,
    style: { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 220 },
    targetPosition: 'top', sourcePosition: 'right' },
  // 오른쪽: 트리거 횟수 = 세션 수
  { id: 'rs-count', label: '트리거 횟수\n= 오늘 세션 수', x: 620, y: 40,
    style: { bg: '#312e81', color: '#c4b5fd', border: '1px solid #6366f1', width: 160 },
    targetPosition: 'left', sourcePosition: 'bottom' },
  // 아래: 런타임 기반 판별 분기
  { id: 'rs-running', label: '실행 중\n(경과 시간 역산, 폴링 재개)', x: 480, y: 200,
    style: { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e', width: 180 },
    targetPosition: 'top' },
  { id: 'rs-cooldown', label: '쿨다운\n(정리 중, 대기)', x: 680, y: 200,
    style: { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 150 },
    targetPosition: 'top' },
  { id: 'rs-limit', label: '세션 제한 초과\n(오늘 사용 불가)', x: 860, y: 200,
    style: { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 150 },
    targetPosition: 'top' },
];

const RESTORE_EDGES: MiniFlowEdge[] = [
  { source: 'rs-click', target: 'rs-lambda', color: '#d97706' },
  { source: 'rs-lambda', target: 'rs-repo', color: '#6366f1' },
  { source: 'rs-repo', target: 'rs-count', color: '#6366f1' },
  { source: 'rs-count', target: 'rs-running', color: '#22c55e', label: '활성 세션' },
  { source: 'rs-count', target: 'rs-cooldown', dashed: true, color: '#d97706', label: '최근 종료' },
  { source: 'rs-count', target: 'rs-limit', dashed: true, color: '#dc2626', label: '한도 초과' },
];

/* ── 세션 라이프사이클 ── */

const phaseStyle = { bg: '#312e81', color: '#c4b5fd', border: '2px solid #6366f1', width: 200 };
const stepStyle = { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 200 };
const stepActiveStyle = { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e', width: 220 };
const stepDestroyStyle = { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 200 };

const LIFECYCLE_NODES: MiniFlowNode[] = [
  // Phase 1: Terraform Apply
  { id: 'lc-p1', label: 'Phase 1\nTerraform Apply (5~8분)', x: 220, y: 0,
    style: phaseStyle, sourcePosition: 'bottom' },
  { id: 'lc-dispatch', label: 'workflow_dispatch\n트리거', x: 0, y: 100,
    style: stepStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'lc-apply', label: 'terraform init + apply', x: 220, y: 100,
    style: stepStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'lc-ec2', label: '8개 EC2 생성\ncloud-init Docker 배포', x: 440, y: 100,
    style: stepStyle, targetPosition: 'top', sourcePosition: 'bottom' },

  // Phase 2: Active Runtime
  { id: 'lc-p2', label: 'Phase 2\nActive Runtime (15분)', x: 220, y: 220,
    style: { ...phaseStyle, bg: '#14532d', color: '#86efac', border: '2px solid #22c55e' }, sourcePosition: 'bottom' },
  { id: 'lc-running', label: '서비스 정상 동작', x: 0, y: 320,
    style: stepActiveStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'lc-status', label: 'INFRA_STATUS\n실시간 업데이트', x: 220, y: 320,
    style: stepActiveStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'lc-polling', label: 'Controller\n5초 간격 폴링', x: 440, y: 320,
    style: stepActiveStyle, targetPosition: 'top', sourcePosition: 'bottom' },

  // Phase 3: Terraform Destroy
  { id: 'lc-p3', label: 'Phase 3\nTerraform Destroy (2~3분)', x: 220, y: 440,
    style: { ...phaseStyle, bg: '#7f1d1d', color: '#fca5a5', border: '2px solid #dc2626' }, sourcePosition: 'bottom' },
  { id: 'lc-timer', label: '타이머 만료', x: 0, y: 540,
    style: stepDestroyStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'lc-destroy', label: 'terraform destroy\n모든 EC2 삭제', x: 220, y: 540,
    style: stepDestroyStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'lc-reset', label: 'INFRA_STATUS\n초기화', x: 440, y: 540,
    style: stepDestroyStyle, targetPosition: 'top' },
];

const LIFECYCLE_EDGES: MiniFlowEdge[] = [
  // Phase 1 → steps
  { source: 'lc-p1', target: 'lc-dispatch', color: '#6366f1' },
  { source: 'lc-p1', target: 'lc-apply', color: '#6366f1' },
  { source: 'lc-p1', target: 'lc-ec2', color: '#6366f1' },
  // steps flow
  { source: 'lc-dispatch', target: 'lc-apply', color: '#475569', dashed: true },
  { source: 'lc-apply', target: 'lc-ec2', color: '#475569', dashed: true },
  // Phase 1 → Phase 2
  { source: 'lc-ec2', target: 'lc-p2', color: '#22c55e', animated: true, label: 'SSH 완료 확인' },
  // Phase 2 → steps
  { source: 'lc-p2', target: 'lc-running', color: '#22c55e' },
  { source: 'lc-p2', target: 'lc-status', color: '#22c55e' },
  { source: 'lc-p2', target: 'lc-polling', color: '#22c55e' },
  // Phase 2 → Phase 3
  { source: 'lc-running', target: 'lc-p3', color: '#dc2626', animated: true, label: '15분 경과' },
  // Phase 3 → steps
  { source: 'lc-p3', target: 'lc-timer', color: '#dc2626' },
  { source: 'lc-p3', target: 'lc-destroy', color: '#dc2626' },
  { source: 'lc-p3', target: 'lc-reset', color: '#dc2626' },
  // steps flow
  { source: 'lc-timer', target: 'lc-destroy', color: '#475569', dashed: true },
  { source: 'lc-destroy', target: 'lc-reset', color: '#475569', dashed: true },
];

/* ── 인프라 토폴로지 ── */

const sgFrontStyle = { bg: '#1e3a5f', color: '#93c5fd', border: '2px solid #2563eb', width: 200 };
const sgAuthStyle = { bg: '#312e81', color: '#c4b5fd', border: '2px solid #6366f1', width: 180 };
const sgInfraStyle = { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e', width: 180 };
const sgServiceStyle = { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 180 };
const sgEntryStyle = { bg: '#1e293b', color: '#e2e8f0', border: '1px dashed #475569', width: 120 };

export const TOPO_NODES: MiniFlowNode[] = [
  // 1층: 진입점 → Nginx
  { id: 'topo-entry', label: 'Internet\n:80', x: 340, y: 0,
    style: sgEntryStyle, sourcePosition: 'bottom' },
  { id: 'topo-front', label: 'hamster-front\nNginx + React x4\n(:80)', x: 300, y: 100,
    style: sgFrontStyle, targetPosition: 'top', sourcePosition: 'bottom' },

  // 2층: 서비스 + Auth
  { id: 'topo-auth', label: 'hamster-auth\nKeycloak\n(:8090)', x: 0, y: 240,
    style: sgAuthStyle, targetPosition: 'top' },
  { id: 'topo-commerce', label: 'hamster-commerce\necommerce\n(:8080)', x: 200, y: 240,
    style: sgServiceStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'topo-billing', label: 'hamster-billing\ncash-gw + pg\n(:8082, :8086)', x: 400, y: 240,
    style: sgServiceStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'topo-payment', label: 'hamster-payment\npayment\n(:8083)', x: 610, y: 240,
    style: sgServiceStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'topo-support', label: 'hamster-support\nprog + noti\n(:8084, :8085)', x: 810, y: 240,
    style: sgServiceStyle, targetPosition: 'top', sourcePosition: 'bottom' },

  // 3층: 인프라
  { id: 'topo-db', label: 'hamster-db\nMySQL + MongoDB\n(:3306, :27017)', x: 260, y: 400,
    style: sgInfraStyle, targetPosition: 'top' },
  { id: 'topo-kafka', label: 'hamster-kafka\nKafka KRaft\n(:9092)', x: 540, y: 400,
    style: sgInfraStyle, targetPosition: 'top' },
];

export const TOPO_EDGES: MiniFlowEdge[] = [
  { source: 'topo-entry', target: 'topo-front', animated: true, color: '#2563eb' },
  { source: 'topo-front', target: 'topo-auth', color: '#6366f1', label: '/keycloak/*' },
  { source: 'topo-front', target: 'topo-commerce', color: '#d97706', label: '/api/ecommerce/*' },
  { source: 'topo-front', target: 'topo-billing', color: '#d97706', label: '/api/cash-gw, pg/*' },
  { source: 'topo-front', target: 'topo-payment', color: '#d97706', label: '/api/payment/*' },
  { source: 'topo-front', target: 'topo-support', color: '#d97706', label: '/api/prog, noti/*' },
  { source: 'topo-commerce', target: 'topo-db', dashed: true, color: '#22c55e' },
  { source: 'topo-billing', target: 'topo-db', dashed: true, color: '#22c55e' },
  { source: 'topo-payment', target: 'topo-db', dashed: true, color: '#22c55e' },
  { source: 'topo-support', target: 'topo-db', dashed: true, color: '#22c55e' },
  { source: 'topo-commerce', target: 'topo-kafka', dashed: true, color: '#22c55e' },
  { source: 'topo-billing', target: 'topo-kafka', dashed: true, color: '#22c55e' },
  { source: 'topo-payment', target: 'topo-kafka', dashed: true, color: '#22c55e' },
  { source: 'topo-support', target: 'topo-kafka', dashed: true, color: '#22c55e' },
];

/* ── 통합 아키텍처 (뷰어용) ── */

const ctrlStyle = { bg: '#1e3a5f', color: '#93c5fd', border: '2px solid #2563eb', width: 200 };
const lambdaStyle = { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 150 };
const repoStyle = { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 220 };
const actionsStyle = { bg: '#312e81', color: '#c4b5fd', border: '1px solid #6366f1', width: 190 };

export const UNIFIED_NODES: MiniFlowNode[] = [
  // ── Tier 0: Control Plane ──
  { id: 'u-controller', label: 'Hamster Controller\n(GitHub Pages)', x: 360, y: 0,
    style: ctrlStyle, sourcePosition: 'bottom' },

  // ── Tier 1: Pipeline ──
  { id: 'u-lambda', label: 'Lambda Proxy', x: 140, y: 110,
    style: lambdaStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'u-repo', label: 'GitHub Repository\n(INFRA_STATUS)', x: 350, y: 110,
    style: repoStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'u-actions', label: 'GitHub Actions\n(Terraform)', x: 620, y: 110,
    style: actionsStyle, targetPosition: 'top', sourcePosition: 'bottom' },

  // ── Tier 2: Entry ──
  { id: 'u-entry', label: 'Internet\n:80', x: 420, y: 260,
    style: sgEntryStyle, sourcePosition: 'bottom' },

  // ── Tier 3: Nginx ──
  { id: 'u-front', label: 'hamster-front\nNginx + React x4\n(:80)', x: 370, y: 360,
    style: sgFrontStyle, targetPosition: 'top', sourcePosition: 'bottom' },

  // ── Tier 4: Services ──
  { id: 'u-auth', label: 'hamster-auth\nKeycloak\n(:8090)', x: 40, y: 510,
    style: sgAuthStyle, targetPosition: 'top' },
  { id: 'u-commerce', label: 'hamster-commerce\necommerce\n(:8080)', x: 240, y: 510,
    style: sgServiceStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'u-billing', label: 'hamster-billing\ncash-gw + pg\n(:8082, :8086)', x: 440, y: 510,
    style: sgServiceStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'u-payment', label: 'hamster-payment\npayment\n(:8083)', x: 650, y: 510,
    style: sgServiceStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'u-support', label: 'hamster-support\nprog + noti\n(:8084, :8085)', x: 850, y: 510,
    style: sgServiceStyle, targetPosition: 'top', sourcePosition: 'bottom' },

  // ── Tier 5: Data Layer ──
  { id: 'u-db', label: 'hamster-db\nMySQL + MongoDB\n(:3306, :27017)', x: 300, y: 680,
    style: sgInfraStyle, targetPosition: 'top' },
  { id: 'u-kafka', label: 'hamster-kafka\nKafka KRaft\n(:9092)', x: 580, y: 680,
    style: sgInfraStyle, targetPosition: 'top' },
];

export const UNIFIED_EDGES: MiniFlowEdge[] = [
  // Control Plane → Pipeline
  { source: 'u-controller', target: 'u-lambda', color: '#d97706', label: 'API' },
  { source: 'u-controller', target: 'u-repo', color: '#6366f1', animated: true },
  { source: 'u-lambda', target: 'u-repo', color: '#6366f1' },
  { source: 'u-repo', target: 'u-actions', color: '#6366f1', label: 'dispatch' },
  // Actions → Infra provisioning
  { source: 'u-actions', target: 'u-front', animated: true, color: '#22c55e', label: 'Terraform Apply' },
  // Entry → Nginx
  { source: 'u-entry', target: 'u-front', animated: true, color: '#2563eb' },
  // Nginx → Services
  { source: 'u-front', target: 'u-auth', color: '#6366f1', label: '/keycloak/*' },
  { source: 'u-front', target: 'u-commerce', color: '#d97706' },
  { source: 'u-front', target: 'u-billing', color: '#d97706' },
  { source: 'u-front', target: 'u-payment', color: '#d97706' },
  { source: 'u-front', target: 'u-support', color: '#d97706' },
  // Services → Data Layer
  { source: 'u-commerce', target: 'u-db', dashed: true, color: '#22c55e' },
  { source: 'u-billing', target: 'u-db', dashed: true, color: '#22c55e' },
  { source: 'u-payment', target: 'u-db', dashed: true, color: '#22c55e' },
  { source: 'u-support', target: 'u-db', dashed: true, color: '#22c55e' },
  { source: 'u-commerce', target: 'u-kafka', dashed: true, color: '#22c55e' },
  { source: 'u-billing', target: 'u-kafka', dashed: true, color: '#22c55e' },
  { source: 'u-payment', target: 'u-kafka', dashed: true, color: '#22c55e' },
  { source: 'u-support', target: 'u-kafka', dashed: true, color: '#22c55e' },
];

/* ── 테라폼 컨텍스트 ── */

const terraformContext: TerraformContextData = {
  groups: [
    {
      label: '테라폼 정의',
      sub: 'terraform/',
      files: [
        { name: 'provider.tf', desc: 'AWS ap-northeast-2 (서울), 리전 및 프로바이더 설정' },
        { name: 'variables.tf', desc: '자격 증명, DB 비밀번호, 런타임 설정값 변수 선언' },
        { name: 'network.tf', desc: 'VPC, 3-Tier Security Groups (front-sg, auth-sg, internal-sg)' },
        { name: 'front-instance.tf', desc: 'Nginx 리버스 프록시 + React SPA x4, 유일한 퍼블릭 인스턴스' },
        { name: 'auth-instance.tf', desc: 'Keycloak 인증 서버, VPC 내부 접근만 허용' },
        { name: 'db-instance.tf', desc: 'MySQL 8.0 (8개 스키마) + MongoDB 7.0' },
        { name: 'kafka-instance.tf', desc: 'Kafka 7.5 KRaft 단일 브로커, ZooKeeper 없음' },
        { name: 'commerce-instance.tf', desc: 'ecommerce-service 단독 인스턴스' },
        { name: 'billing-instance.tf', desc: 'cash-gateway + hamster-pg, Self IP 루프백 통신' },
        { name: 'payment-instance.tf', desc: 'payment-service 단독 인스턴스' },
        { name: 'support-instance.tf', desc: 'progression + notification 동시 배포' },
        { name: 'cloud-init-check.tf', desc: 'null_resource로 8개 인스턴스 cloud-init 병렬 완료 검증' },
        { name: 'seed-data.tf', desc: '초기 데이터 투입 트리거, 모든 인스턴스 준비 후 실행' },
        { name: 'outputs.tf', desc: '인프라 리포트 출력 (IP, 상태, 리소스 요약)' },
      ],
    },
    {
      label: '배포 스크립트',
      sub: 'terraform/scripts/',
      files: [
        { name: 'deploy-template.sh', desc: '템플릿 메소드 패턴 — 공통 오케스트레이션 (스왑, Docker, 상태 리포트)' },
        { name: 'report-status.sh', desc: 'GitHub Variables API로 인스턴스 상태 실시간 보고 라이브러리' },
        { name: 'db.sh', desc: 'MySQL 8개 스키마 생성 + MongoDB 초기화, SELECT 1 readiness 체크' },
        { name: 'kafka.sh', desc: 'KRaft 모드 설정, Private IP 동적 바인딩 (advertised.listeners)' },
        { name: 'auth.sh', desc: 'Keycloak 23.0 + Realm JSON 자동 임포트' },
        { name: 'commerce.sh', desc: 'ecommerce-service 배포, 200MB JVM 힙' },
        { name: 'billing.sh', desc: 'cash-gateway (300MB) + hamster-pg (150MB), Self IP 루프백 설정' },
        { name: 'payment.sh', desc: 'payment-service 배포, 300MB JVM 힙' },
        { name: 'support.sh', desc: 'progression (150MB) + notification (150MB) 동시 배포' },
        { name: 'front.sh', desc: 'Nginx 동적 설정 생성, React SPA Docker 추출, 리버스 프록시 라우트' },
        { name: 'seed-data.sh', desc: '의존성 체인 기반 초기 데이터 투입 (가맹점, 상품, 쿠폰)' },
      ],
    },
  ],
};

/* ── 인프라 토폴로지 컨텍스트 ── */

const infraTopology: InfraTopologyData = {
  diagram: {
    nodes: TOPO_NODES,
    edges: TOPO_EDGES,
    height: 520,
  },
  securityGroups: [
    {
      name: 'front-sg',
      accessLevel: 'Public',
      ports: ':80 HTTP, :22 SSH',
      color: {
        dot: 'bg-blue-400',
        name: 'text-blue-400',
        badge: 'bg-blue-900/30 text-blue-400',
        border: 'border-blue-900/30',
        bg: 'bg-blue-950/10',
      },
    },
    {
      name: 'auth-sg',
      accessLevel: 'VPC + SSH',
      ports: ':8090 Keycloak',
      color: {
        dot: 'bg-purple-400',
        name: 'text-purple-400',
        badge: 'bg-purple-900/30 text-purple-400',
        border: 'border-purple-900/30',
        bg: 'bg-purple-950/10',
      },
    },
    {
      name: 'internal-sg',
      accessLevel: 'VPC only',
      ports: ':3306 :27017 :9092-9093 :8080-8086',
      color: {
        dot: 'bg-green-400',
        name: 'text-green-400',
        badge: 'bg-green-900/30 text-green-400',
        border: 'border-green-900/30',
        bg: 'bg-green-950/10',
      },
    },
  ],
  sgCallout: '각 보안 그룹의 인바운드·아웃바운드 규칙과 실제 적용 결과는 뷰어의 플랜 리포트에서 확인할 수 있습니다.',
  instanceNote: '공통: t3.micro (vCPU 2, RAM 1GB), 8GB gp3, 2GB 스왑. Terraform이 Private IP를 cloud-init에 주입하여 서비스 간 통신을 설정합니다.',
  instances: [
    {
      name: 'hamster-front',
      desc: '유일한 퍼블릭 진입점. 경로 기반 리버스 프록시 + 정적 SPA 서빙.',
      apps: [
        { name: 'Nginx 리버스 프록시', port: ':80', desc: '/keycloak/* → auth:8090\n/api/ecommerce/* → commerce:8080\n/api/cash-gateway/* → billing:8082\n/api/hamster-pg/* → billing:8086\n/api/payment/* → payment:8083\n/api/progression/* → support:8084\n/api/notification/* → support:8085' },
        { name: 'ecommerce (React SPA)', desc: '일반 사용자 쇼핑몰 프론트엔드' },
        { name: 'content-creator (React SPA)', desc: '가맹점 상품·주문 관리 프론트엔드' },
        { name: 'internal-admin (React SPA)', desc: '내부 관리자 대시보드' },
      ],
    },
    {
      name: 'hamster-auth',
      apps: [
        { name: 'Keycloak 23.0', port: ':8090' },
      ],
    },
    {
      name: 'hamster-db',
      apps: [
        { name: 'MySQL 8.0', port: ':3306' },
        { name: 'MongoDB 7.0', port: ':27017' },
      ],
    },
    {
      name: 'hamster-kafka',
      apps: [
        { name: 'Kafka 7.5 KRaft', port: ':9092' },
      ],
    },
    {
      name: 'hamster-commerce',
      apps: [
        { name: 'ecommerce-service', port: ':8080', desc: '일반 사용자 쇼핑몰 서비스' },
      ],
    },
    {
      name: 'hamster-billing',
      desc: '두 서비스를 운영하며 Self IP 루프백으로 통신.',
      apps: [
        { name: 'cash-gateway-service', port: ':8082', desc: 'PG 프로토콜 추상화 서비스' },
        { name: 'hamster-pg-service', port: ':8086', desc: '외부 더미 PG사, 시뮬레이션' },
      ],
    },
    {
      name: 'hamster-payment',
      apps: [
        { name: 'payment-service', port: ':8083', desc: '이벤트 소싱 기반 결제·재고·잔액 관리 서비스' },
      ],
    },
    {
      name: 'hamster-support',
      apps: [
        { name: 'progression-service', port: ':8084', desc: '진행도 추적 서비스' },
        { name: 'notification-service', port: ':8085', desc: '실패 이벤트 수집 서비스' },
      ],
    },
  ],
  instanceCallout: '각 인스턴스의 리소스 할당, 스토리지, cloud-init 스크립트 등 상세 스펙은 뷰어의 플랜 리포트에서 확인할 수 있습니다.',
};

/* ── Story 1: 순환 참조 토폴로지 ── */

// 문제: front(Keycloak + Nginx) ↔ 백엔드 순환 참조 — 빙글 도는 의존성
const circularNodeStyle = { bg: '#7f1d1d', color: '#fca5a5', border: '2px solid #dc2626', width: 180 };
const circularDepStyle = { bg: '#450a0a', color: '#f87171', border: '1px dashed #dc2626', width: 150 };

const CIRCULAR_PROBLEM_NODES: MiniFlowNode[] = [
  // 왼쪽: front
  { id: 'cp-front', label: 'hamster-front\nKeycloak + Nginx', x: 0, y: 100,
    style: circularNodeStyle, sourcePosition: 'top', targetPosition: 'bottom' },
  // 오른쪽: 백엔드
  { id: 'cp-backend', label: '백엔드 서비스\ncommerce, billing ...', x: 420, y: 100,
    style: circularNodeStyle, sourcePosition: 'bottom', targetPosition: 'top' },
  // 위쪽 경로: front → (Nginx에 백엔드 IP 필요) → backend
  { id: 'cp-need-ip', label: 'Nginx conf 생성에\n백엔드 IP 필요', x: 190, y: 0,
    style: circularDepStyle, targetPosition: 'left', sourcePosition: 'right' },
  // 아래쪽 경로: backend → (JWT에 Keycloak IP 필요) → front
  { id: 'cp-need-auth', label: 'JWT issuer-uri에\nKeycloak IP 필요', x: 190, y: 210,
    style: circularDepStyle, targetPosition: 'right', sourcePosition: 'left' },
];
const CIRCULAR_PROBLEM_EDGES: MiniFlowEdge[] = [
  // 위쪽 순환: front → 의존 → backend
  { source: 'cp-front', target: 'cp-need-ip', color: '#dc2626', animated: true },
  { source: 'cp-need-ip', target: 'cp-backend', color: '#dc2626', animated: true },
  // 아래쪽 순환: backend → 의존 → front
  { source: 'cp-backend', target: 'cp-need-auth', color: '#dc2626', animated: true },
  { source: 'cp-need-auth', target: 'cp-front', color: '#dc2626', animated: true },
];

// 해결: auth 분리 → 단방향 의존성
const CIRCULAR_RESOLVED_NODES: MiniFlowNode[] = [
  { id: 'cr-auth', label: 'hamster-auth\nKeycloak', x: 200, y: 0,
    style: { bg: '#312e81', color: '#c4b5fd', border: '2px solid #6366f1', width: 160 },
    sourcePosition: 'bottom' },
  { id: 'cr-front', label: 'hamster-front\nNginx', x: 0, y: 130,
    style: { bg: '#1e3a5f', color: '#93c5fd', border: '2px solid #2563eb', width: 160 },
    targetPosition: 'top' },
  { id: 'cr-backend', label: '백엔드 서비스', x: 400, y: 130,
    style: { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 160 },
    targetPosition: 'top' },
];
const CIRCULAR_RESOLVED_EDGES: MiniFlowEdge[] = [
  { source: 'cr-auth', target: 'cr-front', color: '#6366f1', label: 'auth IP' },
  { source: 'cr-auth', target: 'cr-backend', color: '#6366f1', label: 'auth IP' },
  { source: 'cr-front', target: 'cr-backend', color: '#d97706', dashed: true, label: '백엔드 IP → Nginx' },
];

// Story 1 타임라인
const STORY_1_CIRCULAR_DEP: TimelineStory = {
  title: 'Null Resource와 순환 참조 분리',
  subtitle: '비용 절감 시도 → 구조적 문제 인식 → 인스턴스 분리',
  stages: [
    {
      label: '비용 절감을 위한 인스턴스 통합',
      type: 'problem',
      content: (
        <div className="space-y-3">
          <div>프리티어 한도를 최대한 활용하기 위해, Keycloak을 front 인스턴스에 함께 배포하려 했습니다. 그런데 Terraform 의존성 그래프에서 순환 참조가 발생했습니다.</div>
          <DocMiniFlow nodes={CIRCULAR_PROBLEM_NODES} edges={CIRCULAR_PROBLEM_EDGES} direction="LR" height={280} />
          <div>front는 백엔드 IP가 있어야 Nginx conf를 생성할 수 있고, 백엔드는 front IP가 있어야 Keycloak JWT issuer-uri를 설정할 수 있습니다. 두 리소스가 서로를 필요로 하는 순환 의존 상태가 발생하였습니다.</div>
        </div>
      ),
    },
    {
      label: 'null_resource SSH 후처리로 우회',
      type: 'attempt',
      content: (
        <div className="space-y-3">
          <div>Terraform 의존성 그래프를 우회하기 위해, front 인스턴스를 Nginx 설정 없이 먼저 띄우고, 모든 백엔드가 올라온 뒤 null_resource로 SSH 접속하여 Nginx conf를 주입했습니다.</div>
          <DocCode language="hcl">{`resource "null_resource" "nginx_proxy" {
  depends_on = [
    aws_instance.commerce,
    aws_instance.billing,
    aws_instance.payment,
    aws_instance.support
  ]

  provisioner "remote-exec" {
    # 모든 백엔드 생성 후, SSH로 front에 접속하여
    # 백엔드 IP를 Nginx 설정에 주입
    inline = ["sudo bash /tmp/nginx-proxy.sh ..."]

    connection {
      host = aws_instance.front.public_ip
    }
  }
}`}</DocCode>
        </div>
      ),
    },
    {
      label: '순환 참조 자체가 구조적 문제',
      type: 'limitation',
      content: (
        <div className="space-y-2">
          <div>동작은 했지만, 근본적인 문제를 재고했습니다. 백엔드가 프론트의 IP를 알아야 하는 이유는 오직 Keycloak이 프론트에 있기 때문이었습니다. 백엔드의 프론트 의존이 Keycloak에 의한 것이라면, Keycloak은 프론트 인스턴스에 존재해서는 안 된다고 판단했습니다.</div>
          <div>t3.micro 하나를 절약하기 위해 모든 백엔드가 프론트에 결합되는 구조가, 정말 이런 구조가 적은 비용인지 고민하게 되었습니다.</div>
        </div>
      ),
    },
    {
      label: 'Keycloak 전용 인스턴스 분리',
      type: 'resolution',
      content: (
        <div className="space-y-3">
          <div>Keycloak을 별도 인스턴스(hamster-auth)로 분리하여 순환 참조를 제거했습니다. 의존성 그래프가 단방향으로 정리됩니다.</div>
          <DocMiniFlow nodes={CIRCULAR_RESOLVED_NODES} edges={CIRCULAR_RESOLVED_EDGES} direction="TB" height={220} />
          <DocCode language="hcl">{`# 현재: front-instance.tf — 직접 IP 주입
resource "aws_instance" "front" {
  user_data = templatefile("scripts/deploy-template.sh", {
    deploy_script = templatefile("scripts/front.sh", {
      COMMERCE_PRIVATE_IP = aws_instance.commerce.private_ip
      BILLING_PRIVATE_IP  = aws_instance.billing.private_ip
      PAYMENT_PRIVATE_IP  = aws_instance.payment.private_ip
      SUPPORT_PRIVATE_IP  = aws_instance.support.private_ip
      AUTH_PRIVATE_IP     = aws_instance.auth.private_ip
    })
  })
}`}</DocCode>
          <div className="text-xs text-gray-500">nginx-proxy.tf, nginx-proxy.sh 삭제. null_resource SSH 후처리 제거.</div>
        </div>
      ),
    },
    {
      label: '3-Tier Security Group 구조 확립',
      type: 'result',
      content: (
        <div className="space-y-2">
          <div>인스턴스 분리와 함께 보안 그룹도 3계층으로 정리되었습니다.</div>
          <div className="text-xs font-mono text-gray-500 space-y-0.5">
            <div><span className="text-blue-400">front-sg</span> — Public (0.0.0.0/0) :80 :22</div>
            <div><span className="text-purple-400">auth-sg</span> — VPC 내부 (172.31.0.0/16) :8090 + SSH</div>
            <div><span className="text-green-400">internal-sg</span> — VPC 내부 :3306 :27017 :9092 :8080-8086</div>
          </div>
        </div>
      ),
    },
  ],
};

/* ── Story 1.5: 실시간 상태 리포팅 토폴로지 ── */

// 문제: Actions 로그는 워크플로우 complete 후에만 접근 가능
const LOG_PROBLEM_NODES: MiniFlowNode[] = [
  { id: 'lp-ctrl', label: 'Hamster Controller\n(상태 추적 필요)', x: 0, y: 50,
    style: { bg: '#1e3a5f', color: '#93c5fd', border: '2px solid #2563eb', width: 200 },
    sourcePosition: 'right' },
  { id: 'lp-actions', label: 'GitHub Actions\n(실행 중)', x: 300, y: 0,
    style: { bg: '#312e81', color: '#c4b5fd', border: '1px solid #6366f1', width: 170 },
    targetPosition: 'left', sourcePosition: 'right' },
  { id: 'lp-log', label: 'Actions 로그\n(접근 불가)', x: 560, y: 0,
    style: { bg: '#7f1d1d', color: '#fca5a5', border: '2px dashed #dc2626', width: 150 },
    targetPosition: 'left' },
  { id: 'lp-ec2', label: '8 x EC2\n(provisioning...)', x: 300, y: 120,
    style: { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e', width: 170 },
    targetPosition: 'left' },
  { id: 'lp-label', label: '워크플로우 complete 전까지\n로그 접근 불가', x: 470, y: 55,
    style: { bg: 'transparent', color: '#f87171', border: 'none', width: 200 } },
];
const LOG_PROBLEM_EDGES: MiniFlowEdge[] = [
  { source: 'lp-ctrl', target: 'lp-actions', color: '#6366f1', label: '상태 조회?' },
  { source: 'lp-actions', target: 'lp-log', color: '#dc2626', dashed: true, label: '차단' },
  { source: 'lp-actions', target: 'lp-ec2', color: '#22c55e', animated: true },
];

// 해결: EC2 → GitHub Variables → Controller 폴링
const STATUS_PUSH_NODES: MiniFlowNode[] = [
  { id: 'sp-ec2', label: 'EC2 인스턴스\n(deploy-template.sh)', x: 0, y: 50,
    style: { bg: '#14532d', color: '#86efac', border: '2px solid #22c55e', width: 200 },
    sourcePosition: 'right' },
  { id: 'sp-var', label: 'GitHub Variables\nINFRA_STATUS', x: 300, y: 50,
    style: { bg: '#1e293b', color: '#e2e8f0', border: '2px solid #475569', width: 190 },
    targetPosition: 'left', sourcePosition: 'right' },
  { id: 'sp-ctrl', label: 'Hamster Controller\n(5초 폴링)', x: 600, y: 50,
    style: { bg: '#1e3a5f', color: '#93c5fd', border: '2px solid #2563eb', width: 180 },
    targetPosition: 'left' },
  { id: 'sp-merge', label: 'GET → merge\n→ PATCH × 3', x: 130, y: 140,
    style: { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 150 },
    targetPosition: 'top' },
];
const STATUS_PUSH_EDGES: MiniFlowEdge[] = [
  { source: 'sp-ec2', target: 'sp-var', color: '#22c55e', animated: true, label: 'push_infra_status' },
  { source: 'sp-var', target: 'sp-ctrl', color: '#2563eb', animated: true, label: '상태 폴링' },
  { source: 'sp-ec2', target: 'sp-merge', color: '#d97706', dashed: true },
];

// 템플릿 메소드 구조
const TEMPLATE_NODES: MiniFlowNode[] = [
  { id: 'tm-template', label: 'deploy-template.sh\n(횡단 관심사)', x: 0, y: 0,
    style: { bg: '#312e81', color: '#c4b5fd', border: '2px solid #6366f1', width: 210 },
    sourcePosition: 'bottom' },
  { id: 'tm-swap', label: '스왑 설정\njq 설치', x: 0, y: 110,
    style: { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 130 },
    targetPosition: 'top' },
  { id: 'tm-status', label: 'push_infra_status\nreport_status', x: 170, y: 110,
    style: { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 160 },
    targetPosition: 'top' },
  { id: 'tm-deploy', label: 'deploy.sh 실행\n(비즈니스 로직)', x: 370, y: 110,
    style: { bg: '#14532d', color: '#86efac', border: '2px solid #22c55e', width: 160 },
    targetPosition: 'top' },
  { id: 'tm-verify', label: 'Docker 상태 확인\n최종 리포트', x: 560, y: 110,
    style: { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 160 },
    targetPosition: 'top' },
  { id: 'tm-biz', label: 'commerce.sh\nbilling.sh\npayment.sh ...', x: 370, y: 220,
    style: { bg: '#14532d', color: '#86efac', border: '1px dashed #22c55e', width: 160 },
    targetPosition: 'top' },
];
const TEMPLATE_EDGES: MiniFlowEdge[] = [
  { source: 'tm-template', target: 'tm-swap', color: '#475569' },
  { source: 'tm-template', target: 'tm-status', color: '#d97706' },
  { source: 'tm-template', target: 'tm-deploy', color: '#22c55e' },
  { source: 'tm-template', target: 'tm-verify', color: '#d97706' },
  { source: 'tm-deploy', target: 'tm-biz', color: '#22c55e', dashed: true, label: '주입' },
];

const STORY_STATUS_REPORTING: TimelineStory = {
  title: '실시간 상태 리포팅',
  subtitle: 'Actions 로그 접근 불가 → EC2 직접 상태 push → 횡단 관심 분리 (템플릿 메소드)',
  stages: [
    {
      label: 'GitHub Actions 로그에 실시간 접근 불가',
      type: 'problem',
      content: (
        <div className="space-y-3">
          <div>Hamster Controller가 인프라 상태를 실시간으로 추적해야 했습니다. GitHub Actions 워크플로우가 Terraform을 실행하므로, Actions 로그에서 진행 상황을 읽으려 했습니다.</div>
          <DocMiniFlow nodes={LOG_PROBLEM_NODES} edges={LOG_PROBLEM_EDGES} direction="LR" height={200} />
          <div>그러나 GitHub Actions API는 워크플로우가 complete 상태가 되어야만 로그에 접근할 수 있었습니다. 워크플로우가 실행 중인 동안에는 각 인스턴스의 provisioning 상태를 알 수 없었습니다.</div>
        </div>
      ),
    },
    {
      label: 'EC2가 직접 GitHub Variables로 상태 push',
      type: 'resolution',
      content: (
        <div className="space-y-3">
          <div>Actions 로그를 읽는 대신, 각 EC2 인스턴스가 직접 GitHub Variables API로 자신의 상태를 push하도록 했습니다. INFRA_STATUS 변수 하나에 8개 인스턴스의 상태를 JSON으로 merge합니다.</div>
          <DocMiniFlow nodes={STATUS_PUSH_NODES} edges={STATUS_PUSH_EDGES} direction="LR" height={200} />
          <div>상태 리포팅, 스왑 설정, Docker 상태 검증 등은 모든 인스턴스의 공통 관심사이므로 deploy-template.sh에 템플릿 메소드 패턴으로 분리했습니다. 실제 배포 스크립트는 비즈니스 로직만 담당합니다.</div>
          <DocMiniFlow nodes={TEMPLATE_NODES} edges={TEMPLATE_EDGES} direction="TB" height={290} />
          <DocCode language="hcl">{`# billing-instance.tf — 인스턴스 정의
resource "aws_instance" "billing" {
  user_data = templatefile("scripts/deploy-template.sh", {
    deploy_script = templatefile("scripts/billing.sh", { ... })
    #                            ^^^^^^^^^^^^^^^^^^^^^^^^
    #                            비즈니스 로직이 템플릿에 주입됨
  })
}`}</DocCode>
          <DocCode language="bash">{`# deploy-template.sh — 횡단 관심사 (템플릿 메소드)
push_infra_status "provisioning"        # 상태 리포트: 가동 시작
# ... 스왑 설정, jq 설치 ...
bash /tmp/deploy.sh                     # 주입된 비즈니스 로직 실행
# ... Docker 컨테이너 상태 확인 ...
push_infra_status "running"             # 상태 리포트: 가동 완료`}</DocCode>
          <DocCode language="bash">{`# billing.sh — 비즈니스 로직만 담당
docker run -d --name cash-gateway ...
docker run -d --name hamster-pg ...
# 횡단 관심사(상태 리포트, 스왑, 검증)는 template이 처리하므로 신경 쓰지 않음`}</DocCode>
          <DocCallout code={`push_infra_status() {
  for i in 1 2 3; do           # 3회 retry
    GET   → 현재 INFRA_STATUS 읽기
    merge → 자기 인스턴스 상태만 갱신
    PATCH → 덮어쓰기
    sleep 1
  done
}`}>
            8개 인스턴스가 동시에 하나의 GitHub Variable을 업데이트하므로, GET-merge-PATCH 사이에 다른 인스턴스의 쓰기가 끼어들 수 있습니다. 실제로 발생하는지는 확인하지 못했지만, 구조적으로 가능성이 있다고 판단하여 3회 반복으로 최신 값 기반 덮어쓰기를 시도합니다.
          </DocCallout>
        </div>
      ),
    },
    {
      label: '서버 없는 정적 페이지에서 인프라 상태 복원',
      type: 'result',
      content: (
        <div className="space-y-2">
          <div>결과적으로 Hamster Controller는 서버도 상태도 없는 정적 페이지이지만, GitHub Variables를 폴링하여 새로고침 후에도 현재 인프라 상태를 복원하고 표시할 수 있습니다. 각 배포 스크립트는 횡단 관심사를 전혀 고려하지 않고 비즈니스 로직만 작성하면 됩니다.</div>
        </div>
      ),
    },
  ],
};

/* ── Story 2: MySQL 이중 기동 토폴로지 ── */

// MySQL 이중 기동 과정
const MYSQL_BOOT_NODES: MiniFlowNode[] = [
  { id: 'mb-start', label: 'docker run mysql', x: 0, y: 60,
    style: { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 160 },
    sourcePosition: 'right' },
  { id: 'mb-temp', label: 'Temporary Server\n(시스템 테이블 초기화)', x: 220, y: 0,
    style: { bg: '#92400e', color: '#fcd34d', border: '2px solid #d97706', width: 200 },
    sourcePosition: 'right', targetPosition: 'left' },
  { id: 'mb-ping', label: 'mysqladmin ping\n→ 응답함 (함정)', x: 220, y: 120,
    style: { bg: '#7f1d1d', color: '#fca5a5', border: '2px dashed #dc2626', width: 200 },
    targetPosition: 'left' },
  { id: 'mb-shutdown', label: '임시 서버 종료', x: 480, y: 0,
    style: { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 140 },
    sourcePosition: 'right', targetPosition: 'left' },
  { id: 'mb-prod', label: 'Production Server\n(진짜 기동)', x: 680, y: 0,
    style: { bg: '#14532d', color: '#86efac', border: '2px solid #22c55e', width: 180 },
    targetPosition: 'left' },
];
const MYSQL_BOOT_EDGES: MiniFlowEdge[] = [
  { source: 'mb-start', target: 'mb-temp', color: '#d97706' },
  { source: 'mb-start', target: 'mb-ping', color: '#dc2626', dashed: true },
  { source: 'mb-temp', target: 'mb-shutdown', color: '#dc2626' },
  { source: 'mb-shutdown', target: 'mb-prod', color: '#22c55e', animated: true },
];

// 최종 일관성 수렴
const EVENTUAL_NODES: MiniFlowNode[] = [
  { id: 'ev-svc', label: '서비스 컨테이너\n(Spring Boot)', x: 0, y: 60,
    style: { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 180 },
    sourcePosition: 'right' },
  { id: 'ev-crash', label: 'JDBC 실패\ncrash', x: 240, y: 0,
    style: { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 120 },
    sourcePosition: 'right', targetPosition: 'left' },
  { id: 'ev-restart', label: 'Docker\nauto-restart', x: 420, y: 0,
    style: { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 140 },
    sourcePosition: 'right', targetPosition: 'left' },
  { id: 'ev-db', label: 'DB ready', x: 240, y: 120,
    style: { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e', width: 120 },
    targetPosition: 'left', sourcePosition: 'right' },
  { id: 'ev-ok', label: '정상 연결\n수렴', x: 420, y: 120,
    style: { bg: '#14532d', color: '#86efac', border: '2px solid #22c55e', width: 140 },
    targetPosition: 'left' },
];
const EVENTUAL_EDGES: MiniFlowEdge[] = [
  { source: 'ev-svc', target: 'ev-crash', color: '#dc2626', label: 'DB 미준비' },
  { source: 'ev-crash', target: 'ev-restart', color: '#475569' },
  { source: 'ev-restart', target: 'ev-svc', color: '#d97706', dashed: true },
  { source: 'ev-svc', target: 'ev-db', color: '#22c55e', label: 'DB 준비됨' },
  { source: 'ev-db', target: 'ev-ok', color: '#22c55e', animated: true },
];

const STORY_2_MYSQL_DUAL_BOOT: TimelineStory = {
  title: 'MySQL 이중 기동과 최종 일관성',
  subtitle: '애플리케이션 기동 실패 → 원인 분석 → Docker restart로 자연 수렴',
  stages: [
    {
      label: '서비스 기동 시 JDBC 연결 실패',
      type: 'problem',
      content: (
        <div className="space-y-2">
          <div>Terraform apply 후 애플리케이션이 올라오지 않는 현상이 발생했습니다. Spring Boot가 DB 연결에 실패하면서 Hibernate DDL 자동 생성이 동작하지 않았고, 서비스가 crash하는 상황이었습니다.</div>
          <div>Terraform의 depends_on은 EC2가 "running" 상태인 것만 보장할 뿐, 그 위의 Docker 컨테이너가 ready인지는 알 수 없었습니다.</div>
        </div>
      ),
    },
    {
      label: 'MySQL Temporary Server — 이중 기동의 함정',
      type: 'attempt',
      content: (
        <div className="space-y-3">
          <div>MySQL Docker 이미지는 최초 실행 시 "이중 기동" 과정을 거칩니다. 문제는 임시 서버(Temporary Server)도 ping에 응답한다는 것입니다.</div>
          <DocMiniFlow nodes={MYSQL_BOOT_NODES} edges={MYSQL_BOOT_EDGES} direction="LR" height={200} />
          <div>mysqladmin ping은 2단계(임시 서버)에서도 응답하므로, "DB가 떴다"고 판단한 후 CREATE DATABASE를 실행하면 3단계(종료 후 재시작) 타이밍에 걸려 Access denied가 발생했습니다.</div>
        </div>
      ),
    },
    {
      label: '의존성 상태 파악이 문제 해결에 도움이 되지 않음',
      type: 'limitation',
      content: (
        <div className="space-y-3">
          <div>db.sh에서 SELECT 1로 실제 인증+쿼리 성공 여부를 확인하는 것으로 DB 스키마 생성 문제는 해결했습니다.</div>
          <DocCode language="bash">{`# db.sh — SELECT 1로 진짜 ready 확인
for i in $(seq 1 30); do
  if docker exec mysql mysql -uroot -p"$ROOT_PW" \\
     -e "SELECT 1" >/dev/null 2>&1; then
    echo "MySQL 완전 기동 확인 (\${i}회차)"
    break
  fi
  sleep 2
done`}</DocCode>
          <div>하지만 다른 배포 스크립트가 어떤 의존이 충족되었는지 파악하려는 방향 자체가 문제 해결에 크게 도움이 되지 않았습니다. DB가 준비되어도 Kafka가 안 떴을 수 있고, Kafka가 떴어도 다른 서비스가 안 떴을 수 있습니다.</div>
          <div>오히려 데이터베이스를 온전히 처리할 수 없는 상태라면 애플리케이션이 crash하게 두고, Docker restart로 최종 일관성을 기대하는 것이 더 적합한 구조라고 판단했습니다. Kafka EDA 아키텍처에서 consumer lag은 컨슈머 부착 시 자연스럽게 소모된다는 전제도 이 판단을 뒷받침했습니다.</div>
        </div>
      ),
    },
    {
      label: 'Docker restart policy + 자연 수렴',
      type: 'resolution',
      content: (
        <div className="space-y-3">
          <div>모든 Docker 컨테이너에 <code className="text-amber-400 text-xs">--restart unless-stopped</code>를 적용했습니다. 명시적 순서 제어 대신, "언젠가 모두 뜬다"는 최종 일관성 전략입니다.</div>
          <DocMiniFlow nodes={EVENTUAL_NODES} edges={EVENTUAL_EDGES} direction="LR" height={200} />
          <DocCode language="bash">{`# billing.sh — restart policy로 최종 일관성
# Terraform depends_on은 EC2 running만 보장
# → DB CREATE 완료 전 서비스 기동될 수 있음
# → crash 시 Docker가 자동 재시작하여 자연 수렴

docker run -d --name cash-gateway \\
  --restart unless-stopped \\
  -e DB_HOST=\${DB_PRIVATE_IP} \\
  -e KAFKA_HOST=\${KAFKA_PRIVATE_IP} \\
  -e KEYCLOAK_HOST=\${AUTH_PRIVATE_IP} \\
  ghcr.io/gtypeid/hamster-cash-gateway:latest`}</DocCode>
        </div>
      ),
    },
    {
      label: 'EDA 아키텍처와의 정합성',
      type: 'result',
      content: (
        <div className="space-y-2">
          <div>이 방식이 가능한 근거는 햄스터 월드가 이벤트 드리븐 아키텍처이기 때문입니다. Kafka consumer lag은 컨슈머가 부착되면 자연스럽게 소모됩니다. 동기 HTTP 호출이 아닌 비동기 이벤트 기반이므로, 일시적 서비스 불가 상태가 데이터 유실로 이어지지 않습니다.</div>
        </div>
      ),
    },
  ],
};

/* ── Story 3: Provisioner 병렬화 토폴로지 ── */

// 순차 대기 (provisioner가 인스턴스에 붙은 경우)
const SEQ_PROV_NODES: MiniFlowNode[] = [
  { id: 'sp-db', label: 'db\ncloud-init ~3분', x: 0, y: 50,
    style: { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 160 },
    sourcePosition: 'right' },
  { id: 'sp-auth', label: 'auth\ncloud-init ~2분', x: 220, y: 50,
    style: { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 160 },
    sourcePosition: 'right', targetPosition: 'left' },
  { id: 'sp-svc', label: 'commerce, billing\npayment, support ...', x: 440, y: 50,
    style: { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 180 },
    sourcePosition: 'right', targetPosition: 'left' },
  { id: 'sp-front', label: 'front\ncloud-init ~2분', x: 680, y: 50,
    style: { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 160 },
    targetPosition: 'left' },
  { id: 'sp-time', label: '순차 합산 ~25분', x: 300, y: 140,
    style: { bg: 'transparent', color: '#f87171', border: 'none', width: 160 } },
];
const SEQ_PROV_EDGES: MiniFlowEdge[] = [
  { source: 'sp-db', target: 'sp-auth', color: '#dc2626', label: '대기' },
  { source: 'sp-auth', target: 'sp-svc', color: '#dc2626', label: '대기' },
  { source: 'sp-svc', target: 'sp-front', color: '#dc2626', label: '대기' },
];

// 병렬 체크 (null_resource 분리)
const PAR_PROV_NODES: MiniFlowNode[] = [
  { id: 'pp-create', label: 'EC2 생성\n(순차, IP 참조)', x: 0, y: 80,
    style: { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 180 },
    sourcePosition: 'right' },
  { id: 'pp-db', label: 'null_resource\ncloud_init_db', x: 280, y: 0,
    style: { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e', width: 170 },
    targetPosition: 'left' },
  { id: 'pp-auth', label: 'null_resource\ncloud_init_auth', x: 280, y: 55,
    style: { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e', width: 170 },
    targetPosition: 'left' },
  { id: 'pp-svc', label: 'null_resource\ncloud_init_*  (x6)', x: 280, y: 110,
    style: { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e', width: 170 },
    targetPosition: 'left' },
  { id: 'pp-done', label: '전체 완료\n~5분', x: 520, y: 55,
    style: { bg: '#14532d', color: '#86efac', border: '2px solid #22c55e', width: 120 },
    targetPosition: 'left' },
];
const PAR_PROV_EDGES: MiniFlowEdge[] = [
  { source: 'pp-create', target: 'pp-db', color: '#22c55e' },
  { source: 'pp-create', target: 'pp-auth', color: '#22c55e' },
  { source: 'pp-create', target: 'pp-svc', color: '#22c55e' },
  { source: 'pp-db', target: 'pp-done', color: '#22c55e', animated: true },
  { source: 'pp-auth', target: 'pp-done', color: '#22c55e', animated: true },
  { source: 'pp-svc', target: 'pp-done', color: '#22c55e', animated: true },
];

const STORY_3_PARALLEL_PROVISIONER: TimelineStory = {
  title: 'Provisioner 병렬화',
  subtitle: 'Apply 실패 미감지 → provisioner 추가 → 의도치 않은 순차 실행 → 병렬 전환',
  stages: [
    {
      label: 'cloud-init 실패 시 destroy로 향하지 않음',
      type: 'problem',
      content: (
        <div className="space-y-2">
          <div>GitHub Actions 워크플로우는 terraform apply 후 일정 시간 대기, 이후 terraform destroy까지 항상 실행되는 구조입니다. 배포 과정에 문제가 생기면 결국 destroy로 향해야 합니다.</div>
          <div>그런데 Terraform은 user_data(cloud-init)를 "실행했다"는 사실만 추적하고, 그 결과가 성공인지 실패인지는 알 수 없었습니다. MySQL 이중 기동 문제에서 애플리케이션이 온전히 가동되지 못했는데도, Terraform apply가 실패로 향하지 않아 destroy가 트리거되지 않았습니다.</div>
        </div>
      ),
    },
    {
      label: '인스턴스에 provisioner 부착',
      type: 'attempt',
      content: (
        <div className="space-y-3">
          <div>각 인스턴스 리소스에 remote-exec provisioner를 직접 추가하여, cloud-init이 완료될 때까지 SSH로 대기하도록 했습니다.</div>
          <DocCode language="hcl">{`# 이전: 인스턴스에 직접 provisioner 부착
resource "aws_instance" "commerce" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  # ...

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
  }
}`}</DocCode>
          <div>cloud-init이 실패하면(exit 1) provisioner도 실패하고, terraform apply 전체가 실패하게 되어 감지 문제는 해결되었습니다.</div>
        </div>
      ),
    },
    {
      label: '의존성 그래프에 의한 순차 대기 (~25분)',
      type: 'limitation',
      content: (
        <div className="space-y-3">
          <div>provisioner가 인스턴스 리소스에 부착되면서, 의도치 않게 서비스 인스턴스 간의 순차적 가동이 보증되었습니다. cloud-init이 완료되어야 해당 인스턴스가 "생성 완료"로 처리되고, 다른 인스턴스가 이 IP를 참조하면 의존성 그래프에 의해 순차 대기가 발생합니다. 안정성이라는 트레이드오프를 획득한 셈이었습니다.</div>
          <DocMiniFlow nodes={SEQ_PROV_NODES} edges={SEQ_PROV_EDGES} direction="LR" height={190} />
          <div>다만 현재로서의 판단은, 세션이 오래 지속될 수 없다는 점과 위의 최종 일관성에 수렴한다는 전제를 고려하면, 프로비저닝을 강한 일관성이 아닌 최종 일관성으로 유도해야 했습니다.</div>
        </div>
      ),
    },
    {
      label: 'null_resource 분리 → 병렬 검증',
      type: 'resolution',
      content: (
        <div className="space-y-3">
          <div>provisioner를 인스턴스에서 분리하여 별도의 null_resource로 선언했습니다. null_resource는 인스턴스 간 의존성이 없으므로, 8개가 동시에 cloud-init 완료를 체크합니다.</div>
          <DocMiniFlow nodes={PAR_PROV_NODES} edges={PAR_PROV_EDGES} direction="LR" height={190} />
          <DocCode language="hcl">{`# cloud-init-check.tf — null_resource로 병렬 체크
resource "null_resource" "cloud_init_db" {
  depends_on = [aws_instance.db]  # 인스턴스 생성만 대기

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      host = aws_instance.db.public_ip
    }
  }
}

resource "null_resource" "cloud_init_commerce" {
  depends_on = [aws_instance.commerce]  # db가 아닌 자기 인스턴스만 의존

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      host = aws_instance.commerce.public_ip
    }
  }
}
# ... 8개 null_resource가 동시 실행`}</DocCode>
        </div>
      ),
    },
    {
      label: '~5분 배포, fail-fast 유지',
      type: 'result',
      content: (
        <div className="space-y-2">
          <div>배포 시간이 ~25분에서 ~5분으로 단축되었습니다. 하나라도 cloud-init이 실패하면 null_resource가 실패하고, terraform apply가 실패합니다. GitHub Actions의 always() 단계에서 terraform destroy로 전체를 정리합니다.</div>
          <div>MySQL 이중 기동 트러블슈팅에서 확립한 Docker restart 최종 일관성 전략이 있기에 가능한 결정이었습니다. 애플리케이션 간 의존성(DB 없으면 서비스 못 뜸)을 인프라 레벨에서 강제하지 않고, Docker restart policy에 위임합니다.</div>
        </div>
      ),
    },
  ],
};

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    children: [
      { key: 'svc-intent', label: '인프라 의도' },
      { key: 'svc-desc', label: '인프라 설명' },
      { key: 'story-circular', label: 'Null Resource와 순환 참조 분리', badge: '트러블슈팅' },
      { key: 'story-status', label: '실시간 상태 리포팅', badge: '트러블슈팅' },
      { key: 'story-mysql', label: 'MySQL 이중 기동과 최종 일관성', badge: '트러블슈팅' },
      { key: 'story-provisioner', label: 'Provisioner 병렬화', badge: '트러블슈팅' },
    ],
    content: (
      <div className="space-y-8">
        {/* 인프라 의도 */}
        <DocBlock id="svc-intent" title="인프라 의도">
          <DocParagraph>
            AWS 프리티어 한도 내에서 다수의 인스턴스를 사용하길 희망하였습니다.
            가용 총 시간을 활용 인스턴스로 나누는 형태로 구상하였으며,
            누구나 포트폴리오 시연 인프라의 시작을 컨트롤할 수 있는 구조를 의도하였습니다.
          </DocParagraph>
          <DocParagraph>
            항상 켜져 있는 서버가 아니라, 필요할 때만 인프라를 띄우고
            시연이 끝나면 자동으로 정리합니다.
            이 방식으로 프리티어 750시간 한도를 효율적으로 사용합니다.
          </DocParagraph>
        </DocBlock>

        {/* 인프라 설명 */}
        <DocBlock id="svc-desc" title="인프라 설명">
          <DocCard title="Hamster Controller 아키텍처">
            <DocParagraph>
              Hamster Controller(이 대시보드)는 GitHub Pages에 정적 배포되며,
              햄스터 월드 레포지토리의 Terraform 워크플로우를 트리거하고
              인프라 상태를 폴링하여 세션을 제어합니다.
            </DocParagraph>
            <DocMiniFlow nodes={ARCH_NODES} edges={ARCH_EDGES} direction="LR" />
          </DocCard>
          <DocCard title="상태 복원 : 정적 페이지 세션 판별">
            <DocParagraph>
              정적 페이지이므로 자체 상태가 없습니다.
              사용자가 Connect를 클릭하면
              오늘의 Terraform 트리거 이력을 조회합니다.
              트리거 횟수가 곧 오늘 세션 수이며,
              런타임 시간을 기준으로 실행 중인지, 쿨다운인지, 세션 제한에 도달했는지를 판별합니다.
            </DocParagraph>
            <DocMiniFlow nodes={RESTORE_NODES} edges={RESTORE_EDGES} direction="LR" />
            <DocCallout>
              인프라를 제어하는 대시보드는 인스턴스 상태와 무관하게 언제나 가동되어야 했으며,
              별도 서버 없이 항상 접근 가능한 GitHub Pages 정적 배포를 선택했습니다.
              정적 페이지에서 GitHub API를 호출하려면 PAT 토큰이 필요하지만
              클라이언트에 노출할 수 없으므로, AWS Lambda를 프록시로 두어
              토큰을 서버 측 환경 변수에만 보관합니다.
            </DocCallout>
          </DocCard>
        </DocBlock>

        {/* Keycloak 순환 참조 분리 */}
        <DocBlock id="story-circular" title="Null Resource와 순환 참조 분리" badge="트러블슈팅">
          <DocTimeline story={STORY_1_CIRCULAR_DEP} headless />
        </DocBlock>

        {/* 실시간 상태 리포팅 */}
        <DocBlock id="story-status" title="실시간 상태 리포팅" badge="트러블슈팅">
          <DocTimeline story={STORY_STATUS_REPORTING} headless />
        </DocBlock>

        {/* MySQL 이중 기동과 최종 일관성 */}
        <DocBlock id="story-mysql" title="MySQL 이중 기동과 최종 일관성" badge="트러블슈팅">
          <DocTimeline story={STORY_2_MYSQL_DUAL_BOOT} headless />
        </DocBlock>

        {/* Provisioner 병렬화 */}
        <DocBlock id="story-provisioner" title="Provisioner 병렬화" badge="트러블슈팅">
          <DocTimeline story={STORY_3_PARALLEL_PROVISIONER} headless />
        </DocBlock>
      </div>
    ),
  },
  {
    key: 'topology',
    label: '인프라 토폴로지',
    content: <InfraTopologySection data={infraTopology} />,
    doc: true,
  },
  {
    key: 'terraform',
    label: '테라폼 컨텍스트',
    content: <TerraformContextSection data={terraformContext} />,
    doc: true,
  },
];

export function InfrastructureTab() {
  return (
    <ServiceDocLayout
      title="인프라"
      sections={sections}
    />
  );
}
