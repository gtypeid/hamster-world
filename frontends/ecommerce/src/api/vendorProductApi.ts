import { apiClient } from './client'
import type { BackendProduct } from '../types/api'

/**
 * Merchant Product API
 *
 * 판매자(Merchant)가 상품을 등록/수정하는 API
 *
 * 백엔드 엔드포인트:
 * - POST   /api/merchant/products              - 상품 생성
 * - PUT    /api/merchant/products/{id}         - 상품 메타데이터 수정
 * - POST   /api/merchant/products/{id}/adjust-stock - 재고 조정
 */

/**
 * 상품 생성 요청
 */
export interface CreateProductRequest {
  sku: string
  name: string
  description?: string
  imageUrl?: string
  category: string  // ProductCategory enum
  price: number
  initialStock: number
}

/**
 * 상품 수정 요청
 */
export interface UpdateProductRequest {
  name: string
  description?: string
  imageUrl?: string
  category: string
  price: number
}

/**
 * 재고 조정 요청
 */
export interface AdjustStockRequest {
  stock: number  // 조정할 재고 수량 (절대값)
  reason: string  // "추가 입고", "재고 정정" 등
}

export const vendorProductApi = {
  /**
   * 상품 생성
   *
   * POST /api/merchant/products
   */
  async createProduct(request: CreateProductRequest): Promise<BackendProduct> {
    console.log('[merchantProductApi] createProduct request:', request)
    const response = await apiClient.post<BackendProduct>('/api/merchant/products', request)
    console.log('[merchantProductApi] createProduct response:', response.data)
    return response.data
  },

  /**
   * 상품 메타데이터 수정
   *
   * PUT /api/merchant/products/{id}
   */
  async updateProduct(id: string, request: UpdateProductRequest): Promise<BackendProduct> {
    const response = await apiClient.put<BackendProduct>(`/api/merchant/products/${id}`, request)
    return response.data
  },

  /**
   * 재고 조정 요청
   *
   * POST /api/merchant/products/{id}/adjust-stock
   *
   * Response: 202 Accepted (Payment Service에서 비동기 처리)
   */
  async adjustStock(id: string, request: AdjustStockRequest): Promise<void> {
    await apiClient.post(`/api/merchant/products/${id}/adjust-stock`, request)
  }
}
