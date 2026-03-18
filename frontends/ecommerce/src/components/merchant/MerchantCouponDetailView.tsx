import type { MerchantCoupon } from '../../types/ecommerce'

interface MerchantCouponDetailViewProps {
  coupon: MerchantCoupon
  onDelete: () => void
  onClose: () => void
}

export function MerchantCouponDetailView({ coupon, onDelete, onClose }: MerchantCouponDetailViewProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">활성</span>
      case 'INACTIVE':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full">비활성</span>
      case 'EXPIRED':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">만료</span>
    }
  }

  // Parse filtersJson
  let filters = null
  if (coupon.filtersJson) {
    try {
      filters = JSON.parse(coupon.filtersJson)
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ←
          </button>
          <h2 className="text-xl font-bold text-hamster-brown">쿠폰 상세</h2>
        </div>
        <button
          onClick={onDelete}
          className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
        >
          삭제
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🎟️</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-hamster-brown">{coupon.name}</h3>
                {getStatusBadge(coupon.status)}
              </div>
              <p className="text-sm text-gray-600">{coupon.description}</p>
            </div>
          </div>
        </section>

        {/* Coupon Code */}
        <section className="bg-gray-50 rounded-xl p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">쿠폰 코드</label>
          <div className="flex items-center gap-3">
            <code className="text-2xl font-mono font-bold text-hamster-orange">{coupon.couponCode}</code>
            <button
              onClick={() => navigator.clipboard.writeText(coupon.couponCode)}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              복사
            </button>
          </div>
        </section>

        {/* Discount Info */}
        <section className="bg-amber-50 rounded-xl p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">할인 정보</label>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600">할인 타입:</span>
              <span className="font-bold text-gray-900">
                {coupon.discountType === 'FIXED' ? '정액 할인' : '정률 할인'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600">할인 금액:</span>
              <span className="text-2xl font-bold text-amber-600">
                {coupon.discountType === 'FIXED'
                  ? `${coupon.discountValue.toLocaleString()}원`
                  : `${coupon.discountValue}%`}
              </span>
            </div>
            {coupon.maxDiscountAmount && (
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-600">최대 할인 금액:</span>
                <span className="font-semibold text-gray-900">{coupon.maxDiscountAmount.toLocaleString()}원</span>
              </div>
            )}
          </div>
        </section>

        {/* Usage Conditions */}
        <section className="bg-blue-50 rounded-xl p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">사용 조건</label>
          <div className="space-y-2">
            {coupon.minOrderAmount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-600">최소 주문 금액:</span>
                <span className="font-semibold text-gray-900">{coupon.minOrderAmount.toLocaleString()}원</span>
              </div>
            ) : (
              <div className="text-sm text-gray-600">최소 주문 금액 제한 없음</div>
            )}

            {filters && (
              <>
                {filters.categories && filters.categories.length > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-600">카테고리:</span>
                    <span className="font-semibold text-gray-900">{filters.categories.join(', ')}</span>
                  </div>
                )}
                {filters.productIds && filters.productIds.length > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-600">상품 ID:</span>
                    <span className="font-semibold text-gray-900">{filters.productIds.join(', ')}</span>
                  </div>
                )}
                {filters.merchantIds && filters.merchantIds.length > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-600">판매자 ID:</span>
                    <span className="font-semibold text-gray-900">{filters.merchantIds.join(', ')}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Target Products */}
        <section className="bg-green-50 rounded-xl p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">적용 대상 상품</label>
          {coupon.targetProducts.length === 0 ? (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-xl">✓</span>
              <span>전체 상품에 적용됩니다</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-green-700 font-medium mb-2">
                총 {coupon.targetProducts.length}개 상품
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {coupon.targetProducts.map((product, index) => (
                  <div
                    key={product.productPublicId}
                    className="flex items-center gap-3 p-2 bg-white rounded-lg border border-green-200"
                  >
                    <span className="text-sm font-mono text-gray-400 w-8">{index + 1}.</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product.productName}</p>
                      <p className="text-xs text-gray-500 font-mono">{product.productPublicId}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Validity Period */}
        <section className="bg-purple-50 rounded-xl p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">유효 기간</label>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600">시작:</span>
              <span className="font-semibold text-gray-900">{formatDate(coupon.validFrom)}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600">종료:</span>
              <span className="font-semibold text-gray-900">{formatDate(coupon.validUntil)}</span>
            </div>
          </div>
        </section>

        {/* Metadata */}
        <section className="bg-gray-50 rounded-xl p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">메타 정보</label>
          <div className="space-y-2 text-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-gray-600">쿠폰 ID:</span>
              <code className="font-mono text-xs text-gray-800">{coupon.couponId}</code>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-600">발급 주체:</span>
              <span className="text-gray-800">
                {coupon.issuerType === 'PLATFORM' ? '플랫폼' : '판매자'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-600">생성일:</span>
              <span className="text-gray-800">{formatDate(coupon.createdAt)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
