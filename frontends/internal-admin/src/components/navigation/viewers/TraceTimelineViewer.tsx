import { useState } from 'react'

export interface TraceTimelineViewerProps {
  id: string // traceId
  data?: any
}

// Mock 데이터: traceId로 관련 이벤트 조회
interface TraceEvent {
  eventId: string
  eventType: string
  service: string
  status: 'SUCCESS' | 'FAILED'
  timestamp: string
  aggregateId?: string
  details?: string
}

function getMockTraceEvents(_traceId: string): TraceEvent[] {
  // TODO: 실제로는 백엔드 API 호출
  return [
    {
      eventId: 'evt-880h1733-h5ce-74g7-d049-779988773333',
      eventType: 'OrderCreatedEvent',
      service: 'ecommerce-service',
      status: 'SUCCESS',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      aggregateId: '6bC4dE8fF0gH3kK5',
      details: '주문 생성 완료'
    },
    {
      eventId: 'evt-881h1733-i6df-85h8-e150-880099884444',
      eventType: 'PaymentRequestedEvent',
      service: 'cash-gateway-service',
      status: 'FAILED',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      aggregateId: '6bC4dE8fF0gH3kK5',
      details: 'JsonProcessingException: Unexpected character at position 45'
    },
    {
      eventId: 'evt-882h1733-j7eg-96i9-f261-991100995555',
      eventType: 'OrderCancelledEvent',
      service: 'ecommerce-service',
      status: 'SUCCESS',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      aggregateId: '6bC4dE8fF0gH3kK5',
      details: '결제 실패로 인한 주문 취소'
    }
  ]
}

export function TraceTimelineViewer({ id: _traceId, data: _data }: TraceTimelineViewerProps) {
  const [events] = useState<TraceEvent[]>(getMockTraceEvents(_traceId))

  if (events.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        이 Trace ID와 연관된 이벤트를 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
          🔗 Trace Timeline
        </h2>
        <p className="text-sm text-gray-600 mt-1 font-mono">
          Trace ID: {_traceId}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          총 {events.length}개의 이벤트가 이 Trace에 포함되어 있습니다.
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.eventId} className="flex gap-4">
            {/* Timeline 라인 */}
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${
                event.status === 'SUCCESS'
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`} />
              {index < events.length - 1 && (
                <div className="w-0.5 h-full bg-gray-300 flex-1 min-h-[40px]" />
              )}
            </div>

            {/* Event Card */}
            <div className={`flex-1 rounded-lg border-2 p-4 ${
              event.status === 'SUCCESS'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className={`font-bold text-base ${
                    event.status === 'SUCCESS' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {event.status === 'SUCCESS' ? '✅' : '❌'} {event.eventType}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(event.timestamp).toLocaleString('ko-KR')}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  event.status === 'SUCCESS'
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                }`}>
                  {event.status}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold">Service:</span>
                  <span className="font-mono text-gray-700">{event.service}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold">Event ID:</span>
                  <span className="font-mono text-blue-600">{event.eventId}</span>
                </div>
                {event.aggregateId && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-semibold">Aggregate ID:</span>
                    <span className="font-mono text-purple-600">{event.aggregateId}</span>
                  </div>
                )}
                {event.details && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-gray-700">{event.details}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-700 mb-2">📊 Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 font-semibold">성공</p>
            <p className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'SUCCESS').length}
            </p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold">실패</p>
            <p className="text-2xl font-bold text-red-600">
              {events.filter(e => e.status === 'FAILED').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
