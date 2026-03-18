# Kafka 토폴로지 시각화 시스템

## 개요

Internal Admin Portal의 Kafka 토폴로지 시각화 기능. 서비스 간 메시지 흐름, 토픽, 이벤트를 인터랙티브 그래프로 표시합니다.

**위치**: `/notification/topology`

**특징**:
- 전체 화면 레이아웃 (TracerPane 없음)
- 아이템 기반 렌더링 시스템
- 필터링 + 이벤트 모드 토글
- Dagre 자동 레이아웃 (가중치 기반 그룹핑)

---

## 아키텍처

### 핵심 개념: Item-based Rendering

기존의 단일 함수에서 모든 노드를 생성하는 방식 대신, **각 노드 타입이 자신의 렌더링 로직을 소유**합니다.

```
TopologyWorld (데이터 관리)
    ↓
TopologyWorldItem[] (렌더링 가능한 아이템들)
    ↓
TopologyRenderer (렌더링 + 레이아웃)
    ↓
React Flow (시각화)
```

### 디렉토리 구조

```
src/components/topology/
├── items/
│   ├── TopologyWorldItem.tsx       # 추상 베이스 클래스
│   ├── ServiceItem.tsx             # 서비스 노드
│   ├── PublisherItem.tsx           # Publisher 노드
│   ├── ConsumerItem.tsx            # Consumer 노드
│   ├── TopicItem.tsx               # Topic 노드
│   └── EventItem.tsx               # Event 노드 (단일/복수 모드)
├── TopologyWorld.ts                # 아이템 관리, 데이터 → 아이템 변환
├── TopologyRenderer.ts             # 렌더링 + Dagre 레이아웃
└── TopologyViewer.tsx              # React 컴포넌트 (UI)
```

---

## 주요 컴포넌트

### 1. TopologyWorldItem (추상 클래스)

**파일**: `items/TopologyWorldItem.tsx`

모든 아이템의 베이스 클래스. 각 아이템은 `render()` 메서드를 구현해야 합니다.

```typescript
abstract class TopologyWorldItem {
  abstract render(mode?: any): { nodes: Node[]; edges: Edge[] }

  protected isInactive(serviceName?: string, topic?: string): boolean
  protected getColor(tailwindClass: string): string
}
```

**하위 클래스**:
- `ServiceItem`: 서비스 노드 (250x120, 서비스별 색상)
- `PublisherItem`: Publisher 노드 (200x70, 빨간색)
- `ConsumerItem`: Consumer 노드 (200x70, 파란색)
- `TopicItem`: Topic 노드 (200x80, 노란색)
- `EventItem`: Event 노드 (180x60, 보라색, **모드 전환 지원**)

### 2. TopologyWorld

**파일**: `TopologyWorld.ts`

`TopologyResponse` 데이터를 받아서 아이템들을 생성하고 관리합니다.

**핵심 로직**:
```typescript
class TopologyWorld {
  constructor(topology: TopologyResponse, traceContext?: TraceContext)

  getItems(): TopologyWorldItem[]
  getItemsByType<T>(type: Class<T>): T[]  // 타입별 필터링
}
```

**buildItems() 핵심 부분**:
1. 토픽 → 발행자 매핑 생성 (`topicOwnerMap`)
2. 서비스별로 ServiceItem, PublisherItem, ConsumerItem 생성
3. 각 Publisher/Consumer에 EventItem 추가 (ownerService 전달)
4. TopicItem 생성 (publishers, consumers 매핑 포함)

**중요**: EventItem 생성 시 `ownerService`를 반드시 전달해야 단일 모드에서 올바른 참조가 가능합니다.

### 3. TopologyRenderer

**파일**: `TopologyRenderer.ts`

아이템들을 React Flow 노드/엣지로 변환하고 Dagre 레이아웃을 적용합니다.

**가중치 시스템** (핵심!):
```typescript
Publisher → Topic: weight 300      // 토픽을 Publisher 근처에 고정
Publisher/Consumer → Event: 200    // 이벤트 밀집 배치
Service → Publisher/Consumer: 100  // 그룹핑
Topic → Consumer: 10               // 긴 엣지 허용 (Consumer는 멀리 OK)
```

**레이아웃 파라미터**:
```typescript
nodesep: 50   // 노드 간 간격
ranksep: 150  // 계층 간 간격
```

### 4. EventItem - 단일/복수 모드

**파일**: `items/EventItem.tsx`

가장 복잡한 아이템. 두 가지 렌더링 모드를 지원합니다.

#### 단일 소스 모드 (`mode: 'single'`)
- Publisher의 이벤트만 실제 노드 생성
- Consumer는 Publisher의 이벤트 노드를 참조 (긴 엣지)
- 이벤트의 단일 진실 공급원(Single Source of Truth) 표현

```typescript
if (mode === 'single') {
  if (this.isOwnedByPublisher()) {
    return createNodeAndEdge()  // Publisher: 노드 생성
  } else {
    // Consumer: Publisher 이벤트 참조
    const canonicalEventId = this.getCanonicalEventId()
    return { nodes: [], edges: [참조 엣지] }
  }
}
```

#### 복수 아이템 모드 (`mode: 'multi'`)
- Publisher와 Consumer 모두 이벤트 노드 생성
- 각 구독자가 어떤 이벤트를 사용하는지 명시적 표현

**getCanonicalEventId()**: 단일 모드에서 Consumer가 참조할 Publisher 이벤트 ID
```typescript
`event-publisher-${ownerService}-${topic}-${eventName}`
```

---

## UI 기능

### 필터 시스템

**위치**: `TopologyViewer.tsx:160-212`

5가지 노드 타입 필터:
- Service, Publisher, Consumer, Topic, Event

**동작 방식**:
- 필터 변경 시 레이아웃 재계산 (현재 방식)
- `world.getItems()`에서 필터링 후 렌더링

```typescript
const filteredItems = items.filter((item) => {
  if (item instanceof ServiceItem) return filters.service
  if (item instanceof PublisherItem) return filters.publisher
  // ...
})
```

**대안 고려사항**: 위치 고정 방식 (opacity만 변경)은 현재 미구현. 필요 시 참고:
- 장점: 노드 위치 불변, 사용자 혼란 방지
- 단점: 숨겨진 노드 공간이 비어있음

### 이벤트 모드 토글

**위치**: `TopologyViewer.tsx:161-185`

- **단일 소스**: Publisher의 이벤트만 표시, Consumer는 참조
- **각 구독자별**: 모든 이벤트를 각자 노드로 표시

```typescript
const [eventMode, setEventMode] = useState<'single' | 'multi'>('multi')
```

렌더러에 전달:
```typescript
renderer.render(filteredItems, eventMode)
```

### 레이아웃 방향 전환

**위치**: `TopologyViewer.tsx:147-157`

- **세로 배치 (TB)**: Top to Bottom
- **가로 배치 (LR)**: Left to Right

Dagre의 `rankdir` 옵션 사용.

---

## 데이터 흐름

### 1. API → World
```typescript
fetchTopology()
  → TopologyResponse
  → new TopologyWorld(topology, traceContext)
```

### 2. World → Items
```typescript
TopologyWorld.buildItems()
  → ServiceItem[], PublisherItem[], ConsumerItem[], TopicItem[], EventItem[]
```

**중요**: `topicOwnerMap` 생성 후 EventItem에 `ownerService` 전달

### 3. Items → Renderer
```typescript
world.getItems()
  → filter by filters
  → renderer.render(items, eventMode)
```

### 4. Renderer → React Flow
```typescript
renderer.render()
  → { nodes, edges }
  → renderer.applyLayout(nodes, edges, direction)
  → Dagre 계산
  → { layoutedNodes, layoutedEdges }
```

---

## 그래프 구조 (계층)

### 단일 모드 예시:
```
Rank 0: [Service A] [Service B]
Rank 1: [Publisher A] [Publisher B]
Rank 2: [Topic A] [Topic B]
Rank 3: [Event A1] [Event A2]  ← Publisher 소유
Rank 4: [Consumer B]
            └─────────→ Event A1 (참조)
```

### 가중치 효과:
```
[ecommerce-service]
  └─ [ecommerce-publisher] (weight 100)
       ├─ [ecommerce-events 토픽] (weight 300 - 매우 가까움)
       ├─ [OrderCreatedEvent] (weight 200)
       ├─ [OrderCancelledEvent]
       └─ [ProductCreatedEvent]
            └─────────── (weight 10 - 긴 엣지) ─────→ [payment-consumer]
```

---

## 라우팅 특이사항

**파일**: `App.tsx:50-60`

토폴로지 페이지만 **SplitLayout 없이** 전체 화면으로 렌더링:

```tsx
// 토폴로지 - 전체 화면
<Route path="/notification/topology">
  <AppLayout>
    <TopologyPage />  // No SplitLayout!
  </AppLayout>
</Route>

// 다른 페이지들 - SplitLayout 유지
<Route path="/*">
  <AppLayout>
    <SplitLayout mainPane={...} tracerPane={<TracerPane />} />
  </AppLayout>
</Route>
```

---

## 향후 개선 아이디어

### 1. Compound Nodes (그룹핑)
현재는 엣지 가중치로만 그룹핑. React Flow의 parent/child 관계를 사용하면 시각적으로 더 명확:

```typescript
dagreGraph.setParent('event-xxx', 'publisher-xxx')
```

Publisher가 이벤트들을 "포함"하는 박스로 표시 가능.

### 2. 커스텀 노드 컴포넌트
현재는 기본 노드 + JSX label 사용. React Flow의 커스텀 노드로 전환하면:
- 더 복잡한 인터랙션 가능
- 노드 내부에 버튼, 토글 등 추가
- Hover 시 상세 정보 표시

**참고**: `reactflow` 패키지의 `nodeTypes` prop

### 3. 위치 고정 필터
현재는 필터 변경 시 레이아웃 재계산. 위치 고정 방식:

```typescript
// 모든 노드를 한 번 레이아웃
const allLayouted = applyLayout(allNodes, allEdges)

// 필터링은 opacity/display만
allLayouted.forEach(node => {
  node.style.opacity = shouldShow(node) ? 1 : 0
})
```

### 4. TraceContext 필터링 강화
현재 `traceContext.involvedServices`, `involvedTopics` 기본 지원.

추가 가능:
- 특정 trace의 경로만 하이라이트
- Failed 이벤트 경로 강조
- 타임라인 재생 (애니메이션)

### 5. 백엔드 실제 API 연동
**파일**: `api/topologyService.ts`

```typescript
const USE_MOCK = true  // TODO: 백엔드 연동 시 false로 변경
```

백엔드 컨트롤러:
```
GET /api/topology
→ notification-service/src/main/kotlin/.../TopologyController.kt
```

---

## 트러블슈팅

### Q: 이벤트가 Publisher/Consumer에서 너무 멀리 떨어져 있어요
A: `TopologyRenderer.ts:75-89`의 가중치를 조정하세요:
```typescript
weight = 200  // 이 값을 500, 1000으로 높이면 더 밀집
```

### Q: 토픽이 발행자 근처가 아니라 중간에 생겨요
A: `Publisher → Topic` 가중치를 최대한 높게:
```typescript
else if (edge.id.includes('edge-publisher-topic')) {
  weight = 500  // 300 → 500으로 증가
}
```

### Q: 단일 모드에서 Consumer가 이벤트를 참조하지 못해요
A: `TopologyWorld.ts:102-111`에서 `ownerService`가 올바르게 전달되는지 확인:
```typescript
const ownerService = topicOwnerMap.get(sub.topic) || 'unknown'
```

`topicOwnerMap`은 `buildItems()` 시작 시 생성됩니다.

### Q: 필터링이 작동하지 않아요
A: `TopologyViewer.tsx:79-89`의 `instanceof` 체크 확인.
Import 경로가 `.tsx` 확장자 포함되어 있어야 합니다:
```typescript
import { EventItem } from './items/EventItem.tsx'  // .tsx 필수!
```

### Q: Dagre 레이아웃이 엉망이에요
A: `TopologyRenderer.ts:55-59`의 파라미터 조정:
```typescript
nodesep: 50   // 노드 간 간격 (작을수록 밀집)
ranksep: 150  // 계층 간 간격
```

---

## 참고 파일

### 핵심 파일 (수정 시 주의)
- `items/EventItem.tsx` - 단일/복수 모드 로직
- `TopologyWorld.ts` - ownerService 매핑
- `TopologyRenderer.ts` - 가중치 시스템

### 데이터 파일
- `api/mockTopology.ts` - Mock 데이터
- `types/topology.ts` - 타입 정의

### 백엔드 참고
- `notification-service/.../TopologyController.kt`
- `common/.../kafka-topology.yml`

### Navigation System 연동
- `components/navigation/registry/ServiceRegistry.ts` - 서비스별 색상/아이콘
- ServiceItem에서 `ServiceRegistry.get(serviceType)` 호출

---

## 마지막 작업 상태 (2026-02-09)

✅ 완료된 작업:
- Item-based 렌더링 시스템 구축
- 단일/복수 이벤트 모드 구현
- 계층별 가중치 시스템 (토픽을 발행자 근처에 고정)
- 필터링 UI (Service, Publisher, Consumer, Topic, Event)
- 전체 화면 레이아웃 (TracerPane 제거)
- 세로/가로 배치 전환

🔄 진행 중 / 고려 중:
- 백엔드 실제 API 연동 (`USE_MOCK = true`)
- Compound nodes 도입 (시각적 그룹핑)
- 위치 고정 필터 방식 (성능 개선)

📝 다음 세션 시작 시:
1. 이 문서 읽기
2. `TopologyViewer.tsx` 확인 (UI 상태)
3. `TopologyRenderer.ts` 확인 (가중치 조정 가능성)
4. Mock 데이터로 테스트 후 실제 API 연동
