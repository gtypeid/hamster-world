import { ecommerceClient } from './client'
import type { EcommerceProduct } from '@/types/ecommerce'

/**
 * Ecommerce Product Service API
 * Ecommerce Service의 Product 관련 API
 */

interface EcommerceProductDetailResponse {
  publicId: string
  sku: string
  name: string
  description: string | null
  imageUrl: string | null
  category: string
  price: number
  stock: number
  isSoldOut: boolean
  averageRating: number
  reviewCount: number
  lastStockSyncedAt: string | null
  merchant: {
    publicId: string
    storeName: string
  }
  createdAt: string
  modifiedAt: string | null
}

/**
 * Ecommerce Product 상세 조회 (Public API - 인증 불필요)
 * GET /public/products/{publicId} (Nginx가 /api/ 붙여줌)
 */
export async function fetchEcommerceProductDetail(publicId: string): Promise<EcommerceProduct> {
  const response = await ecommerceClient.get<EcommerceProductDetailResponse>(
    `/public/products/${publicId}`
  )

  return {
    publicId: response.data.publicId,
    sku: response.data.sku,
    name: response.data.name,
    description: response.data.description,
    imageUrl: response.data.imageUrl,
    category: response.data.category as any,
    price: response.data.price,
    stock: response.data.stock,
    isSoldOut: response.data.isSoldOut,
    averageRating: response.data.averageRating,
    reviewCount: response.data.reviewCount,
    lastStockSyncedAt: response.data.lastStockSyncedAt,
    merchant: response.data.merchant,
    createdAt: response.data.createdAt,
    modifiedAt: response.data.modifiedAt,
  }
}
