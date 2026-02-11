import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { merchantCouponApi } from '../api/merchantCouponApi'
import type { CreateCouponPolicyRequest } from '../types/coupon'

/**
 * 머천트 쿠폰 관련 React Query 훅
 */

/**
 * 내 쿠폰 목록 조회 (판매자가 생성한 쿠폰)
 *
 * GET /merchant/coupons/my-coupons/list
 */
export function useMyMerchantCoupons() {
  return useQuery({
    queryKey: ['merchant', 'coupons', 'my'],
    queryFn: () => merchantCouponApi.getMyCoupons(),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 판매자 쿠폰 생성
 *
 * POST /merchant/coupons
 */
export function useCreateMerchantCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateCouponPolicyRequest) =>
      merchantCouponApi.createCoupon(request),
    onSuccess: () => {
      // 쿠폰 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['merchant', 'coupons'] })
    }
  })
}
