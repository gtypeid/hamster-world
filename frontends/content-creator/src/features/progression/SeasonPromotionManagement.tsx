import { useState, useMemo } from 'react'
import type { SeasonPromotionMaster, SeasonPromotionFormData, PromotionTargetRole } from '@/types/progression'
import {
  mockSeasonPromotions,
  convertSeasonPromotionToCSV,
  convertRewardsToCSV,
  downloadSeasonPromotionCSV,
} from './seasonPromotionMockData'
import { SeasonPromotionDetailView } from './components/SeasonPromotionDetailView'
import { SeasonPromotionEditor } from './components/SeasonPromotionEditor'

type PromotionStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'ALL'

export function SeasonPromotionManagement() {
  const [promotions, setPromotions] = useState<SeasonPromotionMaster[]>(mockSeasonPromotions)
  const [selectedPromotion, setSelectedPromotion] = useState<SeasonPromotionMaster | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [targetRoleFilter] = useState<PromotionTargetRole | 'ALL'>('CUSTOMER') // 고객 전용
  const [statusFilter, setStatusFilter] = useState<PromotionStatus>('ALL')

  // Get promotion status
  const getPromotionStatus = (promo: SeasonPromotionMaster): PromotionStatus => {
    const now = new Date()
    const start = new Date(promo.startAt)
    const end = new Date(promo.endAt)

    if (now < start) return 'UPCOMING'
    if (now > end) return 'ENDED'
    return 'ACTIVE'
  }

  // Filter and search promotions
  const filteredPromotions = useMemo(() => {
    return promotions
      .filter((promo) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          if (
            !promo.title.toLowerCase().includes(query) &&
            !promo.promotionId.toLowerCase().includes(query)
          ) {
            return false
          }
        }

        // Target role filter
        if (targetRoleFilter !== 'ALL' && promo.targetRole !== targetRoleFilter) {
          return false
        }

        // Status filter
        if (statusFilter !== 'ALL') {
          const status = getPromotionStatus(promo)
          if (status !== statusFilter) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [promotions, searchQuery, targetRoleFilter, statusFilter])

  const handleSelectPromotion = (promo: SeasonPromotionMaster) => {
    setSelectedPromotion(promo)
    setIsCreatingNew(false)
  }

  const handleCreateNew = () => {
    setSelectedPromotion(null)
    setIsCreatingNew(true)
  }

  const handleSave = (formData: SeasonPromotionFormData) => {
    // Convert FormData to Master
    const filtersJson = Object.keys(formData.conditionFilters).length > 0
      ? JSON.stringify(formData.conditionFilters)
      : undefined

    const promotion: SeasonPromotionMaster = {
      promotionId: formData.promotionId || `PROMO_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      targetRole: formData.targetRole,
      startAt: new Date(formData.startAt).toISOString(),
      endAt: new Date(formData.endAt).toISOString(),
      maxStep: formData.maxStep ?? 1,
      condition: {
        type: formData.conditionType,
        requirement: formData.conditionRequirement,
        filtersJson,
      },
      basicRewards: formData.basicRewards,
      vipBonusRewards: formData.vipBonusRewards,
      sortOrder: formData.sortOrder,
    }

    if (isCreatingNew) {
      setPromotions([...promotions, promotion])
      alert(`✅ "${promotion.title}" 프로모션이 생성되었습니다!`)
    } else {
      setPromotions(promotions.map((p) => (p.promotionId === promotion.promotionId ? promotion : p)))
      alert(`✅ "${promotion.title}" 프로모션이 수정되었습니다!`)
    }
    setSelectedPromotion(promotion)
    setIsCreatingNew(false)
  }

  const handleCancel = () => {
    setIsCreatingNew(false)
    setSelectedPromotion(null)
  }

  const handleDelete = (promotionId: string) => {
    const deleted = promotions.find((p) => p.promotionId === promotionId)
    if (confirm(`"${deleted?.title}" 프로모션을 삭제하시겠습니까?`)) {
      setPromotions(promotions.filter((p) => p.promotionId !== promotionId))
      if (selectedPromotion?.promotionId === promotionId) {
        setSelectedPromotion(null)
      }
      alert(`🗑️ "${deleted?.title}" 프로모션이 삭제되었습니다!`)
    }
  }

  const handleExportCSV = () => {
    const promoCsv = convertSeasonPromotionToCSV(promotions)
    const rewardCsv = convertRewardsToCSV(promotions)

    downloadSeasonPromotionCSV('season_promotions.csv', promoCsv)
    downloadSeasonPromotionCSV('season_promotion_rewards.csv', rewardCsv)

    alert('✅ season_promotions.csv 및 season_promotion_rewards.csv 파일이 다운로드되었습니다!')
  }

  const getStatusColor = (status: PromotionStatus) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'ENDED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: PromotionStatus) => {
    switch (status) {
      case 'UPCOMING':
        return '예정'
      case 'ACTIVE':
        return '진행중'
      case 'ENDED':
        return '종료'
      default:
        return '-'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-4">
            <h1 className="text-xl font-bold text-hamster-brown whitespace-nowrap">
              시즌 프로모션 관리
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


            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PromotionStatus)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-hamster-orange"
            >
              <option value="ALL">전체</option>
              <option value="UPCOMING">예정</option>
              <option value="ACTIVE">진행중</option>
              <option value="ENDED">종료</option>
            </select>

            <span className="text-xs text-gray-500 whitespace-nowrap">
              {filteredPromotions.length}개
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
        {/* Left: Promotion List */}
        <div className="w-96 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-2">
            {filteredPromotions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">검색 결과가 없습니다</p>
              </div>
            ) : (
              filteredPromotions.map((promo) => {
                const status = getPromotionStatus(promo)
                const basicRewardCount = Object.keys(promo.basicRewards).length
                const vipRewardCount = Object.keys(promo.vipBonusRewards).length

                return (
                  <button
                    key={promo.promotionId}
                    onClick={() => handleSelectPromotion(promo)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPromotion?.promotionId === promo.promotionId
                        ? 'border-hamster-orange bg-hamster-ivory'
                        : 'border-gray-200 hover:border-hamster-orange hover:bg-gray-50'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm flex-1">{promo.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    {/* Promotion ID */}
                    <div className="text-xs text-gray-500 font-mono mb-2">{promo.promotionId}</div>

                    {/* Info */}
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <span className="text-gray-400">기간:</span>{' '}
                        <span className="font-medium">
                          {formatDate(promo.startAt)} ~ {formatDate(promo.endAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>
                          <span className="text-gray-400">최대 스텝:</span>{' '}
                          <span className="font-medium text-hamster-orange">{promo.maxStep}</span>
                        </span>
                        <span>
                          <span className="text-gray-400">보상:</span>{' '}
                          <span className="font-medium">
                            {basicRewardCount}+{vipRewardCount}개
                          </span>
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Detail View or Editor or Empty State */}
        <div className="flex-1">
          {isCreatingNew ? (
            <SeasonPromotionEditor onSave={handleSave} onCancel={handleCancel} />
          ) : selectedPromotion ? (
            <SeasonPromotionDetailView promotion={selectedPromotion} onDelete={handleDelete} />
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
        <div className="text-8xl mb-6">🎯</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">프로모션을 선택하세요</h2>
        <p className="text-gray-600 mb-6">좌측 목록에서 프로모션을 선택하여 상세 정보를 확인하세요</p>
      </div>
    </div>
  )
}
