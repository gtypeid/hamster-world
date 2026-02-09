import { Navigable } from '../Navigable'
import { getTopicOwner, getTopicDescription, type DLQMessage } from '@/features/notification/mockData'

export interface DLQMessageViewerProps {
  id: string
  data?: DLQMessage
}

export function DLQMessageViewer({ id, data }: DLQMessageViewerProps) {
  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        DLQ 메시지를 찾을 수 없습니다.
      </div>
    )
  }

  const message = data
  const publisherService = getTopicOwner(message.originalTopic)
  const topicDescription = getTopicDescription(message.originalTopic)

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
          🔴 DLQ 메시지 상세
        </h2>
        <p className="text-sm text-red-600 mt-1">
          {message.eventType || 'Unknown Event'}
        </p>
      </div>

      {/* 서비스 흐름 (Topology) */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">📍 서비스 흐름</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-semibold mb-1">발행 서비스</p>
              <p className="text-sm font-mono font-bold text-blue-700">{publisherService}</p>
              {topicDescription && (
                <p className="text-xs text-blue-600 mt-1">({topicDescription})</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-gray-400 text-2xl">↓</div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3">
            <p className="text-xs text-gray-600 font-semibold mb-1">토픽</p>
            <p className="text-sm font-mono font-bold text-gray-700">{message.originalTopic}</p>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-gray-400 text-2xl">↓</div>
          </div>

          <div className="flex-1 bg-red-50 border-2 border-red-300 rounded-lg p-3">
            <p className="text-xs text-red-600 font-semibold mb-1">구독 실패</p>
            <p className="text-sm font-mono font-bold text-red-700">{message.consumerGroup}</p>
            <p className="text-xs text-red-600 mt-1">❌ 처리 실패</p>
          </div>
        </div>
      </section>

      {/* Kafka 메타데이터 */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">📊 Kafka 메타데이터</h4>
        <div className="space-y-2 text-sm">
          <InfoRow label="Topic" value={message.originalTopic} mono />
          <InfoRow label="Partition" value={`${message.originalPartition}`} />
          <InfoRow label="Offset" value={`${message.originalOffset}`} />
          <InfoRow
            label="Failed At"
            value={new Date(message.failedAt).toLocaleString('ko-KR')}
          />
          <InfoRow label="Retry Count" value={`${message.retryCount}회`} />
          {message.reprocessAttempts > 0 && (
            <InfoRow label="Reprocess Attempts" value={`${message.reprocessAttempts}회`} />
          )}
        </div>
      </section>

      {/* 추적 가능한 ID */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">🔗 추적 가능한 ID</h4>
        <div className="space-y-2 text-sm font-mono">
          {message.eventId && (
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
              <span className="text-gray-500 flex-shrink-0">Event ID:</span>
              <Navigable id={message.eventId} type="event-id" />
            </div>
          )}

          {message.traceId && (
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
              <span className="text-gray-500 flex-shrink-0">Trace ID:</span>
              <Navigable id={message.traceId} type="trace-id" />
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
              <span className="font-mono text-gray-700">{message.aggregateId}</span>
              <span className="text-xs text-gray-400">(타입 추론 실패)</span>
            </div>
          )}
        </div>
      </section>

      {/* 예외 정보 */}
      <section className="bg-white rounded-lg border-2 border-red-200 p-6">
        <h4 className="text-lg font-bold text-red-700 mb-4">🔴 예외 정보</h4>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">Exception Class</p>
            <p className="text-sm font-mono bg-red-50 p-2 rounded text-red-700">
              {message.exceptionClass}
            </p>
          </div>

          {message.exceptionMessage && (
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1">Exception Message</p>
              <p className="text-sm bg-red-50 p-3 rounded text-red-700 whitespace-pre-wrap">
                {message.exceptionMessage}
              </p>
            </div>
          )}

          {message.stackTrace && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 font-semibold cursor-pointer hover:text-gray-700">
                Stack Trace (클릭하여 펼치기)
              </summary>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto">
                {message.stackTrace}
              </pre>
            </details>
          )}
        </div>
      </section>

      {/* Payload (JSON) */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">📦 Payload (원본 메시지)</h4>
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
          <pre>{message.originalMessage}</pre>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(message.originalMessage)
              alert('Payload가 클립보드에 복사되었습니다.')
            }}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 transition-colors"
          >
            📋 JSON 복사
          </button>
        </div>
      </section>

      {/* 해결 정보 (RESOLVED/IGNORED인 경우) */}
      {(message.status === 'RESOLVED' || message.status === 'IGNORED') && (
        <section className="bg-green-50 rounded-lg border-2 border-green-200 p-6">
          <h4 className="text-lg font-bold text-green-700 mb-4">
            {message.status === 'RESOLVED' ? '✅ 해결 정보' : '🚫 무시 정보'}
          </h4>
          <div className="space-y-2 text-sm">
            {message.resolvedAt && (
              <InfoRow
                label="해결/무시 시각"
                value={new Date(message.resolvedAt).toLocaleString('ko-KR')}
              />
            )}
            {message.resolvedBy && (
              <InfoRow label="처리자" value={message.resolvedBy} />
            )}
            {message.notes && (
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">메모</p>
                <p className="bg-white p-3 rounded border border-green-300 text-gray-700">
                  {message.notes}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Actions */}
      {message.status === 'PENDING' && (
        <div className="flex gap-3">
          <button
            onClick={() => alert('재시도 기능은 백엔드 연동 후 구현됩니다.')}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            🔄 재시도
          </button>
          <button
            onClick={() => {
              const reason = prompt('무시 사유를 입력하세요:')
              if (reason) {
                alert(`무시 처리됨: ${reason}\n(백엔드 연동 후 실제 동작)`)
              }
            }}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            🗑️ 무시
          </button>
        </div>
      )}
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string
  mono?: boolean
}

function InfoRow({ label, value, mono }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
      <span className="text-gray-500 flex-shrink-0 text-xs font-semibold">{label}:</span>
      <span className={`text-gray-700 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
