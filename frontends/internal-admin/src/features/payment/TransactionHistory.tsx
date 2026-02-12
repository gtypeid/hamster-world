import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Navigable } from '@/components/navigation/Navigable'
import { useListSearch } from '@/hooks/useListSearch'
import { fetchPaymentList } from '@/api/productService'
import type { Payment, PaymentStatus } from '@/types/payment'

const getStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-800'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: PaymentStatus) => {
  switch (status) {
    case 'APPROVED':
      return '✅ 승인'
    case 'CANCELLED':
      return '🔄 취소'
    default:
      return status
  }
}

export function TransactionHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | PaymentStatus>('all')

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setIsLoading(true)
        const data = await fetchPaymentList()
        setPayments(data)
      } catch (error) {
        console.error('Failed to load payments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPayments()
  }, [])

  // URL 파라미터 검색 + 하이라이트
  const { highlightedId, itemRefs } = useListSearch(
    payments,
    {
      paymentPublicId: (p) => p.paymentPublicId,
      orderPublicId: (p) => p.orderPublicId,
      processPublicId: (p) => p.processPublicId,
    },
    (p) => p.paymentPublicId,
    isLoading
  )

  // 필터링
  const filteredPayments =
    filter === 'all' ? payments : payments.filter((p) => p.status === filter)

  // 통계
  const stats = {
    total: payments.length,
    approved: payments.filter((p) => p.status === 'APPROVED').length,
    cancelled: payments.filter((p) => p.status === 'CANCELLED').length,
    totalAmount: payments
      .filter((p) => p.status === 'APPROVED')
      .reduce((sum, p) => sum + p.amount, 0),
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-hamster-brown mb-2">💰 거래 내역</h2>
        <p className="text-gray-600">Payment Service - 확정된 거래 기록 (Business Truth)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl shadow-md p-4 border-2 border-blue-200">
          <p className="text-sm text-gray-600 mb-1">전체 거래</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}건</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">승인</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}건</p>
        </div>
        <div className="bg-gray-100 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">취소</p>
          <p className="text-2xl font-bold text-gray-600">{stats.cancelled}건</p>
        </div>
        <div className="bg-hamster-orange rounded-xl shadow-md p-4">
          <p className="text-sm text-white mb-1">승인 금액</p>
          <p className="text-2xl font-bold text-white">₩{stats.totalAmount.toLocaleString()}</p>
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
          onClick={() => setFilter('APPROVED')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'APPROVED'
              ? 'bg-green-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          승인만
        </button>
        <button
          onClick={() => setFilter('CANCELLED')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'CANCELLED'
              ? 'bg-gray-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          취소만
        </button>
      </div>

      {filteredPayments.length === 0 && (
        <EmptyState
          message="거래 내역이 없어요"
          submessage="Payment가 생성되면 여기에 표시됩니다 💰"
        />
      )}

      {filteredPayments.length > 0 && (
        <div className="space-y-4">
          {filteredPayments.map((payment) => {
            const isHighlighted = highlightedId === payment.paymentPublicId
            return (
              <div
                key={payment.paymentPublicId}
                ref={(el) => { itemRefs.current[payment.paymentPublicId] = el }}
                className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all duration-500 ${
                  isHighlighted
                    ? 'ring-4 ring-blue-500 ring-offset-2 border-blue-500'
                    : 'border-transparent hover:border-hamster-orange'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}
                    >
                      {getStatusLabel(payment.status)}
                    </span>
                    {payment.originPaymentPublicId && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        🔄 취소건
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-hamster-brown">
                      ₩{payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>

                {/* Public IDs */}
                <div className="space-y-2 text-xs mb-4 font-mono">
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 flex-shrink-0">Payment ID:</span>
                    <Navigable id={payment.paymentPublicId} type="payment-id" />
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 flex-shrink-0">Order ID:</span>
                    <Navigable id={payment.orderPublicId} type="order-id" />
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 flex-shrink-0">Process ID:</span>
                    <Navigable id={payment.processPublicId} type="process-id" />
                  </div>

                  {payment.originPaymentPublicId && (
                    <div className="flex items-center gap-3 bg-orange-50 p-2 rounded">
                      <span className="text-gray-500 flex-shrink-0">원본 Payment ID:</span>
                      <Navigable id={payment.originPaymentPublicId} type="payment-id" />
                    </div>
                  )}
                </div>

                {/* Payment Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Gateway MID:</span>{' '}
                    <span className="font-medium font-mono text-xs">{payment.gatewayMid}</span>
                  </div>
                  {payment.pgTransaction && (
                    <div>
                      <span className="text-gray-500">PG TID:</span>{' '}
                      <span className="font-medium font-mono text-xs">{payment.pgTransaction}</span>
                    </div>
                  )}
                  {payment.pgApprovalNo && (
                    <div>
                      <span className="text-gray-500">승인번호:</span>{' '}
                      <span className="font-bold text-green-600">{payment.pgApprovalNo}</span>
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
