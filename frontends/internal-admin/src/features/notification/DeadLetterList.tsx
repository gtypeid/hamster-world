import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigable } from '@/components/navigation/Navigable'
import { mockDLQMessages, getDLQStatistics, getTopicOwner, type DLQMessage, type DLQStatus } from './mockData'
import { ServiceRegistry } from '@/components/navigation/registry/ServiceRegistry'

export function DeadLetterList() {
  const [messages, setMessages] = useState<DLQMessage[]>([])
  const [topicFilter, setTopicFilter] = useState<string>('ALL')
  const [serviceFilter, setServiceFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<DLQStatus | 'ALL'>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 데이터 로드
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // TODO: API 연동 시 fetchDLQMessages() 호출
        await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call
        // 최신순 정렬
        const sortedMessages = [...mockDLQMessages].sort(
          (a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime()
        )
        setMessages(sortedMessages)
      } catch (err) {
        console.error('Failed to load DLQ messages:', err)
        setError('DLQ 메시지를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [])

  const filteredMessages = messages.filter((msg) => {
    if (topicFilter !== 'ALL' && msg.originalTopic !== topicFilter) return false
    if (serviceFilter !== 'ALL' && msg.consumerGroup !== serviceFilter) return false
    if (statusFilter !== 'ALL' && msg.status !== statusFilter) return false
    return true
  })

  const stats = getDLQStatistics(filteredMessages)

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-bold mb-2">❌ 오류 발생</p>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">🔴 데드레터 모니터링</h1>

        {/* Statistics */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <StatCard label="총 실패" value={stats.total} color="gray" />
          <StatCard label="미처리" value={stats.pending} color="yellow" />
          <StatCard label="재처리중" value={stats.reprocessing} color="blue" />
          <StatCard label="해결됨" value={stats.resolved} color="green" />
          <StatCard label="무시됨" value={stats.ignored} color="gray" />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Topic Filter */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">토픽</h3>
            <div className="flex gap-2 flex-wrap">
              <FilterButton
                active={topicFilter === 'ALL'}
                onClick={() => setTopicFilter('ALL')}
                label="전체"
                count={messages.length}
              />
              <FilterButton
                active={topicFilter === 'ecommerce-events'}
                onClick={() => setTopicFilter('ecommerce-events')}
                label="ecommerce-events"
                count={messages.filter((m) => m.originalTopic === 'ecommerce-events').length}
              />
              <FilterButton
                active={topicFilter === 'payment-events'}
                onClick={() => setTopicFilter('payment-events')}
                label="payment-events"
                count={messages.filter((m) => m.originalTopic === 'payment-events').length}
              />
              <FilterButton
                active={topicFilter === 'progression-events'}
                onClick={() => setTopicFilter('progression-events')}
                label="progression-events"
                count={messages.filter((m) => m.originalTopic === 'progression-events').length}
              />
              <FilterButton
                active={topicFilter === 'cash-gateway-events'}
                onClick={() => setTopicFilter('cash-gateway-events')}
                label="cash-gateway-events"
                count={messages.filter((m) => m.originalTopic === 'cash-gateway-events').length}
              />
            </div>
          </div>

          {/* Service Filter */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">실패한 서비스</h3>
            <div className="flex gap-2 flex-wrap">
              <FilterButton
                active={serviceFilter === 'ALL'}
                onClick={() => setServiceFilter('ALL')}
                label="전체"
                count={messages.length}
              />
              <FilterButton
                active={serviceFilter === 'ecommerce-service'}
                onClick={() => setServiceFilter('ecommerce-service')}
                label="ecommerce-service"
                count={messages.filter((m) => m.consumerGroup === 'ecommerce-service').length}
              />
              <FilterButton
                active={serviceFilter === 'payment-service'}
                onClick={() => setServiceFilter('payment-service')}
                label="payment-service"
                count={messages.filter((m) => m.consumerGroup === 'payment-service').length}
              />
              <FilterButton
                active={serviceFilter === 'cash-gateway-service'}
                onClick={() => setServiceFilter('cash-gateway-service')}
                label="cash-gateway-service"
                count={messages.filter((m) => m.consumerGroup === 'cash-gateway-service').length}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">상태</h3>
            <div className="flex gap-2 flex-wrap">
              <FilterButton
                active={statusFilter === 'ALL'}
                onClick={() => setStatusFilter('ALL')}
                label="전체"
                count={messages.length}
              />
              <FilterButton
                active={statusFilter === 'RESOLVED'}
                onClick={() => setStatusFilter('RESOLVED')}
                label="해결됨"
                count={messages.filter((m) => m.status === 'RESOLVED').length}
              />
              <FilterButton
                active={statusFilter === 'PENDING'}
                onClick={() => setStatusFilter('PENDING')}
                label="장애"
                count={messages.filter((m) => m.status === 'PENDING' || m.status === 'REPROCESSING' || m.status === 'IGNORED').length}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card List (2-line layout) */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            해당하는 DLQ 메시지가 없습니다
          </div>
        ) : (
          filteredMessages.map((message) => {
            const isResolved = message.status === 'RESOLVED'

            // EventType → IdType 추론
            const inferIdType = (eventType: string): 'order-id' | 'product-id' | 'ecommerce-product-id' | null => {
              const typeMap: Record<string, 'order-id' | 'product-id' | 'ecommerce-product-id'> = {
                'OrderCreatedEvent': 'order-id',
                'ProductCreatedEvent': 'ecommerce-product-id',
                'ProductStockChangedEvent': 'product-id',
              }
              return typeMap[eventType] || null
            }

            const aggregateIdType = message.eventType ? inferIdType(message.eventType) : null

            return (
            <div
              key={message.id}
              className={`rounded-lg border p-4 hover:shadow-md transition-all ${
                isResolved
                  ? 'bg-gray-50 border-gray-100 opacity-60 hover:border-gray-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Line 1: 시간, 이벤트 */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-gray-500 font-medium">
                  {new Date(message.failedAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-base font-bold text-gray-900">
                  {message.eventType || 'Unknown'}
                </span>
              </div>

              {/* Line 2: 토픽 → 서비스 */}
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="text-gray-900 font-bold">토픽:</span>
                <ServiceBadge service={getTopicOwner(message.originalTopic)} topic={message.originalTopic} />
                <span className="text-gray-500 text-base">→</span>
                <span className="text-gray-900 font-bold">서비스:</span>
                <ServiceBadge service={message.consumerGroup} />
              </div>

              {/* Line 3: 사유 */}
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="text-gray-900 font-bold flex-shrink-0">사유:</span>
                <span className="text-gray-700 truncate">
                  {message.exceptionMessage || message.exceptionClass}
                </span>
              </div>

              {/* Line 4: 상태, 재시도 */}
              <div className="flex items-center gap-4 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-bold">상태:</span>
                  {message.status === 'RESOLVED' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✅ 해결됨
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      🔴 장애
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-bold">재시도:</span>
                  <span className="text-gray-700">{message.retryCount}회</span>
                </div>
              </div>

              {/* IDs Section - Navigable */}
              <div className="space-y-2 text-xs font-mono border-t border-gray-200 pt-3">
                {message.traceId && (
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 flex-shrink-0">Trace ID:</span>
                    <Navigable id={message.traceId} type="trace-id" />
                  </div>
                )}

                {message.eventId && (
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 flex-shrink-0">Event ID:</span>
                    <Navigable id={message.eventId} type="event-id" />
                  </div>
                )}

                {message.aggregateId && aggregateIdType && (
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 flex-shrink-0">Aggregate ID:</span>
                    <Navigable id={message.aggregateId} type={aggregateIdType} />
                  </div>
                )}

                {message.aggregateId && !aggregateIdType && (
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 flex-shrink-0">Aggregate ID:</span>
                    <span className="text-gray-600">{message.aggregateId}</span>
                    <span className="text-gray-400">(타입 미지정)</span>
                  </div>
                )}
              </div>
            </div>
            )
          })
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  color?: 'gray' | 'yellow' | 'blue' | 'green'
}

function StatCard({ label, value, color = 'gray' }: StatCardProps) {
  const colorStyles = {
    gray: 'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
  }

  return (
    <div className={`rounded-lg p-4 ${colorStyles[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

interface FilterButtonProps {
  active: boolean
  onClick: () => void
  label: string
  count: number
  color?: 'gray' | 'red' | 'blue' | 'yellow' | 'purple' | 'green'
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  color = 'orange',
}: FilterButtonProps) {
  const baseStyle = active
    ? 'bg-hamster-orange text-white'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors text-xs ${baseStyle}`}
    >
      {label} ({count})
    </button>
  )
}

function StatusBadge({ status }: { status: DLQStatus }) {
  const statusStyles: Record<DLQStatus, { label: string; className: string }> = {
    PENDING: { label: '⏳ 미처리', className: 'bg-yellow-100 text-yellow-700' },
    REPROCESSING: { label: '🔄 재처리중', className: 'bg-blue-100 text-blue-700' },
    RESOLVED: { label: '✅ 해결됨', className: 'bg-green-100 text-green-700' },
    IGNORED: { label: '🚫 무시됨', className: 'bg-gray-100 text-gray-700' },
  }

  const { label, className } = statusStyles[status]

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

// 서비스명 → ServiceType 매핑 헬퍼
function getServiceType(serviceName: string): 'payment' | 'gateway' | 'ecommerce' | 'notification' | null {
  if (serviceName.includes('payment')) return 'payment'
  if (serviceName.includes('gateway')) return 'gateway'
  if (serviceName.includes('ecommerce')) return 'ecommerce'
  if (serviceName.includes('notification')) return 'notification'
  if (serviceName.includes('progression')) return 'notification' // progression은 notification으로 표시
  return null
}

function ServiceBadge({ service, topic }: { service: string; topic?: string }) {
  const serviceType = getServiceType(service)

  if (!serviceType) {
    // 알 수 없는 서비스
    return (
      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm font-medium font-mono">
        {topic || service}
      </span>
    )
  }

  const config = ServiceRegistry.get(serviceType)

  return (
    <span className={`px-2 py-1 ${config.color} text-white rounded text-sm font-bold font-mono inline-flex items-center gap-1`}>
      <span>{config.icon}</span>
      <span>{topic || service}</span>
    </span>
  )
}
