import type { CouponMaster } from '@/types/progression'

/**
 * Mock Coupon 데이터
 * 실제 백엔드 연동 전까지 사용
 */
export const mockCoupons: CouponMaster[] = [
  {
    couponId: '1',
    couponCode: 'WELCOME_3000',
    name: '신규 가입 환영 쿠폰',
    description: '첫 주문 시 3,000원 할인',
    discountType: 'FIXED',
    discountAmount: 3000,
    minPurchaseAmount: 10000,
    validDays: 30,
    sortOrder: 10,
  },
  {
    couponId: '2',
    couponCode: 'FIRST_ORDER_5000',
    name: '첫 주문 특별 할인',
    description: '첫 주문 시 5,000원 할인',
    discountType: 'FIXED',
    discountAmount: 5000,
    minPurchaseAmount: 20000,
    validDays: 7,
    sortOrder: 20,
  },
  {
    couponId: '3',
    couponCode: 'VIP_10PERCENT',
    name: 'VIP 회원 10% 할인',
    description: 'VIP 회원 전용 10% 할인 (최대 5,000원)',
    discountType: 'PERCENTAGE',
    discountAmount: 10,
    minPurchaseAmount: 30000,
    maxDiscountAmount: 5000,
    validDays: 90,
    sortOrder: 30,
  },
  {
    couponId: '4',
    couponCode: 'WEEKLY_1000',
    name: '주간 보너스 쿠폰',
    description: '주간 미션 달성 시 1,000원 할인',
    discountType: 'FIXED',
    discountAmount: 1000,
    minPurchaseAmount: 5000,
    validDays: 14,
    sortOrder: 40,
  },
  {
    couponId: '5',
    couponCode: 'REVIEW_REWARD_2000',
    name: '리뷰 작성 보상 쿠폰',
    description: '리뷰 작성 시 2,000원 할인',
    discountType: 'FIXED',
    discountAmount: 2000,
    minPurchaseAmount: 15000,
    validDays: 30,
    sortOrder: 50,
  },
  {
    couponId: '6',
    couponCode: 'SEASON_15PERCENT',
    name: '시즌 특별 15% 할인',
    description: '시즌 프로모션 15% 할인 (최대 10,000원)',
    discountType: 'PERCENTAGE',
    discountAmount: 15,
    minPurchaseAmount: 50000,
    maxDiscountAmount: 10000,
    validDays: 60,
    sortOrder: 60,
  },
  {
    couponId: '7',
    couponCode: 'BIRTHDAY_5PERCENT',
    name: '생일 축하 쿠폰',
    description: '생일 축하 5% 할인',
    discountType: 'PERCENTAGE',
    discountAmount: 5,
    minPurchaseAmount: 10000,
    maxDiscountAmount: 3000,
    validDays: 30,
    sortOrder: 70,
  },
]

/**
 * CSV Export용 헬퍼 함수
 */
export function convertCouponToCSV(coupons: CouponMaster[]): string {
  const headers = [
    'coupon_id',
    'coupon_code',
    'name',
    'description',
    'discount_type',
    'discount_amount',
    'min_purchase_amount',
    'max_discount_amount',
    'valid_days',
    'sort_order',
  ].join(',')

  const rows = coupons.map((coupon) => {
    return [
      coupon.couponId,
      coupon.couponCode,
      coupon.name,
      coupon.description,
      coupon.discountType,
      coupon.discountAmount,
      coupon.minPurchaseAmount || '',
      coupon.maxDiscountAmount || '',
      coupon.validDays,
      coupon.sortOrder,
    ].join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * CSV 다운로드 헬퍼
 */
export function downloadCouponCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
