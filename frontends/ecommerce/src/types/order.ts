/**
 * Order 관련 타입 정의
 */

// 백엔드 OrderStatus enum
export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_REQUESTED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_FAILED'
  | 'CANCELED'

// 주문 검색 쿼리 파라미터
export interface OrderSearchParams {
  status?: OrderStatus
  from?: string  // ISO DateTime
  to?: string    // ISO DateTime
}

// 주문 목록 응답 (간단한 정보)
export interface OrderResponse {
  orderPublicId: string
  userPublicId: string
  orderNumber: string
  gatewayPaymentPublicId: string | null
  totalPrice: number
  status: OrderStatus
  itemCount: number
  createdAt: string | null
  modifiedAt: string | null
}

// 주문 아이템 응답
export interface OrderItemResponse {
  orderItemPublicId: string
  productPublicId: string
  productName: string
  productImageUrl: string | null
  quantity: number
  price: number  // 단가 * 수량
}

// 주문 상세 응답
export interface OrderDetailResponse {
  orderPublicId: string
  userPublicId: string
  orderNumber: string
  gatewayPaymentPublicId: string | null
  totalPrice: number
  status: OrderStatus
  items: OrderItemResponse[]
  createdAt: string | null
  modifiedAt: string | null
}

// 판매자 주문 목록 응답
export interface MerchantOrderResponse {
  orderPublicId: string
  userPublicId: string
  orderNumber: string
  gatewayPaymentPublicId: string | null
  orderTotalPrice: number  // 전체 주문 금액
  myItemsPrice: number     // 내 상품 금액 합계
  myItemCount: number      // 내 상품 수량
  status: OrderStatus
  createdAt: string | null
  modifiedAt: string | null
}

// 판매자 주문 상세 응답
export interface MerchantOrderDetailResponse {
  orderPublicId: string
  userPublicId: string
  orderNumber: string
  gatewayPaymentPublicId: string | null
  orderTotalPrice: number
  myItemsPrice: number
  myItems: OrderItemResponse[]  // 내 상품만 필터링
  status: OrderStatus
  createdAt: string | null
  modifiedAt: string | null
}

// Legacy types (기존 호환성)
export interface Order {
  publicId: string
  userPublicId: string
  orderNumber: string | null
  gatewayReferenceId: string | null
  price: number
  status: OrderStatus
  createdAt: string | null
  modifiedAt: string | null
}

export interface OrderItem {
  publicId: string
  orderPublicId: string
  productPublicId: string
  quantity: number
  price: number
  createdAt: string | null
  modifiedAt: string | null
}

export interface OrderWithItems {
  order: Order
  items: OrderItem[]
}

// UI용 OrderStatus 한글 매핑
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: '주문 생성',
  PAYMENT_REQUESTED: '결제 요청',
  PAYMENT_APPROVED: '결제 완료',
  PAYMENT_FAILED: '결제 실패',
  CANCELED: '취소됨'
}

// UI용 OrderStatus 색상
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  CREATED: 'bg-gray-100 text-gray-800',
  PAYMENT_REQUESTED: 'bg-yellow-100 text-yellow-800',
  PAYMENT_APPROVED: 'bg-green-100 text-green-800',
  PAYMENT_FAILED: 'bg-red-100 text-red-800',
  CANCELED: 'bg-red-100 text-red-800'
}
