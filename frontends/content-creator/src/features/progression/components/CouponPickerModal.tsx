import { useState, useMemo } from 'react'
import type { CouponMaster, CouponDiscountType } from '@/types/progression'

interface CouponPickerModalProps {
  coupons: CouponMaster[]
  selectedCouponCode?: string
  onSelect: (couponCode: string) => void
  onClose: () => void
}

export function CouponPickerModal({
  coupons,
  selectedCouponCode,
  onSelect,
  onClose,
}: CouponPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [discountTypeFilter, setDiscountTypeFilter] = useState<CouponDiscountType | 'ALL'>('ALL')

  // Filter coupons
  const filteredCoupons = useMemo(() => {
    return coupons
      .filter((coupon) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          if (
            !coupon.name.toLowerCase().includes(query) &&
            !coupon.couponCode.toLowerCase().includes(query)
          ) {
            return false
          }
        }

        // Discount type filter
        if (discountTypeFilter !== 'ALL' && coupon.discountType !== discountTypeFilter) {
          return false
        }

        return true
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [coupons, searchQuery, discountTypeFilter])

  const handleSelect = (couponCode: string) => {
    onSelect(couponCode)
    onClose()
  }

  const formatDiscount = (coupon: CouponMaster) => {
    if (coupon.discountType === 'FIXED') {
      return `${coupon.discountAmount.toLocaleString()}원 할인`
    } else {
      const maxPart = coupon.maxDiscountAmount
        ? ` (최대 ${coupon.maxDiscountAmount.toLocaleString()}원)`
        : ''
      return `${coupon.discountAmount}% 할인${maxPart}`
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-hamster-brown">쿠폰 선택</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="쿠폰 이름 또는 코드로 검색..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
            />
            <select
              value={discountTypeFilter}
              onChange={(e) => setDiscountTypeFilter(e.target.value as CouponDiscountType | 'ALL')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
            >
              <option value="ALL">전체</option>
              <option value="FIXED">정액 할인</option>
              <option value="PERCENTAGE">정률 할인</option>
            </select>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {filteredCoupons.length}개의 쿠폰
          </p>
        </div>

        {/* Coupon List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCoupons.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCoupons.map((coupon) => (
                <div
                  key={coupon.couponCode}
                  className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                    selectedCouponCode === coupon.couponCode
                      ? 'border-hamster-orange bg-orange-50'
                      : 'border-gray-200 hover:border-hamster-orange hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(coupon.couponCode)}
                >
                  {/* Coupon Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{coupon.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{coupon.couponCode}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        coupon.discountType === 'FIXED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {coupon.discountType === 'FIXED' ? '정액' : '정률'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{coupon.description}</p>

                  {/* Coupon Details */}
                  <div className="space-y-2 mb-4">
                    {/* Discount */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">할인:</span>
                      <span className="text-sm font-bold text-hamster-orange">
                        {formatDiscount(coupon)}
                      </span>
                    </div>

                    {/* Min Purchase Amount */}
                    {coupon.minPurchaseAmount && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16">최소 주문:</span>
                        <span className="text-sm text-gray-700">
                          {coupon.minPurchaseAmount.toLocaleString()}원 이상
                        </span>
                      </div>
                    )}

                    {/* Valid Days */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">유효기간:</span>
                      <span className="text-sm text-gray-700">발급 후 {coupon.validDays}일</span>
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(coupon.couponCode)
                    }}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCouponCode === coupon.couponCode
                        ? 'bg-hamster-orange text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedCouponCode === coupon.couponCode ? '선택됨 ✓' : '선택하기'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
