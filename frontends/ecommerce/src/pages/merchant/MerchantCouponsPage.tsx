import { useState } from 'react'
import { MerchantLayout } from '../../components/merchant/MerchantLayout'
import { MerchantCouponDetailView } from '../../components/merchant/MerchantCouponDetailView'
import { MerchantCouponEditor } from '../../components/merchant/MerchantCouponEditor'
import { useAlert } from '../../contexts/AlertContext'
import { useMyMerchantCoupons, useCreateMerchantCoupon } from '../../hooks/useMerchantCoupon'
import type { MerchantCoupon, MerchantCouponFormData, CouponStatus } from '../../types/ecommerce'
import type { CouponPolicyDto, CreateCouponPolicyRequest } from '../../types/coupon'

/**
 * CouponPolicyDto를 MerchantCoupon으로 변환
 */
function convertToMerchantCoupon(dto: CouponPolicyDto): MerchantCoupon {
  return {
    couponId: dto.publicId,
    couponCode: dto.couponCode,
    name: dto.name,
    description: dto.description || '',
    issuerType: dto.issuerType as 'PLATFORM' | 'MERCHANT',
    merchantId: dto.merchantPublicId ? undefined : undefined, // merchantPublicId는 string이지만 MerchantCoupon은 number 예상
    status: dto.status as CouponStatus,
    validFrom: dto.validFrom,
    validUntil: dto.validUntil,
    couponDays: dto.couponDays,
    minOrderAmount: dto.minOrderAmount || undefined,
    filtersJson: undefined,
    discountType: dto.discountType as 'FIXED' | 'PERCENTAGE',
    discountValue: dto.discountValue,
    maxDiscountAmount: dto.maxDiscountAmount || undefined,
    targetProducts: dto.targetProducts || [],
    createdAt: dto.createdAt,
    updatedAt: dto.createdAt, // updatedAt이 없으므로 createdAt 사용
  }
}

export function MerchantCouponsPage() {
  const { showAlert, showConfirm } = useAlert()
  const { data: couponDtos = [], isLoading: isLoadingCoupons } = useMyMerchantCoupons()
  const createCoupon = useCreateMerchantCoupon()

  // CouponPolicyDto[] → MerchantCoupon[] 변환
  const coupons = couponDtos.map(convertToMerchantCoupon)
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
      // TODO: 백엔드에 쿠폰 삭제 API 구현 필요
      showAlert('쿠폰 삭제 기능은 백엔드 구현 후 사용 가능합니다.')
      setShowDetailModal(false)
      setSelectedCoupon(null)
    }
  }

  const handleSave = async (data: MerchantCouponFormData) => {
    // Convert filters to filtersJson
    const filtersJson = data.filters ? JSON.stringify(data.filters) : null

    // CreateCouponPolicyRequest 생성
    const request: CreateCouponPolicyRequest = {
      name: data.name,
      description: data.description || null,
      validFrom: data.validFrom + 'T00:00:00', // YYYY-MM-DD → YYYY-MM-DDT00:00:00 (ISO DateTime)
      validUntil: data.validUntil + 'T23:59:59', // YYYY-MM-DD → YYYY-MM-DDT23:59:59 (ISO DateTime)
      couponDays: data.couponDays || 10, // 폼에서 입력한 값 사용 (기본 10일)
      minOrderAmount: data.minOrderAmount || null,
      conditionFiltersJson: filtersJson,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxDiscountAmount: data.maxDiscountAmount || null,
    }

    try {
      // API 호출
      await createCoupon.mutateAsync(request)
      showAlert('새 쿠폰이 생성되었습니다.')
      setShowEditorModal(false)
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '쿠폰 생성에 실패했습니다.')
    }
  }

  const handleCancelEditor = () => {
    setShowEditorModal(false)
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedCoupon(null)
  }

  // 로딩 상태
  if (isLoadingCoupons) {
    return (
      <MerchantLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎫</div>
            <p className="text-gray-600">쿠폰 목록을 불러오는 중...</p>
          </div>
        </div>
      </MerchantLayout>
    )
  }

  return (
    <MerchantLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">쿠폰 관리</h1>
          <p className="text-gray-600">고객에게 제공할 할인 쿠폰을 관리하세요</p>
        </div>

        {/* Notice - API 연동 완료 */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">✅</span>
            <div className="flex-1">
              <p className="text-sm text-green-900">
                <strong>API 연동 완료:</strong> 실제 쿠폰 데이터를 표시합니다.
              </p>
              <p className="text-xs text-green-700 mt-1">
                쿠폰 생성 시 서버에서 자동으로 쿠폰 코드를 생성합니다.
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
                    적용 상품
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
                      {coupon.targetProducts && coupon.targetProducts.length > 0 ? (
                        <div className="text-sm">
                          <p className="text-gray-700 font-medium">
                            {coupon.targetProducts[0].productName}
                          </p>
                          {coupon.targetProducts.length > 1 && (
                            <p className="text-xs text-gray-500 mt-1">
                              외 {coupon.targetProducts.length - 1}개 상품
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-blue-600 font-medium">전체 상품</span>
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
            <MerchantCouponDetailView
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
            <MerchantCouponEditor onSave={handleSave} onCancel={handleCancelEditor} />
          </div>
        </div>
      )}
    </MerchantLayout>
  )
}
