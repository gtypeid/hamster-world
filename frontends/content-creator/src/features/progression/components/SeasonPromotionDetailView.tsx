import type { SeasonPromotionMaster, MissionFilters } from '@/types/progression'

interface SeasonPromotionDetailViewProps {
  promotion: SeasonPromotionMaster
  onDelete: (promotionId: string) => void
}

export function SeasonPromotionDetailView({ promotion, onDelete }: SeasonPromotionDetailViewProps) {
  // Parse filters from JSON
  let filters: MissionFilters = {}
  try {
    if (promotion.condition.filtersJson) {
      filters = JSON.parse(promotion.condition.filtersJson)
    }
  } catch (e) {
    console.error('Failed to parse filters:', e)
  }

  const getPromotionStatus = () => {
    const now = new Date()
    const start = new Date(promotion.startAt)
    const end = new Date(promotion.endAt)

    if (now < start) return { label: '예정', color: 'bg-blue-100 text-blue-800' }
    if (now > end) return { label: '종료', color: 'bg-gray-100 text-gray-800' }
    return { label: '진행중', color: 'bg-green-100 text-green-800' }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getMissionTypeDescription = (type: string) => {
    switch (type) {
      case 'CREATE_ORDER':
        return '주문 생성 시 스텝 진행'
      case 'COMPLETE_ORDER':
        return '주문 완료 시 스텝 진행'
      case 'CREATE_REVIEW':
        return '리뷰 작성 시 스텝 진행'
      default:
        return type
    }
  }

  const status = getPromotionStatus()
  const basicRewardSteps = Object.keys(promotion.basicRewards)
    .map(Number)
    .sort((a, b) => a - b)
  const vipRewardSteps = Object.keys(promotion.vipBonusRewards)
    .map(Number)
    .sort((a, b) => a - b)

  // Merge all steps for table
  const allSteps = Array.from(
    new Set([...basicRewardSteps, ...vipRewardSteps])
  ).sort((a, b) => a - b)

  return (
    <div className="h-full bg-gray-50 overflow-y-auto p-4">
      {/* Content */}
      <div className="space-y-4">
        {/* Header Section */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-hamster-brown">{promotion.title}</h2>
                <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                  {promotion.promotionId}
                </span>
                <span className={`inline-block text-xs px-2 py-1 rounded font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-gray-600">{promotion.description}</p>
            </div>
            <button
              onClick={() => onDelete(promotion.promotionId)}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
            >
              삭제
            </button>
          </div>

          <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-xs text-blue-800 font-semibold">
              🎯 시즌 프로모션은 기간 동안 스텝별로 진행되며, VIP 구매 시 추가 보너스를 받을 수 있습니다.
            </p>
          </div>
        </section>

        {/* 기본 정보 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            기본 정보
          </h3>

          <div className="space-y-4">
            {/* Target Role - Customer Only */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">대상</label>
              <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-purple-700">
                    고객 (CUSTOMER)
                  </span>
                </div>
                <p className="text-xs text-gray-700">
                  고객을 대상으로 한 시즌 프로모션입니다.
                </p>
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">진행 기간</label>
              <div className="bg-gray-50 rounded p-3 space-y-2">
                <div>
                  <span className="text-xs text-gray-500">시작:</span>{' '}
                  <span className="text-sm font-medium">{formatDateTime(promotion.startAt)}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">종료:</span>{' '}
                  <span className="text-sm font-medium">{formatDateTime(promotion.endAt)}</span>
                </div>
              </div>
            </div>

            {/* Max Step */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">최대 스텝</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-hamster-orange">{promotion.maxStep}</span>
                <span className="text-sm text-gray-600">단계</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">사용자가 달성할 수 있는 최대 단계입니다.</p>
            </div>
          </div>
        </section>

        {/* 진행 조건 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            스텝 진행 조건
          </h3>

          <div className="space-y-4">
            {/* Mission Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">조건 타입</label>
              <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-green-700">
                    {promotion.condition.type}
                  </span>
                </div>
                <p className="text-xs text-gray-700">
                  {getMissionTypeDescription(promotion.condition.type)}
                </p>
              </div>
            </div>

            {/* Requirement */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">필요 횟수</label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-green-600">
                  {promotion.condition.requirement}
                </span>
                <span className="text-sm text-gray-600">회</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">스텝 1단계 올라가는데 필요한 횟수입니다.</p>
            </div>

            {/* Filters */}
            {Object.keys(filters).length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">필터</label>
                <div className="bg-gray-50 rounded p-3">
                  <pre className="text-xs font-mono">{JSON.stringify(filters, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 보상 테이블 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            보상 목록
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">스텝</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">기본 보상</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">VIP 보너스</th>
                </tr>
              </thead>
              <tbody>
                {allSteps.map((step) => {
                  const basicReward = promotion.basicRewards[step]
                  const vipReward = promotion.vipBonusRewards[step]

                  return (
                    <tr key={step} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{step}단계</td>
                      <td className="px-3 py-2">
                        {basicReward ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {basicReward.rewardType} {basicReward.rewardAmount}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {vipReward ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-medium">
                            {vipReward.rewardType} {vipReward.rewardAmount}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></span>
              <span className="text-gray-600">기본 보상 ({basicRewardSteps.length}개)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded"></span>
              <span className="text-gray-600">VIP 보너스 ({vipRewardSteps.length}개)</span>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="bg-gradient-to-r from-hamster-orange to-orange-500 rounded-lg p-4 text-white">
          <h3 className="text-base font-bold mb-2">요약</h3>
          <p className="text-xs leading-relaxed">
            <strong>{promotion.title}</strong>은(는){' '}
            <strong>고객</strong> 대상 시즌 프로모션으로,{' '}
            <strong>{promotion.condition.type}</strong>을(를) 달성하면 스텝이 올라갑니다. 최대{' '}
            <strong>{promotion.maxStep}단계</strong>까지 달성 가능하며, 총{' '}
            <strong>{basicRewardSteps.length}개의 기본 보상</strong>과{' '}
            <strong>{vipRewardSteps.length}개의 VIP 보너스</strong>가 준비되어 있습니다.
          </p>
        </section>
      </div>
    </div>
  )
}
