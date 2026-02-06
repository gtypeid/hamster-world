// Ecommerce Service Types

export type ProductCategory = 'FOOD' | 'TOY' | 'ACCESSORY' | 'CAGE' | 'BEDDING' | 'ETC'

export interface MerchantInfo {
  publicId: string
  storeName: string
}

export interface EcommerceProduct {
  // Public ID
  publicId: string // Ecommerce Product Public ID

  // Basic Info
  sku: string
  name: string
  description: string | null
  imageUrl: string | null
  category: ProductCategory
  price: number

  // Stock Info (from Payment Service sync)
  stock: number
  isSoldOut: boolean
  lastStockSyncedAt: string | null

  // Review Stats
  averageRating: number // 평균 평점 (0.0 ~ 5.0)
  reviewCount: number // 리뷰 개수

  // Merchant Info
  merchant: MerchantInfo

  // Timestamps
  createdAt: string
  modifiedAt: string | null
}
