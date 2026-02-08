import { useState } from 'react'
import type { MissionType, MissionFilters } from '@/types/progression'

interface ConditionBuilderProps {
  conditionType: MissionType
  requirement: number
  filters: MissionFilters
  onConditionTypeChange: (type: MissionType) => void
  onRequirementChange: (req: number) => void
  onFiltersChange: (filters: MissionFilters) => void
}

const MISSION_TYPES: { value: MissionType; label: string; description: string }[] = [
  { value: 'CREATE_ORDER', label: '주문 생성', description: '사용자가 주문을 생성할 때 카운트됩니다.' },
  { value: 'COMPLETE_ORDER', label: '주문 완료', description: '주문이 완료 상태로 변경될 때 카운트됩니다.' },
  { value: 'CREATE_PRODUCT', label: '상품 등록', description: '사용자가 상품을 등록할 때 카운트됩니다.' },
  { value: 'CREATE_REVIEW', label: '리뷰 작성', description: '사용자가 리뷰를 작성할 때 카운트됩니다.' },
  { value: 'CONFIRM_PAYMENT', label: '결제 확인', description: '결제가 확인될 때 카운트됩니다.' },
  { value: 'USER_LOGIN', label: '로그인', description: '사용자가 로그인할 때 카운트됩니다.' },
]

export function ConditionBuilder({
  conditionType,
  requirement,
  filters,
  onConditionTypeChange,
  onRequirementChange,
  onFiltersChange,
}: ConditionBuilderProps) {
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const hasFilters = Object.keys(filters).length > 0

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <h3 className="text-lg font-bold text-hamster-brown mb-4">
        조건 설정
      </h3>

      <div className="space-y-4">
        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이벤트 타입 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {MISSION_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  conditionType === type.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="conditionType"
                  value={type.value}
                  checked={conditionType === type.value}
                  onChange={(e) => onConditionTypeChange(e.target.value as MissionType)}
                  className="mt-1 text-green-600 focus:ring-green-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-semibold text-gray-900">{type.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Requirement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            필요 횟수 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={requirement}
            onChange={(e) => onRequirementChange(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
          />
          <p className="mt-1 text-xs text-gray-500">
            Quota 1회 달성에 필요한 이벤트 발생 횟수
          </p>
        </div>

        {/* Filters (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              필터 (선택사항)
            </label>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs text-hamster-orange hover:text-orange-600 font-medium"
            >
              {showFilters ? '필터 숨기기' : '필터 추가'}
            </button>
          </div>

          {showFilters && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              {/* Region Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  지역 (region)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filters.region || ''}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                    placeholder="예: 성수동"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
                  />
                  {filters.region && (
                    <button
                      onClick={() => handleRemoveFilter('region')}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>

              {/* TimeSlot Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  시간대 (timeSlot)
                </label>
                <div className="flex gap-2">
                  <select
                    value={filters.timeSlot || ''}
                    onChange={(e) => handleFilterChange('timeSlot', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
                  >
                    <option value="">선택 안함</option>
                    <option value="MORNING">아침 (06:00-12:00)</option>
                    <option value="AFTERNOON">오후 (12:00-18:00)</option>
                    <option value="EVENING">저녁 (18:00-24:00)</option>
                    <option value="NIGHT">밤 (00:00-06:00)</option>
                  </select>
                  {filters.timeSlot && (
                    <button
                      onClick={() => handleRemoveFilter('timeSlot')}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>

              {/* MinAmount Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  최소 금액 (minAmount)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.minAmount || ''}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    placeholder="예: 10000"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hamster-orange"
                  />
                  {filters.minAmount && (
                    <button
                      onClick={() => handleRemoveFilter('minAmount')}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                💡 필터를 추가하면 조건이 더 구체화됩니다
              </p>
            </div>
          )}

          {/* Active Filters Display */}
          {hasFilters && !showFilters && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  <span className="font-medium">{key}:</span>
                  <span>{value}</span>
                  <button
                    onClick={() => handleRemoveFilter(key)}
                    className="ml-1 hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
