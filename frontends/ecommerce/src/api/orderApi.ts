import { apiClient } from './client'
import type {
  OrderWithItems,
  OrderResponse,
  OrderDetailResponse,
  MerchantOrderResponse,
  MerchantOrderDetailResponse,
  OrderSearchParams
} from '../types/order'

/**
 * 주문 API
 *
 * 백엔드 엔드포인트:
 * - POST   /orders                            - 장바구니 주문 생성
 * - POST   /orders/{orderId}/cancel           - 주문 취소
 * - GET    /orders/list                       - 내 주문 목록
 * - GET    /orders/{orderPublicId}            - 내 주문 상세
 * - GET    /orders/merchant/list              - 판매자 주문 목록
 * - GET    /orders/merchant/{orderPublicId}   - 판매자 주문 상세
 */
export const orderApi = {
  /**
   * 장바구니 주문 생성
   */
  async createOrder(): Promise<OrderWithItems> {
    try {
      const response = await apiClient.post<OrderWithItems>('/orders')
      return response.data
    } catch (error) {
      console.error('Failed to create order:', error)
      throw new Error('주문 생성에 실패했습니다')
    }
  },

  /**
   * 주문 취소
   */
  async cancelOrder(orderPublicId: string): Promise<OrderWithItems> {
    try {
      const response = await apiClient.post<OrderWithItems>(`/orders/${orderPublicId}/cancel`)
      return response.data
    } catch (error) {
      console.error('Failed to cancel order:', error)
      throw new Error('주문 취소에 실패했습니다')
    }
  },

  /**
   * 내 주문 목록 조회
   *
   * GET /orders/list
   */
  async getMyOrders(params?: OrderSearchParams): Promise<OrderResponse[]> {
    try {
      const response = await apiClient.get<OrderResponse[]>('/orders/list', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch my orders:', error)
      throw new Error('주문 목록을 불러오는데 실패했습니다')
    }
  },

  /**
   * 내 주문 상세 조회
   */
  async getOrderDetail(orderPublicId: string): Promise<OrderDetailResponse> {
    try {
      const response = await apiClient.get<OrderDetailResponse>(`/orders/${orderPublicId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch order detail:', error)
      throw new Error('주문 상세를 불러오는데 실패했습니다')
    }
  },

  /**
   * 판매자 주문 목록 조회 (내 상품이 포함된 주문)
   *
   * GET /orders/merchant/list
   */
  async getMerchantOrders(params?: OrderSearchParams): Promise<MerchantOrderResponse[]> {
    try {
      const response = await apiClient.get<MerchantOrderResponse[]>('/orders/merchant/list', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch merchant orders:', error)
      throw new Error('판매자 주문 목록을 불러오는데 실패했습니다')
    }
  },

  /**
   * 판매자 주문 상세 조회
   */
  async getMerchantOrderDetail(orderPublicId: string): Promise<MerchantOrderDetailResponse> {
    try {
      const response = await apiClient.get<MerchantOrderDetailResponse>(`/orders/merchant/${orderPublicId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch merchant order detail:', error)
      throw new Error('판매자 주문 상세를 불러오는데 실패했습니다')
    }
  }
}
