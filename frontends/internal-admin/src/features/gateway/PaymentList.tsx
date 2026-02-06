import { useState } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

// 더미 데이터 - Payment (최종 승인/취소 기록)
const dummyPayments = [
  { id: 1, attemptId: 123, tid: 'PAY-2026-001', orderId: 'ORD-001', amount: 15000, status: 'APPROVED', approvalNo: 'APV-123456', createdAt: '2026-01-30 14:30:10' },
  { id: 2, attemptId: 124, tid: 'PAY-2026-002', orderId: 'ORD-002', amount: 12000, status: 'FAILED', approvalNo: null, createdAt: '2026-01-30 14:25:20' },
  { id: 3, attemptId: 122, tid: 'PAY-2026-003', orderId: 'ORD-003', amount: 8000, status: 'CANCELLED', approvalNo: 'APV-999999', createdAt: '2026-01-30 14:20:50' },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-800'
    case 'FAILED': return 'bg-red-100 text-red-800'
    case 'CANCELLED': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'APPROVED': return '✅ 승인'
    case 'FAILED': return '❌ 실패'
    case 'CANCELLED': return '🔄 취소'
    default: return status
  }
}

export function PaymentList() {
  const [selectedPayment, setSelectedPayment] = useState<typeof dummyPayments[0] | null>(null)
  const isLoading = false

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-hamster-brown mb-2">
          💳 Payment 내역
        </h2>
        <p className="text-gray-600">최종 승인/취소 기록</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">승인</p>
          <p className="text-2xl font-bold text-green-600">
            {dummyPayments.filter(p => p.status === 'APPROVED').length}건
          </p>
        </div>
        <div className="bg-red-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">실패</p>
          <p className="text-2xl font-bold text-red-600">
            {dummyPayments.filter(p => p.status === 'FAILED').length}건
          </p>
        </div>
        <div className="bg-gray-100 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">취소</p>
          <p className="text-2xl font-bold text-gray-600">
            {dummyPayments.filter(p => p.status === 'CANCELLED').length}건
          </p>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && dummyPayments.length === 0 && (
        <EmptyState
          message="아직 Payment가 없어요"
          submessage="결제 승인/취소가 발생하면 여기에 표시됩니다 💳"
        />
      )}

      {!isLoading && dummyPayments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-hamster-orange">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  TID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Attempt ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  승인번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  처리일시
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dummyPayments.map((payment) => (
                <tr
                  key={payment.id}
                  onClick={() => setSelectedPayment(payment)}
                  className="hover:bg-orange-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                    {payment.tid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                    #{payment.attemptId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {payment.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {payment.amount.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {payment.approvalNo || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              총 <span className="font-bold text-hamster-orange">{dummyPayments.length}</span>건의 Payment
            </p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-hamster-brown">
                Payment {selectedPayment.tid}
              </h2>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">PaymentAttempt ID</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono">
                  #{selectedPayment.attemptId}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Order ID</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  {selectedPayment.orderId}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">금액</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-bold">
                  {selectedPayment.amount.toLocaleString()}원
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">상태</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusLabel(selectedPayment.status)}
                  </span>
                </div>
              </div>

              {selectedPayment.approvalNo && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">승인번호</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono">
                    {selectedPayment.approvalNo}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">처리일시</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  {selectedPayment.createdAt}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
