import { useState } from 'react'
import { CouponIssueCard } from './CouponIssueCard'
import type { ProductCouponInfo } from '../../types/api'

interface ProductCouponSectionProps {
  coupons: ProductCouponInfo[]
  issuedCouponCodes: Set<string>
  onIssueCoupon: (couponCode: string) => Promise<void>
}

/**
 * 상품 상세 페이지의 쿠폰 섹션
 *
 * 해당 머천트가 발급하는 쿠폰 목록을 표시하고
 * 사용자가 쿠폰을 발급받을 수 있도록 함
 */
export function ProductCouponSection({ coupons, issuedCouponCodes, onIssueCoupon }: ProductCouponSectionProps) {
  const [issuingCouponCode, setIssuingCouponCode] = useState<string | null>(null)

  if (!coupons || coupons.length === 0) {
    return null
  }

  const handleIssue = async (couponCode: string) => {
    try {
      setIssuingCouponCode(couponCode)
      await onIssueCoupon(couponCode)
    } finally {
      setIssuingCouponCode(null)
    }
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      {/* 섹션 헤더 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-bold text-hamster-brown">🎁 받을 수 있는 쿠폰</h3>
          <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
            {coupons.length}개
          </span>
        </div>
        <p className="text-sm text-gray-600">
          쿠폰을 미리 발급받고 구매 시 할인 혜택을 받으세요!
        </p>
      </div>

      {/* 쿠폰 카드 목록 */}
      <div className="space-y-3">
        {coupons.map((coupon) => (
          <CouponIssueCard
            key={coupon.couponPolicyPublicId}
            coupon={coupon}
            isAlreadyIssued={issuedCouponCodes.has(coupon.couponCode)}
            onIssue={handleIssue}
            isIssuing={issuingCouponCode === coupon.couponCode}
          />
        ))}
      </div>

      {/* 안내 메시지 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 발급받은 쿠폰은 장바구니에서 사용할 수 있습니다. 쿠폰은 중복 사용이 불가능하며, 1인 1회만
          발급 가능합니다.
        </p>
      </div>
    </div>
  )
}
