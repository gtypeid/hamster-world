import { useState, useEffect } from 'react'
import type { ViewerProps } from '@/types/navigation'
import type { ProcessDetail } from '@/types/gateway'
import { getMockProcessDetail } from '@/features/gateway/mockData'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Navigable } from '../Navigable'

/**
 * ProcessDetailViewer
 * - PaymentProcess 상세 정보 표시
 * - Event Timeline 포함
 * - Payment 결과 포함 (있는 경우)
 */
export function ProcessDetailViewer({ id }: ViewerProps) {
  const [detail, setDetail] = useState<ProcessDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    // Mock 데이터 로드 (실제로는 API 호출)
    setTimeout(() => {
      const data = getMockProcessDetail(id)
      setDetail(data)
      setIsLoading(false)
    }, 300)
  }, [id])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!detail) {
    return (
      <div className="text-center text-gray-500">
        <p className="font-bold mb-2">❌ 프로세스를 찾을 수 없어요</p>
        <p className="text-sm">Process ID: {id}</p>
      </div>
    )
  }

  const { process, events, payment } = detail

  const getStatusColor = (status: string) => {
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

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Process Info */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">💳 프로세스 정보</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}
            >
              {process.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Gateway Reference:</span>
            <span className="font-mono font-medium">{process.gatewayReferenceId}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Order Number:</span>
            <span className="font-medium">{process.orderNumber}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">금액:</span>
            <span className="font-bold text-hamster-brown">
              ₩{process.amount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Provider:</span>
            <span className="font-medium">{process.provider}</span>
          </div>

          {process.failureReason && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-red-600 font-medium">⚠️ {process.failureReason}</p>
            </div>
          )}
        </div>
      </section>

      {/* Related IDs */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">🔗 관련 ID</h4>

        <div className="space-y-2 text-sm font-mono">
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
      </section>

      {/* Event Timeline */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">
          📡 이벤트 타임라인 ({events.length}건)
        </h4>

        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={event.eventId}
              className={`rounded-lg border-2 p-4 ${getEventStatusColor(event.status)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-hamster-orange text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-800">{event.eventType}</span>
                    {event.status === 'pending' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{event.message}</p>
                  <div className="text-xs text-gray-500 space-y-1 font-mono">
                    <div className="flex justify-between items-center">
                      <span>Event ID:</span>
                      <Navigable id={event.eventId} type="event-id" />
                    </div>
                    {event.traceId && (
                      <div className="flex justify-between items-center">
                        <span>Trace ID:</span>
                        <Navigable id={event.traceId} type="trace-id" />
                      </div>
                    )}
                    <div>{new Date(event.timestamp).toLocaleString('ko-KR')}</div>
                  </div>
                  {event.details && (
                    <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Result */}
      {payment && (
        <section className="bg-white rounded-lg border-2 border-green-200 p-6">
          <h4 className="text-lg font-bold text-hamster-brown mb-4">💳 Payment 결과</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Payment ID:</span>
              <Navigable id={payment.publicId} type="payment-id" />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">Process ID:</span>
              <Navigable id={payment.processPublicId} type="process-id" />
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-bold text-green-600">{payment.status}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">PG Transaction:</span>
              <span className="font-mono font-medium">{payment.pgTransaction}</span>
            </div>

            {payment.pgApprovalNo && (
              <div className="flex justify-between">
                <span className="text-gray-500">PG Approval:</span>
                <span className="font-mono font-medium">{payment.pgApprovalNo}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-500">생성일:</span>
              <span className="font-medium">
                {new Date(payment.createdAt).toLocaleString('ko-KR')}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
