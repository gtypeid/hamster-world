# Hamster Controller

> Portfolio Hub + Infrastructure Control + Service Documentation

Hamster World 프로젝트의 엔트리 포인트이자 인프라 제어 센터.
GitHub Pages에 정적 배포되어 서비스 문서, 인프라 제어, 아키텍처 시각화를 제공한다.

## 주요 기능

### Home
- 프로젝트 소개, 기술 스택, 이벤트 드리븐 아키텍처 설명
- 서비스/인프라/문서 네비게이션

### Services
- 전체 서비스 목록 및 상태 표시 (Frontend, Backend, Infrastructure)
- 인스턴스 상태에 따른 서비스 접근 제어

### Infrastructure Control
- GitHub Actions 워크플로우 트리거 (EC2 생성, Docker 배포, 리소스 삭제)
- ReactFlow 기반 인프라 플로우 시각화
- 사용 시간 모니터링, 실시간 워크플로우 이력, 세션 관리

### Service Documentation (Viewer Modal)
- 서비스별 탭 전환 방식의 문서 뷰어 (ViewerModal + viewerTabs)
- 각 서비스 탭은 왼쪽 사이드바 카테고리로 섹션 전환

## 서비스 문서 시스템

`src/components/docs/` 아래에 서비스별 문서 탭이 존재한다.
공통 컴포넌트로 데이터와 렌더러를 분리하는 패턴을 사용한다.

### 공통 컴포넌트

| 파일 | 역할 |
|------|------|
| `ServiceDocLayout.tsx` | 왼쪽 사이드바 + 본문 레이아웃. DocHeading, DocBlock, DocParagraph, DocCard, DocCode(Prism.js 신택스 하이라이팅), DocCallout, DocLink, DocKeyValueList, DocBulletList, DocImage 등 공통 UI 제공. 키워드 하이라이트 시스템 내장 |
| `ServiceFlowSection.tsx` | 카프카 토폴로지 렌더러. `ServiceFlowData` (publishes, consumes) 데이터를 받아 시각화 |
| `BoundedContextSection.tsx` | 바운드 컨텍스트 렌더러. `BoundedContextData` (contexts, externals, children) 데이터를 받아 시각화 |

### 서비스 탭

| 파일 | 서비스 | 섹션 구성 |
|------|--------|-----------|
| `EcommerceTab.tsx` | 이커머스 | 개요, 카프카 토폴로지, 바운드 컨텍스트, 설계 의도, 핵심 코드, 결과, 화면 |
| `PaymentTab.tsx` | 페이먼트 | 개요, 카프카 토폴로지, 바운드 컨텍스트, 설계 의도, 핵심 코드, 결과 |
| `CashGatewayTab.tsx` | 캐시 게이트웨이 | 개요(서비스 의도, 서비스 설명, 핵심 설계 및 코드, 여담), 카프카 토폴로지, 바운드 컨텍스트 |
| `ProgressionTab.tsx` | 프로그레션 | 개요, 카프카 토폴로지, 바운드 컨텍스트, 설계 의도, 핵심 코드, 결과 |
| `InternalAdminTab.tsx` | 내부 어드민 | 프론트엔드 앱 (Kafka 없음) |
| `ContentCreatorTab.tsx` | 콘텐츠 크리에이터 | 프론트엔드 앱 (Kafka 없음) |
| `HamsterPgTab.tsx` | 햄스터 PG | PG 시뮬레이터 |
| `OverviewTab.tsx` | 전체 개요 | 프로젝트 전체 아키텍처 |
| `PlatformTab.tsx` | 플랫폼 | 공통 인프라 |
| `InfrastructureTab.tsx` | 인프라 | AWS/Terraform |

### 바운드 컨텍스트 데이터 구조

```typescript
interface ExternalRef {
  service: ViewerTab;         // viewerTabs.ts의 탭 키
  desc: string;
  isSourceOfTruth?: boolean;  // 이 외부 서비스가 진실의 원천인 경우
}

interface ContextItem {
  name: string;
  service: ViewerTab;
  detail: string;
  externals?: ExternalRef[];
  children?: ContextItem[];   // 하위 도메인 (ㄴ 커넥터로 연결)
}
```

- `isSourceOfTruth: true`인 external이 있으면 → 자기 서비스 태그/텍스트 비활성, 해당 external 태그/텍스트 활성
- 활성/비활성은 색상 차이만 (폰트 크기 동일)
- 서비스 태그는 `viewerTabs.ts`의 `ALL_TABS`에서 label/color를 조회

### 서비스 간 이벤트 의존 관계 (바운드 컨텍스트 기준)

```
Ecommerce
  Order        ← payment(SoT), progression(반응하여 소비)
  Product      ← payment(SoT, 재고)
  Account      ← payment(SoT, 잔액)
  Merchant     → cashgw(MID 발급)
  CouponPolicy (자체 소유)
  Cart         (자체 소유)

Payment
  Payment      ← cashgw(SoT) → ecommerce(반응하여 소비)
  Product      → ecommerce(캐시 동기화)
    └ ProductRecord
  Account      → ecommerce(캐시 동기화), progression(보상 이벤트)
    └ AccountRecord
  OrderSnapshot ← ecommerce(SoT, 주문 원본)

CashGateway
  PaymentProcess ← payment(트리거)
    └ Payment    → payment(반응하여 소비), ecommerce(반응하여 소비)
  CashGatewayMid → ecommerce(식별자 저장)

Progression
  Archive      ← ecommerce(트리거) → payment(반응하여 소비)
    └ UserArchiveProgress
  Quota        ← ecommerce(트리거) → payment(반응하여 소비)
  SeasonPromotion ← ecommerce(트리거), payment(SoT, VIP 상태)
```

`←` 이 서비스에 영향을 주는 쪽, `→` 이 서비스의 이벤트를 소비하는 쪽, `SoT` = Source of Truth

## 기술 스택

- React 19 + TypeScript + Vite
- React Router DOM
- TanStack Query (서버 상태) + Zustand (클라이언트 상태)
- Tailwind CSS 4.x
- Prism.js (코드 신택스 하이라이팅)
- ReactFlow (인프라 플로우 시각화)
- Axios + GitHub REST API + Lambda Proxy

## 프로젝트 구조

```
src/
├── components/
│   ├── docs/                    # 서비스 문서 탭 + 공통 렌더러
│   │   ├── ServiceDocLayout.tsx # 공통 레이아웃 (사이드바 + 본문)
│   │   ├── ServiceFlowSection.tsx # 카프카 토폴로지 렌더러
│   │   ├── BoundedContextSection.tsx # 바운드 컨텍스트 렌더러
│   │   ├── EcommerceTab.tsx
│   │   ├── PaymentTab.tsx
│   │   ├── CashGatewayTab.tsx
│   │   ├── ProgressionTab.tsx
│   │   └── ...Tab.tsx           # 기타 서비스 탭
│   ├── infra/                   # 인프라 제어 UI
│   │   ├── InfraFlowView.tsx    # ReactFlow 인프라 다이어그램
│   │   ├── SessionControl.tsx   # 세션 관리
│   │   ├── ViewerModal.tsx      # 서비스 문서 뷰어 모달
│   │   └── viewerTabs.ts        # 탭 정의 (ViewerTab 타입, ALL_TABS)
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   └── Header.tsx
│   ├── HamsterWheel.tsx
│   └── WelcomeModal.tsx
├── pages/
│   ├── Home.tsx
│   ├── Services.tsx
│   └── Infrastructure.tsx
├── services/
│   ├── github.ts               # GitHub API 클라이언트
│   ├── lambdaProxy.ts           # Lambda 프록시 (CORS 우회)
│   ├── infraSession.ts
│   ├── mockGithub.ts
│   └── workflowPoller.ts
├── stores/
│   └── useInfraStore.ts
├── config/
│   └── infraConfig.ts
├── types/
│   └── github.ts
└── utils/
    ├── parsePlan.ts
    ├── parseWorkflowLog.ts
    └── timeCalculator.ts
```

## 다음 세션 가이드

이 프로젝트를 이어서 작업할 때 알아야 할 핵심 사항:

### 서비스 문서 패턴

새 서비스 탭을 추가하거나 기존 탭을 수정할 때:

1. 데이터 객체 (`ServiceFlowData`, `BoundedContextData`)를 정의하고
2. 공통 렌더러 (`ServiceFlowSection`, `BoundedContextSection`)에 전달하는 패턴
3. `viewerTabs.ts`의 `ALL_TABS`가 탭 정의의 단일 진실의 원천

### 바운드 컨텍스트 활성/비활성 규칙

- `ExternalRef.isSourceOfTruth: true` → 해당 external 태그/텍스트 활성, 자기 서비스 태그/텍스트 비활성
- children은 부모의 활성/비활성을 상속
- children도 자체 externals를 가질 수 있음 (렌더러 지원됨)
- 활성/비활성은 색상만 다름 (`text-gray-300` vs `text-gray-500`), 폰트 크기는 동일 (`text-[15px]`)

### 섹션 순서 규칙

CashGatewayTab (최신 패턴):
- 개요 섹션 안에 DocBlock 서브섹션으로 구성: 서비스 의도 → 서비스 설명 → 핵심 설계 및 코드 → 여담
- `DocSection.children`으로 사이드바 앵커 네비게이션 제공, children은 항상 펼침 상태
- 개요 → 카프카 토폴로지 → 바운드 컨텍스트

기존 탭 (Ecommerce, Payment, Progression):
- 개요 → 카프카 토폴로지 → 바운드 컨텍스트 → 설계 의도 → 핵심 코드 → 결과

### DocBlock 서브섹션 패턴 (CashGatewayTab 기준)

```typescript
const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    children: [                              // 사이드바 앵커 네비게이션
      { key: 'svc-intent', label: '서비스 의도' },
      { key: 'svc-desc', label: '서비스 설명' },
      { key: 'svc-design', label: '핵심 설계 및 코드' },
      { key: 'svc-aside', label: '여담' },
    ],
    content: (
      <div className="space-y-8">
        <DocBlock id="svc-intent" title="서비스 의도">...</DocBlock>
        <DocBlock id="svc-desc" title="서비스 설명">...</DocBlock>
        <DocBlock id="svc-design" title="핵심 설계 및 코드">...</DocBlock>
        <DocBlock id="svc-aside" title="여담">...</DocBlock>
      </div>
    ),
  },
  // ...카프카 토폴로지, 바운드 컨텍스트
];
```

- `DocSection.children[].key`와 `DocBlock id`가 일치해야 앵커 스크롤 동작
- children이 있는 섹션은 다른 탭 클릭 시에도 항상 펼침 상태 유지

### 키워드 하이라이트 시스템

`ServiceDocLayout.tsx`의 `HIGHLIGHT_RULES` 배열에 키워드-색상 매핑 정의.
`DocParagraph`, `DocCallout` 내부 텍스트에 자동 적용.

| 키워드 | 색상 |
|--------|------|
| 햄스터 월드, Cash Gateway | amber |
| Payment Service | red |
| Ecommerce | blue |
| Progression | purple |
| Source of Truth, 진실의 원천 | emerald |
| Kafka | sky |
| Webhook | orange |

### 코드 하이라이팅

- `DocCode`에 `language="kotlin"` 전달 시 Prism.js로 신택스 하이라이팅 적용
- `language` 미지정 시 단색 텍스트 출력 (상태 전이 다이어그램 등)
- 테마: prism-tomorrow (다크), 배경색은 `#080e1a`로 오버라이드

### DocCallout 컴포넌트

설계 결정의 이유(Why)를 강조하는 콜아웃 블록.
amber 좌측 보더 + 반투명 배경 + "WHY" 라벨. 키워드 하이라이트 적용됨.

```tsx
<DocCallout>
  Cash Gateway는 "누가 요청했는지"만 식별하고, "얼마를 누구에게"는 Payment Service의 도메인으로 남겨 두었습니다.
</DocCallout>
```

### 텍스트 스타일 규칙

- 한글 위주, 영어 최소화 (Source of Truth → 진실의 원천, INSERT-only → 불변, delta → 변화량)
- 반응하는 소비자는 "~에 반응하여 소비" 패턴으로 통일
- CashGatewayTab: "~합니다/~했습니다" 정중체 (텔링 스타일)

## 로컬 개발

```bash
cp .env.example .env   # 환경변수 설정
npm install
npm run dev            # http://localhost:3000
npm run build          # dist/ 정적 빌드
```

## 라이선스

MIT
