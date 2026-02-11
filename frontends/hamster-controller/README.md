# 🐹 Hamster Controller

> Portfolio Hub + Infrastructure Control Dashboard

Hamster World 프로젝트의 **엔트리 포인트**이자 **인프라 제어 센터**입니다.
GitHub Pages에 정적으로 배포되어 프로젝트 문서, 아키텍처, 서비스 링크를 제공하고,
GitHub Actions를 통해 AWS 인프라를 온디맨드로 제어합니다.

## 🎯 주요 기능

### 🏠 Entry Point (Home)
- 프로젝트 전체 소개 및 기술 스택
- 이벤트 드리븐 아키텍처 설명
- 빠른 네비게이션 (서비스, 인프라, 문서)

### 🎯 Services Navigator
- 모든 서비스 목록 및 상태 표시
  - Frontend: 이커머스, 어드민, Hamster PG
  - Backend: E-Commerce API, Payment, Cash Gateway 등
  - Infrastructure: Keycloak, Grafana
- 인스턴스 상태에 따른 서비스 접근 제어

### 🏗️ Architecture Visualization
- **ReactFlow**로 시스템 구조 다이어그램
- Frontend → Gateway → Backend → Kafka → Database 흐름
- 인프라 인스턴스 구성 설명

### 🎮 Infrastructure Control
- GitHub Actions 워크플로우 트리거
  - 🚀 AWS EC2 인스턴스 생성
  - 🐳 Docker 애플리케이션 배포
  - 🗑️ 리소스 삭제
- 사용 시간 모니터링 (프리티어 한도 체크)
- 실시간 워크플로우 실행 이력
- 햄스터 챗바퀴 애니메이션 (상태 시각화)

### 📚 Documentation Viewer
- 프로젝트 문서 모음
- Google Slides 임베드 지원
- API 명세, ERD 등

## 🛠️ 기술 스택

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router DOM
- **State Management**:
  - TanStack Query (서버 상태)
  - Zustand (클라이언트 상태)
- **Styling**: Tailwind CSS 3.x
- **Visualization**: ReactFlow (시스템 다이어그램)
- **HTTP Client**: Axios
- **API**: GitHub REST API (Actions, Workflows)

## 🚀 로컬 개발

### 1. 환경변수 설정

`.env.example`을 복사해서 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일에 GitHub 정보 입력:

```env
VITE_GITHUB_TOKEN=ghp_your_token_here
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=your-repo
VITE_WORKFLOW_ID=infrastructure.yml
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인 가능

## 📦 빌드 및 배포

### 로컬 빌드

```bash
npm run build
```

`dist/` 폴더에 정적 파일 생성됨

### GitHub Pages 배포

1. `vite.config.ts`의 `base` 경로를 레포 이름으로 수정
2. GitHub Actions 또는 수동으로 `dist/` 폴더를 `gh-pages` 브랜치에 푸시

## 🔑 GitHub Personal Access Token 발급

1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. 필수 권한:
   - `repo` (전체)
   - `workflow` (GitHub Actions 트리거용)

## 📊 프로젝트 구조

```
src/
├── components/           # 재사용 컴포넌트
│   ├── HamsterWheel.tsx # 챗바퀴 애니메이션
│   └── Layout.tsx       # 공통 레이아웃 (헤더, 네비게이션, 푸터)
├── pages/               # 페이지 컴포넌트
│   ├── Home.tsx         # 홈 (프로젝트 소개)
│   ├── Services.tsx     # 서비스 네비게이터
│   ├── Architecture.tsx # 시스템 아키텍처 (ReactFlow)
│   ├── Infrastructure.tsx # 인프라 제어
│   └── Documentation.tsx  # 문서 뷰어
├── services/            # API 서비스
│   └── github.ts        # GitHub API 클라이언트
├── stores/              # Zustand 스토어
│   └── useInfraStore.ts # 인프라 상태 관리
├── types/               # TypeScript 타입
│   └── github.ts
└── utils/               # 유틸리티
    └── timeCalculator.ts # 시간 계산 로직
```

## 🗺️ 페이지 라우팅

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | Home | 프로젝트 소개 및 엔트리 포인트 |
| `/services` | Services | 모든 서비스 목록 및 링크 |
| `/architecture` | Architecture | 시스템 구조 다이어그램 |
| `/infrastructure` | Infrastructure | AWS 인프라 제어 대시보드 |
| `/docs` | Documentation | 프로젝트 문서 뷰어 |

## ⚙️ 설정

### 일일 시간 제한 변경

`src/stores/useInfraStore.ts`:

```typescript
dailyLimit: 1440, // 분 단위 (1440 = 24시간)
```

### 최소 실행 시간 변경

`src/pages/Dashboard.tsx`:

```typescript
const canTrigger = remainingMinutes > 10; // 최소 10분 이상
```

## 🎨 디자인 컨셉

- **Hamster 컬러 팔레트** (기존 프로젝트 통일)
  - Primary: Hamster Orange (#F59E0B)
  - Text: Hamster Brown (#92400E)
  - Background: Hamster Ivory/Beige
- **레이아웃**: 왼쪽 사이드바 네비게이션 (햄스터월드 표준)
- **애니메이션**: 햄스터 로고 wiggle 효과
- **통일성**: ecommerce, internal-admin, hamster-pg와 동일한 UI 패턴

## 📝 TODO

- [ ] 워크플로우별 개별 시간 추적
- [ ] 실행 이력 상세 로그 표시
- [ ] 인스턴스 상태 실시간 모니터링
- [ ] 알림 기능 (시간 초과 시)
- [ ] Chart.js로 사용량 시각화

## 📄 라이선스

MIT
