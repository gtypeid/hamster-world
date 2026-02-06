import { ecommerceClient } from './client'
import type { OrderListItem, OrderDetail } from '@/types/order'

/**
 * Order Admin API Service
 * - Ecommerce Service의 /admin/orders API 호출
 * - DEVELOPER role 필요
 */

/**
 * 전체 주문 목록 조회
 */
export async function fetchOrderList(): Promise<OrderListItem[]> {
  const response = await ecommerceClient.get<OrderListItem[]>('/admin/orders/list')
  return response.data
}

/**
 * 주문 상세 조회
 */
export async function fetchOrderDetail(orderPublicId: string): Promise<OrderDetail> {
  const response = await ecommerceClient.get<OrderDetail>(`/admin/orders/${orderPublicId}`)
  return response.data
}
