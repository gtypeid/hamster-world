import { paymentClient } from './client'
import type { Product, ResourceDetail } from '@/types/payment'

/**
 * Product Service API
 * Payment Service의 Product 관련 API
 */

interface ProductListResponse {
  productPublicId: string
  ecommerceProductId: string | null
  sku: string
  weekId: string
  name: string
  price: number
  description: string | null
  stock: number
  isSoldOut: boolean
  category: string
  lastRecordedAt: string | null
  createdAt: string
  modifiedAt: string | null
}

interface ProductDetailResponse {
  product: ProductListResponse
  records: {
    recordPublicId: string
    productPublicId: string
    stockDelta: number
    reason: string
    createdAt: string
  }[]
}

/**
 * Product 목록 조회
 * GET /api/products/list
 */
export async function fetchProductList(): Promise<Product[]> {
  const response = await paymentClient.get<ProductListResponse[]>('/api/products/list')
  return response.data.map(mapProductResponse)
}

/**
 * Product 상세 조회 (with Event Sourcing Records)
 * GET /api/products/{publicId}
 */
export async function fetchProductDetail(publicId: string): Promise<ResourceDetail> {
  const response = await paymentClient.get<ProductDetailResponse>(`/api/products/${publicId}`)

  return {
    product: mapProductResponse(response.data.product),
    records: response.data.records.map(record => ({
      recordPublicId: record.recordPublicId,
      productPublicId: record.productPublicId,
      stockDelta: record.stockDelta,
      reason: record.reason,
      createdAt: record.createdAt,
    }))
  }
}

/**
 * Backend ProductResponse → Frontend Product 변환
 */
function mapProductResponse(data: ProductListResponse): Product {
  return {
    publicId: data.productPublicId,
    ecommerceProductId: data.ecommerceProductId,
    sku: data.sku,
    weekId: data.weekId,
    name: data.name,
    price: data.price,
    description: data.description,
    stock: data.stock,
    isSoldOut: data.isSoldOut,
    category: data.category as any,
    lastRecordedAt: data.lastRecordedAt,
    createdAt: data.createdAt,
    modifiedAt: data.modifiedAt,
  }
}
