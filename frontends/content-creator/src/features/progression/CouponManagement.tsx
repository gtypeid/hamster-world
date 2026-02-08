import { useState, useMemo } from 'react'
import type { CouponMaster, CouponDiscountType } from '@/types/progression'
import { mockCoupons, convertCouponToCSV, downloadCouponCSV } from './couponMockData'
import { CouponDetailView } from './components/CouponDetailView'
import { CouponEditor } from './components/CouponEditor'

export function CouponManagement() {
  const [coupons, setCoupons] = useState<CouponMaster[]>(mockCoupons)
  const [selectedCoupon, setSelectedCoupon] = useState<CouponMaster | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [discountTypeFilter, setDiscountTypeFilter] = useState<CouponDiscountType | 'ALL'>('ALL')

  // Filter and search coupons
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

  const handleSelectCoupon = (coupon: CouponMaster) => {
    setSelectedCoupon(coupon)
    setIsCreatingNew(false)
  }

  const handleCreateNew = () => {
    setSelectedCoupon(null)
    setIsCreatingNew(true)
  }

  const handleSave = (coupon: CouponMaster) => {
    if (isCreatingNew) {
      // Add new coupon
      setCoupons([...coupons, coupon])
      alert(`✅ "${coupon.name}" 쿠폰이 생성되었습니다!`)
    } else {
      // Update existing coupon
      setCoupons(coupons.map((c) => (c.couponId === coupon.couponId ? coupon : c)))
      alert(`✅ "${coupon.name}" 쿠폰이 수정되었습니다!`)
    }
    setSelectedCoupon(coupon)
    setIsCreatingNew(false)
  }

  const handleCancel = () => {
    setIsCreatingNew(false)
    setSelectedCoupon(null)
  }

  const handleDelete = (couponId: string) => {
    const deleted = coupons.find((c) => c.couponId === couponId)
    if (confirm(`"${deleted?.name}" 쿠폰을 삭제하시겠습니까?`)) {
      setCoupons(coupons.filter((c) => c.couponId !== couponId))
      if (selectedCoupon?.couponId === couponId) {
        setSelectedCoupon(null)
      }
      alert(`🗑️ "${deleted?.name}" 쿠폰이 삭제되었습니다!`)
    }
  }

  const handleExportCSV = () => {
    const csv = convertCouponToCSV(coupons)
    downloadCouponCSV('coupons.csv', csv)
    alert('✅ coupons.csv 파일이 다운로드되었습니다!')
  }

  const getDiscountTypeColor = (discountType: CouponDiscountType) => {
    switch (discountType) {
      case 'FIXED':
        return 'bg-blue-100 text-blue-800'
      case 'PERCENTAGE':
        return 'bg-purple-100 text-purple-800'
    }
  }

  const formatDiscount = (coupon: CouponMaster) => {
    if (coupon.discountType === 'FIXED') {
      return `${coupon.discountAmount.toLocaleString()}원`
    } else {
      return `${coupon.discountAmount}%`
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-4">
            <h1 className="text-xl font-bold text-hamster-brown whitespace-nowrap">
              관리자 쿠폰 관리
            </h1>

            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-hamster-orange"
              />
            </div>

            {/* Discount Type Filter */}
            <select
              value={discountTypeFilter}
              onChange={(e) => setDiscountTypeFilter(e.target.value as CouponDiscountType | 'ALL')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-hamster-orange"
            >
              <option value="ALL">전체</option>
              <option value="FIXED">정액</option>
              <option value="PERCENTAGE">정률</option>
            </select>

            <span className="text-xs text-gray-500 whitespace-nowrap">
              {filteredCoupons.length}개
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateNew}
              className="px-4 py-1.5 bg-hamster-orange hover:bg-orange-600 text-white text-sm rounded transition-colors font-medium"
            >
              + New
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors font-medium"
            >
              📥 CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Coupon List */}
        <div className="w-96 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-2">
            {filteredCoupons.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">검색 결과가 없습니다</p>
              </div>
            ) : (
              filteredCoupons.map((coupon) => (
                <button
                  key={coupon.couponId}
                  onClick={() => handleSelectCoupon(coupon)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedCoupon?.couponId === coupon.couponId
                      ? 'border-hamster-orange bg-hamster-ivory'
                      : 'border-gray-200 hover:border-hamster-orange hover:bg-gray-50'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm flex-1">
                      {coupon.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getDiscountTypeColor(
                        coupon.discountType
                      )}`}
                    >
                      {coupon.discountType === 'FIXED' ? '정액' : '정률'}
                    </span>
                  </div>

                  {/* Coupon Code */}
                  <div className="text-xs text-gray-500 font-mono mb-2">
                    {coupon.couponCode}
                  </div>

                  {/* Info */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">할인:</span>
                      <span className="font-medium text-hamster-orange">
                        {formatDiscount(coupon)}
                      </span>
                    </div>
                    {coupon.minPurchaseAmount && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">최소:</span>
                        <span className="font-mono">
                          {coupon.minPurchaseAmount.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">유효:</span>
                      <span className="font-mono">{coupon.validDays}일</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Editor, Detail View or Empty State */}
        <div className="flex-1">
          {isCreatingNew ? (
            <CouponEditor
              coupon={null}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : selectedCoupon ? (
            <CouponDetailView coupon={selectedCoupon} onDelete={handleDelete} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-8xl mb-6">🎟️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          쿠폰을 선택하세요
        </h2>
        <p className="text-gray-600 mb-6">
          좌측 목록에서 쿠폰을 선택하여 상세 정보를 확인하세요
        </p>
      </div>
    </div>
  )
}
