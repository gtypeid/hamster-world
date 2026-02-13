import { apiClient } from './client'
import type { Payment } from '@/features/payment/types'

export const paymentApi = {
  // Payment 상세 조회
  getPayment: async (tid: string): Promise<Payment> => {
    const response = await apiClient.get<Payment>(`/payment/${tid}`)
    return response.data
  },

  // Payment 목록 조회 (List)
  getPayments: async (): Promise<Payment[]> => {
    const response = await apiClient.get<Payment[]>('/payment/list')
    return response.data
  },
}
