import { PaymentStatus } from '@/features/payment/types'

interface BadgeProps {
  status: PaymentStatus
}

const statusConfig = {
  [PaymentStatus.PENDING]: {
    label: '대기',
    className: 'bg-yellow-100 text-yellow-800',
  },
  [PaymentStatus.COMPLETED]: {
    label: '완료',
    className: 'bg-green-100 text-green-800',
  },
  [PaymentStatus.FAILED]: {
    label: '실패',
    className: 'bg-red-100 text-red-800',
  },
  [PaymentStatus.CANCEL_PENDING]: {
    label: '취소대기',
    className: 'bg-orange-100 text-orange-800',
  },
  [PaymentStatus.CANCELLED]: {
    label: '취소',
    className: 'bg-gray-100 text-gray-800',
  },
}

export function Badge({ status }: BadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
