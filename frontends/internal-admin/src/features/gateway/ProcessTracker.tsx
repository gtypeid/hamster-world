import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Navigable } from '@/components/navigation/Navigable'
import { useListSearch } from '@/hooks/useListSearch'
import { fetchProcessList } from '@/api/gatewayService'
import type { PaymentProcess, PaymentProcessStatus } from '@/types/gateway'

const getStatusColor = (status: PaymentProcessStatus) => {
  switch (status) {
    case 'UNKNOWN':
      return 'bg-yellow-100 text-yellow-800'
    case 'SUCCESS':
      return 'bg-green-100 text-green-800'
    case 'FAILED':
      return 'bg-red-100 text-red-800'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: PaymentProcessStatus) => {
  switch (status) {
    case 'UNKNOWN':
      return '🔄 진행 중'
    case 'SUCCESS':
      return '✅ 성공'
    case 'FAILED':
      return '❌ 실패'
    case 'CANCELLED':
      return '🔄 취소'
    default:
      return status
  }
}

const getElapsedTime = (createdAt: string): string => {
  const elapsed = Date.now() - new Date(createdAt).getTime()
  const seconds = Math.floor(elapsed / 1000)

  if (seconds < 60) return `${seconds}초`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`
  return `${Math.floor(seconds / 86400)}일 전`
}

export function ProcessTracker() {
  const [filter, setFilter] = useState<'all' | PaymentProcessStatus>('all')
  const [processes, setProcesses] = useState<PaymentProcess[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProcesses = async () => {
      try {
        setIsLoading(true)
        const data = await fetchProcessList()
        setProcesses(data)
      } catch (error) {
        console.error('Failed to load processes:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProcesses()
  }, [])

  // URL 파라미터 검색 + 하이라이트 (Hook으로 추상화)
  const { highlightedId, itemRefs } = useListSearch(
    processes,
    {
      publicId: (p) => p.publicId,
      orderPublicId: (p) => p.orderPublicId || '',
      userPublicId: (p) => p.userPublicId || '',
    },
    (p) => p.publicId,
    isLoading
  )

  // 필터링
  const filteredProcesses =
    filter === 'all' ? processes : processes.filter((p) => p.status === filter)

  // 통계
  const stats = {
    inProgress: processes.filter((p) => p.status === 'UNKNOWN').length,
    success: processes.filter((p) => p.status === 'SUCCESS').length,
    failed: processes.filter((p) => p.status === 'FAILED').length,
    cancelled: processes.filter((p) => p.status === 'CANCELLED').length,
  }


  // Auto-refresh for UNKNOWN processes (TODO: 백엔드 API 구현 후 활성화)
  useEffect(() => {
    const interval = setInterval(() => {
      // TODO: UNKNOWN 상태인 프로세스만 다시 조회
      // const unknownProcesses = processes.filter(p => p.status === 'UNKNOWN')
      // if (unknownProcesses.length > 0) {
      //   loadProcesses()
      // }
    }, 3000)
    return () => clearInterval(interval)
  }, [processes])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-hamster-brown mb-2">🔄 통신 프로세스</h2>
        <p className="text-gray-600">Cash Gateway - PG 통신 상태 모니터링 (Communication Truth)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-xl shadow-md p-4 border-2 border-yellow-200">
          <p className="text-sm text-gray-600 mb-1">진행 중</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}건</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">성공</p>
          <p className="text-2xl font-bold text-green-600">{stats.success}건</p>
        </div>
        <div className="bg-red-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">실패</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed}건</p>
        </div>
        <div className="bg-gray-100 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">취소</p>
          <p className="text-2xl font-bold text-gray-600">{stats.cancelled}건</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-hamster-orange text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('UNKNOWN')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'UNKNOWN'
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          진행 중만
        </button>
        <button
          onClick={() => setFilter('FAILED')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'FAILED'
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          실패만
        </button>
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && filteredProcesses.length === 0 && (
        <EmptyState
          message="프로세스가 없어요"
          submessage="결제 프로세스가 생성되면 여기에 표시됩니다 🔄"
        />
      )}

      {!isLoading && filteredProcesses.length > 0 && (
        <div className="space-y-4">
          {filteredProcesses.map((process) => {
            const isHighlighted = highlightedId === process.publicId
            return (
              <div
                key={process.publicId}
                ref={(el) => { itemRefs.current[process.publicId] = el }}
                className={`bg-white rounded-lg shadow-md transition-all duration-500 ${
                  isHighlighted ? 'ring-4 ring-blue-500 ring-offset-2' : ''
                }`}
              >
                {/* Process Card */}
                <div className="p-6 border-2 border-transparent hover:border-hamster-orange rounded-lg transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-hamster-brown font-mono">
                          {process.gatewayReferenceId}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}
                        >
                          {getStatusLabel(process.status)}
                        </span>
                      </div>

                      {/* Public IDs - Navigable */}
                      <div className="space-y-2 text-xs mb-3 font-mono">
                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                          <span className="text-gray-500 flex-shrink-0">Process ID:</span>
                          <Navigable id={process.publicId} type="process-id" />
                        </div>
                        {process.orderPublicId && (
                          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                            <span className="text-gray-500 flex-shrink-0">Order ID:</span>
                            <Navigable id={process.orderPublicId} type="order-id" />
                          </div>
                        )}
                        {process.userPublicId && (
                          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                            <span className="text-gray-500 flex-shrink-0">User ID:</span>
                            <Navigable id={process.userPublicId} type="user-id" />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Order:</span>{' '}
                          <span className="font-medium">{process.orderNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">금액:</span>{' '}
                          <span className="font-bold text-hamster-brown">
                            ₩{process.amount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Provider:</span>{' '}
                          <span className="font-medium">{process.provider}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">시간:</span>{' '}
                          <span className="font-medium">{getElapsedTime(process.createdAt)}</span>
                        </div>
                      </div>

                      {process.message && process.status === 'FAILED' && (
                        <div className="mt-2 text-sm">
                          <span className="text-red-600 font-medium">
                            ⚠️ 실패 사유: {process.message}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress indicator for UNKNOWN status */}
                  {process.status === 'UNKNOWN' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
                        <span>PG 응답 대기 중...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
