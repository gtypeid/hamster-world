import { useState, useEffect } from 'react'
import type { ViewerProps } from '@/types/navigation'
import type { ProcessDetail } from '@/types/gateway'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Navigable } from '../Navigable'
import { FieldRenderer } from '../FieldRenderer'

/**
 * ProcessDetailViewer
 * - PaymentProcess 상세 정보 표시
 * - Event Timeline 포함
 * - Payment 결과 포함 (있는 경우)
 */
export function ProcessDetailViewer({ id, data: initialData }: ViewerProps) {
  const [detail, setDetail] = useState<ProcessDetail | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)

  useEffect(() => {
    // initialData가 있으면 그대로 사용 (fetcher가 이미 호출됨)
    if (initialData) {
      setDetail(initialData)
      setIsLoading(false)
      return
    }

    // initialData가 없으면 에러 (fetcher가 실행되어야 함)
    setIsLoading(false)
    setDetail(null)
  }, [id, initialData])

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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  }

  const calculateDuration = (start: string, end: string): string => {
    const duration = new Date(end).getTime() - new Date(start).getTime()
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(2)}초`
  }

  return (
    <div className="space-y-6">
      {/* Payment Flow Timeline - 새로운 섹션 */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">🔄 결제 흐름 타임라인</h4>

        <div className="space-y-4">
          {/* 1. Order 생성 → Process 생성 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-800">🛒 주문 생성 → Process 생성</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {process.orderNumber}
                </span>
              </div>
              <div className="text-xs text-gray-600 font-mono">
                {formatTimestamp(process.createdAt)}
              </div>
            </div>
          </div>

          {/* 2. PG 요청 발송 */}
          {process.requestedAt && (
            <>
              <div className="ml-4 border-l-2 border-blue-300 h-6"></div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">📤 PG 요청 발송</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {process.provider}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 font-mono space-y-1">
                    <div>{formatTimestamp(process.requestedAt)}</div>
                    <div className="text-gray-500">
                      ⏱️ Process 생성 후 {calculateDuration(process.createdAt, process.requestedAt)}
                    </div>
                    {process.requestAttemptCount > 1 && (
                      <div className="text-orange-600">
                        🔄 재시도 횟수: {process.requestAttemptCount}회
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 3. PG 응답 수신 (202 Queued) */}
          {process.ackReceivedAt && (
            <>
              <div className="ml-4 border-l-2 border-blue-300 h-6"></div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">📥 PG 응답 수신 (큐 등록)</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      202 Accepted
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 font-mono space-y-1">
                    <div>{formatTimestamp(process.ackReceivedAt)}</div>
                    {process.requestedAt && (
                      <div className="text-gray-500">
                        ⏱️ 요청 후 {calculateDuration(process.requestedAt, process.ackReceivedAt)}
                      </div>
                    )}
                    {process.pgTransaction && (
                      <div className="text-gray-700">
                        TID: {process.pgTransaction}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 4. Webhook 수신 */}
          {process.modifiedAt ? (
            <>
              <div className="ml-4 border-l-2 border-blue-300 h-6"></div>
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm ${
                    process.status === 'SUCCESS'
                      ? 'bg-green-500'
                      : process.status === 'FAILED'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                  }`}
                >
                  4
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">🔔 Webhook 수신</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}
                    >
                      {process.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 font-mono space-y-1">
                    <div>{formatTimestamp(process.modifiedAt)}</div>
                    {process.ackReceivedAt && (
                      <div className="text-gray-500">
                        ⏱️ PG 응답 후 {calculateDuration(process.ackReceivedAt, process.modifiedAt)}
                      </div>
                    )}
                    {process.createdAt && (
                      <div className="text-blue-600 font-bold">
                        🎯 전체 소요시간: {calculateDuration(process.createdAt, process.modifiedAt)}
                      </div>
                    )}
                    {process.pgApprovalNo && (
                      <div className="text-green-700 font-medium">
                        ✅ 승인번호: {process.pgApprovalNo}
                      </div>
                    )}
                    {process.failureReason && (
                      <div className="text-red-600 font-medium">
                        ❌ 실패 사유: {process.failureReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="ml-4 border-l-2 border-blue-300 h-6 border-dashed"></div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-sm animate-pulse">
                  4
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-600">🔔 Webhook 대기 중...</span>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    PG사에서 결제 처리 중입니다 (비동기)
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

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

      {/* Related IDs - Using FieldRenderer */}
      <FieldRenderer viewerType="process-detail" data={process} />

      {/* Request/Response Payloads */}
      {(process.requestPayload || process.responsePayload) && (
        <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h4 className="text-lg font-bold text-hamster-brown mb-4">📦 Request/Response Payload</h4>

          <div className="space-y-4">
            {/* Request Payload */}
            {process.requestPayload && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-blue-600">→ Request Payload</span>
                  <span className="text-xs text-gray-500">(PG에 전송한 데이터)</span>
                </div>
                <pre className="bg-blue-50 border border-blue-200 p-4 rounded text-xs overflow-x-auto font-mono">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(process.requestPayload), null, 2)
                    } catch {
                      return process.requestPayload
                    }
                  })()}
                </pre>
              </div>
            )}

            {/* Response Payload */}
            {process.responsePayload && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-green-600">← Response Payload</span>
                  <span className="text-xs text-gray-500">(PG에서 받은 데이터)</span>
                </div>
                <pre className="bg-green-50 border border-green-200 p-4 rounded text-xs overflow-x-auto font-mono">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(process.responsePayload), null, 2)
                    } catch {
                      return process.responsePayload
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>
        </section>
      )}

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
