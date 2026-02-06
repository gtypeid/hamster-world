# Navigation System Architecture

> **목적**: 다음 Claude 세션이 Navigation System을 즉시 이해하고 확장/수정할 수 있도록 작성된 기술 문서

## 📋 목차

1. [개요](#개요)
2. [핵심 개념](#핵심-개념)
3. [아키텍처 구조](#아키텍처-구조)
4. [API 중심 설계](#api-중심-설계)
5. [상태 관리](#상태-관리)
6. [주요 기능](#주요-기능)
7. [확장 가이드](#확장-가이드)
8. [디버깅 및 최적화](#디버깅-및-최적화)

---

## 개요

**Navigation System**은 **MainPane (리스트) + TracerPane (상세 뷰어)** 구조의 Two-Pane Architecture입니다.

### 왜 만들었나?

**문제:** Expandable Card 패턴은 리스트가 길어질수록 스크롤 지옥 발생
**해결:** ID 클릭 → 오른쪽 TracerPane에 상세 정보 표시 → 리스트는 그대로 유지

### 핵심 목표

1. **스크롤 독립성**: MainPane과 TracerPane이 각각 독립적으로 스크롤
2. **히스토리 스택**: 뒤로/앞으로 가기 지원 (브라우저처럼)
3. **Cross-service 추적**: Ecommerce Order → Payment Process → Product 모두 추적 가능
4. **페이지 리로드 없음**: "내 아이템 가기" 버튼으로 MainPane 전환 시에도 TracerPane 상태 유지

### 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│                    AppLayout (h-screen)                     │
├─────────────────────┬───────────────────────────────────────┤
│   MainPane (Left)   │     TracerPane (Right)                │
│   (overflow-y-auto) │     (overflow-y-auto)                 │
│                     │                                       │
│ ┌─────────────────┐ │ ┌───────────────────────────────────┐ │
│ │ Order List      │ │ │ 🛒 ECOMMERCE                      │ │
│ │                 │ │ │ Order 상세                         │ │
│ │ [Order #1] ←────┼─┼→│ Order ID: xxx                     │ │
│ │ [Order #2]      │ │ │ User ID: yyy (클릭 가능)           │ │
│ │ [Order #3]      │ │ │ Process ID: zzz (클릭 가능)        │ │
│ │ ...             │ │ │                                   │ │
│ └─────────────────┘ │ │ ← 뒤로 │ 앞으로 → │ 📍 내 아이템 가기│ │
│                     │ │                                   │ │
│                     │ │ [Order Detail Content]            │ │
│                     │ └───────────────────────────────────┘ │
└─────────────────────┴───────────────────────────────────────┘
```

---

## 핵심 개념

### 1. NavigationItem

모든 네비게이션은 `NavigationItem` 형태로 관리됩니다.

```typescript
interface NavigationItem {
  id: string           // ID 값 (예: "KRmMnVjtY0")
  type: IdType         // ID 타입 (예: "order-id")
  viewerType: ViewerType  // 어떤 뷰어로 표시할지 (예: "order-detail")
  label: string        // 표시할 라벨 (예: "Order KRmMnVjtY0")
  data?: any           // 뷰어에 전달할 추가 데이터 (선택)
}
```

### 2. IdType (ID 타입 시스템)

```typescript
export type IdType =
  // Cash Gateway Service
  | 'process-id'
  | 'payment-id'
  | 'event-id'
  | 'trace-id'

  // Payment Service
  | 'product-id'
  | 'product-record-id'

  // Ecommerce Service
  | 'order-id'
  | 'user-id'
  | 'ecommerce-product-id'
```

**색상 규칙** (`Navigable.tsx: getColorForIdType()`):
- **파란색**: 현재 서비스 ID (process-id, product-id 등)
- **초록색**: Ecommerce cross-reference (order-id, ecommerce-product-id)
- **보라색**: User reference (user-id)
- **회색**: Trace ID

### 3. ViewerType

```typescript
export type ViewerType =
  | 'process-detail'
  | 'payment-detail'
  | 'event-timeline'
  | 'trace-timeline'
  | 'product-detail'
  | 'ecommerce-product-detail'
  | 'order-detail'
  | 'user-detail'
```

---

## 아키텍처 구조

### 디렉토리 구조

```
src/
├── types/
│   └── navigation.ts          # NavigationItem, ViewerType, IdType 등

├── components/
│   ├── layout/
│   │   └── AppLayout.tsx      # 전체 레이아웃 (h-screen, overflow 관리)
│   │
│   └── navigation/            # === Navigation System ===
│       ├── NavigationContext.tsx    # 상태 관리 Context + Reducer
│       ├── SplitLayout.tsx          # Two-Pane 레이아웃 + Resize
│       ├── TracerPane.tsx           # 우측 팬 (상세 뷰어 렌더링)
│       ├── Navigable.tsx            # 클릭 가능한 ID 래퍼
│       │
│       ├── registry/
│       │   ├── ViewerRegistry.ts        # ViewerType → Component + API 매핑
│       │   ├── ServiceRegistry.ts       # 서비스별 설정 (아이콘, 색상, 경로)
│       │   ├── RelationRegistry.ts      # ID 간 관계 정의
│       │   └── initializeRegistry.ts    # 앱 시작 시 등록
│       │
│       └── viewers/
│           ├── GenericDataViewer.tsx      # 데이터 로드 + Viewer 렌더링
│           ├── OrderDetailViewer.tsx
│           ├── UserDetailViewer.tsx
│           ├── ProductDetailViewer.tsx
│           ├── EcommerceProductDetailViewer.tsx
│           └── ProcessDetailViewer.tsx

├── api/                       # API Services
│   ├── client.ts              # Axios 클라이언트
│   ├── orderService.ts
│   ├── userService.ts
│   ├── productService.ts
│   └── ecommerceProductService.ts

└── features/
    ├── ecommerce/
    │   └── OrderList.tsx      # MainPane: URL 파라미터 검색 지원
    ├── gateway/
    │   └── ProcessTracker.tsx # MainPane: Process 목록
    └── payment/
        └── ResourceTracker.tsx # MainPane: Product 목록
```

### 컴포넌트 계층

```typescript
// App.tsx
<QueryClientProvider>
  <NavigationProvider>  // Context Provider
    <BrowserRouter>
      <AppContent>
        <AppLayout>
          <SplitLayout
            mainPane={<Routes>...</Routes>}
            tracerPane={<TracerPane />}
          />
        </AppLayout>
      </AppContent>
    </BrowserRouter>
  </NavigationProvider>
</QueryClientProvider>

// 초기화 (AppContent)
useEffect(() => {
  initializeRegistry()  // ViewerRegistry, ServiceRegistry 등록
}, [])
```

---

## API 중심 설계

### 개요

**기존 문제**: 각 Viewer 컴포넌트가 개별적으로 API를 호출 → 코드 중복, 로딩/에러 처리 중복

**해결**: ViewerRegistry에 API fetcher를 등록하고, GenericDataViewer가 자동으로 데이터 로드

### ViewerConfig 구조

```typescript
export interface ViewerConfig {
  type: ViewerType
  title: string
  component: React.ComponentType<ViewerProps>

  // 서비스 정보
  service: 'payment' | 'gateway' | 'ecommerce'

  // API 설정
  fetcher?: ApiFetcher              // ID로 데이터 조회하는 함수
  isEmbeddedOnly?: boolean          // 단독 조회 불가 플래그 (Record ID 등)

  // "내 아이템 가기" 설정
  myItem?: MyItemConfig | false
}

export type ApiFetcher<T = any> = (id: string) => Promise<T>

export interface MyItemConfig {
  searchBy: (id: string) => { field: string; value: string }
  listRoute?: string  // 커스텀 리스트 경로 (없으면 ServiceRegistry의 listRoute 사용)
}
```

### ViewerRegistry 등록 예시

```typescript
// registry/initializeRegistry.ts
import { fetchProductDetail } from '@/api/productService'
import { fetchEcommerceProductDetail } from '@/api/ecommerceProductService'
import { fetchOrderDetail } from '@/api/orderService'
import { fetchUserDetail } from '@/api/userService'

// ✅ Product Detail (Payment Service)
ViewerRegistry.register({
  type: 'product-detail',
  title: 'Product 상세',
  component: ProductDetailViewer,
  service: 'payment',
  fetcher: fetchProductDetail,  // ⭐ API 함수 등록
  myItem: {
    searchBy: (id) => ({ field: 'publicId', value: id }),
    listRoute: '/payment/resource'
  }
})

// ✅ Ecommerce Product Detail
ViewerRegistry.register({
  type: 'ecommerce-product-detail',
  title: 'Ecommerce Product 상세',
  component: EcommerceProductDetailViewer,
  service: 'ecommerce',
  fetcher: fetchEcommerceProductDetail,
  myItem: {
    searchBy: (id) => ({ field: 'ecommerceProductId', value: id }),
    listRoute: '/payment/resource'  // Cross-service! Payment 페이지로 이동
  }
})

// ✅ Order Detail
ViewerRegistry.register({
  type: 'order-detail',
  title: 'Order 상세',
  component: OrderDetailViewer,
  service: 'ecommerce',
  fetcher: fetchOrderDetail,
  myItem: {
    searchBy: (id) => ({ field: 'orderPublicId', value: id }),
    listRoute: '/ecommerce/orders'
  }
})

// ✅ User Detail
ViewerRegistry.register({
  type: 'user-detail',
  title: 'User 상세',
  component: UserDetailViewer,
  service: 'ecommerce',
  fetcher: fetchUserDetail,
  myItem: {
    searchBy: (id) => ({ field: 'publicId', value: id }),
    // listRoute 없음 → ServiceRegistry의 기본값 사용 (/ecommerce/orders)
  }
})

// ✅ Product Record - 단독 조회 불가
ViewerRegistry.register({
  type: 'product-record-detail',
  title: 'Product Record',
  component: ProductRecordDetailViewer,
  service: 'payment',
  isEmbeddedOnly: true,  // ⭐ fetcher 없음 + 단독 조회 불가
  myItem: false
})
```

### ServiceRegistry 설정

```typescript
// registry/ServiceRegistry.ts
const services = {
  payment: {
    name: 'PAYMENT',
    icon: '💳',
    color: 'bg-purple-500',
    listRoute: '/payment/resource'
  },
  gateway: {
    name: 'GATEWAY',
    icon: '🚪',
    color: 'bg-blue-500',
    listRoute: '/gateway/processes'
  },
  ecommerce: {
    name: 'ECOMMERCE',
    icon: '🛒',
    color: 'bg-green-500',
    listRoute: '/ecommerce/orders'
  }
}
```

### 데이터 흐름

```
사용자가 Product ID 클릭
  ↓
Navigable → navigate({ id, type: 'product-id', viewerType: 'product-detail' })
  ↓
NavigationContext → 스택에 추가
  ↓
TracerPane → GenericDataViewer 렌더링
  ↓
GenericDataViewer
  ├─ ViewerRegistry.get('product-detail')
  ├─ viewerConfig.fetcher 확인
  ├─ fetchProductDetail(id) 호출  ⭐ Registry에서 가져온 fetcher
  └─ ProductDetailViewer에 data 전달
  ↓
ProductDetailViewer → 데이터 렌더링 (API 호출 불필요)
```

### GenericDataViewer 구현

```typescript
// viewers/GenericDataViewer.tsx
export function GenericDataViewer({ id, type, data }: GenericDataViewerProps) {
  const viewerConfig = ViewerRegistry.get(type)
  const [viewerData, setViewerData] = useState(data)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 이미 data가 있으면 API 호출 안함
    if (data) {
      setViewerData(data)
      return
    }

    // fetcher가 없으면 단독 조회 불가
    if (!viewerConfig.fetcher) {
      if (viewerConfig.isEmbeddedOnly) {
        setError('이 ID는 단독 조회가 불가능합니다. 부모 데이터에 포함되어 있습니다.')
      }
      return
    }

    // ⭐ Registry의 fetcher로 자동 API 호출
    setIsLoading(true)
    viewerConfig.fetcher(id)
      .then(setViewerData)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [id, type, data])

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  const ViewerComponent = viewerConfig.component
  return <ViewerComponent id={id} type={type} data={viewerData} />
}
```

---

## 상태 관리

### NavigationContext (Reducer 패턴)

**상태 구조:**
```typescript
interface NavigationState {
  stack: {
    items: NavigationItem[]
    currentIndex: number
  }
  isLoading: boolean
  error: string | null
}
```

**액션:**
```typescript
type NavigationAction =
  | { type: 'NAVIGATE'; item: NavigationItem }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' }
  | { type: 'CLEAR' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
```

### 스택 관리 로직 (핵심!)

**`NAVIGATE` 액션 처리** (`NavigationContext.tsx: navigationReducer()`):

```typescript
case 'NAVIGATE': {
  // 1. 현재 표시 중인 항목과 동일한 ID면 무시
  const currentItem = state.stack.items[state.stack.currentIndex]
  if (currentItem?.id === action.item.id && currentItem?.type === action.item.type) {
    return state  // 변경 없음
  }

  // 2. 스택에서 동일한 ID 찾기
  const existingIndex = state.stack.items.findIndex(
    (item) => item.id === action.item.id && item.type === action.item.type
  )

  // 3. 이미 스택에 있으면 그 위치로 "돌아가기" (이후 항목들 제거)
  if (existingIndex !== -1) {
    return {
      ...state,
      stack: {
        items: state.stack.items.slice(0, existingIndex + 1),
        currentIndex: existingIndex,
      },
    }
  }

  // 4. 새로운 ID면 현재 위치 이후의 히스토리 제거하고 추가
  const newItems = [
    ...state.stack.items.slice(0, state.stack.currentIndex + 1),
    action.item,
  ]
  return {
    ...state,
    stack: {
      items: newItems,
      currentIndex: newItems.length - 1,
    },
  }
}
```

**스택 동작 예시:**
```
1. Process A 클릭   → [Process A]
2. Order X 클릭     → [Process A, Order X]
3. User Y 클릭      → [Process A, Order X, User Y]
4. Process A 클릭   → [Process A]  // Order X, User Y 제거 (뒤로 돌아감)
5. Order X 클릭     → [Process A, Order X]
6. Order X 다시 클릭 → 무시  // 이미 표시 중
```

**뒤로/앞으로 가기:**
- `GO_BACK`: `currentIndex--` (0 이하면 무시)
- `GO_FORWARD`: `currentIndex++` (items.length-1 이상이면 무시)

---

## 주요 기능

### 1. Navigable Component (ID 클릭 가능하게 만들기)

**사용법:**
```tsx
// OrderList.tsx
<Navigable id={order.orderPublicId} type="order-id">
  {order.orderPublicId}
</Navigable>

// 또는 자동 라벨
<Navigable id={order.orderPublicId} type="order-id" />
// → "Order KRmMnVjtY0" 자동 생성
```

**Props:**
```typescript
interface NavigableProps {
  id: string
  type: IdType
  viewerType?: ViewerType  // 없으면 inferViewerType()로 자동 추론
  label?: string           // 없으면 formatLabel()로 자동 생성
  className?: string
  children?: ReactNode     // 커스텀 렌더링
  data?: any               // 뷰어에 전달할 추가 데이터
}
```

**자동 추론:**
```typescript
function inferViewerType(idType: IdType): ViewerType {
  switch (idType) {
    case 'process-id': return 'process-detail'
    case 'product-id': return 'product-detail'
    case 'order-id': return 'order-detail'
    case 'user-id': return 'user-detail'
    case 'ecommerce-product-id': return 'ecommerce-product-detail'
    // ...
  }
}
```

### 2. TracerPane (상세 뷰어)

**렌더링 로직:**
```typescript
const { state, goBack, goForward, clear } = useNavigation()
const currentItem = state.stack.items[state.stack.currentIndex]

// 1. currentItem 없으면 EmptyState
// 2. isLoading이면 LoadingSpinner
// 3. error 있으면 에러 메시지
// 4. ViewerRegistry에서 뷰어 찾기
const viewerConfig = ViewerRegistry.get(currentItem.viewerType)

// 5. GenericDataViewer로 자동 데이터 로드 + 뷰어 렌더링
return <GenericDataViewer id={currentItem.id} type={currentItem.viewerType} data={currentItem.data} />
```

**헤더:**
- 서비스 배지 + 뷰어 타이틀 (예: "🛒 ECOMMERCE Order 상세")
- ID 라벨 표시 (예: "Order KRmMnVjtY0")
- 네비게이션 버튼: `[← 뒤로] [앞으로 →] [2 / 5] [✕ 닫기]`
- "📍 내 아이템 가기" 버튼 (myItem 설정 있을 때만)

### 3. "내 아이템 가기" 기능

TracerPane에서 버튼 클릭 시 **페이지 리로드 없이** MainPane을 해당 아이템의 리스트 페이지로 이동시킵니다.

**플로우:**
```
1. 주문 리스트에서 "User ID: ABC123" 클릭
   ↓
2. TracerPane에 User 상세 뷰 표시
   ↓
3. "📍 내 아이템 가기" 버튼 클릭
   ↓
4. MainPane이 User 리스트 페이지로 이동 (리로드 없음)
   ↓
5. User ID "ABC123"으로 자동 스크롤 + 파란 링 하이라이트 (3초)
   ↓
6. TracerPane은 User 상세 뷰 그대로 유지
```

**구현 (TracerPane.tsx):**
```typescript
const handleGoToMyItem = () => {
  const viewerConfig = ViewerRegistry.get(currentItem.viewerType)
  if (!viewerConfig?.myItem || viewerConfig.myItem === false) return

  // 커스텀 listRoute가 있으면 사용, 없으면 ServiceRegistry에서 가져오기
  const route = viewerConfig.myItem.listRoute
    ? viewerConfig.myItem.listRoute
    : ServiceRegistry.get(viewerConfig.service).listRoute

  const searchCondition = viewerConfig.myItem.searchBy(currentItem.id)

  const params = new URLSearchParams()
  params.set('searchBy', searchCondition.field)
  params.set('searchValue', searchCondition.value)

  // window.history.pushState로 URL만 변경 (리로드 없음)
  const newUrl = `${route}?${params.toString()}`
  window.history.pushState({}, '', newUrl)

  // popstate 이벤트 발생시켜서 React Router가 감지하도록
  window.dispatchEvent(new PopStateEvent('popstate'))
}
```

**장점:**
- 페이지 리로드 없음 → TracerPane 상태 유지
- React Router가 자동으로 감지하여 MainPane 컴포넌트 전환
- 사용자 경험 향상 (빠르고 부드러운 네비게이션)

### 4. URL 파라미터 기반 검색 + 하이라이트

리스트 페이지는 URL 파라미터를 통해 특정 아이템을 검색하고 하이라이트합니다.

**구현 (OrderList.tsx 예시):**
```typescript
const [searchParams, setSearchParams] = useSearchParams()
const [highlightedId, setHighlightedId] = useState<string | null>(null)
const orderRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

useEffect(() => {
  const searchByField = searchParams.get('searchBy')
  const searchValue = searchParams.get('searchValue')

  if (!searchByField || !searchValue || isLoading || orders.length === 0) return

  // 검색 조건에 맞는 아이템 찾기
  let targetOrder: OrderListItem | undefined
  if (searchByField === 'orderPublicId') {
    targetOrder = orders.find((o) => o.orderPublicId === searchValue)
  } else if (searchByField === 'publicId') {
    // User ID로 검색 (미래 기능)
    targetOrder = orders.find((o) => o.userPublicId === searchValue)
  }

  if (!targetOrder) {
    console.warn(`Order not found: ${searchByField}=${searchValue}`)
    setSearchParams({})
    return
  }

  setHighlightedId(targetOrder.orderPublicId)

  // 스크롤 (헤더 영역 고려)
  setTimeout(() => {
    const element = orderRefs.current[targetOrder.orderPublicId]
    if (element) {
      const headerOffset = 200
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }, 100)

  // 3초 후 하이라이트 제거 & URL 파라미터 제거
  const timer = setTimeout(() => {
    setHighlightedId(null)
    setSearchParams({})
  }, 3000)

  return () => clearTimeout(timer)
}, [searchParams, isLoading, orders, setSearchParams])

// 렌더링
{filteredOrders.map((order) => {
  const isHighlighted = highlightedId === order.orderPublicId
  return (
    <div
      key={order.orderPublicId}
      ref={(el) => (orderRefs.current[order.orderPublicId] = el)}
      className={`transition-all duration-500 ${
        isHighlighted ? 'ring-4 ring-blue-500 ring-offset-2 rounded-lg' : ''
      }`}
    >
      <OrderCard order={order} />
    </div>
  )
})}
```

**핵심 포인트:**
1. `useSearchParams`로 URL 파라미터 읽기
2. `useRef`로 각 아이템의 DOM 요소 추적
3. `headerOffset`으로 페이지 헤더 영역 고려한 스크롤
4. `ring-4 ring-blue-500`로 3초간 파란 링 하이라이트
5. 자동으로 URL 파라미터 정리

### 5. SplitLayout (Two-Pane + Resize)

**Props:**
```typescript
interface SplitLayoutProps {
  mainPane: ReactNode
  tracerPane: ReactNode
  defaultWidth?: number   // TracerPane 기본 너비 (%)
  minWidth?: number       // 최소 너비 (%)
  maxWidth?: number       // 최대 너비 (%)
}
```

**Resize 로직:**
- `onMouseDown` (Resize Handle) → `setIsResizing(true)`
- `onMouseMove` (Container) → 마우스 X 좌표로 너비 계산
- `onMouseUp` / `onMouseLeave` → `setIsResizing(false)`

**스크롤 독립성:**
```tsx
<div className="flex h-full w-full overflow-hidden">
  <div className="h-full overflow-y-auto overflow-x-hidden" style={{width: ...}}>
    {mainPane}
  </div>

  <div className="w-1 bg-gray-300 hover:bg-hamster-orange cursor-col-resize" />

  <div className="h-full overflow-y-auto overflow-x-hidden" style={{width: ...}}>
    {tracerPane}
  </div>
</div>
```

---

## 확장 가이드

### 새 Viewer 추가

**1. ViewerType 추가** (`types/navigation.ts`):
```typescript
export type ViewerType =
  | 'process-detail'
  | 'settlement-detail'  // 새로 추가
```

**2. API Service 작성** (`api/settlementService.ts`):
```typescript
export async function fetchSettlementDetail(id: string): Promise<Settlement> {
  const response = await paymentClient.get(`/api/settlements/${id}`)
  return response.data
}
```

**3. Viewer 컴포넌트 작성** (`viewers/SettlementDetailViewer.tsx`):
```typescript
import type { ViewerProps } from '@/types/navigation'

export function SettlementDetailViewer({ id, data }: ViewerProps) {
  const [settlement, setSettlement] = useState(data)

  useEffect(() => {
    if (data) {
      setSettlement(data)
      return
    }
    // Fallback: data 없으면 직접 API 호출 (하위 호환성)
    fetchSettlementDetail(id).then(setSettlement)
  }, [id, data])

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">
          정산 정보
        </h4>
        {/* 렌더링 */}
      </section>
    </div>
  )
}
```

**4. ViewerRegistry 등록** (`registry/initializeRegistry.ts`):
```typescript
import { fetchSettlementDetail } from '@/api/settlementService'

ViewerRegistry.register({
  type: 'settlement-detail',
  title: 'Settlement 상세',
  component: SettlementDetailViewer,
  service: 'payment',
  fetcher: fetchSettlementDetail,  // ⭐ API 함수 등록
  myItem: {
    searchBy: (id) => ({ field: 'settlementPublicId', value: id }),
    listRoute: '/payment/settlement'
  }
})
```

**5. ID 자동 추론 업데이트** (`Navigable.tsx`):
```typescript
function inferViewerType(idType: IdType): ViewerType {
  switch (idType) {
    case 'settlement-id': return 'settlement-detail'  // 추가
    // ...
  }
}
```

**끝! 이제 `<Navigable id={xxx} type="settlement-id" />`만 사용하면 자동으로 동작합니다.**

### 새 ID 타입 추가

**1. IdType 추가** (`types/navigation.ts`):
```typescript
export type IdType =
  | 'settlement-id'  // 새로 추가
```

**2. 색상 규칙 추가** (`Navigable.tsx`):
```typescript
function getColorForIdType(type: IdType): string {
  switch (type) {
    case 'settlement-id': return 'text-purple-600 hover:text-purple-700'
    // ...
  }
}
```

**3. 라벨 포맷 추가** (`Navigable.tsx`):
```typescript
const typeLabels: Record<IdType, string> = {
  'settlement-id': 'Settlement',
  // ...
}
```

### Cross-Service Reference 추가

**예시: Ecommerce Product는 Ecommerce 소속이지만 Payment 페이지에서 참조**

```typescript
ViewerRegistry.register({
  type: 'ecommerce-product-detail',
  title: 'Ecommerce Product 상세',
  component: EcommerceProductDetailViewer,
  service: 'ecommerce',        // 소속: Ecommerce (초록색 배지)
  fetcher: fetchEcommerceProductDetail,
  myItem: {
    searchBy: (id) => ({ field: 'ecommerceProductId', value: id }),
    listRoute: '/payment/resource'  // 하지만 Payment 페이지로 이동!
  }
})
```

**결과:**
- TracerPane 배지는 초록색 (Ecommerce 서비스)
- "내 아이템 가기"는 `/payment/resource`로 이동
- Payment 자원 관리 페이지에서 `ecommerceProductId`로 검색

### 단독 조회 불가 ID 처리

**예시: Record ID는 Product 상세 조회 시 함께 오는 데이터**

```typescript
ViewerRegistry.register({
  type: 'product-record-detail',
  title: 'Product Record',
  component: ProductRecordDetailViewer,
  service: 'payment',
  isEmbeddedOnly: true,  // ⭐ fetcher 없음 + 단독 조회 불가
  myItem: false
})
```

**결과:**
- Record ID 클릭 시 "이 ID는 단독 조회가 불가능합니다. 부모 데이터에 포함되어 있습니다." 메시지 표시
- 불필요한 API 호출 방지

---

## 디버깅 및 최적화

### 디버깅 팁

#### 스택이 제대로 쌓이지 않을 때

```typescript
// NavigationContext.tsx: navigationReducer()에 로깅 추가
case 'NAVIGATE':
  console.log('[NAVIGATE]', action.item.id, action.item.type)
  console.log('[STACK BEFORE]', state.stack.items.map(i => `${i.type}:${i.id}`))
  // ... reducer 로직
  console.log('[STACK AFTER]', newState.stack.items.map(i => `${i.type}:${i.id}`))
```

#### 뷰어가 표시되지 않을 때

```typescript
// TracerPane.tsx
console.log('[CURRENT ITEM]', currentItem)
console.log('[VIEWER CONFIG]', ViewerRegistry.get(currentItem?.viewerType))
```

#### API 호출이 안될 때

```typescript
// GenericDataViewer.tsx
console.log('[FETCHER]', viewerConfig.fetcher)
console.log('[IS EMBEDDED ONLY]', viewerConfig.isEmbeddedOnly)
```

#### Resize가 작동하지 않을 때

- `onMouseMove`가 부모 컨테이너에 있는지 확인
- `isResizing` 상태가 제대로 업데이트되는지 확인
- `overflow-hidden`이 부모에 있는지 확인

### 성능 최적화

#### 1. useMemo로 필터링 최적화

```typescript
const filteredProcesses = useMemo(
  () => filter === 'all' ? mockProcesses : mockProcesses.filter(p => p.status === filter),
  [filter]
)
```

#### 2. 뷰어 컴포넌트 lazy loading

```typescript
const ProcessDetailViewer = lazy(() => import('./viewers/ProcessDetailViewer'))
```

#### 3. 스택 크기 제한 (옵션)

```typescript
const MAX_STACK_SIZE = 20

if (newItems.length > MAX_STACK_SIZE) {
  newItems.shift()  // 가장 오래된 항목 제거
}
```

### 스타일링 패턴

#### ID 표시 (MainPane & TracerPane 공통)

```tsx
<div className="space-y-2 text-xs font-mono">
  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
    <span className="text-gray-500 flex-shrink-0">Process ID:</span>
    <Navigable id={process.publicId} type="process-id" />
  </div>
</div>
```

**핵심:**
- `space-y-2`: 각 ID 행 간격
- `gap-3`: 라벨과 ID 간격 (justify-between 대신 gap 사용)
- `flex-shrink-0`: 라벨이 줄어들지 않도록
- `font-mono`: ID는 고정폭 폰트

#### 섹션 (TracerPane 내부)

```tsx
<section className="bg-white rounded-lg border-2 border-gray-200 p-6">
  <h4 className="text-lg font-bold text-hamster-brown mb-4 flex items-center gap-2">
    <span>🔗</span>
    <span>관련 ID</span>
  </h4>
  {/* 내용 */}
</section>
```

---

## 주의사항

### 1. AppLayout 높이 관리

반드시 `h-screen` + `flex-col` + `overflow-hidden` 구조 유지:

```tsx
<div className="h-screen flex flex-col bg-gray-50">
  <Header />
  <div className="flex flex-1 overflow-hidden">
    <Sidebar />
    <main className="flex-1 overflow-hidden">
      {children}
    </main>
  </div>
</div>
```

### 2. 페이지 컴포넌트 padding

MainPane에 표시되는 페이지는 자체적으로 `p-8` 추가 필요:

```tsx
export function ProcessTracker() {
  return (
    <div className="p-8">  // 필수!
      {/* 내용 */}
    </div>
  )
}
```

### 3. Navigable 중첩 클릭 방지

```tsx
const handleClick = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()  // 중요! 부모 클릭 이벤트 방지
  navigate(...)
}
```

### 4. useState import 필수

Navigable을 사용하는 모든 컴포넌트는 `useState`가 필요합니다 (filter 상태 등).

```typescript
import { useState } from 'react'  // 필수!
```

---

## 미구현 기능 (TODO)

### 1. 추가 뷰어
- [ ] ProcessDetailViewer (Gateway)
- [ ] PaymentDetailViewer (Gateway)
- [ ] EventTimelineViewer
- [ ] TraceTimelineViewer (분산 트랜잭션 전체 추적)

### 2. Backend API 연동
- [ ] 현재 Mock 데이터 사용
- [ ] `/api/admin/...` 엔드포인트 구현 필요

### 3. RelationRegistry 활용
- [ ] 현재 field 기반만 동작
- [ ] fetch 함수로 백엔드 호출 추가 필요
- [ ] Related IDs 자동 표시

### 4. TracerPane 추가 기능
- [ ] Breadcrumb UI (스택 히스토리 시각화)
- [ ] Export 기능 (JSON, CSV)
- [ ] 멀티 탭 지원

### 5. Real-time 업데이트
- [ ] WebSocket or SSE
- [ ] UNKNOWN 프로세스 자동 갱신

---

## 참고 파일

- **핵심 로직**: `src/components/navigation/NavigationContext.tsx`
- **레이아웃**: `src/components/navigation/SplitLayout.tsx`, `src/components/layout/AppLayout.tsx`
- **ID 래퍼**: `src/components/navigation/Navigable.tsx`
- **데이터 로더**: `src/components/navigation/viewers/GenericDataViewer.tsx`
- **뷰어 예시**: `src/components/navigation/viewers/ProductDetailViewer.tsx`, `OrderDetailViewer.tsx`
- **초기화**: `src/components/navigation/registry/initializeRegistry.ts`
- **타입 정의**: `src/types/navigation.ts`
- **API 서비스**: `src/api/productService.ts`, `orderService.ts`, 등

---

**작성일**: 2026-02-05
**버전**: 2.0.0 (통합본)
**이전 버전**: NAVIGATION.md + NAVIGATION_SYSTEM.md 통합

Made with 🐹 by Hamster Team