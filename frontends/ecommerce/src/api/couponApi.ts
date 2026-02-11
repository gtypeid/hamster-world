import { apiClient } from './client'
import type {
  UserCouponDto,
  CouponPolicyDto,
  CouponUsageDto
} from '../types/coupon'

/**
 * 쿠폰 API
 *
 * 백엔드 엔드포인트:
 * - GET    /coupons/{couponCode}                - 쿠폰 정책 조회
 * - POST   /coupons/{couponCode}/claim          - 쿠폰 수령
 * - GET    /coupons/my-coupons/list             - 내 전체 쿠폰 목록
 * - GET    /coupons/my-coupons/available/list   - 내 사용 가능 쿠폰 목록
 * - GET    /coupons/my-usages/list              - 내 쿠폰 사용 내역
 */
export const couponApi = {
  /**
   * 쿠폰 정책 조회
   *
   * GET /coupons/{couponCode}
   *
   * @param couponCode 쿠폰 코드 (예: WELCOME2024)
   * @returns 쿠폰 정책 정보
   */
  async getCouponPolicy(couponCode: string): Promise<CouponPolicyDto> {
    try {
      const response = await apiClient.get<CouponPolicyDto>(`/coupons/${couponCode}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch coupon policy:', error)
      throw new Error('쿠폰 정보를 불러오는데 실패했습니다')
    }
  },

  /**
   * 쿠폰 수령 (Claim)
   *
   * POST /coupons/{couponCode}/claim
   *
   * @param couponCode 쿠폰 코드
   * @returns 발급된 사용자 쿠폰
   */
  async claimCoupon(couponCode: string): Promise<UserCouponDto> {
    // 에러를 그대로 throw하여 상위에서 처리할 수 있도록 함
    const response = await apiClient.post<UserCouponDto>(`/coupons/${couponCode}/claim`)
    return response.data
  },

  /**
   * 내 전체 쿠폰 목록 조회
   *
   * GET /coupons/my-coupons/list
   *
   * @returns 내가 보유한 전체 쿠폰 목록 (AVAILABLE, USED, EXPIRED 모두)
   */
  async getMyCoupons(): Promise<UserCouponDto[]> {
    try {
      const response = await apiClient.get<UserCouponDto[]>('/coupons/my-coupons/list')
      return response.data
    } catch (error) {
      console.error('Failed to fetch my coupons:', error)
      throw new Error('쿠폰 목록을 불러오는데 실패했습니다')
    }
  },

  /**
   * 내 사용 가능 쿠폰 목록 조회
   *
   * GET /coupons/my-coupons/available/list
   *
   * @returns 현재 사용 가능한 쿠폰 목록 (AVAILABLE 상태만)
   */
  async getMyAvailableCoupons(): Promise<UserCouponDto[]> {
    try {
      const response = await apiClient.get<UserCouponDto[]>('/coupons/my-coupons/available/list')
      return response.data
    } catch (error) {
      console.error('Failed to fetch available coupons:', error)
      throw new Error('사용 가능한 쿠폰을 불러오는데 실패했습니다')
    }
  },

  /**
   * 내 쿠폰 사용 내역 조회
   *
   * GET /coupons/my-usages/list
   *
   * @returns 쿠폰 사용 내역 목록
   */
  async getMyCouponUsages(): Promise<CouponUsageDto[]> {
    try {
      const response = await apiClient.get<CouponUsageDto[]>('/coupons/my-usages/list')
      return response.data
    } catch (error) {
      console.error('Failed to fetch coupon usages:', error)
      throw new Error('쿠폰 사용 내역을 불러오는데 실패했습니다')
    }
  }
}
