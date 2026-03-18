import { useState } from 'react'
import { usePayments } from '../hooks/usePayments'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { PaymentDetail } from './PaymentDetail'
import type { Payment } from '../types'

export function PaymentList() {
  const { data: payments, isLoading, error } = usePayments()
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-hamster-brown mb-2">
          🎡 거래 내역
        </h2>
        <p className="text-gray-600">결제 거래 내역을 확인합니다</p>
      </div>

      {isLoading && <LoadingSpinner />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">
            😵 데이터를 불러오는데 실패했어요
          </p>
          <p className="text-sm text-red-500 mt-1">
            {error instanceof Error ? error.message : '알 수 없는 오류'}
          </p>
        </div>
      )}

      {!isLoading && !error && payments && payments.length === 0 && (
        <EmptyState
          message="아직 거래 내역이 없어요"
          submessage="햄스터가 결제를 기다리고 있어요 🎡"
        />
      )}

      {!isLoading && !error && payments && payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-hamster-orange">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  TID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  주문 ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  MID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  생성일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  onClick={() => setSelectedPayment(payment)}
                  className="hover:bg-orange-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                    {payment.tid.substring(0, 25)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {payment.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.midId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={payment.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              총 <span className="font-bold text-hamster-orange">{payments.length}</span>건의 거래
            </p>
            <p className="text-xs text-gray-500">
              🔄 5초마다 자동 업데이트
            </p>
          </div>
        </div>
      )}

      {selectedPayment && (
        <PaymentDetail
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  )
}
