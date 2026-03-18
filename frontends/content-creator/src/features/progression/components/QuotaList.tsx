import type { QuotaMaster, CycleType } from '@/types/progression'

interface QuotaListProps {
  quotas: QuotaMaster[]
  selectedQuotaId?: string
  onSelectQuota: (quota: QuotaMaster) => void
  onCreateNew: () => void
}

export function QuotaList({
  quotas,
  selectedQuotaId,
  onSelectQuota,
  onCreateNew,
}: QuotaListProps) {
  // 주기별 색상
  const getCycleColor = (cycleType: CycleType) => {
    switch (cycleType) {
      case 'DAILY':
        return 'bg-green-100 text-green-800'
      case 'WEEKLY':
        return 'bg-blue-100 text-blue-800'
      case 'MONTHLY':
        return 'bg-purple-100 text-purple-800'
    }
  }

  // 정렬된 Quota 목록 (sortOrder 기준)
  const sortedQuotas = [...quotas].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-hamster-brown mb-3">
          Quota 목록
        </h2>
        <button
          onClick={onCreateNew}
          className="w-full bg-hamster-orange hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          + New Quota
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedQuotas.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">등록된 Quota가 없습니다</p>
            <p className="text-xs mt-2">New Quota를 생성해보세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedQuotas.map((quota) => (
              <button
                key={quota.quotaId}
                onClick={() => onSelectQuota(quota)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  selectedQuotaId === quota.quotaId
                    ? 'border-hamster-orange bg-hamster-ivory shadow-md'
                    : 'border-gray-200 hover:border-hamster-orange hover:bg-gray-50'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                    {quota.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${getCycleColor(
                      quota.cycleType
                    )}`}
                  >
                    {quota.cycleType}
                  </span>
                </div>

                {/* Info */}
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Max:</span>
                    <span className="font-mono">{quota.maxLimit}회</span>
                  </div>
                  {quota.rewardType && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">보상:</span>
                      <span className="font-medium text-hamster-orange">
                        {quota.rewardAmount} {quota.rewardType}
                      </span>
                    </div>
                  )}
                </div>

                {/* Condition Type Badge */}
                <div className="mt-2">
                  <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {quota.condition.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          총 <span className="font-bold text-hamster-brown">{quotas.length}</span>개의 Quota
        </div>
      </div>
    </div>
  )
}
