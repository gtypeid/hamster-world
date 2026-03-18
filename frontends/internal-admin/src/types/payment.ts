// Payment Service 타입
// Backend: payment-service/domain

// ===== Resource (자원 관리) =====

export type ProductCategory = 'ELECTRONICS' | 'FASHION' | 'FOOD' | 'BOOK' | 'ETC'

export interface Product {
  // === Public IDs (Backend Response) ===
  publicId: string // Payment Service의 Product Public ID (Snowflake Base62)
  ecommerceProductId: string | null // Ecommerce Service의 Product Public ID (cross-service reference)

  // === Product Info ===
  sku: string // Stock Keeping Unit (unique)
  weekId: string // Week identifier
  name: string
  price: number
  description: string | null
  category: ProductCategory

  // === Stock Info ===
  stock: number
  isSoldOut: boolean
  lastRecordedAt: string | null // 마지막 재고 계산 시각

  // === Timestamps ===
  createdAt: string
  modifiedAt: string | null
}

export interface ProductRecord {
  // === Public ID (Backend Response) ===
  recordPublicId: string // ProductRecord의 Public ID (Snowflake Base62)

  // === Record Info ===
  productPublicId: string // Product의 Public ID (FK reference)
  stockDelta: number // 재고 변화량 (양수: 증가, 음수: 감소)
  reason: string // 'INITIAL_STOCK', 'STOCK_RESERVED', 'STOCK_RESTORED', 'STOCK_REPLENISHMENT' 등
  orderPublicId?: string // TODO: Backend에서 추가 예정 - 주문 차감 시 Order Public ID

  // === Timestamps ===
  createdAt: string
}

// 자원 상세 (Product + Event Sourcing History)
export interface ResourceDetail {
  product: Product
  records: ProductRecord[]
}

export interface Settlement {
  id: number
  amount: number
  balance: number
  createdAt: string
}

export interface SettlementRecord {
  id: number
  type: 'payment' | 'refund' | 'withdrawal'
  attemptId?: number
  amount: number
  balance: number
  reason: string
  createdAt: string
}

// ===== Transaction (거래 내역) =====

export type PaymentStatus = 'APPROVED' | 'CANCELLED'

export interface Payment {
  // === Public IDs (Backend Response) ===
  paymentPublicId: string // Payment Public ID (Snowflake Base62)
  processPublicId: string // Cash Gateway PaymentProcess Public ID
  gatewayPaymentPublicId: string // Gateway Payment Public ID
  orderPublicId: string // Ecommerce Order Public ID
  originPaymentPublicId: string | null // 원본 Payment Public ID (취소건인 경우)

  // === Payment Info ===
  gatewayMid: string // Gateway Merchant ID
  amount: number
  status: PaymentStatus // APPROVED, CANCELLED
  pgTransaction: string | null // PG Transaction ID
  pgApprovalNo: string | null // PG Approval Number

  // === Timestamps ===
  createdAt: string
  modifiedAt: string | null
}

export interface PaymentDetail extends Payment {
  // TODO: OrderSnapshot 정보 추가 예정
  // orderSnapshot?: OrderSnapshot
}
