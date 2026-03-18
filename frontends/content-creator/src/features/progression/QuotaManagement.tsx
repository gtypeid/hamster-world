import { useState, useMemo } from 'react'
import type { QuotaMaster, CycleType, QuotaType } from '@/types/progression'
import { mockQuotas, convertQuotaToCSV, downloadCSV } from './mockData'
import { QuotaDetailView } from './components/QuotaDetailView'
import { QuotaEditor } from './components/QuotaEditor'

export function QuotaManagement() {
  const [quotas, setQuotas] = useState<QuotaMaster[]>(mockQuotas)
  const [selectedQuota, setSelectedQuota] = useState<QuotaMaster | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [cycleFilter, setCycleFilter] = useState<CycleType | 'ALL'>('ALL')
  const [quotaTypeFilter, setQuotaTypeFilter] = useState<QuotaType | 'ALL'>('ALL')

  // Filter and search quotas
  const filteredQuotas = useMemo(() => {
    return quotas
      .filter((quota) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          if (
            !quota.name.toLowerCase().includes(query) &&
            !quota.quotaKey.toLowerCase().includes(query)
          ) {
            return false
          }
        }

        // Cycle filter
        if (cycleFilter !== 'ALL' && quota.cycleType !== cycleFilter) {
          return false
        }

        // Quota type filter
        if (quotaTypeFilter !== 'ALL' && quota.quotaType !== quotaTypeFilter) {
          return false
        }

        return true
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [quotas, searchQuery, cycleFilter, quotaTypeFilter])

  const handleSelectQuota = (quota: QuotaMaster) => {
    setSelectedQuota(quota)
    setIsCreatingNew(false)
  }

  const handleCreateNew = () => {
    setSelectedQuota(null)
    setIsCreatingNew(true)
  }

  const handleSave = (quota: QuotaMaster) => {
    if (isCreatingNew) {
      // Add new quota
      setQuotas([...quotas, quota])
      alert(`✅ "${quota.name}" Quota가 생성되었습니다!`)
    } else {
      // Update existing quota
      setQuotas(quotas.map((q) => (q.quotaId === quota.quotaId ? quota : q)))
      alert(`✅ "${quota.name}" Quota가 수정되었습니다!`)
    }
    setSelectedQuota(quota)
    setIsCreatingNew(false)
  }

  const handleDelete = (quotaId: string) => {
    const deleted = quotas.find((q) => q.quotaId === quotaId)
    if (confirm(`"${deleted?.name}" Quota를 삭제하시겠습니까?`)) {
      setQuotas(quotas.filter((q) => q.quotaId !== quotaId))
      if (selectedQuota?.quotaId === quotaId) {
        setSelectedQuota(null)
      }
      alert(`🗑️ "${deleted?.name}" Quota가 삭제되었습니다!`)
    }
  }

  const handleCancel = () => {
    setIsCreatingNew(false)
    setSelectedQuota(null)
  }

  const handleExportCSV = () => {
    const csv = convertQuotaToCSV(quotas)
    downloadCSV('quotas.csv', csv)
    alert('✅ quotas.csv 파일이 다운로드되었습니다!')
  }

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-4">
            <h1 className="text-xl font-bold text-hamster-brown whitespace-nowrap">
              정기 미션 관리
            </h1>

            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-hamster-orange"
              />
            </div>

            {/* Cycle Filter */}
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value as CycleType | 'ALL')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-hamster-orange"
            >
              <option value="ALL">전체</option>
              <option value="DAILY">DAILY</option>
              <option value="WEEKLY">WEEKLY</option>
              <option value="MONTHLY">MONTHLY</option>
            </select>

            {/* Quota Type Filter */}
            <select
              value={quotaTypeFilter}
              onChange={(e) => setQuotaTypeFilter(e.target.value as QuotaType | 'ALL')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-hamster-orange"
            >
              <option value="ALL">전체</option>
              <option value="ACTION_REWARD">보상</option>
              <option value="ACTION_CONSTRAINT">제약</option>
            </select>

            <span className="text-xs text-gray-500 whitespace-nowrap">
              {filteredQuotas.length}개
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateNew}
              className="px-4 py-1.5 bg-hamster-orange hover:bg-orange-600 text-white text-sm rounded transition-colors font-medium"
            >
              + New
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors font-medium"
            >
              📥 CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Quota List */}
        <div className="w-96 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-2">
            {filteredQuotas.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">검색 결과가 없습니다</p>
              </div>
            ) : (
              filteredQuotas.map((quota) => (
                <button
                  key={quota.quotaId}
                  onClick={() => handleSelectQuota(quota)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedQuota?.quotaId === quota.quotaId
                      ? 'border-hamster-orange bg-hamster-ivory'
                      : 'border-gray-200 hover:border-hamster-orange hover:bg-gray-50'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm flex-1">
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

                  {/* Quota Key */}
                  <div className="text-xs text-gray-500 font-mono mb-2">
                    {quota.quotaKey}
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
              ))
            )}
          </div>
        </div>

        {/* Right: Editor, Detail View or Empty State */}
        <div className="flex-1">
          {isCreatingNew ? (
            <QuotaEditor
              quota={null}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : selectedQuota ? (
            <QuotaDetailView quota={selectedQuota} onDelete={handleDelete} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-8xl mb-6">📋</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Quota를 선택하세요
        </h2>
        <p className="text-gray-600 mb-6">
          좌측 목록에서 Quota를 선택하여 상세 정보를 확인하세요
        </p>
      </div>
    </div>
  )
}
