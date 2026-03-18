import { paymentClient } from './client'
import type { Product, ResourceDetail, Payment, PaymentDetail } from '@/types/payment'

/**
 * Payment Service API
 * - Product 관련 (자원 관리)
 * - Payment 관련 (거래 내역)
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
    orderPublicId?: string // TODO: Backend에서 추가 예정
    createdAt: string
  }[]
}

/**
 * Product 목록 조회
 * GET /products/list (Nginx가 /api/ 붙여줌)
 */
export async function fetchProductList(): Promise<Product[]> {
  const response = await paymentClient.get<ProductListResponse[]>('/products/list')
  return response.data.map(mapProductResponse)
}

/**
 * Product 상세 조회 (with Event Sourcing Records)
 * GET /products/{publicId}
 */
export async function fetchProductDetail(publicId: string): Promise<ResourceDetail> {
  const response = await paymentClient.get<ProductDetailResponse>(`/products/${publicId}`)

  return {
    product: mapProductResponse(response.data.product),
    records: response.data.records.map(record => ({
      recordPublicId: record.recordPublicId,
      productPublicId: record.productPublicId,
      stockDelta: record.stockDelta,
      reason: record.reason,
      orderPublicId: record.orderPublicId, // TODO: Backend에서 추가 예정
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

// ===== Payment (거래 내역) =====

/**
 * Payment 목록 조회
 * GET /payments/list
 */
export async function fetchPaymentList(): Promise<Payment[]> {
  const response = await paymentClient.get<Payment[]>('/payments/list')
  return response.data
}

/**
 * Payment 상세 조회
 * GET /payments/{publicId}
 */
export async function fetchPaymentDetail(publicId: string): Promise<PaymentDetail> {
  const response = await paymentClient.get<PaymentDetail>(`/payments/${publicId}`)
  return response.data
}
