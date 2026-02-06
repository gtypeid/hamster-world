import { useQuery } from '@tanstack/react-query'
import { paymentApi } from '@/api/paymentApi'

// Payment 목록 조회
export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: paymentApi.getPayments,
    refetchInterval: 5000, // 5초마다 자동 리페치 (실시간 업데이트)
  })
}

// Payment 상세 조회
export function usePayment(tid: string) {
  return useQuery({
    queryKey: ['payment', tid],
    queryFn: () => paymentApi.getPayment(tid),
    enabled: !!tid, // tid가 있을 때만 실행
  })
}
