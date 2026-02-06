import { apiClient } from './client'
import type { MerchantResponse, MerchantCreateRequest, MerchantUpdateRequest, MerchantSellerInfoResponse } from '../types/merchant'

/**
 * Merchant API
 *
 * 백엔드 엔드포인트:
 * - POST   /api/merchant/apply                        - 판매자 신청 (USER -> VENDOR 역할 변경)
 * - GET    /api/merchants/me                          - 내 머천트 정보 조회
 * - PUT    /api/merchants/{merchantId}                - 머천트 정보 수정
 * - GET    /api/merchants/{merchantId}/seller-info    - 판매자 공개 정보 조회
 */

export const merchantApi = {
  /**
   * 판매자 신청 (머천트 등록)
   *
   * POST /api/merchants
   *
   * 사업자 정보, 스토어 정보, 정산 정보 입력
   */
  async createMerchant(request: MerchantCreateRequest): Promise<MerchantResponse> {
    try {
      const response = await apiClient.post<MerchantResponse>('/api/merchants', request)
      return response.data
    } catch (error) {
      console.error('Failed to create merchant:', error)
      throw new Error('판매자 신청에 실패했습니다')
    }
  },

  /**
   * 내 머천트 정보 조회
   *
   * GET /api/merchants/me
   */
  async getMyMerchant(): Promise<MerchantResponse | null> {
    try {
      const response = await apiClient.get<MerchantResponse>('/api/merchants/me')
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        // 머천트가 없는 경우 null 반환
        return null
      }
      throw error
    }
  },

  /**
   * 머천트 정보 수정
   *
   * PUT /api/merchants/{merchantId}
   */
  async updateMerchant(merchantId: string, request: MerchantUpdateRequest): Promise<MerchantResponse> {
    const response = await apiClient.put<MerchantResponse>(`/api/merchants/${merchantId}`, request)
    return response.data
  },

  /**
   * 판매자 공개 정보 조회 (비로그인 사용자도 접근 가능)
   *
   * GET /api/public/merchants/{merchantId}
   */
  async getMerchantSellerInfo(merchantId: string): Promise<MerchantSellerInfoResponse> {
    const response = await apiClient.get<MerchantSellerInfoResponse>(`/api/public/merchants/${merchantId}`)
    return response.data
  }
}
