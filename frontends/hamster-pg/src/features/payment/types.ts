// Backend Payment 엔티티와 매칭
export interface Payment {
  id: number
  tid: string
  midId: string
  orderId: string
  amount: number
  callbackUrl: string
  echo?: string
  status: PaymentStatus
  approvalNo?: string
  notificationStatus: NotificationStatus
  notificationAttemptCount: number
  lastNotificationAt?: string
  notificationErrorMessage?: string
  failureReason?: string
  processedAt?: string
  createdAt: string
  modifiedAt: string
}

export const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCEL_PENDING: 'CANCEL_PENDING',
  CANCELLED: 'CANCELLED',
} as const

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus]

export const NotificationStatus = {
  NOT_SENT: 'NOT_SENT',
  SENT: 'SENT',
} as const

export type NotificationStatus = typeof NotificationStatus[keyof typeof NotificationStatus]

export interface PaymentSearchRequest {
  midId?: string
  status?: PaymentStatus
  orderId?: string
  page?: number
  size?: number
}
