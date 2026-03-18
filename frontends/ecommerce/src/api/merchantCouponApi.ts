import { apiClient } from './client'
import type {
  CouponPolicyDto,
  CreateCouponPolicyRequest
} from '../types/coupon'

/**
 * 머천트 쿠폰 API
 *
 * 백엔드 엔드포인트:
 * - POST   /merchant/coupons                    - 판매자 쿠폰 생성
 * - GET    /merchant/coupons/my-coupons/list    - 내 쿠폰 목록
 */
export const merchantCouponApi = {
  /**
   * 판매자 쿠폰 생성
   *
   * POST /merchant/coupons
   *
   * @param request 쿠폰 생성 요청
   * @returns 생성된 쿠폰 정책
   */
  async createCoupon(request: CreateCouponPolicyRequest): Promise<CouponPolicyDto> {
    try {
      const response = await apiClient.post<CouponPolicyDto>('/merchant/coupons', request)
      return response.data
    } catch (error) {
      console.error('Failed to create merchant coupon:', error)
      throw new Error('쿠폰 생성에 실패했습니다')
    }
  },

  /**
   * 내 쿠폰 목록 조회
   *
   * GET /merchant/coupons/my-coupons/list
   *
   * @returns 판매자가 생성한 쿠폰 목록
   */
  async getMyCoupons(): Promise<CouponPolicyDto[]> {
    try {
      const response = await apiClient.get<CouponPolicyDto[]>('/merchant/coupons/my-coupons/list')
      return response.data
    } catch (error) {
      console.error('Failed to fetch merchant coupons:', error)
      throw new Error('쿠폰 목록을 불러오는데 실패했습니다')
    }
  }
}
