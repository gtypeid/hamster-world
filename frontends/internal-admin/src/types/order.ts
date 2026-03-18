// Ecommerce Order Types

export type OrderStatus =
  | 'CREATED' // 주문 생성
  | 'PAYMENT_REQUESTED' // 결제 요청
  | 'PAYMENT_APPROVED' // 결제 승인
  | 'PAYMENT_FAILED' // 결제 실패
  | 'CANCELED' // 취소됨

/**
 * 주문 목록 아이템 (Admin API 응답)
 */
export interface OrderListItem {
  orderPublicId: string
  userPublicId: string
  orderNumber: string
  gatewayPaymentPublicId: string | null
  totalPrice: number
  status: OrderStatus
  itemCount: number
  createdAt: string
  modifiedAt: string | null
}

/**
 * 주문 아이템
 */
export interface OrderItem {
  orderItemPublicId: string
  productPublicId: string
  productName: string
  productImageUrl: string | null
  quantity: number
  price: number
}

/**
 * 주문 상세 (Admin API 응답)
 */
export interface OrderDetail {
  orderPublicId: string
  userPublicId: string
  orderNumber: string
  gatewayPaymentPublicId: string | null
  totalPrice: number
  status: OrderStatus
  items: OrderItem[]
  createdAt: string
  modifiedAt: string | null
}
