import { useState, useMemo } from 'react'
import type { ArchiveMaster, ArchiveType, ProgressType } from '@/types/progression'
import { mockArchives, convertArchiveToCSV, downloadArchiveCSV } from './archiveMockData'
import { ArchiveDetailView } from './components/ArchiveDetailView'
import { ArchiveEditor } from './components/ArchiveEditor'

export function ArchiveManagement() {
  const [archives, setArchives] = useState<ArchiveMaster[]>(mockArchives)
  const [selectedArchive, setSelectedArchive] = useState<ArchiveMaster | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [archiveTypeFilter, setArchiveTypeFilter] = useState<ArchiveType | 'ALL'>('ALL')
  const [progressTypeFilter, setProgressTypeFilter] = useState<ProgressType | 'ALL'>('ALL')

  // Filter and search archives
  const filteredArchives = useMemo(() => {
    return archives
      .filter((archive) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          if (
            !archive.name.toLowerCase().includes(query) &&
            !archive.archiveCode.toLowerCase().includes(query)
          ) {
            return false
          }
        }

        // Archive type filter
        if (archiveTypeFilter !== 'ALL' && archive.archiveType !== archiveTypeFilter) {
          return false
        }

        // Progress type filter
        if (progressTypeFilter !== 'ALL' && archive.progressType !== progressTypeFilter) {
          return false
        }

        return true
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [archives, searchQuery, archiveTypeFilter, progressTypeFilter])

  const handleSelectArchive = (archive: ArchiveMaster) => {
    setSelectedArchive(archive)
    setIsCreatingNew(false)
  }

  const handleCreateNew = () => {
    setSelectedArchive(null)
    setIsCreatingNew(true)
  }

  const handleSave = (archive: ArchiveMaster) => {
    if (isCreatingNew) {
      // Add new archive
      setArchives([...archives, archive])
      alert(`✅ "${archive.name}" 뱃지가 생성되었습니다!`)
    } else {
      // Update existing archive
      setArchives(archives.map((a) => (a.archiveId === archive.archiveId ? archive : a)))
      alert(`✅ "${archive.name}" 뱃지가 수정되었습니다!`)
    }
    setSelectedArchive(archive)
    setIsCreatingNew(false)
  }

  const handleCancel = () => {
    setIsCreatingNew(false)
    setSelectedArchive(null)
  }

  const handleDelete = (archiveId: string) => {
    const deleted = archives.find((a) => a.archiveId === archiveId)
    if (confirm(`"${deleted?.name}" 업적을 삭제하시겠습니까?`)) {
      setArchives(archives.filter((a) => a.archiveId !== archiveId))
      if (selectedArchive?.archiveId === archiveId) {
        setSelectedArchive(null)
      }
      alert(`🗑️ "${deleted?.name}" 업적이 삭제되었습니다!`)
    }
  }

  const handleExportCSV = () => {
    const csv = convertArchiveToCSV(archives)
    downloadArchiveCSV('archives.csv', csv)
    alert('✅ archives.csv 파일이 다운로드되었습니다!')
  }

  const getArchiveTypeColor = (archiveType: ArchiveType) => {
    switch (archiveType) {
      case 'ORDER':
        return 'bg-blue-100 text-blue-800'
      case 'MERCHANT':
        return 'bg-purple-100 text-purple-800'
    }
  }

  const getProgressTypeColor = (progressType: ProgressType) => {
    switch (progressType) {
      case 'EVENT_BASED':
        return 'bg-green-100 text-green-800'
      case 'STAT_BASED':
        return 'bg-orange-100 text-orange-800'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-4">
            <h1 className="text-xl font-bold text-hamster-brown whitespace-nowrap">
              뱃지 관리
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

            {/* Archive Type Filter */}
            <select
              value={archiveTypeFilter}
              onChange={(e) => setArchiveTypeFilter(e.target.value as ArchiveType | 'ALL')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-hamster-orange"
            >
              <option value="ALL">전체</option>
              <option value="ORDER">주문</option>
              <option value="MERCHANT">판매자</option>
            </select>

            {/* Progress Type Filter */}
            <select
              value={progressTypeFilter}
              onChange={(e) => setProgressTypeFilter(e.target.value as ProgressType | 'ALL')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-hamster-orange"
            >
              <option value="ALL">전체</option>
              <option value="EVENT_BASED">이벤트</option>
              <option value="STAT_BASED">통계</option>
            </select>

            <span className="text-xs text-gray-500 whitespace-nowrap">
              {filteredArchives.length}개
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
        {/* Left: Archive List */}
        <div className="w-96 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-2">
            {filteredArchives.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">검색 결과가 없습니다</p>
              </div>
            ) : (
              filteredArchives.map((archive) => (
                <button
                  key={archive.archiveId}
                  onClick={() => handleSelectArchive(archive)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedArchive?.archiveId === archive.archiveId
                      ? 'border-hamster-orange bg-hamster-ivory'
                      : 'border-gray-200 hover:border-hamster-orange hover:bg-gray-50'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm flex-1">
                      {archive.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getArchiveTypeColor(
                        archive.archiveType
                      )}`}
                    >
                      {archive.archiveType === 'ORDER' ? '주문' : '판매자'}
                    </span>
                  </div>

                  {/* Archive Code */}
                  <div className="text-xs text-gray-500 font-mono mb-2">
                    {archive.archiveCode}
                  </div>

                  {/* Info */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getProgressTypeColor(
                          archive.progressType
                        )}`}
                      >
                        {archive.progressType === 'EVENT_BASED' ? '이벤트' : '통계'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">보상:</span>
                      <span className="font-medium text-hamster-orange">
                        {archive.rewardAmount} {archive.rewardType}
                      </span>
                    </div>
                  </div>

                  {/* Condition Info */}
                  <div className="mt-2">
                    {archive.progressType === 'EVENT_BASED' && archive.condition ? (
                      <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {archive.condition.type} × {archive.condition.requirement}
                      </span>
                    ) : (
                      <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {archive.statKey}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Editor, Detail View or Empty State */}
        <div className="flex-1">
          {isCreatingNew ? (
            <ArchiveEditor
              archive={null}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : selectedArchive ? (
            <ArchiveDetailView archive={selectedArchive} onDelete={handleDelete} />
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
        <div className="text-8xl mb-6">🏆</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          업적을 선택하세요
        </h2>
        <p className="text-gray-600 mb-6">
          좌측 목록에서 업적을 선택하여 상세 정보를 확인하세요
        </p>
      </div>
    </div>
  )
}
