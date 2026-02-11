import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { couponApi } from '../api/couponApi'
import type { UserCouponDto, CouponPolicyDto } from '../types/coupon'

/**
 * 쿠폰 관련 React Query 훅
 */

/**
 * 내 전체 쿠폰 목록 조회
 *
 * GET /coupons/my-coupons/list
 */
export function useMyCoupons(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['coupons', 'my'],
    queryFn: () => couponApi.getMyCoupons(),
    staleTime: 1000 * 60 * 5, // 5분
    enabled: options?.enabled ?? true, // 기본값 true
  })
}

/**
 * 내 사용 가능 쿠폰 목록 조회 (장바구니용)
 *
 * GET /coupons/my-coupons/available/list
 */
export function useMyAvailableCoupons() {
  return useQuery({
    queryKey: ['coupons', 'my', 'available'],
    queryFn: () => couponApi.getMyAvailableCoupons(),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 쿠폰 정책 조회
 *
 * GET /coupons/{couponCode}
 */
export function useCouponPolicy(couponCode: string) {
  return useQuery({
    queryKey: ['coupons', 'policy', couponCode],
    queryFn: () => couponApi.getCouponPolicy(couponCode),
    enabled: !!couponCode, // couponCode가 있을 때만 실행
    staleTime: 1000 * 60 * 10, // 10분
  })
}

/**
 * 쿠폰 수령 (Claim)
 *
 * POST /coupons/{couponCode}/claim
 */
export function useClaimCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (couponCode: string) => couponApi.claimCoupon(couponCode),
    onSuccess: () => {
      // 쿠폰 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      // 상품 상세도 새로고침 (발급 상태 업데이트를 위해)
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

/**
 * 내 쿠폰 사용 내역 조회
 *
 * GET /coupons/my-usages/list
 */
export function useMyCouponUsages() {
  return useQuery({
    queryKey: ['coupons', 'my', 'usages'],
    queryFn: () => couponApi.getMyCouponUsages(),
    staleTime: 1000 * 60 * 5, // 5분
  })
}
