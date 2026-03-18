/**
 * Coupon 관련 타입 정의
 *
 * 백엔드 API 응답 타입과 프론트엔드 전용 타입
 */

// 사용자 쿠폰 상태
export type UserCouponStatus = 'AVAILABLE' | 'USED' | 'EXPIRED'

// 할인 타입
export type DiscountType = 'FIXED' | 'PERCENTAGE'

// 쿠폰 발행자 타입
export type IssuerType = 'PLATFORM' | 'MERCHANT'

// 쿠폰 정책 상태
export type CouponPolicyStatus = 'ACTIVE' | 'INACTIVE'

/**
 * 쿠폰 정책 DTO (백엔드 응답)
 *
 * GET /coupons/{couponCode} 응답
 * GET /merchant/coupons/my-coupons/list 응답
 */
export interface CouponPolicyDto {
  publicId: string
  couponCode: string
  name: string
  description: string | null
  issuerType: IssuerType
  merchantPublicId: string | null
  status: CouponPolicyStatus
  validFrom: string  // ISO DateTime
  validUntil: string  // ISO DateTime
  couponDays: number
  minOrderAmount: number | null
  discountType: DiscountType
  discountValue: number
  maxDiscountAmount: number | null
  targetProducts: TargetProductInfo[]  // 대상 상품 (비어있으면 전체 상품)
  createdAt: string  // ISO DateTime
}

/**
 * 쿠폰 정책 대상 상품 정보
 */
export interface TargetProductInfo {
  productPublicId: string
  productName: string
}

/**
 * 사용자 쿠폰 DTO (백엔드 응답)
 *
 * GET /coupons/my-coupons/list 응답
 * GET /coupons/my-coupons/available/list 응답
 */
export interface UserCouponDto {
  publicId: string
  couponCode: string
  couponPolicyPublicId: string | null
  couponName: string | null
  status: UserCouponStatus
  issuedAt: string  // ISO DateTime
  expiresAt: string  // ISO DateTime
  usedAt: string | null  // ISO DateTime
}

/**
 * 쿠폰 사용 내역 DTO (백엔드 응답)
 *
 * GET /coupons/my-usages/list 응답
 */
export interface CouponUsageDto {
  publicId: string
  userPublicId: string
  couponCode: string
  orderPublicId: string
  discountAmount: number
  usedAt: string  // ISO DateTime
}

/**
 * 쿠폰 할인 계산 결과 (프론트엔드 전용)
 *
 * 장바구니에서 쿠폰 적용 시 계산 결과
 */
export interface CouponDiscount {
  userCouponId: string
  couponCode: string
  couponName: string
  discountAmount: number
  isApplicable: boolean
  reason?: string  // 적용 불가 사유
}

/**
 * 쿠폰 적용 가능 여부 체크 결과 (프론트엔드 전용)
 */
export interface CouponApplicability {
  applicable: boolean
  reason?: string  // 적용 불가 사유 (최소 주문 금액 미달 등)
}

/**
 * 쿠폰 정책 생성 요청 (Merchant/Admin용)
 *
 * POST /merchant/coupons
 * POST /admin/coupons/platform
 */
export interface CreateCouponPolicyRequest {
  name: string
  description: string | null
  validFrom: string  // ISO DateTime
  validUntil: string  // ISO DateTime
  couponDays?: number | null  // 발급 후 사용 가능 일수 (null이면 기본 10일)
  minOrderAmount: number | null
  conditionFiltersJson?: string | null  // 필터 JSON (선택)
  discountType: DiscountType
  discountValue: number
  maxDiscountAmount: number | null
}

// UI용 UserCouponStatus 한글 매핑
export const USER_COUPON_STATUS_LABELS: Record<UserCouponStatus, string> = {
  AVAILABLE: '사용 가능',
  USED: '사용 완료',
  EXPIRED: '만료됨'
}

// UI용 UserCouponStatus 색상
export const USER_COUPON_STATUS_COLORS: Record<UserCouponStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  USED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-red-100 text-red-800'
}
