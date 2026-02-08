import { useState } from 'react'
import type { SeasonPromotionMaster, SeasonPromotionFormData, PromotionTargetRole, MissionType, MissionFilters } from '@/types/progression'
import { StepRewardTable } from './StepRewardTable'

interface SeasonPromotionEditorProps {
  initialData?: SeasonPromotionMaster
  onSave: (data: SeasonPromotionFormData) => void
  onCancel: () => void
}

export function SeasonPromotionEditor({ initialData, onSave, onCancel }: SeasonPromotionEditorProps) {
  const [formData, setFormData] = useState<SeasonPromotionFormData>(() => {
    if (initialData) {
      // Parse existing condition
      let filters: MissionFilters = {}
      try {
        if (initialData.condition.filtersJson) {
          filters = JSON.parse(initialData.condition.filtersJson)
        }
      } catch (e) {
        console.error('Failed to parse filters:', e)
      }

      return {
        promotionId: initialData.promotionId,
        title: initialData.title,
        description: initialData.description,
        targetRole: initialData.targetRole,
        startAt: initialData.startAt.slice(0, 16), // ISO to datetime-local
        endAt: initialData.endAt.slice(0, 16),
        conditionType: initialData.condition.type,
        conditionRequirement: initialData.condition.requirement,
        conditionFilters: filters,
        basicRewards: initialData.basicRewards,
        vipBonusRewards: initialData.vipBonusRewards,
        sortOrder: initialData.sortOrder,
      }
    }

    // Default values for new promotion
    return {
      title: '',
      description: '',
      targetRole: 'CUSTOMER',
      startAt: '',
      endAt: '',
      conditionType: 'CREATE_ORDER',
      conditionRequirement: 1,
      conditionFilters: {},
      basicRewards: {},
      vipBonusRewards: {},
      sortOrder: 0,
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title.trim()) {
      alert('프로모션 제목을 입력해주세요.')
      return
    }
    if (!formData.startAt || !formData.endAt) {
      alert('프로모션 시작일과 종료일을 입력해주세요.')
      return
    }
    if (new Date(formData.startAt) >= new Date(formData.endAt)) {
      alert('종료일은 시작일보다 나중이어야 합니다.')
      return
    }
    if (formData.conditionRequirement < 1) {
      alert('필요 횟수는 1 이상이어야 합니다.')
      return
    }

    // Calculate maxStep from rewards
    const allRewardSteps = [
      ...Object.keys(formData.basicRewards).map(Number),
      ...Object.keys(formData.vipBonusRewards).map(Number)
    ]
    const maxStep = allRewardSteps.length > 0 ? Math.max(...allRewardSteps) : 1

    if (maxStep < 1) {
      alert('최소 1개 이상의 보상을 설정해주세요.')
      return
    }

    // Add calculated maxStep to formData
    const formDataWithMaxStep = { ...formData, maxStep }

    onSave(formDataWithMaxStep)
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h2 className="text-xl font-bold text-hamster-brown mb-2">
            {initialData ? '시즌 프로모션 수정' : '새 시즌 프로모션 만들기'}
          </h2>
          <p className="text-xs text-gray-600">
            시즌 프로모션은 배틀 패스 형태로 사용자가 스텝별로 보상을 획득하는 이벤트입니다.
          </p>
          <div className="mt-2 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-xs text-blue-800 font-semibold">
              💡 <strong>2-Track 보상 시스템:</strong> 기본 보상은 모든 사용자가 받고, VIP 보너스는 VIP 패스 구매자만 추가로 받습니다.
            </p>
          </div>
        </div>

        {/* 기본 정보 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4 space-y-4">
          <h3 className="text-base font-bold text-hamster-brown pb-2 border-b border-gray-200">
            기본 정보
          </h3>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              프로모션 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-hamster-orange"
              placeholder="예: 봄맞이 대축제"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              사용자에게 보일 프로모션 이름입니다.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-hamster-orange"
              placeholder="프로모션에 대한 설명을 입력하세요"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              프로모션의 목적과 내용을 설명합니다.
            </p>
          </div>

          {/* Target Role - Fixed to CUSTOMER */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              대상
            </label>
            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-bold text-purple-700">
                  고객 (CUSTOMER)
                </span>
              </div>
              <p className="text-xs text-gray-700">
                이 페이지는 고객 대상 시즌 프로모션 전용입니다. 라이더 프로모션은 배달 섹션에서 관리됩니다.
              </p>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                시작일시 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-hamster-orange"
                required
              />
              <p className="text-xs text-gray-500 mt-1">프로모션 시작 시간</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                종료일시 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-hamster-orange"
                required
              />
              <p className="text-xs text-gray-500 mt-1">프로모션 종료 시간</p>
            </div>
          </div>
        </section>

        {/* 스텝 진행 조건 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4 space-y-4">
          <h3 className="text-base font-bold text-hamster-brown pb-2 border-b border-gray-200">
            스텝 진행 조건
          </h3>
          <p className="text-xs text-gray-600">
            사용자가 어떤 행동을 완료했을 때 스텝이 올라갈지 정의합니다.
          </p>

          {/* Condition Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              조건 타입 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.conditionType}
              onChange={(e) => setFormData({ ...formData, conditionType: e.target.value as MissionType })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-hamster-orange"
              required
            >
              <option value="CREATE_ORDER">주문 생성 (CREATE_ORDER)</option>
              <option value="COMPLETE_ORDER">주문 완료 (COMPLETE_ORDER)</option>
              <option value="CREATE_PRODUCT">상품 등록 (CREATE_PRODUCT)</option>
              <option value="CREATE_REVIEW">리뷰 작성 (CREATE_REVIEW)</option>
              <option value="CONFIRM_PAYMENT">결제 확인 (CONFIRM_PAYMENT)</option>
              <option value="USER_LOGIN">로그인 (USER_LOGIN)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              사용자가 이 행동을 완료할 때마다 진행도가 증가합니다.
            </p>
          </div>

          {/* Requirement */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              스텝당 필요 횟수 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.conditionRequirement}
              onChange={(e) => setFormData({ ...formData, conditionRequirement: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-hamster-orange"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              스텝 1단계 올라가는데 필요한 횟수입니다. (예: 2로 설정하면 주문 2번마다 1스텝 증가)
            </p>
          </div>
        </section>

        {/* 보상 설정 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            보상 설정
          </h3>
          <p className="text-xs text-gray-600 mb-4">
            각 스텝에 도달했을 때 지급할 보상을 설정합니다. 기본 보상과 VIP 보너스를 각각 설정할 수 있습니다.
          </p>

          <StepRewardTable
            basicRewards={formData.basicRewards}
            vipBonusRewards={formData.vipBonusRewards}
            onBasicRewardsChange={(rewards) => setFormData({ ...formData, basicRewards: rewards })}
            onVipBonusRewardsChange={(rewards) => setFormData({ ...formData, vipBonusRewards: rewards })}
          />
        </section>

        {/* Sort Order */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            정렬 순서
          </h3>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              정렬 순서
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-hamster-orange"
            />
            <p className="text-xs text-gray-500 mt-1">
              프로모션 목록에서의 정렬 순서입니다. 작은 숫자가 먼저 표시됩니다.
            </p>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors font-medium"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-hamster-orange hover:bg-orange-600 text-white rounded transition-colors font-medium"
          >
            {initialData ? '수정 완료' : '생성하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
