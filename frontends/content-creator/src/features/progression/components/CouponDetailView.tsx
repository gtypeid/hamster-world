import type { CouponMaster } from '@/types/progression'

interface CouponDetailViewProps {
  coupon: CouponMaster
  onDelete: (couponId: string) => void
}

export function CouponDetailView({ coupon, onDelete }: CouponDetailViewProps) {
  const getDiscountTypeDescription = (type: string) => {
    switch (type) {
      case 'FIXED':
        return '정액 할인: 주문 금액에서 고정된 금액만큼 할인됩니다.'
      case 'PERCENTAGE':
        return '정률 할인: 주문 금액의 일정 비율만큼 할인됩니다. 최대 할인 금액이 설정되어 있을 수 있습니다.'
      default:
        return ''
    }
  }

  const formatDiscount = () => {
    if (coupon.discountType === 'FIXED') {
      return `${coupon.discountAmount.toLocaleString()}원`
    } else {
      return `${coupon.discountAmount}%`
    }
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto p-4">
      {/* Content */}
      <div className="space-y-4">
        {/* Header Section */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-hamster-brown">{coupon.name}</h2>
                <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                  {coupon.couponCode}
                </span>
              </div>
              <p className="text-sm text-gray-600">{coupon.description}</p>
            </div>
            <button
              onClick={() => onDelete(coupon.couponId)}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
            >
              삭제
            </button>
          </div>
        </section>

        {/* 할인 정보 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            할인 정보
          </h3>

          <div className="space-y-4">
            {/* Discount Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                할인 타입 (Discount Type)
              </label>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-blue-700">
                    {coupon.discountType === 'FIXED' ? '정액 할인' : '정률 할인'}
                  </span>
                  <span className="text-xs text-blue-600 font-mono">
                    ({coupon.discountType})
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {getDiscountTypeDescription(coupon.discountType)}
                </p>
              </div>
            </div>

            {/* Discount Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                할인 금액/비율 (Discount Amount)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-hamster-orange">
                  {formatDiscount()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {coupon.discountType === 'FIXED'
                  ? '주문 금액에서 차감되는 고정 금액입니다.'
                  : '주문 금액에 적용되는 할인 비율입니다.'}
              </p>
            </div>

            {/* Max Discount Amount (PERCENTAGE only) */}
            {coupon.discountType === 'PERCENTAGE' && coupon.maxDiscountAmount && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  최대 할인 금액 (Max Discount Amount)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-600">
                    {coupon.maxDiscountAmount.toLocaleString()}원
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  정률 할인 시 최대로 할인받을 수 있는 금액입니다.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 사용 조건 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            사용 조건
          </h3>

          <div className="space-y-4">
            {/* Min Purchase Amount */}
            {coupon.minPurchaseAmount && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  최소 주문 금액 (Min Purchase Amount)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">
                    {coupon.minPurchaseAmount.toLocaleString()}원
                  </span>
                  <span className="text-sm text-gray-600">이상</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  쿠폰 사용을 위한 최소 주문 금액입니다.
                </p>
              </div>
            )}

            {/* Valid Days */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                유효 기간 (Valid Days)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  {coupon.validDays}일
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                쿠폰 발급 후 사용 가능한 기간입니다.
              </p>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                정렬 순서 (Sort Order)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-700">
                  {coupon.sortOrder}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                작은 숫자일수록 먼저 표시됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="bg-gradient-to-r from-hamster-orange to-orange-500 rounded-lg p-4 text-white">
          <h3 className="text-base font-bold mb-2">요약</h3>
          <p className="text-xs leading-relaxed">
            <strong>{coupon.name}</strong>은(는){' '}
            {coupon.minPurchaseAmount && (
              <>
                <strong>{coupon.minPurchaseAmount.toLocaleString()}원</strong> 이상 구매 시{' '}
              </>
            )}
            <strong>{formatDiscount()}</strong> 할인을 제공하며,{' '}
            발급 후 <strong>{coupon.validDays}일</strong> 동안 사용 가능합니다.
            {coupon.discountType === 'PERCENTAGE' && coupon.maxDiscountAmount && (
              <>
                {' '}
                (최대 <strong>{coupon.maxDiscountAmount.toLocaleString()}원</strong> 할인)
              </>
            )}
          </p>
        </section>
      </div>
    </div>
  )
}
