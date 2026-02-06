// Payment Service 타입 - 자원(Resource) 관점
// Backend: payment-service/domain/product

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
