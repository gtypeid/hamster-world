// Navigation System Types

/**
 * ID 타입 정의
 * - 서비스별 Public ID 타입들
 */
export type IdType =
  // Cash Gateway Service
  | 'process-id' // PaymentProcess publicId
  | 'payment-id' // Payment publicId
  | 'event-id' // ProcessEvent eventId
  | 'trace-id' // Distributed trace ID

  // Payment Service
  | 'product-id' // Product publicId

  // Ecommerce Service (Cross-service references)
  | 'order-id' // Order publicId
  | 'user-id' // User publicId
  | 'ecommerce-product-id' // Ecommerce Product publicId

/**
 * 상세 뷰어 타입 정의
 * - TracerPane에 표시될 뷰어들
 */
export type ViewerType =
  | 'process-detail' // PaymentProcess 상세
  | 'payment-detail' // Payment 상세
  | 'event-timeline' // Event Timeline
  | 'trace-timeline' // Trace ID로 묶인 전체 타임라인
  | 'product-detail' // Product 상세 + Event Sourcing (Payment Service)
  | 'ecommerce-product-detail' // Ecommerce Product 상세
  | 'order-detail' // Order 상세 (Ecommerce)
  | 'user-detail' // User 상세 (Ecommerce)

/**
 * 네비게이션 아이템 (TracerPane에 표시할 내용)
 */
export interface NavigationItem {
  id: string // 클릭한 ID 값
  type: IdType // ID 타입
  viewerType: ViewerType // 어떤 뷰어로 표시할지
  label: string // 표시할 라벨 (예: "Process: 7nX9kP2mQ8rT1vY5")
  data?: any // 뷰어에 전달할 추가 데이터
}

/**
 * 네비게이션 스택
 * - 사용자가 클릭한 ID 히스토리
 * - 뒤로가기/앞으로가기 지원용
 */
export interface NavigationStack {
  items: NavigationItem[]
  currentIndex: number
}

/**
 * 네비게이션 상태
 */
export interface NavigationState {
  stack: NavigationStack
  isLoading: boolean
  error: string | null
}

/**
 * 네비게이션 액션
 */
export type NavigationAction =
  | { type: 'NAVIGATE'; item: NavigationItem }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' }
  | { type: 'CLEAR' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }

/**
 * ID 패턴 정의
 * - 자동 감지용 정규식 패턴
 */
export interface IdPattern {
  type: IdType
  pattern: RegExp
  prefix?: string // 예: "PROD_", "PAY_"
}

/**
 * API Fetcher 설정
 * - fetcher가 있으면: API 호출해서 데이터 가져옴
 * - fetcher가 없으면: 단독 조회 불가 (부모 데이터에 포함된 ID)
 */
export type ApiFetcher<T = any> = (id: string) => Promise<T>

/**
 * "내 아이템 가기" 설정
 */
export interface MyItemConfig {
  searchBy: (id: string) => { field: string; value: string } // 검색 조건 생성 함수
  listRoute?: string // 커스텀 리스트 라우트 (없으면 ServiceRegistry의 listRoute 사용)
}

/**
 * 뷰어 설정
 */
export interface ViewerConfig {
  type: ViewerType
  title: string
  component: React.ComponentType<ViewerProps>

  // API 설정 (필수 - 서비스 아이콘/색상 결정)
  service: 'payment' | 'gateway' | 'ecommerce' // 어느 서비스의 API인지
  fetcher?: ApiFetcher // ID로 데이터 조회하는 함수

  // "내 아이템 가기" 설정 (기본: 활성화, 비활성화하려면 false)
  myItem?: MyItemConfig | false
}

/**
 * 뷰어 Props
 */
export interface ViewerProps {
  id: string // 표시할 ID
  type: IdType // ID 타입
  data?: any // 추가 데이터
}
