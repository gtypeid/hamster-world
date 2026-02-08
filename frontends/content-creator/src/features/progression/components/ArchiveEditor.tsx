import { useState, useEffect } from 'react'
import type {
  ArchiveMaster,
  ArchiveFormData,
  ArchiveType,
  ProgressType,
  RewardType,
  MissionType,
  MissionFilters,
} from '@/types/progression'
import { ConditionBuilder } from './ConditionBuilder'

interface ArchiveEditorProps {
  archive?: ArchiveMaster | null
  onSave: (archive: ArchiveMaster) => void
  onDelete?: (archiveId: string) => void
  onCancel: () => void
}

export function ArchiveEditor({ archive, onSave, onDelete, onCancel }: ArchiveEditorProps) {
  const isNew = !archive

  // Form State
  const [formData, setFormData] = useState<ArchiveFormData>(() => initializeFormData(archive))

  // Sync with prop changes
  useEffect(() => {
    setFormData(initializeFormData(archive))
  }, [archive])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Convert form data to ArchiveMaster
    const archiveMaster: ArchiveMaster = {
      archiveId: archive?.archiveId || Date.now().toString(),
      archiveCode: formData.archiveCode,
      name: formData.name,
      description: formData.description,
      archiveType: formData.archiveType,
      progressType: formData.progressType,
      condition:
        formData.progressType === 'EVENT_BASED'
          ? {
              type: formData.conditionType!,
              requirement: formData.conditionRequirement!,
              filtersJson: JSON.stringify(formData.conditionFilters || {}),
            }
          : undefined,
      statKey: formData.progressType === 'STAT_BASED' ? formData.statKey : undefined,
      rewardType: formData.rewardType,
      rewardAmount: formData.rewardAmount,
      sortOrder: formData.sortOrder,
    }

    onSave(archiveMaster)
  }

  const handleDelete = () => {
    if (!archive) return
    if (confirm(`"${archive.name}" 뱃지를 삭제하시겠습니까?`)) {
      onDelete?.(archive.archiveId)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-xl font-bold text-hamster-brown">
          {isNew ? '새 뱃지 생성' : `수정: ${archive.name}`}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isNew ? '업적 뱃지를 생성합니다' : '뱃지 정보를 수정합니다'}
        </p>
        <div className="mt-2 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
          <p className="text-xs text-amber-800 font-semibold">
            ⚠️ <strong>중요:</strong> 뱃지는 사용자당 <strong className="underline">단 한번만</strong> 달성하고 리워드를 받을 수 있습니다. 반복 보상이 필요하다면 '정기 미션'을 사용하세요.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 기본 정보 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            기본 정보
          </h3>

          <div className="space-y-4">
            {/* Archive Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                업적 코드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.archiveCode}
                onChange={(e) =>
                  setFormData({ ...formData, archiveCode: e.target.value.toUpperCase() })
                }
                placeholder="FIRST_ORDER"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                영문 대문자와 언더스코어만 사용 (예: FIRST_ORDER, ORDER_MASTER_10)
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                업적 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="첫 주문 완료"
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
                placeholder="첫 번째 주문을 완료하세요"
                rows={2}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange text-sm"
              />
            </div>

            {/* Archive Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                업적 타입 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {(['ORDER', 'MERCHANT'] as ArchiveType[]).map((type) => (
                  <label
                    key={type}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.archiveType === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="archiveType"
                      value={type}
                      checked={formData.archiveType === type}
                      onChange={(e) =>
                        setFormData({ ...formData, archiveType: e.target.value as ArchiveType })
                      }
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-gray-900">
                        {type === 'ORDER' ? '주문 업적 (ORDER)' : '판매자 업적 (MERCHANT)'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {type === 'ORDER' &&
                          '주문 관련 업적입니다. 고객의 주문, 리뷰 등 구매 활동과 관련된 업적입니다.'}
                        {type === 'MERCHANT' &&
                          '판매자 관련 업적입니다. 상품 등록, 판매 금액 등 판매자 활동과 관련된 업적입니다.'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Progress Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                진행 방식 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {(['EVENT_BASED', 'STAT_BASED'] as ProgressType[]).map((type) => (
                  <label
                    key={type}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.progressType === type
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="progressType"
                      value={type}
                      checked={formData.progressType === type}
                      onChange={(e) =>
                        setFormData({ ...formData, progressType: e.target.value as ProgressType })
                      }
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-gray-900">
                        {type === 'EVENT_BASED' ? '이벤트 기반 (EVENT_BASED)' : '통계 기반 (STAT_BASED)'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {type === 'EVENT_BASED' &&
                          '특정 이벤트가 발생할 때마다 카운트되어 진행도가 증가합니다.'}
                        {type === 'STAT_BASED' &&
                          '누적 통계 값을 기준으로 진행도가 결정됩니다. (예: 총 구매 금액, 총 판매 금액)'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
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
              <p className="mt-1 text-xs text-gray-500">작은 숫자일수록 먼저 표시됩니다</p>
            </div>
          </div>
        </section>

        {/* 달성 조건 (EVENT_BASED) */}
        {formData.progressType === 'EVENT_BASED' && (
          <ConditionBuilder
            conditionType={formData.conditionType || 'CREATE_ORDER'}
            requirement={formData.conditionRequirement || 1}
            filters={formData.conditionFilters || {}}
            onConditionTypeChange={(type) => setFormData({ ...formData, conditionType: type })}
            onRequirementChange={(req) => setFormData({ ...formData, conditionRequirement: req })}
            onFiltersChange={(filters) => setFormData({ ...formData, conditionFilters: filters })}
          />
        )}

        {/* 통계 키 (STAT_BASED) */}
        {formData.progressType === 'STAT_BASED' && (
          <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
            <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
              통계 설정
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                통계 키 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.statKey || ''}
                onChange={(e) => setFormData({ ...formData, statKey: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange text-sm"
              >
                <option value="">통계 키를 선택하세요</option>
                <option value="TOTAL_PURCHASE_AMOUNT">총 구매 금액 (TOTAL_PURCHASE_AMOUNT)</option>
                <option value="TOTAL_ORDER_COUNT">총 주문 횟수 (TOTAL_ORDER_COUNT)</option>
                <option value="TOTAL_SALES_AMOUNT">총 판매 금액 (TOTAL_SALES_AMOUNT)</option>
                <option value="TOTAL_PRODUCT_COUNT">총 상품 개수 (TOTAL_PRODUCT_COUNT)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                업적 달성 기준이 되는 통계 값을 선택하세요. 누적 통계가 특정 값에 도달하면 업적이 달성됩니다.
              </p>
            </div>
          </section>
        )}

        {/* 보상 설정 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            보상 설정
          </h3>

          <div className="space-y-4">
            {/* Reward Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                        {type === 'POINT' &&
                          '사용자에게 포인트를 지급합니다. 포인트는 즉시 적립되며 다음 구매에 사용할 수 있습니다.'}
                        {type === 'COUPON' && '사용자에게 쿠폰을 지급합니다. 쿠폰은 사용자의 쿠폰함에 저장됩니다.'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reward Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                보상 양 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.rewardAmount}
                onChange={(e) =>
                  setFormData({ ...formData, rewardAmount: parseInt(e.target.value) || 0 })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.rewardType === 'POINT'
                  ? '지급할 포인트 양을 입력하세요'
                  : '지급할 쿠폰 개수를 입력하세요'}
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

// Helper: Initialize form data from Archive
function initializeFormData(archive?: ArchiveMaster | null): ArchiveFormData {
  if (!archive) {
    return {
      archiveCode: '',
      name: '',
      description: '',
      archiveType: 'ORDER',
      progressType: 'EVENT_BASED',
      conditionType: 'CREATE_ORDER',
      conditionRequirement: 1,
      conditionFilters: {},
      statKey: undefined,
      rewardType: 'POINT',
      rewardAmount: 0,
      sortOrder: 100,
    }
  }

  // Parse filters from JSON
  let filters: MissionFilters = {}
  try {
    if (archive.condition?.filtersJson) {
      filters = JSON.parse(archive.condition.filtersJson)
    }
  } catch (e) {
    console.error('Failed to parse filters:', e)
  }

  return {
    archiveId: archive.archiveId,
    archiveCode: archive.archiveCode,
    name: archive.name,
    description: archive.description,
    archiveType: archive.archiveType,
    progressType: archive.progressType,
    conditionType: archive.condition?.type,
    conditionRequirement: archive.condition?.requirement,
    conditionFilters: filters,
    statKey: archive.statKey,
    rewardType: archive.rewardType,
    rewardAmount: archive.rewardAmount,
    sortOrder: archive.sortOrder,
  }
}
