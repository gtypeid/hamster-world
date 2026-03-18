import { useState, useEffect } from 'react'
import type { CouponMaster, CouponFormData, CouponDiscountType } from '@/types/progression'

interface CouponEditorProps {
  coupon?: CouponMaster | null
  onSave: (coupon: CouponMaster) => void
  onDelete?: (couponId: string) => void
  onCancel: () => void
}

export function CouponEditor({ coupon, onSave, onDelete, onCancel }: CouponEditorProps) {
  const isNew = !coupon

  // Form State
  const [formData, setFormData] = useState<CouponFormData>(() =>
    initializeFormData(coupon)
  )

  // Sync with prop changes
  useEffect(() => {
    setFormData(initializeFormData(coupon))
  }, [coupon])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Convert form data to CouponMaster
    const couponMaster: CouponMaster = {
      couponId: coupon?.couponId || Date.now().toString(),
      couponCode: formData.couponCode,
      name: formData.name,
      description: formData.description,
      discountType: formData.discountType,
      discountAmount: formData.discountAmount,
      minPurchaseAmount: formData.minPurchaseAmount,
      maxDiscountAmount: formData.maxDiscountAmount,
      validDays: formData.validDays,
      sortOrder: formData.sortOrder,
    }

    onSave(couponMaster)
  }

  const handleDelete = () => {
    if (!coupon) return
    if (confirm(`"${coupon.name}" 쿠폰을 삭제하시겠습니까?`)) {
      onDelete?.(coupon.couponId)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-xl font-bold text-hamster-brown">
          {isNew ? '새 쿠폰 생성' : `수정: ${coupon.name}`}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isNew ? '관리자 쿠폰을 생성합니다' : '쿠폰 정보를 수정합니다'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 기본 정보 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            기본 정보
          </h3>

          <div className="space-y-4">
            {/* Coupon Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                쿠폰 코드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.couponCode}
                onChange={(e) =>
                  setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })
                }
                placeholder="WELCOME_3000"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                영문 대문자, 숫자, 언더스코어만 사용 (예: WELCOME_3000, NEW_USER_1000)
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                쿠폰 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="신규 가입 환영 쿠폰"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="신규 가입 고객을 위한 3,000원 할인 쿠폰"
                rows={2}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange text-sm"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                정렬 순서
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                작은 숫자일수록 먼저 표시됩니다
              </p>
            </div>
          </div>
        </section>

        {/* 할인 설정 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            할인 설정
          </h3>

          <div className="space-y-4">
            {/* Discount Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                할인 타입 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {(['FIXED', 'PERCENTAGE'] as CouponDiscountType[]).map((type) => (
                  <label
                    key={type}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.discountType === type
                        ? 'border-hamster-orange bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="discountType"
                      value={type}
                      checked={formData.discountType === type}
                      onChange={(e) =>
                        setFormData({ ...formData, discountType: e.target.value as CouponDiscountType })
                      }
                      className="mt-1 text-hamster-orange focus:ring-hamster-orange"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-gray-900">
                        {type === 'FIXED' ? '정액 할인 (FIXED)' : '정률 할인 (PERCENTAGE)'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {type === 'FIXED' && '주문 금액에서 고정 금액을 할인합니다. (예: 3,000원 할인)'}
                        {type === 'PERCENTAGE' && '주문 금액에서 일정 비율을 할인합니다. (예: 10% 할인)'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Discount Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                할인 {formData.discountType === 'FIXED' ? '금액' : '비율'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.discountAmount}
                onChange={(e) =>
                  setFormData({ ...formData, discountAmount: parseInt(e.target.value) || 0 })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.discountType === 'FIXED'
                  ? '할인 금액을 원 단위로 입력하세요 (예: 3000)'
                  : '할인 비율을 % 단위로 입력하세요 (예: 10)'}
              </p>
            </div>

            {/* Max Discount Amount (PERCENTAGE only) */}
            {formData.discountType === 'PERCENTAGE' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  최대 할인 금액
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxDiscountAmount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountAmount: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="최대 할인 금액 없음"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  정률 할인의 최대 금액을 제한합니다. (예: 10% 할인이지만 최대 5,000원까지만)
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
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                최소 주문 금액
              </label>
              <input
                type="number"
                min="0"
                value={formData.minPurchaseAmount || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minPurchaseAmount: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="최소 주문 금액 없음"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                쿠폰 사용 가능한 최소 주문 금액을 설정합니다. (예: 10,000원 이상 주문 시)
              </p>
            </div>

            {/* Valid Days */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                유효 기간 (일) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.validDays}
                onChange={(e) =>
                  setFormData({ ...formData, validDays: parseInt(e.target.value) || 1 })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                쿠폰 발급 후 사용 가능한 일수입니다. (예: 30일 → 발급일로부터 30일간 유효)
              </p>
            </div>
          </div>
        </section>
      </form>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            {!isNew && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                삭제
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 bg-hamster-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper: Initialize form data from Coupon
function initializeFormData(coupon?: CouponMaster | null): CouponFormData {
  if (!coupon) {
    return {
      couponCode: '',
      name: '',
      description: '',
      discountType: 'FIXED',
      discountAmount: 0,
      minPurchaseAmount: undefined,
      maxDiscountAmount: undefined,
      validDays: 30,
      sortOrder: 100,
    }
  }

  return {
    couponId: coupon.couponId,
    couponCode: coupon.couponCode,
    name: coupon.name,
    description: coupon.description,
    discountType: coupon.discountType,
    discountAmount: coupon.discountAmount,
    minPurchaseAmount: coupon.minPurchaseAmount,
    maxDiscountAmount: coupon.maxDiscountAmount,
    validDays: coupon.validDays,
    sortOrder: coupon.sortOrder,
  }
}
