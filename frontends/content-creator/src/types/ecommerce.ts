/**
 * E-commerce Service 타입 정의
 */

// ============================================
// Enums & Constants
// ============================================

export type CouponDiscountType = 'FIXED' | 'PERCENTAGE'

export type CouponStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

export type CouponIssuerType = 'PLATFORM' | 'MERCHANT'

// ============================================
// Coupon Filters
// ============================================

export interface CouponFilters {
  categories?: string[] // ProductCategory enum values
  productIds?: number[]
  merchantIds?: number[]
}

// ============================================
// Merchant Coupon (상점 쿠폰)
// ============================================

export interface MerchantCoupon {
  couponId: string
  couponCode: string // 사용자가 입력하는 코드 (예: SPRING2025)
  name: string
  description: string
  issuerType: CouponIssuerType // PLATFORM | MERCHANT
  merchantId?: number // MERCHANT일 때만 사용
  status: CouponStatus
  validFrom: string // ISO DateTime
  validUntil: string // ISO DateTime
  // usageCondition (Embeddable)
  minOrderAmount?: number // 최소 주문 금액
  filtersJson?: string // JSON string: { categories?, productIds?, merchantIds? }
  // discountEmitter (Embeddable)
  discountType: CouponDiscountType
  discountValue: number // FIXED: 금액, PERCENTAGE: 퍼센트
  maxDiscountAmount?: number // PERCENTAGE일 때 최대 할인 금액
  createdAt: string
  updatedAt: string
  // Note: 1유저 1쿠폰 1회 사용 제약은 백엔드에서 UNIQUE(user_id, coupon_code)로 관리됨
}

export interface MerchantCouponFormData {
  couponId?: string
  couponCode: string
  name: string
  description: string
  discountType: CouponDiscountType
  discountValue: number
  maxDiscountAmount?: number
  minOrderAmount?: number
  filters?: CouponFilters // 프론트에서 사용할 구조화된 객체
  validFrom: string
  validUntil: string
}

// ============================================
// Product
// ============================================

export interface Product {
  productId: string
  merchantId: string
  sku: string
  name: string
  description: string
  imageUrl?: string
  category: string
  price: number
  stock: number
  rating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
}
