import { useState } from 'react'
import type { MerchantCoupon, MerchantCouponFormData, CouponDiscountType } from '../../types/ecommerce'
import { ProductPickerModal } from './ProductPickerModal'

interface MerchantCouponEditorProps {
  onSave: (data: MerchantCouponFormData) => void
  onCancel: () => void
}

export function MerchantCouponEditor({ onSave, onCancel }: VendorCouponEditorProps) {
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [applyToAllProducts, setApplyToAllProducts] = useState(true)
  const [formData, setFormData] = useState<MerchantCouponFormData>(() => {
    // Default values for new coupon
    const now = new Date()
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

    return {
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: undefined,
      maxDiscountAmount: undefined,
      filters: undefined,
      validFrom: now.toISOString().slice(0, 10),
      validUntil: sevenDaysLater.toISOString().slice(0, 10),
      couponDays: 10,
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleDiscountTypeChange = (type: CouponDiscountType) => {
    setFormData({
      ...formData,
      discountType: type,
      discountValue: type === 'FIXED' ? 1000 : 10,
      maxDiscountAmount: type === 'PERCENTAGE' ? undefined : undefined,
    })
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-xl font-bold text-hamster-brown">새 쿠폰 만들기</h2>
        <p className="text-sm text-gray-600 mt-1">쿠폰 코드는 자동으로 생성됩니다</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        <section className="bg-gray-50 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-hamster-brown">기본 정보</h3>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              쿠폰 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="봄맞이 특가 쿠폰"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">고객에게 표시될 쿠폰의 이름입니다.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="3,000원 즉시 할인 혜택을 받으세요! (1인 1회 사용)"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">쿠폰의 상세 설명입니다.</p>
          </div>
        </section>

        {/* Discount Info */}
        <section className="bg-amber-50 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-hamster-brown">할인 정보</h3>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              할인 타입 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDiscountTypeChange('FIXED')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.discountType === 'FIXED'
                    ? 'border-amber-500 bg-amber-100'
                    : 'border-gray-300 bg-white hover:border-amber-300'
                }`}
              >
                <div className="font-bold text-gray-900 mb-1">정액 할인</div>
                <div className="text-xs text-gray-600">고정 금액 할인 (예: 3,000원)</div>
              </button>
              <button
                type="button"
                onClick={() => handleDiscountTypeChange('PERCENTAGE')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.discountType === 'PERCENTAGE'
                    ? 'border-amber-500 bg-amber-100'
                    : 'border-gray-300 bg-white hover:border-amber-300'
                }`}
              >
                <div className="font-bold text-gray-900 mb-1">정률 할인</div>
                <div className="text-xs text-gray-600">비율 할인 (예: 10%)</div>
              </button>
            </div>
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              할인 {formData.discountType === 'FIXED' ? '금액' : '비율'} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })
                }
                min={formData.discountType === 'FIXED' ? 100 : 1}
                max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                step={formData.discountType === 'FIXED' ? 100 : 1}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
              <span className="text-lg font-bold text-gray-700">
                {formData.discountType === 'FIXED' ? '원' : '%'}
              </span>
            </div>
          </div>

          {/* Max Discount Amount (for PERCENTAGE only) */}
          {formData.discountType === 'PERCENTAGE' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">최대 할인 금액 (선택)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.maxDiscountAmount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="5000"
                  min={0}
                  step={100}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <span className="text-lg font-bold text-gray-700">원</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                정률 할인 시 할인 금액의 상한선입니다. (예: 10% 할인이지만 최대 5,000원까지)
              </p>
            </div>
          )}
        </section>

        {/* Usage Conditions */}
        <section className="bg-blue-50 rounded-xl p-4 space-y-4">
          <div className="mb-4">
            <h3 className="font-bold text-hamster-brown text-lg">사용 조건</h3>
            <p className="text-xs text-blue-700 mt-1">쿠폰을 사용할 수 있는 조건을 설정하세요 (모두 선택 사항)</p>
          </div>

          {/* Min Order Amount */}
          <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💰</span>
              <label className="text-sm font-bold text-gray-800">최소 주문 금액</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.minOrderAmount || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="20000"
                min={0}
                step={1000}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <span className="text-lg font-bold text-gray-700">원</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">설정하지 않으면 금액 제한 없이 사용 가능합니다.</p>
          </div>

          {/* Categories - "모든 상품에 적용" 체크 시에만 활성화 */}
          <div className={`bg-white rounded-lg p-4 border-2 transition-all ${
            applyToAllProducts
              ? 'border-blue-200'
              : 'border-gray-200 opacity-50 cursor-not-allowed'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏷️</span>
              <label className="text-sm font-bold text-gray-800">특정 카테고리에만 적용</label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['FOOD', 'FURNITURE', 'SPORTS', 'BEDDING', 'TOYS'].map((cat) => {
                const labels: Record<string, string> = {
                  FOOD: '🌰 간식',
                  FURNITURE: '🏠 집/용품',
                  SPORTS: '🎡 운동기구',
                  BEDDING: '🛏️ 침구',
                  TOYS: '🎾 장난감',
                }
                const isSelected = formData.filters?.categories?.includes(cat) || false
                return (
                  <button
                    key={cat}
                    type="button"
                    disabled={!applyToAllProducts}
                    onClick={() => {
                      if (!applyToAllProducts) return

                      const current = formData.filters?.categories || []
                      const updated = isSelected
                        ? current.filter((c) => c !== cat)
                        : [...current, cat]
                      setFormData({
                        ...formData,
                        filters: {
                          ...formData.filters,
                          categories: updated.length > 0 ? updated : undefined,
                        },
                      })
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                      !applyToAllProducts
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : isSelected
                        ? 'border-blue-500 bg-blue-100 text-blue-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {labels[cat]}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {applyToAllProducts
                ? '선택하지 않으면 모든 카테고리의 상품에 적용됩니다.'
                : '특정 상품 선택 시에는 카테고리 필터를 사용할 수 없습니다.'}
            </p>
          </div>

          {/* Product IDs */}
          <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📦</span>
              <label className="text-sm font-bold text-gray-800">상품 적용 범위</label>
            </div>

            {/* 모든 상품에 적용 체크박스 */}
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-3">
              <input
                type="checkbox"
                checked={applyToAllProducts}
                onChange={(e) => {
                  setApplyToAllProducts(e.target.checked)
                  if (e.target.checked) {
                    // 모든 상품에 적용하면 선택된 상품 & 카테고리 초기화
                    setFormData({
                      ...formData,
                      filters: {
                        ...formData.filters,
                        productIds: undefined,
                        categories: undefined, // 카테고리도 초기화
                      },
                    })
                  } else {
                    // 체크 해제 시에도 카테고리 초기화
                    setFormData({
                      ...formData,
                      filters: {
                        ...formData.filters,
                        categories: undefined,
                      },
                    })
                  }
                }}
                className="w-5 h-5 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
              />
              <div className="flex-1">
                <span className="font-semibold text-gray-800">모든 상품에 적용</span>
                <p className="text-xs text-gray-600 mt-0.5">
                  전체 상품에 쿠폰을 적용합니다 (카테고리 필터는 별도 적용)
                </p>
              </div>
            </label>

            {/* 상품 선택 버튼 (체크박스 해제 시에만 활성화) */}
            <button
              type="button"
              onClick={() => setShowProductPicker(true)}
              disabled={applyToAllProducts}
              className={`w-full px-4 py-3 border-2 border-dashed rounded-lg font-medium transition-all ${
                applyToAllProducts
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50 text-gray-600 hover:text-amber-700'
              }`}
            >
              {formData.filters?.productIds && formData.filters.productIds.length > 0 ? (
                <>📦 {formData.filters.productIds.length}개 상품 선택됨</>
              ) : (
                <>+ 특정 상품 선택하기</>
              )}
            </button>
            {!applyToAllProducts && formData.filters?.productIds && formData.filters.productIds.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-2">선택된 상품:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.filters.productIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white text-amber-800 text-xs font-medium rounded border border-amber-300"
                    >
                      {id.substring(0, 8)}...
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.filters?.productIds?.filter((pid) => pid !== id)
                          setFormData({
                            ...formData,
                            filters: {
                              ...formData.filters,
                              productIds: updated && updated.length > 0 ? updated : undefined,
                            },
                          })
                          // 상품이 모두 제거되면 다시 모든 상품으로 변경
                          if (!updated || updated.length === 0) {
                            setApplyToAllProducts(true)
                          }
                        }}
                        className="text-amber-600 hover:text-amber-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-600 mt-2">
              {applyToAllProducts
                ? '위 체크박스를 해제하면 특정 상품만 선택할 수 있습니다.'
                : '특정 상품을 선택하세요. 카테고리와 함께 설정하면 둘 다 만족하는 상품에만 적용됩니다.'}
            </p>
          </div>
        </section>

        {/* Issue Period (발급 기간) */}
        <section className="bg-purple-50 rounded-xl p-4 space-y-4">
          <div className="mb-2">
            <h3 className="font-bold text-hamster-brown text-lg">📅 쿠폰 발급 기간</h3>
            <p className="text-xs text-purple-700 mt-1">이 기간 동안만 고객이 쿠폰을 발급받을 수 있습니다</p>
          </div>

          {/* Valid From */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              발급 시작 일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          {/* Valid Until */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              발급 종료 일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-gray-700">
              💡 <strong>발급 기간:</strong> {formData.validFrom && formData.validUntil ? (
                <>
                  {new Date(formData.validFrom).toLocaleDateString('ko-KR')} ~ {new Date(formData.validUntil).toLocaleDateString('ko-KR')}
                </>
              ) : '날짜를 선택하세요'}
            </p>
          </div>
        </section>

        {/* Coupon Usage Period (쿠폰 유효 기간) */}
        <section className="bg-green-50 rounded-xl p-4 space-y-4">
          <div className="mb-2">
            <h3 className="font-bold text-hamster-brown text-lg">⏰ 쿠폰 사용 유효 기간</h3>
            <p className="text-xs text-green-700 mt-1">발급받은 쿠폰을 며칠 동안 사용할 수 있는지 설정합니다</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              발급 후 사용 가능 일수 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.couponDays || 10}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    couponDays: parseInt(e.target.value) || 10,
                  })
                }
                min={1}
                max={365}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
              <span className="text-lg font-bold text-gray-700">일</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              예) 10일로 설정하면, 쿠폰 발급일로부터 10일 후 자동 만료됩니다.
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs text-gray-700">
              💡 <strong>예시:</strong> 고객이 2월 11일에 쿠폰을 발급받으면 → 2월 {11 + (formData.couponDays || 10)}일까지 사용 가능
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors"
          >
            쿠폰 생성
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      </form>

      {/* Product Picker Modal */}
      {showProductPicker && (
        <ProductPickerModal
          selectedProductIds={formData.filters?.productIds || []}
          onSelect={(productIds) => {
            if (productIds.length > 0) {
              // 상품을 선택하면 "모든 상품에 적용" 체크 해제
              setApplyToAllProducts(false)
              setFormData({
                ...formData,
                filters: {
                  ...formData.filters,
                  productIds,
                },
              })
            } else {
              // 상품을 하나도 선택하지 않으면 "모든 상품에 적용"으로 변경
              setApplyToAllProducts(true)
              setFormData({
                ...formData,
                filters: {
                  ...formData.filters,
                  productIds: undefined,
                },
              })
            }
          }}
          onClose={() => setShowProductPicker(false)}
        />
      )}
    </div>
  )
}
