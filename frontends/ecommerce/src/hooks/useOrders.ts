import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '../api/orderApi'
import type {
  OrderSearchParams,
} from '../types/order'

/**
 * 내 주문 목록 조회
 */
export function useMyOrders(params?: OrderSearchParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['orders', 'my', params],
    queryFn: () => orderApi.getMyOrders(params),
    enabled
  })
}

/**
 * 내 주문 상세 조회
 */
export function useOrderDetail(orderPublicId: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'detail', orderPublicId],
    queryFn: () => orderApi.getOrderDetail(orderPublicId!),
    enabled: !!orderPublicId
  })
}

/**
 * 판매자 주문 목록 조회
 */
export function useMerchantOrders(params?: OrderSearchParams) {
  return useQuery({
    queryKey: ['orders', 'merchant', params],
    queryFn: () => orderApi.getMerchantOrders(params)
  })
}

/**
 * 판매자 주문 상세 조회
 */
export function useMerchantOrderDetail(orderPublicId: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'merchant', 'detail', orderPublicId],
    queryFn: () => orderApi.getMerchantOrderDetail(orderPublicId!),
    enabled: !!orderPublicId
  })
}

/**
 * 주문 생성 (장바구니 → 주문)
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => orderApi.createOrder(),
    onSuccess: () => {
      // 주문 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      // 장바구니도 비워야 하므로 무효화
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    }
  })
}

/**
 * 주문 취소
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderPublicId: string) => orderApi.cancelOrder(orderPublicId),
    onSuccess: () => {
      // 주문 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  })
}
