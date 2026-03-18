export type ViewerTab =
  | 'overview' | 'infra-doc' | 'platform'
  | 'ecommerce' | 'cashgw' | 'payment' | 'hamsterpg' | 'progression'
  | 'internal-admin' | 'content-creator'
  | 'architecture' | 'topology' | 'report';

export interface TabItem {
  key: ViewerTab;
  label: string;
  desc: string;
  color: string;        // text color (e.g. 'text-amber-400')
  dotColor: string;      // dot bg  (e.g. 'bg-amber-400')
  activeColor: string;   // sidebar highlight (e.g. 'bg-amber-500/10 border-amber-500')
}

export interface TabGroup {
  group: string;
  groupColor: string;       // sidebar group label color
  groupColorLight: string;  // modal group label color
  items: TabItem[];
}

export const TAB_GROUPS: TabGroup[] = [
  {
    group: '문서',
    groupColor: 'text-emerald-600',
    groupColorLight: 'text-emerald-500',
    items: [
      { key: 'overview', label: '개요', desc: '프로젝트 소개', color: 'text-emerald-400', dotColor: 'bg-emerald-400', activeColor: 'bg-emerald-500/10 border-emerald-500' },
      { key: 'infra-doc', label: '인프라', desc: 'Terraform & 배포', color: 'text-emerald-400', dotColor: 'bg-emerald-400', activeColor: 'bg-emerald-500/10 border-emerald-500' },
      { key: 'platform', label: '플랫폼', desc: 'Keycloak, Kafka, Grafana', color: 'text-emerald-400', dotColor: 'bg-emerald-400', activeColor: 'bg-emerald-500/10 border-emerald-500' },
    ],
  },
  {
    group: '뷰어',
    groupColor: 'text-blue-600',
    groupColorLight: 'text-blue-500',
    items: [
      { key: 'architecture', label: '아키텍처', desc: '시스템 구성도', color: 'text-blue-400', dotColor: 'bg-blue-400', activeColor: 'bg-blue-500/10 border-blue-500' },
      { key: 'topology', label: '이벤트 플로우', desc: 'Kafka 토폴로지', color: 'text-blue-400', dotColor: 'bg-blue-400', activeColor: 'bg-blue-500/10 border-blue-500' },
      { key: 'report', label: '플랜 리포트', desc: 'terraform plan', color: 'text-blue-400', dotColor: 'bg-blue-400', activeColor: 'bg-blue-500/10 border-blue-500' },
    ],
  },
  {
    group: '서비스',
    groupColor: 'text-amber-600',
    groupColorLight: 'text-amber-500',
    items: [
      { key: 'ecommerce', label: '이커머스', desc: '벤더 SaaS 쇼핑몰', color: 'text-amber-400', dotColor: 'bg-amber-400', activeColor: 'bg-amber-500/10 border-amber-500' },
      { key: 'cashgw', label: '캐시 게이트웨이', desc: '결제 방화벽', color: 'text-amber-400', dotColor: 'bg-amber-400', activeColor: 'bg-amber-500/10 border-amber-500' },
      { key: 'payment', label: '페이먼트', desc: 'Reactive + ES', color: 'text-amber-400', dotColor: 'bg-amber-400', activeColor: 'bg-amber-500/10 border-amber-500' },
      { key: 'progression', label: '프로그레션', desc: '게이미피케이션 엔진', color: 'text-amber-400', dotColor: 'bg-amber-400', activeColor: 'bg-amber-500/10 border-amber-500' },
      { key: 'hamsterpg', label: '햄스터 PG', desc: 'PG 시뮬레이터', color: 'text-amber-400', dotColor: 'bg-amber-400', activeColor: 'bg-amber-500/10 border-amber-500' },
    ],
  },
  {
    group: '앱',
    groupColor: 'text-pink-600',
    groupColorLight: 'text-pink-500',
    items: [
      { key: 'internal-admin', label: '어드민', desc: '운영 대시보드', color: 'text-pink-400', dotColor: 'bg-pink-400', activeColor: 'bg-pink-500/10 border-pink-500' },
      { key: 'content-creator', label: '콘텐츠 크리에이터', desc: '프로모션 관리', color: 'text-pink-400', dotColor: 'bg-pink-400', activeColor: 'bg-pink-500/10 border-pink-500' },
    ],
  },
];

export const ALL_TABS = TAB_GROUPS.flatMap((g) => g.items);
