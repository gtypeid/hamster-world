import { useState, useEffect } from 'react'
import type { QuotaMaster, QuotaFormData, CycleType, QuotaType, RewardType, MissionFilters } from '@/types/progression'
import { ConditionBuilder } from './ConditionBuilder'
import { CouponPickerModal } from './CouponPickerModal'
import { mockCoupons } from '../couponMockData'

interface QuotaEditorProps {
  quota?: QuotaMaster | null
  onSave: (quota: QuotaMaster) => void
  onDelete?: (quotaId: string) => void
  onCancel: () => void
}

export function QuotaEditor({ quota, onSave, onDelete, onCancel }: QuotaEditorProps) {
  const isNew = !quota

  // Form State
  const [formData, setFormData] = useState<QuotaFormData>(() =>
    initializeFormData(quota)
  )

  // Modal State
  const [isCouponPickerOpen, setIsCouponPickerOpen] = useState(false)

  // Sync with prop changes
  useEffect(() => {
    setFormData(initializeFormData(quota))
  }, [quota])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Convert form data to QuotaMaster
    const quotaMaster: QuotaMaster = {
      quotaId: quota?.quotaId || Date.now().toString(),
      quotaKey: formData.quotaKey,
      name: formData.name,
      description: formData.description,
      cycleType: formData.cycleType,
      quotaType: formData.quotaType,
      maxLimit: formData.maxLimit,
      condition: {
        type: formData.conditionType,
        requirement: formData.conditionRequirement,
        filtersJson: JSON.stringify(formData.conditionFilters),
      },
      rewardType: formData.rewardType,
      rewardAmount: formData.rewardAmount,
      couponCode: formData.couponCode,
      sortOrder: formData.sortOrder,
    }

    onSave(quotaMaster)
  }

  const handleDelete = () => {
    if (!quota) return
    if (confirm(`"${quota.name}" Quota를 삭제하시겠습니까?`)) {
      onDelete?.(quota.quotaId)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-hamster-brown">
          {isNew ? '새 정기 미션 생성' : `수정: ${quota.name}`}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isNew ? '정기 미션을 생성합니다' : '미션 정보를 수정합니다'}
        </p>
        <div className="mt-2 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <p className="text-xs text-blue-800 font-semibold">
            🔄 정기 미션은 설정된 주기(일일/주간/월간)마다 초기화되어 <strong>반복적으로</strong> 보상을 받을 수 있습니다.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 기본 정보 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-hamster-brown mb-4">
            기본 정보
          </h3>

          <div className="space-y-4">
            {/* Quota Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quota Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.quotaKey}
                onChange={(e) =>
                  setFormData({ ...formData, quotaKey: e.target.value.toUpperCase() })
                }
                placeholder="WEEKLY_SHOPPER"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                영문 대문자와 언더스코어만 사용 (예: WEEKLY_SHOPPER)
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="주간 쇼핑왕"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="일주일에 5회 주문하면 보너스 포인트 지급"
                rows={2}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
              />
            </div>

            {/* Cycle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주기 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as CycleType[]).map((cycle) => (
                  <label
                    key={cycle}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.cycleType === cycle
                        ? 'border-hamster-orange bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cycleType"
                      value={cycle}
                      checked={formData.cycleType === cycle}
                      onChange={(e) =>
                        setFormData({ ...formData, cycleType: e.target.value as CycleType })
                      }
                      className="mt-1 text-hamster-orange focus:ring-hamster-orange"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-gray-900">{cycle}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {cycle === 'DAILY' && '매일 자정(00:00)에 초기화되며, 하루 단위로 진행 상황이 리셋됩니다.'}
                        {cycle === 'WEEKLY' && '매주 월요일 자정(00:00)에 초기화되며, 일주일 단위로 진행 상황이 리셋됩니다.'}
                        {cycle === 'MONTHLY' && '매월 1일 자정(00:00)에 초기화되며, 한 달 단위로 진행 상황이 리셋됩니다.'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Quota Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                타입 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {(['ACTION_REWARD', 'ACTION_CONSTRAINT'] as QuotaType[]).map((type) => (
                  <label
                    key={type}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.quotaType === type
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quotaType"
                      value={type}
                      checked={formData.quotaType === type}
                      onChange={(e) =>
                        setFormData({ ...formData, quotaType: e.target.value as QuotaType })
                      }
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-gray-900">
                        {type === 'ACTION_REWARD' ? '보상 지급 (ACTION_REWARD)' : '행동 제약 (ACTION_CONSTRAINT)'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {type === 'ACTION_REWARD' && '조건을 달성하면 사용자에게 보상(포인트, 쿠폰 등)을 지급합니다.'}
                        {type === 'ACTION_CONSTRAINT' && '사용자의 특정 행동을 제한하거나 제약합니다. (예: 일일 주문 횟수 제한)'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Max Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 횟수 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxLimit}
                onChange={(e) =>
                  setFormData({ ...formData, maxLimit: parseInt(e.target.value) || 1 })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
              />
              <p className="mt-1 text-xs text-gray-500">
                주기 내 최대 달성 가능 횟수
              </p>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정렬 순서
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
              />
              <p className="mt-1 text-xs text-gray-500">
                작은 숫자일수록 먼저 표시됩니다
              </p>
            </div>
          </div>
        </section>

        {/* 조건 설정 */}
        <ConditionBuilder
          conditionType={formData.conditionType}
          requirement={formData.conditionRequirement}
          filters={formData.conditionFilters}
          onConditionTypeChange={(type) =>
            setFormData({ ...formData, conditionType: type })
          }
          onRequirementChange={(req) =>
            setFormData({ ...formData, conditionRequirement: req })
          }
          onFiltersChange={(filters) =>
            setFormData({ ...formData, conditionFilters: filters })
          }
        />

        {/* 보상 설정 */}
        {formData.quotaType === 'ACTION_REWARD' && (
          <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-hamster-brown mb-4">
              보상 설정
            </h3>

            <div className="space-y-4">
              {/* Reward Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  보상 타입 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {(['POINT', 'COUPON'] as RewardType[]).map((type) => (
                    <label
                      key={type}
                      className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.rewardType === type
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rewardType"
                        value={type}
                        checked={formData.rewardType === type}
                        onChange={(e) =>
                          setFormData({ ...formData, rewardType: e.target.value as RewardType })
                        }
                        className="mt-1 text-yellow-600 focus:ring-yellow-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-semibold text-gray-900">
                          {type === 'POINT' ? '포인트 (POINT)' : '쿠폰 (COUPON)'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {type === 'POINT' && '사용자에게 포인트를 지급합니다. 포인트는 즉시 적립되며 다음 구매에 사용할 수 있습니다.'}
                          {type === 'COUPON' && '사용자에게 쿠폰을 지급합니다. 쿠폰은 사용자의 쿠폰함에 저장됩니다.'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reward Amount or Coupon Code */}
              {formData.rewardType === 'POINT' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    포인트 양 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rewardAmount || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, rewardAmount: parseInt(e.target.value) || 0 })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    지급할 포인트 양을 입력하세요
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    쿠폰 선택 <span className="text-red-500">*</span>
                  </label>

                  {/* Selected Coupon Display */}
                  {formData.couponCode ? (
                    <div className="border-2 border-hamster-orange bg-orange-50 rounded-lg p-4 mb-2">
                      {(() => {
                        const selectedCoupon = mockCoupons.find(
                          (c) => c.couponCode === formData.couponCode
                        )
                        if (!selectedCoupon) return null
                        return (
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{selectedCoupon.name}</h4>
                                <p className="text-xs text-gray-500 font-mono">
                                  {selectedCoupon.couponCode}
                                </p>
                              </div>
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                                {selectedCoupon.discountType === 'FIXED' ? '정액' : '정률'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 space-y-1">
                              <div>
                                <span className="font-medium">할인:</span>{' '}
                                {selectedCoupon.discountType === 'FIXED'
                                  ? `${selectedCoupon.discountAmount.toLocaleString()}원`
                                  : `${selectedCoupon.discountAmount}%`}
                              </div>
                              {selectedCoupon.minPurchaseAmount && (
                                <div>
                                  <span className="font-medium">최소 주문:</span>{' '}
                                  {selectedCoupon.minPurchaseAmount.toLocaleString()}원 이상
                                </div>
                              )}
                              <div>
                                <span className="font-medium">유효기간:</span> 발급 후{' '}
                                {selectedCoupon.validDays}일
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-2 text-center text-gray-500 text-sm">
                      선택된 쿠폰이 없습니다
                    </div>
                  )}

                  {/* Change Coupon Button */}
                  <button
                    type="button"
                    onClick={() => setIsCouponPickerOpen(true)}
                    className="w-full px-4 py-2 bg-white border-2 border-hamster-orange text-hamster-orange rounded-lg hover:bg-orange-50 transition-colors font-medium"
                  >
                    {formData.couponCode ? '쿠폰 변경하기' : '쿠폰 선택하기'}
                  </button>

                  <p className="mt-1 text-xs text-gray-500">
                    지급할 쿠폰을 선택하세요. 쿠폰 관리 메뉴에서 쿠폰을 생성할 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </form>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            {!isNew && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                삭제
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 bg-hamster-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* Coupon Picker Modal */}
      {isCouponPickerOpen && (
        <CouponPickerModal
          coupons={mockCoupons}
          selectedCouponCode={formData.couponCode}
          onSelect={(couponCode) => setFormData({ ...formData, couponCode })}
          onClose={() => setIsCouponPickerOpen(false)}
        />
      )}
    </div>
  )
}

// Helper: Initialize form data from Quota
function initializeFormData(quota?: QuotaMaster | null): QuotaFormData {
  if (!quota) {
    return {
      quotaKey: '',
      name: '',
      description: '',
      cycleType: 'WEEKLY',
      quotaType: 'ACTION_REWARD',
      maxLimit: 1,
      conditionType: 'CREATE_ORDER',
      conditionRequirement: 1,
      conditionFilters: {},
      rewardType: 'POINT',
      rewardAmount: 0,
      couponCode: undefined,
      sortOrder: 100,
    }
  }

  // Parse filters from JSON
  let filters: MissionFilters = {}
  try {
    if (quota.condition.filtersJson) {
      filters = JSON.parse(quota.condition.filtersJson)
    }
  } catch (e) {
    console.error('Failed to parse filters:', e)
  }

  return {
    quotaKey: quota.quotaKey,
    name: quota.name,
    description: quota.description,
    cycleType: quota.cycleType,
    quotaType: quota.quotaType,
    maxLimit: quota.maxLimit,
    conditionType: quota.condition.type,
    conditionRequirement: quota.condition.requirement,
    conditionFilters: filters,
    rewardType: quota.rewardType,
    rewardAmount: quota.rewardAmount,
    couponCode: quota.couponCode,
    sortOrder: quota.sortOrder,
  }
}
