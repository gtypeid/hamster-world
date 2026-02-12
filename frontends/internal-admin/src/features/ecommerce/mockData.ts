import type { EcommerceProduct } from '@/types/ecommerce'

// Mock: Ecommerce Product 목록
export const mockEcommerceProducts: EcommerceProduct[] = [
  {
    publicId: 'EPROD_1xY2zA3bC4dE5fG6',
    sku: 'EPROD_001',
    name: '햄스터 사료 (1kg)',
    description: '프리미엄 햄스터 전용 사료',
    imageUrl: null,
    category: 'FOOD',
    price: 15000,
    stock: 45, // Payment Service와 동기화된 재고
    isSoldOut: false,
    lastStockSyncedAt: new Date(Date.now() - 300000).toISOString(), // 5분 전
    averageRating: 4.5,
    reviewCount: 23,
    merchant: {
      publicId: 'MERCHANT_001',
      storeName: '햄스터 월드 스토어',
    },
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    modifiedAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    publicId: 'EPROD_2yZ3aB4cD5eF6gH7',
    sku: 'EPROD_002',
    name: '햄스터 케이지 (대형)',
    description: '대형 햄스터용 2층 케이지',
    imageUrl: null,
    category: 'CAGE',
    price: 89000,
    stock: 0,
    isSoldOut: true,
    lastStockSyncedAt: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
    averageRating: 4.8,
    reviewCount: 42,
    merchant: {
      publicId: 'MERCHANT_001',
      storeName: '햄스터 월드 스토어',
    },
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    modifiedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    publicId: 'EPROD_3zA4bC5dE6fG7hI8',
    sku: 'EPROD_003',
    name: '햄스터 간식 세트',
    description: '다양한 간식이 들어있는 세트',
    imageUrl: null,
    category: 'FOOD',
    price: 12000,
    stock: 120,
    isSoldOut: false,
    lastStockSyncedAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
    averageRating: 4.2,
    reviewCount: 15,
    merchant: {
      publicId: 'MERCHANT_001',
      storeName: '햄스터 월드 스토어',
    },
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    publicId: 'EPROD_4aB5cD6eF7gH8iJ9',
    sku: 'EPROD_004',
    name: '햄스터 러닝휠',
    description: '조용한 베어링 러닝휠',
    imageUrl: null,
    category: 'TOY',
    price: 25000,
    stock: 3,
    isSoldOut: false,
    lastStockSyncedAt: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
    averageRating: 4.7,
    reviewCount: 31,
    merchant: {
      publicId: 'MERCHANT_001',
      storeName: '햄스터 월드 스토어',
    },
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    modifiedAt: new Date(Date.now() - 3600000).toISOString(),
  },
]

// Helper: Ecommerce Product Public ID로 상세 조회
export function getMockEcommerceProductDetail(
  publicId: string
): EcommerceProduct | null {
  const product = mockEcommerceProducts.find((p) => p.publicId === publicId)
  return product || null
}
