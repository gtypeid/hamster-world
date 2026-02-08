import type { ArchiveMaster, MissionFilters } from '@/types/progression'

interface ArchiveDetailViewProps {
  archive: ArchiveMaster
  onDelete: (archiveId: string) => void
}

export function ArchiveDetailView({ archive, onDelete }: ArchiveDetailViewProps) {
  // Parse filters from JSON
  let filters: MissionFilters = {}
  try {
    if (archive.condition?.filtersJson) {
      filters = JSON.parse(archive.condition.filtersJson)
    }
  } catch (e) {
    console.error('Failed to parse filters:', e)
  }

  const getArchiveTypeDescription = (type: string) => {
    switch (type) {
      case 'ORDER':
        return '주문 관련 업적: 고객의 주문, 리뷰 등 구매 활동과 관련된 업적입니다.'
      case 'MERCHANT':
        return '판매자 관련 업적: 상품 등록, 판매 금액 등 판매자 활동과 관련된 업적입니다.'
      default:
        return ''
    }
  }

  const getProgressTypeDescription = (type: string) => {
    switch (type) {
      case 'EVENT_BASED':
        return '이벤트 기반: 특정 이벤트가 발생할 때마다 카운트되어 진행도가 증가합니다.'
      case 'STAT_BASED':
        return '통계 기반: 누적 통계 값을 기준으로 진행도가 결정됩니다. (예: 총 구매 금액, 총 판매 금액)'
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

  const getStatKeyDescription = (key: string) => {
    switch (key) {
      case 'TOTAL_PURCHASE_AMOUNT':
        return '총 구매 금액: 사용자가 지금까지 구매한 총 금액입니다.'
      case 'TOTAL_ORDER_COUNT':
        return '총 주문 횟수: 사용자가 지금까지 주문한 총 횟수입니다.'
      case 'TOTAL_SALES_AMOUNT':
        return '총 판매 금액: 판매자가 지금까지 판매한 총 금액입니다.'
      case 'TOTAL_PRODUCT_COUNT':
        return '총 상품 개수: 판매자가 등록한 총 상품 개수입니다.'
      default:
        return key
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
                <h2 className="text-xl font-bold text-hamster-brown">{archive.name}</h2>
                <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                  {archive.archiveCode}
                </span>
              </div>
              <p className="text-sm text-gray-600">{archive.description}</p>
            </div>
            <button
              onClick={() => onDelete(archive.archiveId)}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
            >
              삭제
            </button>
          </div>

          <div className="mt-3 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
            <p className="text-xs text-amber-800 font-semibold">
              ⚠️ <strong>중요:</strong> 뱃지는 사용자당 <strong className="underline">단 한번만</strong> 달성하고 리워드를 받을 수 있습니다.
            </p>
          </div>
        </section>

        {/* 기본 정보 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            기본 정보
          </h3>

          <div className="space-y-4">
            {/* Archive Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                업적 타입 (Archive Type)
              </label>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-blue-700">
                    {archive.archiveType === 'ORDER' ? '주문 업적' : '판매자 업적'}
                  </span>
                  <span className="text-xs text-blue-600 font-mono">
                    ({archive.archiveType})
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {getArchiveTypeDescription(archive.archiveType)}
                </p>
              </div>
            </div>

            {/* Progress Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                진행 방식 (Progress Type)
              </label>
              <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-purple-700">
                    {archive.progressType === 'EVENT_BASED' ? '이벤트 기반' : '통계 기반'}
                  </span>
                  <span className="text-xs text-purple-600 font-mono">
                    ({archive.progressType})
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {getProgressTypeDescription(archive.progressType)}
                </p>
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                정렬 순서 (Sort Order)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-700">
                  {archive.sortOrder}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                작은 숫자일수록 먼저 표시됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* 달성 조건 */}
        <section className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="text-base font-bold text-hamster-brown mb-3 pb-2 border-b border-gray-200">
            달성 조건
          </h3>

          {archive.progressType === 'EVENT_BASED' && archive.condition ? (
            <div className="space-y-4">
              {/* Event Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  이벤트 타입 (Mission Type)
                </label>
                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-green-700">
                      {archive.condition.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {getMissionTypeDescription(archive.condition.type)}
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
                    {archive.condition.requirement}
                  </span>
                  <span className="text-sm text-gray-600">회</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  업적 달성에 필요한 이벤트 발생 횟수입니다.
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
          ) : (
            <div className="space-y-4">
              {/* Stat Key */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  통계 키 (Stat Key)
                </label>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-orange-700 font-mono">
                      {archive.statKey}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {getStatKeyDescription(archive.statKey || '')}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                통계 기반 업적은 누적 값을 기준으로 진행도가 자동 계산됩니다.
              </div>
            </div>
          )}
        </section>

        {/* 보상 설정 */}
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
                    {archive.rewardType === 'POINT' ? '포인트' : '쿠폰'}
                  </span>
                  <span className="text-xs text-yellow-600 font-mono">
                    ({archive.rewardType})
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {archive.rewardType === 'POINT'
                    ? '사용자에게 포인트를 지급합니다. 포인트는 즉시 적립되며 다음 구매에 사용할 수 있습니다.'
                    : '사용자에게 쿠폰을 지급합니다. 쿠폰은 사용자의 쿠폰함에 저장됩니다.'}
                </p>
              </div>
            </div>

            {/* Reward Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                보상 양 (Reward Amount)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-hamster-orange">
                  {archive.rewardAmount}
                </span>
                <span className="text-sm text-gray-600">
                  {archive.rewardType === 'POINT' ? '포인트' : '개'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                업적 달성 시 지급되는 보상의 양입니다.
              </p>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="bg-gradient-to-r from-hamster-orange to-orange-500 rounded-lg p-4 text-white">
          <h3 className="text-base font-bold mb-2">요약</h3>
          <p className="text-xs leading-relaxed">
            <strong>{archive.name}</strong>은(는) <strong>{archive.archiveType === 'ORDER' ? '주문' : '판매자'}</strong> 업적으로,{' '}
            {archive.progressType === 'EVENT_BASED' ? (
              <>
                <strong>{archive.condition?.type}</strong> 이벤트를{' '}
                <strong>{archive.condition?.requirement}회</strong> 달성하면
              </>
            ) : (
              <>
                <strong>{archive.statKey}</strong> 통계를 기준으로
              </>
            )}{' '}
            완료되며, <strong>{archive.rewardAmount} {archive.rewardType}</strong>를 보상으로 지급합니다.
          </p>
        </section>
      </div>
    </div>
  )
}
