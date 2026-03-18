# Navigation System Architecture

> **목적**: 다음 Claude가 Navigation System을 이해하고 작업할 수 있도록 작성된 문서

## 📋 현재 상태 요약 (2026-02-06)

**✅ 완료된 작업:**
- Field Registry 패턴 적용 (Kafka Event Registry 방식)
- 모든 Viewer 컴포넌트 마이그레이션 완료 (7개)
- Navigable.tsx 리팩토링 (switch 문 제거)
- 150+ 라인의 중복 코드 제거

**🎯 핵심 개선:**
- 설정 기반 필드 관리로 변경
- 새 ID 타입 추가 시 1개 파일만 수정 (기존 5+ 파일 → 1 파일)
- 일관된 라벨 보장 (FieldRegistry가 단일 진실 공급원)

---

## 🏗️ 아키텍처 개요

### Two-Pane 구조

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
│ │ [Order #3]      │ │ │ Gateway Payment ID: zzz           │ │
│ │ ...             │ │ │                                   │ │
│ └─────────────────┘ │ │ ← 뒤로 │ 앞으로 → │ 📍 내 아이템 가기│ │
│                     │ │                                   │ │
│                     │ │ [Order Detail Content]            │ │
│                     │ └───────────────────────────────────┘ │
└─────────────────────┴───────────────────────────────────────┘
```

**핵심 원칙:**
- MainPane과 TracerPane은 **독립적으로 스크롤**
- ID 클릭 → TracerPane에 상세 표시
- 뒤로/앞으로 가기 히스토리 스택 지원
- Cross-service 추적 가능 (Order → Process → Payment → Product)

---

## 🎯 Field Registry 패턴 (핵심!)

### 왜 만들었나?

**❌ 기존 문제:**
```tsx
// ProcessDetailViewer.tsx
<div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
  <span className="text-gray-500 flex-shrink-0">Process ID:</span>
  <Navigable id={process.publicId} type="process-id" />
</div>

// OrderDetailViewer.tsx
<div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
  <span className="text-gray-500 flex-shrink-0">Order ID:</span>
  <Navigable id={order.orderPublicId} type="order-id" />
</div>

// ... 7개 Viewer에서 150+ 라인 중복
```

**문제점:**
1. 같은 코드 7개 파일에 반복
2. 라벨 불일치 ("Process ID" vs "Process ID (Gateway)")
3. 새 ID 타입 추가 시 5개 이상 파일 수정 필요
4. Navigable.tsx에 switch 문 난리

**✅ 해결: Field Registry 패턴**

백엔드의 Kafka Event Registry처럼 **설정 파일에 모든 필드 정의**:

```typescript
// /src/config/navigation-field-registry.config.ts
export const FIELD_REGISTRY_CONFIG: FieldRegistryConfig = {
  fields: [
    {
      idType: 'process-id',
      fieldName: 'publicId',
      label: 'Process ID',              // 단일 진실 공급원
      viewerType: 'process-detail',
      service: 'gateway',
      optional: false,
      displayOrder: 100,
      format: 'nanoid',
    },
    {
      idType: 'order-id',
      fieldName: 'orderPublicId',
      label: 'Order ID',
      viewerType: 'order-detail',
      service: 'ecommerce',
      optional: false,
      displayOrder: 300,
      format: 'nanoid',
    },
    // ... 9개 필드 정의
  ],

  viewerMappings: [
    {
      viewerType: 'process-detail',
      fields: ['publicId', 'orderPublicId', 'userPublicId'],
    },
    {
      viewerType: 'order-detail',
      fields: ['orderPublicId', 'userPublicId', 'gatewayPaymentPublicId'],
    },
    // ... 7개 뷰어 매핑
  ],
}
```

**✅ 이제 Viewer는 1줄:**

```tsx
// ProcessDetailViewer.tsx
<FieldRenderer viewerType="process-detail" data={process} />

// OrderDetailViewer.tsx
<FieldRenderer viewerType="order-detail" data={order} />

// 끝! 24줄 → 1줄
```

---

## 📂 디렉토리 구조

```
src/
├── config/                           # ⭐ 설정 파일 (Field Registry)
│   ├── navigation-field-registry.ts         # 타입 정의
│   └── navigation-field-registry.config.ts  # 필드 설정 (단일 진실 공급원)
│
├── types/
│   └── navigation.ts                 # IdType, ViewerType, NavigationItem
│
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx            # h-screen, overflow 관리
│   │
│   └── navigation/                  # === Navigation System ===
│       ├── NavigationContext.tsx    # 상태 관리 (Reducer)
│       ├── SplitLayout.tsx          # Two-Pane + Resize
│       ├── TracerPane.tsx           # 우측 팬
│       ├── Navigable.tsx            # 클릭 가능한 ID 래퍼 (Registry 기반)
│       ├── FieldRenderer.tsx        # ⭐ 범용 필드 렌더러
│       │
│       ├── registry/
│       │   ├── FieldRegistry.ts     # ⭐ 필드 레지스트리 (싱글톤)
│       │   ├── ViewerRegistry.ts    # ViewerType → Component + API
│       │   ├── ServiceRegistry.ts   # 서비스 설정 (아이콘, 색상)
│       │   ├── RelationRegistry.ts  # ID 간 관계
│       │   └── initializeRegistry.ts # 앱 시작 시 등록
│       │
│       └── viewers/
│           ├── GenericDataViewer.tsx    # 데이터 로드 + Viewer 렌더링
│           ├── ProcessDetailViewer.tsx
│           ├── GatewayPaymentDetailViewer.tsx
│           ├── PaymentDetailViewer.tsx
│           ├── OrderDetailViewer.tsx
│           ├── UserDetailViewer.tsx
│           ├── ProductDetailViewer.tsx
│           └── EcommerceProductDetailViewer.tsx
│
├── api/                             # API 서비스
│   ├── gatewayService.ts
│   ├── productService.ts
│   ├── orderService.ts
│   └── userService.ts
│
└── features/                        # MainPane 페이지
    ├── ecommerce/OrderList.tsx
    ├── gateway/ProcessTracker.tsx
    └── payment/ResourceTracker.tsx
```

---

## 🔧 핵심 컴포넌트

### 1. FieldRegistry (싱글톤)

**역할**: 필드 메타데이터 관리

```typescript
class FieldRegistryClass {
  private fields = new Map<string, FieldConfig>()
  private idTypeToField = new Map<IdType, FieldConfig>()
  private viewerMappings = new Map<ViewerType, ViewerFieldMapping>()

  // 뷰어에 표시할 필드 목록 반환 (정렬 + 필터링)
  getFieldsForViewer(viewerType: ViewerType, data: any): FieldConfig[] {
    const mapping = this.viewerMappings.get(viewerType)
    if (!mapping) return []

    const fields: FieldConfig[] = []
    for (const fieldName of mapping.fields) {
      const config = this.fields.get(fieldName)
      if (!config) continue
      if (config.optional && !data[fieldName]) continue  // 옵셔널 필드 스킵
      fields.push(config)
    }

    return fields.sort((a, b) => a.displayOrder - b.displayOrder)
  }

  // IdType → ViewerType 추론 (Navigable.tsx에서 사용)
  inferViewerType(idType: IdType): ViewerType | undefined {
    return this.idTypeToField.get(idType)?.viewerType
  }

  // IdType → Service 매핑 (색상 결정)
  getServiceForIdType(idType: IdType): 'payment' | 'gateway' | 'ecommerce' | undefined {
    return this.idTypeToField.get(idType)?.service
  }

  // IdType → 일관된 라벨 (단일 진실 공급원)
  getLabelForIdType(idType: IdType): string {
    return this.idTypeToField.get(idType)?.label || idType
  }
}

export const FieldRegistry = new FieldRegistryClass()
```

**초기화** (`initializeRegistry.ts`):

```typescript
FIELD_REGISTRY_CONFIG.fields.forEach((field) => {
  FieldRegistry.registerField(field)
})

FIELD_REGISTRY_CONFIG.viewerMappings.forEach((mapping) => {
  FieldRegistry.registerViewerMapping(mapping)
})
```

### 2. FieldRenderer

**역할**: 범용 필드 렌더러 (모든 Viewer에서 사용)

```tsx
export function FieldRenderer({ viewerType, data }: FieldRendererProps) {
  const fields = FieldRegistry.getFieldsForViewer(viewerType, data)

  if (fields.length === 0) return null

  return (
    <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <h4 className="text-lg font-bold text-hamster-brown mb-4">🔗 관련 ID</h4>
      <div className="space-y-2 text-sm font-mono">
        {fields.map((field) => {
          const value = data[field.fieldName]
          if (!value) return null

          return (
            <div key={field.fieldName} className="flex items-center gap-3 bg-gray-50 p-2 rounded">
              <span className="text-gray-500 flex-shrink-0">{field.label}:</span>
              <Navigable id={value} type={field.idType} viewerType={field.viewerType} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

**사용법:**

```tsx
// ProcessDetailViewer.tsx
<FieldRenderer viewerType="process-detail" data={process} />

// OrderDetailViewer.tsx
<FieldRenderer viewerType="order-detail" data={order} />

// 끝!
```

### 3. Navigable (Registry 기반)

**역할**: 클릭 가능한 ID 래퍼

**✅ 리팩토링 완료 - switch 문 제거:**

```typescript
// ❌ 기존: 하드코딩된 switch 문
function inferViewerType(idType: IdType): ViewerType {
  switch (idType) {
    case 'process-id': return 'process-detail'
    case 'order-id': return 'order-detail'
    // ... 30줄
  }
}

// ✅ 현재: FieldRegistry 사용
function inferViewerType(idType: IdType): ViewerType {
  const viewerType = FieldRegistry.inferViewerType(idType)
  if (viewerType) return viewerType

  // Fallback for event-id, trace-id (아직 Field Registry에 없음)
  switch (idType) {
    case 'event-id': return 'event-timeline'
    case 'trace-id': return 'trace-timeline'
    default: return 'process-detail'
  }
}
```

**색상도 Registry 기반:**

```typescript
function getColorForIdType(type: IdType): string {
  const service = FieldRegistry.getServiceForIdType(type)

  if (service) {
    const serviceConfig = ServiceRegistry.get(service)
    const colorMap = {
      'bg-purple-500': 'text-purple-600 hover:text-purple-700',
      'bg-blue-500': 'text-blue-600 hover:text-blue-700',
      'bg-green-500': 'text-green-600 hover:text-green-700',
    }
    return colorMap[serviceConfig.color] || 'text-blue-600 hover:text-blue-700'
  }

  return 'text-blue-600 hover:text-blue-700'
}
```

---

## 🚀 다음 Claude를 위한 작업 가이드

### 새 ID 타입 추가하기

**단 1개 파일만 수정하면 됨!**

```typescript
// /src/config/navigation-field-registry.config.ts

export const FIELD_REGISTRY_CONFIG: FieldRegistryConfig = {
  fields: [
    // ... 기존 필드들

    // ✅ 새 필드 추가
    {
      idType: 'settlement-id',          // 1. types/navigation.ts에 IdType 추가 필요
      fieldName: 'settlementPublicId',
      label: 'Settlement ID',
      viewerType: 'settlement-detail',  // 2. ViewerType도 추가 필요
      service: 'payment',
      optional: true,
      displayOrder: 250,
      format: 'nanoid',
    },
  ],

  viewerMappings: [
    // ... 기존 매핑들

    // ✅ 새 뷰어 매핑 추가
    {
      viewerType: 'settlement-detail',
      fields: ['settlementPublicId', 'paymentPublicId', 'orderPublicId'],
    },
  ],
}
```

**추가 작업:**

1. `types/navigation.ts`에 `IdType`, `ViewerType` 추가
2. Viewer 컴포넌트 작성 (`SettlementDetailViewer.tsx`)
3. `ViewerRegistry`에 등록 (`initializeRegistry.ts`)

**끝!** Navigable.tsx, 기타 Viewer 수정 불필요.

### 기존 필드 라벨 변경하기

```typescript
// ❌ 과거: 7개 파일 수정 필요
// ProcessDetailViewer.tsx: "Process ID:"
// OrderDetailViewer.tsx: "Process ID (Gateway):"
// ... 5개 더

// ✅ 현재: 1개 파일만 수정
// /src/config/navigation-field-registry.config.ts
{
  idType: 'process-id',
  label: 'Process ID (Gateway)',  // 여기만 바꾸면 모든 곳에 적용
  // ...
}
```

### Viewer에 특수한 필드 추가하기

FieldRenderer는 **공통 필드만** 렌더링합니다.
특수한 필드(예: 취소/환불 관련)는 별도 섹션으로:

```tsx
// GatewayPaymentDetailViewer.tsx
export function GatewayPaymentDetailViewer({ id, data }: ViewerProps) {
  return (
    <div className="space-y-6">
      {/* 공통 필드 */}
      <FieldRenderer viewerType="gateway-payment-detail" data={payment} />

      {/* 특수 필드: 원본 거래 (취소/환불인 경우) */}
      {payment.originPaymentPublicId && (
        <section className="bg-orange-50 rounded-lg border-2 border-orange-200 p-6">
          <h4 className="text-lg font-bold text-hamster-brown mb-4">🔄 원본 거래</h4>
          <div className="space-y-3 text-sm font-mono">
            <div className="flex items-center gap-3 bg-white p-3 rounded border border-orange-300">
              <span className="text-orange-600 flex-shrink-0 font-bold">Origin Payment:</span>
              <Navigable id={payment.originPaymentPublicId} type="gateway-payment-id" />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
```

### 새 Viewer 추가하기

1. **API Service 작성** (`api/settlementService.ts`)
2. **Viewer 컴포넌트** (`viewers/SettlementDetailViewer.tsx`)
3. **ViewerRegistry 등록** (`initializeRegistry.ts`):

```typescript
ViewerRegistry.register({
  type: 'settlement-detail',
  title: 'Settlement 상세',
  component: SettlementDetailViewer,
  service: 'payment',
  fetcher: fetchSettlementDetail,
  myItem: {
    searchBy: (id) => ({ field: 'settlementPublicId', value: id }),
    listRoute: '/payment/settlement',
  },
})
```

4. **Field Registry에 필드 추가** (위 참고)

---

## 📊 현재 등록된 ID 타입 (2026-02-06)

### Gateway Service
- `process-id` → `process-detail`
- `gateway-payment-id` → `gateway-payment-detail`
- `event-id` → `event-timeline` (Field Registry 미적용)
- `trace-id` → `trace-timeline` (Field Registry 미적용)

### Payment Service
- `payment-id` → `payment-detail`
- `product-id` → `product-detail`

### Ecommerce Service
- `order-id` → `order-detail`
- `user-id` → `user-detail`
- `ecommerce-product-id` → `ecommerce-product-detail`

**TODO**: `event-id`, `trace-id`도 Field Registry에 추가하기

---

## 🎨 상태 관리 (NavigationContext)

### NavigationItem 구조

```typescript
interface NavigationItem {
  id: string           // 예: "KRmMnVjtY0"
  type: IdType         // 예: "order-id"
  viewerType: ViewerType  // 예: "order-detail"
  label: string        // 예: "Order: KRmMnVjtY0"
  data?: any           // 선택: 뷰어에 전달할 데이터
}
```

### 스택 관리 (핵심!)

```typescript
interface NavigationState {
  stack: {
    items: NavigationItem[]
    currentIndex: number
  }
}
```

**동작 방식:**

```
1. Process A 클릭   → [Process A], currentIndex = 0
2. Order X 클릭     → [Process A, Order X], currentIndex = 1
3. User Y 클릭      → [Process A, Order X, User Y], currentIndex = 2
4. 뒤로 가기         → currentIndex = 1 (Order X 표시)
5. Process A 클릭   → [Process A], currentIndex = 0 (Order X, User Y 제거)
```

**중복 방지**: 같은 ID 클릭 시 스택에서 해당 위치로 돌아가고 이후 항목 제거

---

## 🔍 디버깅 팁

### FieldRenderer가 필드를 안보여줄 때

```typescript
// FieldRenderer.tsx에 로깅 추가
const fields = FieldRegistry.getFieldsForViewer(viewerType, data)
console.log('[FieldRenderer]', viewerType, fields)
```

**확인사항:**
1. `navigation-field-registry.config.ts`에 해당 viewerType 매핑 있는지
2. data 객체에 fieldName 필드가 실제로 있는지
3. optional 필드인데 값이 없는지

### Navigable 클릭이 안될 때

```typescript
// Navigable.tsx에 로깅
const inferredViewerType = viewerType || inferViewerType(type)
console.log('[Navigable]', { id, type, inferredViewerType })
```

**확인사항:**
1. IdType이 Field Registry에 등록되어 있는지
2. inferViewerType fallback 로직 확인

### 뷰어가 표시 안될 때

```typescript
// TracerPane.tsx
console.log('[CURRENT ITEM]', currentItem)
console.log('[VIEWER CONFIG]', ViewerRegistry.get(currentItem?.viewerType))
```

---

## ⚠️ 주의사항

### 1. FieldRegistry는 필수 필드만

FieldRenderer는 **필수적이고 공통적인 ID 필드**만 렌더링합니다.

**✅ FieldRegistry에 넣을 것:**
- 다른 뷰어로 이동 가능한 ID (Navigable)
- 여러 뷰어에서 공통으로 표시되는 ID

**❌ FieldRegistry에 넣지 말 것:**
- 특수한 비즈니스 로직이 있는 필드 (취소/환불 표시 등)
- Non-navigable 시스템 ID (Keycloak User ID, Internal ID)
- 뷰어별 고유한 필드

### 2. displayOrder 규칙

```
Gateway Service: 100-199
Payment Service: 200-299
Ecommerce Service: 300-399
```

같은 서비스 내에서는 10 단위로 증가.

### 3. AppLayout 높이 관리 필수

```tsx
// AppLayout.tsx - 반드시 이 구조 유지!
<div className="h-screen flex flex-col bg-gray-50">
  <Header />
  <div className="flex flex-1 overflow-hidden">
    <Sidebar />
    <main className="flex-1 overflow-hidden">
      {children}  {/* SplitLayout이 들어감 */}
    </main>
  </div>
</div>
```

`h-screen` + `overflow-hidden` 없으면 스크롤 독립성 깨짐.

---

## 📝 TODO

### High Priority
- [ ] `event-id`, `trace-id`도 Field Registry에 추가
- [ ] Gateway Payment ID가 실제 백엔드 API 연동되면 테스트

### Medium Priority
- [ ] RelationRegistry 활용 (현재 미사용)
- [ ] FieldRenderer 커스터마이징 옵션 (섹션 제목, 스타일 등)

### Low Priority
- [ ] TracerPane 멀티 탭 지원
- [ ] 스택 크기 제한 (20개 이상 시 자동 제거)

---

**작성일**: 2026-02-06
**작성자**: Claude (Field Registry 마이그레이션 완료 직후)
**버전**: 3.0.0 (Field Registry 패턴 적용)

Made with 🐹 by Hamster Team
