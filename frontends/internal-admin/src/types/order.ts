// Ecommerce Order Types

export type OrderStatus =
  | 'CREATED' // 주문 생성
  | 'PAYMENT_FAILED' // 결제 실패
  | 'PAYMENT_COMPLETED' // 결제 완료
  | 'PREPARING' // 배송 준비
  | 'SHIPPED' // 배송 중
  | 'DELIVERED' // 배송 완료
  | 'CANCELLED' // 취소됨
  | 'REFUNDED' // 환불됨

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
