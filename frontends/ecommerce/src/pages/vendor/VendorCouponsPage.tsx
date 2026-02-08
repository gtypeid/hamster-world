import { useState } from 'react'
import { VendorLayout } from '../../components/vendor/VendorLayout'
import { VendorCouponDetailView } from '../../components/vendor/VendorCouponDetailView'
import { VendorCouponEditor } from '../../components/vendor/VendorCouponEditor'
import { useAlert } from '../../contexts/AlertContext'
import type { MerchantCoupon, MerchantCouponFormData, CouponStatus } from '../../types/ecommerce'

// Mock 쿠폰 데이터
const mockCoupons: MerchantCoupon[] = [
  {
    couponId: '1',
    couponCode: 'HAMSTER_WELCOME',
    name: '신규 고객 환영 쿠폰',
    description: '처음 구매하시는 고객을 위한 10% 할인 쿠폰 (1인 1회 사용)',
    issuerType: 'MERCHANT',
    merchantId: 1,
    status: 'ACTIVE',
    validFrom: '2026-02-01T00:00:00',
    validUntil: '2026-03-31T23:59:59',
    // usageCondition
    minOrderAmount: 20000,
    filtersJson: undefined,
    // discountEmitter
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscountAmount: 5000,
    createdAt: '2026-02-01T00:00:00',
    updatedAt: '2026-02-01T00:00:00',
  },
  {
    couponId: '2',
    couponCode: 'SPRING2026',
    name: '봄맞이 특가 쿠폰',
    description: '3,000원 즉시 할인 (1인 1회 사용)',
    issuerType: 'MERCHANT',
    merchantId: 1,
    status: 'ACTIVE',
    validFrom: '2026-02-08T00:00:00',
    validUntil: '2026-04-30T23:59:59',
    // usageCondition
    minOrderAmount: 15000,
    filtersJson: undefined,
    // discountEmitter
    discountType: 'FIXED',
    discountValue: 3000,
    maxDiscountAmount: undefined,
    createdAt: '2026-02-08T00:00:00',
    updatedAt: '2026-02-08T00:00:00',
  },
  {
    couponId: '3',
    couponCode: 'VIP5000',
    name: 'VIP 고객 전용 쿠폰',
    description: '5,000원 할인 (1인 1회 사용)',
    issuerType: 'MERCHANT',
    merchantId: 1,
    status: 'EXPIRED',
    validFrom: '2026-01-01T00:00:00',
    validUntil: '2026-02-28T23:59:59',
    // usageCondition
    minOrderAmount: 30000,
    filtersJson: undefined,
    // discountEmitter
    discountType: 'FIXED',
    discountValue: 5000,
    maxDiscountAmount: undefined,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  },
]

export function VendorCouponsPage() {
  const { showAlert, showConfirm } = useAlert()
  const [coupons, setCoupons] = useState<MerchantCoupon[]>(mockCoupons)
  const [selectedCoupon, setSelectedCoupon] = useState<MerchantCoupon | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditorModal, setShowEditorModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'ALL'>('ALL')

  const filteredCoupons = coupons.filter((coupon) => {
    if (
      searchQuery &&
      !coupon.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !coupon.couponCode.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    if (statusFilter !== 'ALL' && coupon.status !== statusFilter) {
      return false
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">활성</span>
      case 'INACTIVE':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">비활성</span>
      case 'EXPIRED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">만료</span>
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleRowClick = (coupon: MerchantCoupon) => {
    setSelectedCoupon(coupon)
    setShowDetailModal(true)
  }

  const handleCreateNew = () => {
    setShowEditorModal(true)
  }

  const handleDelete = async () => {
    if (!selectedCoupon) return

    const confirmed = await showConfirm(
      `"${selectedCoupon.name}" 쿠폰을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    )

    if (confirmed) {
      setCoupons((prev) => prev.filter((c) => c.couponId !== selectedCoupon.couponId))
      showAlert(`"${selectedCoupon.name}" 쿠폰이 삭제되었습니다.`)
      setShowDetailModal(false)
      setSelectedCoupon(null)
    }
  }

  const handleSave = (data: MerchantCouponFormData) => {
    // Convert filters to filtersJson
    const filtersJson = data.filters ? JSON.stringify(data.filters) : undefined

    // 자동으로 쿠폰 코드 생성 (COUPON_{timestamp})
    const couponCode = `COUPON_${Date.now()}`

    // 생성
    const newCoupon: MerchantCoupon = {
      couponId: `coupon-${Date.now()}`,
      couponCode,
      name: data.name,
      description: data.description,
      issuerType: 'MERCHANT',
      merchantId: 1, // Mock merchant ID
      status: 'ACTIVE',
      validFrom: data.validFrom + ':00',
      validUntil: data.validUntil + ':00',
      minOrderAmount: data.minOrderAmount,
      filtersJson,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxDiscountAmount: data.maxDiscountAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setCoupons((prev) => [newCoupon, ...prev])
    showAlert('새 쿠폰이 생성되었습니다.')
    setShowEditorModal(false)
  }

  const handleCancelEditor = () => {
    setShowEditorModal(false)
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedCoupon(null)
  }

  return (
    <VendorLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">쿠폰 관리</h1>
          <p className="text-gray-600">고객에게 제공할 할인 쿠폰을 관리하세요</p>
        </div>

        {/* Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div className="flex-1">
              <p className="text-sm text-blue-900">
                <strong>개발 중:</strong> Mock 데이터를 표시 중입니다.
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <input
                type="text"
                placeholder="쿠폰 이름 or 코드 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="ALL">전체 상태</option>
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
                <option value="EXPIRED">만료</option>
              </select>
            </div>

            {/* New Coupon Button */}
            <button
              onClick={handleCreateNew}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors"
            >
              + 새 쿠폰 만들기
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            총 <span className="font-bold text-hamster-brown">{filteredCoupons.length}</span>개의 쿠폰
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">🎟️</span>
              <p className="text-gray-600 mb-2">검색 결과가 없습니다</p>
              <p className="text-sm text-gray-500">다른 검색어로 시도해보세요</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    쿠폰 정보
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    할인
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    사용 조건
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    유효 기간
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCoupons.map((coupon) => (
                  <tr
                    key={coupon.couponId}
                    onClick={() => handleRowClick(coupon)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">🎟️</span>
                        <div>
                          <p className="font-semibold text-hamster-brown">{coupon.name}</p>
                          <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block mt-1">
                            {coupon.couponCode}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {coupon.discountType === 'FIXED' ? (
                        <span className="font-bold text-amber-600">{coupon.discountValue.toLocaleString()}원</span>
                      ) : (
                        <span className="font-bold text-amber-600">{coupon.discountValue}%</span>
                      )}
                      {coupon.maxDiscountAmount && (
                        <p className="text-xs text-gray-500 mt-1">
                          최대 {coupon.maxDiscountAmount.toLocaleString()}원
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.minOrderAmount ? (
                        <span className="text-sm text-gray-700">
                          {coupon.minOrderAmount.toLocaleString()}원 이상
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">제한 없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <p>{formatDate(coupon.validFrom)}</p>
                      <p className="text-gray-500">~ {formatDate(coupon.validUntil)}</p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(coupon.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedCoupon && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCloseDetail}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <VendorCouponDetailView
              coupon={selectedCoupon}
              onDelete={handleDelete}
              onClose={handleCloseDetail}
            />
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {showEditorModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCancelEditor}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <VendorCouponEditor onSave={handleSave} onCancel={handleCancelEditor} />
          </div>
        </div>
      )}
    </VendorLayout>
  )
}
