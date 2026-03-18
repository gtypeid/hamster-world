import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Payment } from '../types'

interface PaymentDetailProps {
  payment: Payment
  onClose: () => void
}

export function PaymentDetail({ payment, onClose }: PaymentDetailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-hamster-orange to-yellow-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎡</span>
            <h3 className="text-xl font-bold text-white">거래 상세 정보</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* 기본 정보 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">기본 정보</h4>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="TID" value={payment.tid} mono />
              <InfoItem label="주문 ID" value={payment.orderId} />
              <InfoItem label="MID" value={payment.midId} />
              <InfoItem label="금액" value={formatCurrency(payment.amount)} highlight />
            </div>
          </div>

          {/* 상태 정보 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">상태 정보</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">결제 상태</p>
                <Badge status={payment.status} />
              </div>
              {payment.approvalNo && (
                <InfoItem label="승인 번호" value={payment.approvalNo} mono />
              )}
              {payment.failureReason && (
                <div className="col-span-2">
                  <InfoItem label="실패 사유" value={payment.failureReason} error />
                </div>
              )}
            </div>
          </div>

          {/* Callback 정보 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Callback 정보</h4>
            <div className="space-y-3">
              <InfoItem label="Callback URL" value={payment.callbackUrl} mono />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">알림 상태</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.notificationStatus === 'SENT'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {payment.notificationStatus === 'SENT' ? '✅ 전송완료' : '⏳ 미전송'}
                  </span>
                </div>
                <InfoItem label="시도 횟수" value={`${payment.notificationAttemptCount}회`} />
              </div>
              {payment.lastNotificationAt && (
                <InfoItem
                  label="마지막 전송 시각"
                  value={new Date(payment.lastNotificationAt).toLocaleString('ko-KR')}
                />
              )}
              {payment.notificationErrorMessage && (
                <InfoItem label="에러 메시지" value={payment.notificationErrorMessage} error />
              )}
              {payment.echo && (
                <InfoItem label="Echo 데이터" value={payment.echo} mono />
              )}
            </div>
          </div>

          {/* 시각 정보 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">시각 정보</h4>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                label="생성 시각"
                value={new Date(payment.createdAt).toLocaleString('ko-KR')}
              />
              {payment.processedAt && (
                <InfoItem
                  label="처리 시각"
                  value={new Date(payment.processedAt).toLocaleString('ko-KR')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button onClick={onClose} variant="secondary">
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}

interface InfoItemProps {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
  error?: boolean
}

function InfoItem({ label, value, mono, highlight, error }: InfoItemProps) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p
        className={`text-sm ${
          mono ? 'font-mono' : ''
        } ${
          highlight ? 'text-lg font-bold text-hamster-orange' : ''
        } ${
          error ? 'text-red-600' : 'text-gray-900'
        } break-all`}
      >
        {value}
      </p>
    </div>
  )
}
