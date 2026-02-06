import { useState, useEffect } from 'react'
import type { ViewerProps } from '@/types/navigation'
import type { Payment } from '@/types/gateway'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Navigable } from '../Navigable'
import { FieldRenderer } from '../FieldRenderer'

/**
 * GatewayPaymentDetailViewer
 * - Cash Gateway Payment 상세 정보 표시
 * - Communication Truth (확정된 거래 기록)
 * - Order에서 gatewayPaymentPublicId 클릭 시 표시
 */
export function GatewayPaymentDetailViewer({ id, data: initialData }: ViewerProps) {
  const [payment, setPayment] = useState<Payment | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)

  useEffect(() => {
    console.log('[GatewayPaymentDetailViewer] initialData:', initialData)

    // initialData가 있으면 그대로 사용 (fetcher가 이미 호출됨)
    if (initialData) {
      setPayment(initialData)
      setIsLoading(false)
      return
    }

    // initialData가 없으면 에러 (fetcher가 실행되어야 함)
    setIsLoading(false)
    setPayment(null)
  }, [id, initialData])

  if (isLoading) {
    return <LoadingSpinner />
  }

  console.log('[GatewayPaymentDetailViewer] payment:', payment)

  if (!payment || !payment.publicId || !payment.amount) {
    return (
      <div className="text-center text-gray-500">
        <p className="font-bold mb-2">❌ Gateway Payment를 찾을 수 없어요</p>
        <p className="text-sm">Payment ID: {id}</p>
        <p className="text-xs text-gray-400 mt-2">
          ⚠️ 백엔드 API 구현 필요: GET /api/payments/{'{publicId}'}
        </p>
        <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
          {JSON.stringify(payment, null, 2)}
        </pre>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      case 'REFUNDED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '✅ 승인'
      case 'CANCELLED':
        return '🔄 취소'
      case 'REFUNDED':
        return '💸 환불'
      default:
        return status
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
    })
  }

  return (
    <div className="space-y-6">
      {/* Communication Truth 설명 */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-3">📡 Communication Truth</h4>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          Cash Gateway의 Payment는 <strong>PG사와의 통신 결과</strong>를 나타냅니다.
        </p>
        <div className="bg-white rounded-lg p-4 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-blue-600">💡</span>
            <div>
              <strong>Communication Truth:</strong> PG사와의 실제 거래 통신 결과 (Cash Gateway)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">💡</span>
            <div>
              <strong>Business Truth:</strong> 재고 + 결제 + 스냅샷 원자성 보장 (Payment Service)
            </div>
          </div>
        </div>
      </section>

      {/* Payment 기본 정보 */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">💳 Gateway Payment 정보</h4>

        <div className="space-y-4">
          {/* 상태 */}
          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-gray-600 font-medium">상태</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(payment.status)}`}
            >
              {getStatusLabel(payment.status)}
            </span>
          </div>

          {/* 금액 */}
          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-gray-600 font-medium">금액</span>
            <span className="text-2xl font-bold text-hamster-brown">
              ₩{payment.amount.toLocaleString()}
            </span>
          </div>

          {/* Gateway Reference ID */}
          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-gray-600 font-medium">Gateway Ref ID</span>
            <span className="font-mono text-sm">{payment.gatewayReferenceId}</span>
          </div>

          {/* PG 정보 */}
          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-gray-600 font-medium">PG Provider</span>
            <span className="font-medium">{payment.provider}</span>
          </div>

          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-gray-600 font-medium">MID</span>
            <span className="font-mono text-sm">{payment.mid}</span>
          </div>

          {/* PG Transaction */}
          {payment.pgTransaction && (
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-gray-600 font-medium">PG Transaction</span>
              <span className="font-mono text-sm">{payment.pgTransaction}</span>
            </div>
          )}

          {/* PG Approval Number */}
          {payment.pgApprovalNo && (
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-gray-600 font-medium">PG Approval No</span>
              <span className="font-mono text-sm font-bold text-green-600">
                {payment.pgApprovalNo}
              </span>
            </div>
          )}

          {/* Origin Source */}
          {payment.originSource && (
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-gray-600 font-medium">Origin Source</span>
              <span className="font-medium">{payment.originSource}</span>
            </div>
          )}

          {/* 생성 시각 */}
          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-gray-600 font-medium">생성 시각</span>
            <span className="text-sm font-mono">{formatTimestamp(payment.createdAt)}</span>
          </div>

          {/* 수정 시각 */}
          {payment.modifiedAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">수정 시각</span>
              <span className="text-sm font-mono">{formatTimestamp(payment.modifiedAt)}</span>
            </div>
          )}
        </div>
      </section>

      {/* Related IDs - Using FieldRenderer */}
      <FieldRenderer viewerType="gateway-payment-detail" data={payment} />

      {/* Origin Payment ID - Special handling for cancellation/refund */}
      {payment.originPaymentPublicId && (
        <section className="bg-orange-50 rounded-lg border-2 border-orange-200 p-6">
          <h4 className="text-lg font-bold text-hamster-brown mb-4">🔄 원본 거래</h4>
          <div className="space-y-3 text-sm font-mono">
            <div className="flex items-center gap-3 bg-white p-3 rounded border border-orange-300">
              <span className="text-orange-600 flex-shrink-0 font-bold">Origin Payment:</span>
              <Navigable id={payment.originPaymentPublicId} type="gateway-payment-id" />
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
