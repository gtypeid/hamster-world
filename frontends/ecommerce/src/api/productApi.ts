import { products, reviews } from '../data/products'
import type { Product } from '../data/products'
import type { BackendProduct, ProductDetailResponse } from '../types/api'
import { apiClient } from './client'
import { adaptProduct, adaptProducts } from '../lib/adapters'

// Mock API with delay to simulate network requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Flag to use real API or mock
const USE_REAL_API = true

/**
 * 상품 API - Public (인증 불필요)
 *
 * 백엔드 엔드포인트:
 * - GET /api/public/products/list     - 상품 목록 조회
 * - GET /api/public/products/{id}     - 상품 단건 조회
 * - GET /api/public/products/page     - 상품 페이지 조회 (페이징)
 *
 * 백엔드는 ProductResponse를 반환하므로 adapter로 변환 필요
 */
export const productApi = {
  // 전체 상품 목록 조회
  async getProducts(): Promise<Product[]> {
    if (USE_REAL_API) {
      try {
        const response = await apiClient.get<BackendProduct[]>('/api/public/products/list')
        return adaptProducts(response.data)
      } catch (error) {
        console.error('Failed to fetch products:', error)
        // 에러를 throw하여 UI에서 에러 상태 표시
        throw new Error('상품 목록을 불러오는데 실패했습니다')
      }
    }

    // Mock data
    await delay(300)
    return products
  },

  // 카테고리별 상품 조회
  async getProductsByCategory(category: string): Promise<Product[]> {
    if (USE_REAL_API) {
      try {
        const params = category !== 'all' ? { category } : {}
        const response = await apiClient.get<BackendProduct[]>('/api/public/products/list', { params })
        return adaptProducts(response.data)
      } catch (error) {
        console.error('Failed to fetch products by category:', error)
        throw new Error('상품 목록을 불러오는데 실패했습니다')
      }
    }

    // Mock data
    await delay(300)
    if (category === 'all') return products
    return products.filter(p => p.category === category)
  },

  // 상품 상세 조회
  async getProduct(id: string): Promise<Product> {
    if (USE_REAL_API) {
      try {
        const response = await apiClient.get<BackendProduct>(`/api/public/products/${id}`)
        return adaptProduct(response.data)
      } catch (error) {
        console.error('Failed to fetch product:', error)
        throw new Error('상품을 불러오는데 실패했습니다')
      }
    }

    // Mock data
    await delay(200)
    const product = products.find(p => p.id === id)
    if (!product) {
      throw new Error('상품을 찾을 수 없습니다')
    }
    return product
  },

  // 상품 상세 조회 (판매자 정보 포함)
  async getProductDetail(id: string): Promise<ProductDetailResponse> {
    try {
      const response = await apiClient.get<ProductDetailResponse>(`/api/public/products/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch product detail:', error)
      throw new Error('상품을 불러오는데 실패했습니다')
    }
  },

  // 상품 리뷰 조회
  async getProductReviews(productId: string) {
    await delay(200)
    return reviews.filter(r => r.productId === productId)
    // TODO: 백엔드 리뷰 API 구현 후 연동
  },
}
