import type { QuotaMaster, MissionFilters } from '@/types/progression'

interface QuotaDetailViewProps {
  quota: QuotaMaster
  onDelete: (quotaId: string) => void
}

export function QuotaDetailView({ quota, onDelete }: QuotaDetailViewProps) {
  // Parse filters from JSON
  let filters: MissionFilters = {}
  try {
    if (quota.condition.filtersJson) {
      filters = JSON.parse(quota.condition.filtersJson)
    }
  } catch (e) {
    console.error('Failed to parse filters:', e)
  }

  const getCycleDescription = (cycle: string) => {
    switch (cycle) {
      case 'DAILY':
        return '매일 자정(00:00)에 초기화되며, 하루 단위로 진행 상황이 리셋됩니다.'
      case 'WEEKLY':
        return '매주 월요일 자정(00:00)에 초기화되며, 일주일 단위로 진행 상황이 리셋됩니다.'
      case 'MONTHLY':
        return '매월 1일 자정(00:00)에 초기화되며, 한 달 단위로 진행 상황이 리셋됩니다.'
      default:
        return ''
    }
  }

  const getQuotaTypeDescription = (type: string) => {
    switch (type) {
      case 'ACTION_REWARD':
        return '조건을 달성하면 사용자에게 보상(포인트, 쿠폰 등)을 지급합니다.'
      case 'ACTION_CONSTRAINT':
        return '사용자의 특정 행동을 제한하거나 제약합니다. (예: 일일 주문 횟수 제한)'
      default:
        return ''
    }
  }

  const getMissionTypeDescription = (type: string) => {
    switch (type) {
      case 'CREATE_ORDER':
        return '사용자가 주문을 생성할 때 카운트됩니다.'
      case 'COMPLETE_ORDER':
        return '주문이 완료 상태로 변경될 때 카운트됩니다.'
      case 'CREATE_PRODUCT':
        return '사용자가 상품을 등록할 때 카운트됩니다.'
      case 'CREATE_REVIEW':
        return '사용자가 리뷰를 작성할 때 카운트됩니다.'
      case 'CONFIRM_PAYMENT':
        return '결제가 확인될 때 카운트됩니다.'
      case 'USER_LOGIN':
        return '사용자가 로그인할 때 카운트됩니다.'
      default:
        return ''
    }
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto p-4">
      {/* Content */}
      <div className="space-y-4">
        {/* Header Section */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-hamster-brown">{quota.name}</h2>
                <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                  {quota.quotaKey}
                </span>
              </div>
              <p className="text-sm text-gray-600">{quota.description}</p>
            </div>
            <button
              onClick={() => onDelete(quota.quotaId)}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
            >
              삭제
            </button>
          </div>

          <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-xs text-blue-800 font-semibold">
              🔄 정기 미션은 설정된 주기(일일/주간/월간)마다 초기화되어 <strong>반복적으로</strong> 보상을 받을 수 있습니다.
            </p>
          </div>
        </section>
        {/* 기본 정보 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            기본 정보
          </h3>

          <div className="space-y-4">
            {/* Cycle Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                주기 (Cycle Type)
              </label>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-blue-700">
                    {quota.cycleType}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {getCycleDescription(quota.cycleType)}
                </p>
              </div>
            </div>

            {/* Quota Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                타입 (Quota Type)
              </label>
              <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-purple-700">
                    {quota.quotaType === 'ACTION_REWARD' ? '보상 지급' : '행동 제약'}
                  </span>
                  <span className="text-xs text-purple-600 font-mono">
                    ({quota.quotaType})
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {getQuotaTypeDescription(quota.quotaType)}
                </p>
              </div>
            </div>

            {/* Max Limit */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                최대 횟수 (Max Limit)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-hamster-orange">
                  {quota.maxLimit}
                </span>
                <span className="text-sm text-gray-600">회</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                주기 내 최대 달성 가능 횟수입니다.
              </p>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                정렬 순서 (Sort Order)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-700">
                  {quota.sortOrder}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                작은 숫자일수록 먼저 표시됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* 조건 설정 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            조건 설정
          </h3>

          <div className="space-y-4">
            {/* Event Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                이벤트 타입 (Mission Type)
              </label>
              <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-green-700">
                    {quota.condition.type}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {getMissionTypeDescription(quota.condition.type)}
                </p>
              </div>
            </div>

            {/* Requirement */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                필요 횟수 (Requirement)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {quota.condition.requirement}
                </span>
                <span className="text-sm text-gray-600">회</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Quota 1회 달성에 필요한 이벤트 발생 횟수입니다.
              </p>
            </div>

            {/* Filters */}
            {Object.keys(filters).length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  필터 (Filters)
                </label>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {filters.region && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase min-w-24">
                        Region:
                      </span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {filters.region}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          특정 지역에서 발생한 이벤트만 카운트합니다.
                        </p>
                      </div>
                    </div>
                  )}
                  {filters.timeSlot && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase min-w-24">
                        Time Slot:
                      </span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {filters.timeSlot}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          특정 시간대에 발생한 이벤트만 카운트합니다.
                        </p>
                      </div>
                    </div>
                  )}
                  {filters.minAmount && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase min-w-24">
                        Min Amount:
                      </span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {filters.minAmount}원 이상
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          최소 금액 이상의 이벤트만 카운트합니다.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {Object.keys(filters).length === 0 && (
              <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                필터가 설정되지 않았습니다. 모든 이벤트가 카운트됩니다.
              </div>
            )}
          </div>
        </section>

        {/* 보상 설정 */}
        {quota.quotaType === 'ACTION_REWARD' && (
          <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
            <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
              보상 설정
            </h3>

            <div className="space-y-4">
              {/* Reward Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  보상 타입 (Reward Type)
                </label>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-yellow-700">
                      {quota.rewardType === 'POINT' ? '포인트' : '쿠폰'}
                    </span>
                    <span className="text-xs text-yellow-600 font-mono">
                      ({quota.rewardType})
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {quota.rewardType === 'POINT'
                      ? '사용자에게 포인트를 지급합니다. 포인트는 즉시 적립되며 다음 구매에 사용할 수 있습니다.'
                      : '사용자에게 쿠폰을 지급합니다. 쿠폰은 사용자의 쿠폰함에 저장됩니다.'}
                  </p>
                </div>
              </div>

              {/* Reward Amount or Coupon Code */}
              {quota.rewardType === 'POINT' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    포인트 양 (Reward Amount)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-hamster-orange">
                      {quota.rewardAmount}
                    </span>
                    <span className="text-sm text-gray-600">포인트</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Quota 1회 달성 시 지급되는 포인트 양입니다.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    쿠폰 코드 (Coupon Code)
                  </label>
                  <div className="bg-gray-50 border-l-4 border-hamster-orange p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-hamster-orange font-mono">
                        {quota.couponCode || 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Quota 1회 달성 시 지급되는 쿠폰입니다. 쿠폰 관리 메뉴에서 상세 정보를 확인할 수 있습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Summary */}
        <section className="bg-gradient-to-r from-hamster-orange to-orange-500 rounded-lg p-4 text-white">
          <h3 className="text-base font-bold mb-2">요약</h3>
          <p className="text-xs leading-relaxed">
            <strong>{quota.name}</strong>은(는) <strong>{quota.cycleType}</strong> 주기로{' '}
            <strong>{quota.condition.type}</strong> 이벤트가{' '}
            <strong>{quota.condition.requirement}회</strong> 발생하면 1회 달성되며,{' '}
            최대 <strong>{quota.maxLimit}회</strong>까지 반복 달성할 수 있습니다.
            {quota.quotaType === 'ACTION_REWARD' && quota.rewardType && (
              <>
                {' '}
                달성 시 <strong>{quota.rewardAmount} {quota.rewardType}</strong>를 보상으로 지급합니다.
              </>
            )}
          </p>
        </section>
      </div>
    </div>
  )
}
