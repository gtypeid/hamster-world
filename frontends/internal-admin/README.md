# 🐹 Internal Admin Portal

Hamster World의 관리자용 Internal Admin Portal입니다.

## 프로젝트 개요

이 프로젝트는 **Cash Gateway Service**와 **Payment Service**의 내부 프로세스를 모니터링하고 추적하기 위한 관리자 도구입니다.

### 주요 기능

1. **Navigation System (Two-Pane Architecture)** 🆕
   - MainPane (리스트) + TracerPane (상세 뷰어)
   - ID 클릭으로 상세 정보 추적
   - Cross-service 참조 지원
   - 📖 [자세한 설명](./NAVIGATION.md)

2. **Ecommerce Service 주문 관리** (`/ecommerce/orders`)
   - Order 리스트 및 상세 정보
   - 주문 상태별 필터링
   - User/Process ID 추적
   - Public ID 기반 추적

3. **Cash Gateway 프로세스 추적** (`/gateway/processes`)
   - PaymentProcess 실시간 모니터링
   - Event Timeline 추적 (Outbox/ProcessEvent 테이블 JOIN)
   - Payment 결과 확인
   - Public ID 기반 추적

4. **Payment Service 자원 관리** (`/payment/resource`)
   - Product 자원 현황 관리
   - Event Sourcing 이력 추적 (ProductRecord)
   - 재고 변화량 이력
   - Ecommerce Product ID 참조
   - Public ID 기반 추적

5. **Expandable UI**
   - 모달 대신 카드 펼치기 형태로 상세 정보 표시
   - 페이지 이동 없이 전체 Event Timeline 확인
   - 여러 항목 동시 비교 가능

## 아키텍처 개념

### Public ID 패턴

모든 서비스는 **Public ID** 패턴을 사용하여 외부 통신 및 서비스 간 참조를 처리합니다.

```
Entity (Backend)
├── id (Long)              // Internal DB PK - NEVER exposed in API
└── publicId (String)      // Snowflake Base62 ID - ALWAYS exposed in API
```

**규칙:**
- Internal ID (`id: Long`): DB 내부 관계에만 사용, API 응답에 절대 노출 안 됨
- Public ID (`publicId: String`): 20자 Snowflake Base62 인코딩, 모든 API 응답 및 이벤트에 사용

### Cross-Service ID References

서비스 간 참조는 Public ID를 통해 이루어집니다.

**예시: Payment Service의 Product**

```typescript
interface Product {
  publicId: string              // Payment Service의 Product Public ID
  ecommerceProductId: string    // Ecommerce Service의 Product Public ID (cross-service reference)
  // ...
}
```

**관계도:**
```
Ecommerce Service
  └── Product (publicId: "EPROD_xxx")
        ↓ Kafka Event: ProductCreatedEvent
Payment Service
  └── Product (
        publicId: "PROD_xxx",           // Payment Service 자체 ID
        ecommerceProductId: "EPROD_xxx" // Ecommerce Product 참조
      )
```

### Event-Driven Architecture

#### Outbox Pattern + Process Event

모든 서비스는 **Outbox 테이블**과 **Process Event 테이블**을 가지고 있습니다.

```
Service A                          Service B
    │                                  │
    ├── Outbox Table                   ├── Outbox Table
    │   ├── eventId (Public ID)        │   ├── eventId (Public ID)
    │   ├── traceId                    │   ├── traceId
    │   ├── aggregateId                │   ├── aggregateId
    │   ├── payload                    │   ├── payload
    │   └── status                     │   └── status
    │                                  │
    ├── ProcessEvent Table             ├── ProcessEvent Table
    │   ├── eventId (Public ID)        │   ├── eventId (Public ID)
    │   ├── processId                  │   ├── processId
    │   ├── traceId                    │   ├── traceId
    │   └── status                     │   └── status
    │                                  │
    └─────────── Kafka ────────────────┘
```

**추적성 (Traceability):**

1. **Event ID**: 각 이벤트의 고유 식별자 (Snowflake Base62)
2. **Trace ID**: 분산 트랜잭션 추적용 ID (여러 서비스 걸쳐 동일한 Trace ID 사용)
3. **Admin Portal**: Outbox + ProcessEvent 테이블 JOIN하여 전체 이벤트 흐름 추적 가능

**참고:**
- 별도의 Admin Service가 있다면, 각 서비스의 Outbox/ProcessEvent를 JOIN하여 더 강력한 추적 가능
- 현재는 각 서비스별로 Mock 데이터를 통해 UI 구현

### PaymentProcess vs Payment

#### PaymentProcess (상태 관리)
- 가변 상태 머신 (UNKNOWN → SUCCESS/FAILED/CANCELLED)
- MANDATORY 트랜잭션으로 관리 (CAS 업데이트)
- 실시간 프로세스 추적용

#### Payment (확정된 거래 기록)
- 불변 트랜잭션 레코드
- 한번 생성되면 수정 불가 (취소는 새로운 Payment 생성)
- 장부 기록용

**관계:**
```
PaymentProcess (publicId: "PROC_xxx")
    ↓ status = SUCCESS
Payment (
    publicId: "PAY_xxx",
    processPublicId: "PROC_xxx"  // FK to PaymentProcess
)
```

### Event Sourcing Pattern (Payment Service)

Payment Service는 **Event Sourcing** 패턴을 사용하여 재고를 관리합니다.

```
Product (stock: 45)
    ↓
ProductRecord (Event Sourcing History)
    ├── #1: +100 (INITIAL_STOCK)       → Balance: 100
    ├── #2: -5   (STOCK_RESERVED)      → Balance: 95
    ├── #3: +3   (STOCK_RESTORED)      → Balance: 98
    ├── #4: -10  (STOCK_RESERVED)      → Balance: 88
    ├── #5: +50  (STOCK_REPLENISHMENT) → Balance: 138
    └── #6: -93  (Multiple RESERVED)   → Balance: 45 (현재)
```

**특징:**
- Delta 저장: 변화량만 기록 (+50, -10 등)
- 불변성: 한번 생성된 Record는 수정/삭제 불가
- 재계산 가능: SUM(ProductRecord.stock) = Product.stock
- Full Audit Trail: 모든 재고 변경 이력 추적 가능

## UI 패턴

### Navigation System
자세한 내용은 [NAVIGATION.md](./NAVIGATION.md)를 참고하세요.

### Expandable UI (펼쳐지는 형태)

모달 대신 **Expandable Card** 형태를 사용합니다.

**이유:**
1. 페이지 이동 없이 상세 정보 확인
2. Event Timeline과 같이 긴 이력도 자연스럽게 표시
3. 여러 항목을 비교하기 쉬움
4. 모바일 친화적

**구조:**
```
┌─ Card (Collapsed) ──────────────────┐
│ Summary Info                         │
│ Public IDs (Process/Order/User)      │
│ [▼ 펼치기]                            │
└──────────────────────────────────────┘

Click ↓

┌─ Card (Expanded) ───────────────────┐
│ Summary Info                         │
│ Public IDs                           │
│ [▲ 접기]                              │
├──────────────────────────────────────┤
│ 📡 Event Timeline                    │
│   ├─ Event #1 (Event ID, Trace ID)  │
│   ├─ Event #2                        │
│   └─ Event #3                        │
│                                      │
│ 💳 Payment Result (if exists)        │
└──────────────────────────────────────┘
```

### Public ID 표시

모든 화면에서 Public ID를 명확히 표시합니다.

**Cash Gateway:**
```typescript
Process ID: 7nX9kP2mQ8rT1vY5       // PaymentProcess Public ID (blue)
Order ID:   5aB3cD7eF9gH2jK4       // Ecommerce Order Public ID (green)
User ID:    3xY6zA9bC2dE5fG8       // Ecommerce User Public ID (purple)
```

**Payment Service:**
```typescript
Payment Product ID:    PROD_1aB2cD3eF4gH5iJ6   // Payment Service Public ID (blue)
Ecommerce Product ID:  EPROD_1xY2zA3bC4dE5fG6  // Ecommerce Service Public ID (green)
```

**색상 규칙:**
- 파란색: 현재 서비스의 Public ID
- 초록색: Cross-service reference (Ecommerce)
- 보라색: User reference

## 기술 스택

- **React 19** + **TypeScript**
- **Vite** (빌드 도구)
- **React Router v7** (라우팅)
- **TanStack Query v5** (서버 상태 관리)
- **Tailwind CSS** (스타일링)

## 개발 서버

```bash
npm install
npm run dev
```

- Local: http://localhost:3001/
- Backend API는 아직 미구현 (Mock 데이터 사용)

## 디렉토리 구조

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx               # 전체 레이아웃 (MainPane + TracerPane)
│   │   └── Sidebar.tsx                 # 사이드바 메뉴
│   ├── navigation/                     # 🆕 Navigation System
│   │   ├── NavigationContext.tsx       # Context + Reducer
│   │   ├── Navigable.tsx               # 클릭 가능한 ID 컴포넌트
│   │   ├── TracerPane.tsx              # 오른쪽 패널 (상세 뷰어)
│   │   ├── registry/
│   │   │   ├── ViewerRegistry.ts       # Viewer 중앙 관리
│   │   │   ├── ServiceRegistry.ts      # 서비스 설정 관리
│   │   │   ├── RelationRegistry.ts     # ID 간 관계 정의
│   │   │   └── initializeRegistry.ts   # 초기화
│   │   └── viewers/
│   │       ├── GenericDataViewer.tsx   # 데이터 로드 + Viewer 렌더링
│   │       ├── OrderDetailViewer.tsx
│   │       ├── UserDetailViewer.tsx
│   │       ├── ProductDetailViewer.tsx
│   │       ├── EcommerceProductDetailViewer.tsx
│   │       └── ProcessDetailViewer.tsx
│   └── ui/
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
├── features/
│   ├── dashboard/
│   │   └── Dashboard.tsx
│   ├── ecommerce/                      # 🆕 Ecommerce Service
│   │   ├── OrderList.tsx               # 주문 리스트 (URL 파라미터 검색 지원)
│   │   └── ProductList.tsx             # 상품 리스트 (예정)
│   ├── gateway/                        # Cash Gateway Service
│   │   ├── ProcessTracker.tsx          # 프로세스 추적 (Expandable)
│   │   ├── PaymentList.tsx
│   │   ├── EventMonitor.tsx
│   │   └── mockData.ts                 # Mock 데이터 (Public ID 기반)
│   └── payment/                        # Payment Service
│       ├── ResourceTracker.tsx         # 자원 관리 (URL 파라미터 검색 지원)
│       ├── SettlementManagement.tsx
│       └── mockData.ts                 # Mock 데이터 (Public ID + Event Sourcing)
├── api/                                # 🆕 API Services
│   ├── orderService.ts                 # Order CRUD
│   ├── userService.ts                  # User CRUD
│   ├── productService.ts               # Payment Product CRUD
│   └── ecommerceProductService.ts      # Ecommerce Product CRUD
├── types/
│   ├── gateway.ts                      # Cash Gateway 타입 정의
│   ├── payment.ts                      # Payment Service 타입 정의
│   ├── order.ts                        # 🆕 Order 타입 정의
│   ├── user.ts                         # 🆕 User 타입 정의
│   └── navigation.ts                   # 🆕 Navigation System 타입
├── App.tsx
└── main.tsx
```

## Mock 데이터 구조

### Cash Gateway Mock

```typescript
// ProcessTracker
mockProcesses: PaymentProcess[] = [
  {
    publicId: '7nX9kP2mQ8rT1vY5',
    orderPublicId: '5aB3cD7eF9gH2jK4',
    userPublicId: '3xY6zA9bC2dE5fG8',
    gatewayReferenceId: 'CGW_20260204_001',
    status: 'UNKNOWN',
    // ...
  }
]

// ProcessDetail (Expandable 펼칠 때 로드)
mockProcessDetail: ProcessDetail = {
  process: { ... },
  events: [
    {
      eventId: 'EVT_1aB2cD3eF4gH5iJ6',
      traceId: 'TRACE_001_CGW_20260204_001',
      eventType: 'PROCESS_CREATED',
      // ...
    }
  ],
  payment: { ... } // 성공 시에만
}
```

### Payment Service Mock

```typescript
// ResourceTracker
mockProducts: Product[] = [
  {
    publicId: 'PROD_1aB2cD3eF4gH5iJ6',
    ecommerceProductId: 'EPROD_1xY2zA3bC4dE5fG6',
    sku: 'PROD_001',
    stock: 45,
    // ...
  }
]

// ResourceDetail (Expandable 펼칠 때 로드)
mockResourceDetail: ResourceDetail = {
  product: { ... },
  records: [
    {
      publicId: 'REC_1aB2cD3eF4gH5iJ6',
      productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
      stock: 100,          // Delta: +100
      reason: 'INITIAL_STOCK',
      // ...
    },
    {
      publicId: 'REC_2bC3dE4fG5hI6jK7',
      stock: -5,           // Delta: -5
      reason: 'STOCK_RESERVED (ORD_xxx)',
      // ...
    }
  ]
}
```

## Backend API 연동 (예정)

현재는 Mock 데이터를 사용하지만, 실제 Backend API 연동 시 다음 사항을 고려해야 합니다:

### Admin Service (선택적)

별도의 Admin Service를 구축하는 경우:

```
Admin Service
    ├── /api/admin/gateway/processes
    │   └── Join: cash_gateway.payment_processes
    │             + cash_gateway.outbox
    │             + cash_gateway.process_events
    │
    ├── /api/admin/payment/products
    │   └── Join: payment.products
    │             + payment.product_records
    │             + payment.outbox
    │
    └── /api/admin/trace/{traceId}
        └── Join across ALL services by traceId
               (Cross-service event tracking)
```

### Direct Service API (현재 가정)

각 서비스가 자체 Admin API를 제공하는 경우:

```
Cash Gateway Service
    └── /api/internal/admin/processes
        └── Returns: PaymentProcess + Events + Payment

Payment Service
    └── /api/internal/admin/products
        └── Returns: Product + ProductRecords (Event Sourcing)
```

**중요:**
- 모든 응답은 **Public ID**만 포함
- Internal ID는 절대 노출하지 않음
- Outbox/ProcessEvent 테이블 JOIN하여 Event Timeline 제공

## 🎨 햄스터 테마

Hamster World 디자인 시스템 사용:

```javascript
colors: {
  hamster: {
    orange: '#F59E0B',  // 주요 색상
    brown: '#92400E',   // 텍스트
    beige: '#FEF3C7',   // 악센트
    ivory: '#FFFBEB',   // 배경
  }
}
```

## 🛣️ 라우트

- `/` - 통합 대시보드 (redirect to `/dashboard`)
- `/dashboard` - 통합 대시보드

### Ecommerce Service
- `/ecommerce/orders` - 주문 관리 (Order List + Detail)

### Cash Gateway
- `/gateway/processes` - 프로세스 추적 (Expandable)

### Payment Service
- `/payment/resource` - 자원 관리 (Product List + Event Sourcing)

## 최근 업데이트 (2026-02-04)

✅ **Navigation System 완성** - Two-Pane Architecture 구현
- MainPane + TracerPane 구조
- "내 아이템 가기" 기능 (URL 파라미터 검색 + 하이라이트)
- Cross-service 참조 지원 (Ecommerce Product → Payment Resource)
- 📖 [자세한 내용 보기](./NAVIGATION.md)

---

## 향후 계획

- [ ] Backend API 연동
- [ ] Real-time 업데이트 (WebSocket or SSE)
- [ ] Process Detail Viewer 구현
- [ ] Event Timeline 필터링 및 검색
- [ ] Export 기능 (CSV, JSON)

## 참고 문서

- [Navigation System 상세 문서](./NAVIGATION.md) 🆕
- [Cash Gateway Service README](../../cash-gateway-service/README.md)
- [Payment Service README](../../payment-service/README.md)
- [Ecommerce Service README](../../ecommerce-service/README.md)

---

Made with 🐹 by Hamster Team
