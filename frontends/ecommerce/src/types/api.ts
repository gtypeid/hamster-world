// 백엔드 API 응답 타입 정의 (ecommerce-service)

/**
 * 백엔드 Product 응답 (ProductResponse.kt)
 *
 * MSA 아키텍처:
 * - 내부 Long ID는 서비스 내부에서만 사용
 * - publicId (Snowflake String)만 클라이언트에 노출
 * - 서비스 간 통신도 publicId 사용
 * - 리뷰 통계 포함 (averageRating, reviewCount)
 */
export interface BackendProduct {
  publicId: string  // Snowflake ID (Base62 encoded) - 클라이언트 노출용
  sku: string
  name: string
  description: string | null
  imageUrl: string | null
  category: string
  price: number  // BigDecimal -> number
  stock: number
  isSoldOut: boolean
  lastStockSyncedAt: string | null
  averageRating: number | null  // 평균 평점 (0.0 ~ 5.0)
  reviewCount: number  // 리뷰 개수
  createdAt: string | null
  modifiedAt: string | null
}

/**
 * 상품 상세 응답 (ProductDetailResponse.kt)
 *
 * 판매자(Merchant) 정보 포함
 */
export interface ProductDetailResponse {
  publicId: string
  sku: string
  name: string
  description: string | null
  imageUrl: string | null
  category: string
  price: number
  stock: number
  isSoldOut: boolean
  averageRating: number // 평균 평점
  reviewCount: number // 리뷰 개수
  lastStockSyncedAt: string | null
  merchant: {
    publicId: string
    storeName: string
  }
  coupons: ProductCouponInfo[] // 해당 상품에 적용 가능한 쿠폰 목록
  createdAt: string | null
  modifiedAt: string | null
}

/**
 * 상품 상세에 부착되는 발급 가능 쿠폰 정보 (ProductCouponInfo.kt)
 *
 * 백엔드에서 제공하는 경량 쿠폰 정보
 * - 발급 상태 정보는 포함되지 않음 (발급 가능한 쿠폰만 필터링되어 옴)
 */
export interface ProductCouponInfo {
  couponPolicyPublicId: string
  couponCode: string
  name: string
  discountType: 'FIXED' | 'PERCENTAGE'
  discountValue: number
  maxDiscountAmount: number | null
  minOrderAmount: number
  validUntil: string // ISO DateTime
}

/**
 * 프론트엔드에서 사용하는 Product 타입
 */
export interface Product {
  id: string  // publicId (String)
  name: string
  price: number
  images: string[]
  merchant: string
  rating: number
  soldCount: number
  description: string
  details: string
  stock: number
  category: string
  sku?: string
  isSoldOut?: boolean
}

/**
 * 장바구니 (Cart.kt)
 */
export interface Cart {
  publicId: string
  userPublicId: string  // User의 publicId
  createdAt: string | null
  modifiedAt: string | null
}

/**
 * 장바구니 아이템 (CartItem.kt)
 */
export interface CartItem {
  publicId: string
  cartPublicId: string
  productPublicId: string
  quantity: number
  createdAt: string | null
  modifiedAt: string | null
}

/**
 * 장바구니 아이템 + 상품 정보 (CartItemWithProduct.kt)
 */
export interface CartItemWithProduct {
  cartItem: CartItem
  product: BackendProduct
}

/**
 * 장바구니 전체 (CartWithItems.kt)
 */
export interface CartWithItems {
  cart: Cart
  items: CartItemWithProduct[]
}

export interface Order {
  publicId: string
  userPublicId: string  // User의 publicId
  orderNo: string
  totalAmount: number
  status: string
  createdAt: string | null
  modifiedAt: string | null
}

export interface Payment {
  publicId: string
  orderPublicId: string  // Order의 publicId
  amount: number
  status: string
  paymentMethod: string
  transactionId: string | null
  createdAt: string | null
  modifiedAt: string | null
}
