import { useState, useEffect } from 'react'
import type { ViewerProps } from '@/types/navigation'
import type { PaymentDetail } from '@/types/payment'
import { fetchPaymentDetail } from '@/api/productService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Navigable } from '../Navigable'
import { FieldRenderer } from '../FieldRenderer'

/**
 * PaymentDetailViewer
 * - Payment 상세 정보 표시
 * - OrderSnapshot 정보 포함 (TODO: 백엔드 구현 후)
 */
export function PaymentDetailViewer({ id, data: initialData }: ViewerProps) {
  const [detail, setDetail] = useState<PaymentDetail | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 이미 data가 전달되었으면 API 호출 안함
    if (initialData) {
      setDetail(initialData)
      setIsLoading(false)
      return
    }

    // Fallback: data가 없으면 직접 API 호출
    const loadDetail = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchPaymentDetail(id)
        setDetail(data)
      } catch (err) {
        console.error('Failed to load payment detail:', err)
        setError('거래 상세 정보를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDetail()
  }, [id, initialData])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p className="font-bold mb-2">❌ 오류 발생</p>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-gray-500 mt-2">Payment ID: {id}</p>
      </div>
    )
  }

  if (!detail || !detail.paymentPublicId) {
    return (
      <div className="text-center text-gray-500">
        <p className="font-bold mb-2">❌ 거래를 찾을 수 없어요</p>
        <p className="text-sm">Payment ID: {id}</p>
      </div>
    )
  }

  const getStatusColor = () => {
    switch (detail.status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = () => {
    switch (detail.status) {
      case 'APPROVED':
        return '✅ 승인'
      case 'CANCELLED':
        return '🔄 취소'
      default:
        return detail.status
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Info */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">💰 거래 정보</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>

          {detail.originPaymentPublicId && (
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-orange-800 font-medium text-xs mb-2">🔄 이 거래는 취소건입니다</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">원본 Payment:</span>
                <Navigable id={detail.originPaymentPublicId} type="payment-id" />
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-500">금액:</span>
            <span className="text-2xl font-bold text-hamster-brown">
              ₩{detail.amount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Gateway MID:</span>
            <span className="font-mono font-medium text-xs">{detail.gatewayMid}</span>
          </div>

          {detail.pgTransaction && (
            <div className="flex justify-between">
              <span className="text-gray-500">PG Transaction ID:</span>
              <span className="font-mono font-medium text-xs">{detail.pgTransaction}</span>
            </div>
          )}

          {detail.pgApprovalNo && (
            <div className="flex justify-between">
              <span className="text-gray-500">PG 승인번호:</span>
              <span className="font-bold text-green-600">{detail.pgApprovalNo}</span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">생성일:</span>
              <span className="font-medium">
                {new Date(detail.createdAt).toLocaleString('ko-KR')}
              </span>
            </div>
            {detail.modifiedAt && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">수정일:</span>
                <span className="font-medium">
                  {new Date(detail.modifiedAt).toLocaleString('ko-KR')}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related IDs - Using FieldRenderer */}
      <FieldRenderer viewerType="payment-detail" data={detail} />

      {/* Business Truth Info */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">⭐ Business Truth</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            ✅ 이 Payment는 <strong>확정된 거래 기록</strong>입니다.
          </p>
          <p>
            ✅ Cash Gateway의 PaymentProcess는 "통신 상태"를 관리하고,
          </p>
          <p>
            ✅ Payment Service의 Payment는 "비즈니스 진실"을 보호합니다.
          </p>
          <p className="text-xs text-gray-500 mt-3">
            💡 Payment + Stock + OrderSnapshot은 같은 트랜잭션에서 원자적으로 생성됩니다.
          </p>
        </div>
      </section>

      {/* TODO: OrderSnapshot 섹션 추가 */}
      <section className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-6">
        <h4 className="text-lg font-bold text-gray-700 mb-4">🚧 OrderSnapshot (구현 예정)</h4>
        <p className="text-sm text-gray-600">
          향후 OrderSnapshot 정보가 여기에 표시됩니다:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
          <li>주문 스냅샷 (재고 차감 시점 데이터)</li>
          <li>주문 항목 목록</li>
          <li>결제 취소 시 복원용 데이터</li>
        </ul>
      </section>
    </div>
  )
}
