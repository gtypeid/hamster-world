import type { ProductCouponInfo } from '../../types/api'

interface CouponIssueCardProps {
  coupon: ProductCouponInfo
  isAlreadyIssued?: boolean
  onIssue: (couponCode: string) => void
  isIssuing?: boolean
}

/**
 * 상품 상세 페이지에서 쿠폰 발급 카드
 *
 * - 쿠폰 정보 표시 (할인 금액/퍼센트, 사용 조건 등)
 * - 이미 발급받은 쿠폰은 비활성 상태로 표시
 */
export function CouponIssueCard({ coupon, isAlreadyIssued, onIssue, isIssuing }: CouponIssueCardProps) {
  // 할인 금액 표시
  const getDiscountDisplay = () => {
    if (coupon.discountType === 'FIXED') {
      return `${coupon.discountValue.toLocaleString()}원 할인`
    } else {
      return `${coupon.discountValue}% 할인`
    }
  }

  // 최대 할인 금액 표시
  const getMaxDiscountDisplay = () => {
    if (coupon.discountType === 'PERCENTAGE' && coupon.maxDiscountAmount) {
      return `최대 ${coupon.maxDiscountAmount.toLocaleString()}원`
    }
    return null
  }

  // 최소 주문 금액 표시
  const getMinOrderDisplay = () => {
    if (coupon.minOrderAmount && coupon.minOrderAmount > 0) {
      return `${coupon.minOrderAmount.toLocaleString()}원 이상 구매 시`
    }
    return '최소 주문 금액 제한 없음'
  }

  // 발급 기간 종료일 표시
  const getValidUntilDisplay = () => {
    const until = new Date(coupon.validUntil).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    return `${until}까지 발급 가능`
  }

  return (
    <div className={`border-2 rounded-lg p-3 transition-all ${
      isAlreadyIssued
        ? 'border-gray-200 bg-gray-50 opacity-75'
        : 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-sm'
    }`}>
      {/* 쿠폰 정보 */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{isAlreadyIssued ? '✓' : '🎫'}</span>
            <h3 className={`font-bold text-sm ${isAlreadyIssued ? 'text-gray-600' : 'text-hamster-brown'}`}>
              {coupon.name}
            </h3>
            {isAlreadyIssued && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                발급완료
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-bold ${isAlreadyIssued ? 'text-gray-500' : 'text-amber-600'}`}>
              {getDiscountDisplay()}
            </span>
            {getMaxDiscountDisplay() && (
              <span className="text-xs text-gray-500">({getMaxDiscountDisplay()})</span>
            )}
          </div>
        </div>

        {/* 발급 버튼 */}
        <button
          onClick={() => !isIssuing && !isAlreadyIssued && onIssue(coupon.couponCode)}
          disabled={isIssuing || isAlreadyIssued}
          className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors whitespace-nowrap ${
            isAlreadyIssued
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : isIssuing
              ? 'bg-amber-400 text-white cursor-wait'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {isAlreadyIssued ? '발급완료' : isIssuing ? '발급 중...' : '발급받기'}
        </button>
      </div>

      {/* 조건 정보 */}
      <div className={`text-xs space-y-0.5 ml-6 ${isAlreadyIssued ? 'text-gray-500' : 'text-gray-600'}`}>
        <p>• {getMinOrderDisplay()}</p>
        <p className={isAlreadyIssued ? '' : 'text-amber-700'}>• {getValidUntilDisplay()}</p>
      </div>
    </div>
  )
}
