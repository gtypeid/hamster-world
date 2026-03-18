import type { Product, ProductRecord, ResourceDetail } from '@/types/payment'

// Mock: 자원(Product) 목록
export const mockProducts: Product[] = [
  {
    // Public IDs
    publicId: 'PROD_1aB2cD3eF4gH5iJ6', // Payment Service Product Public ID
    ecommerceProductId: 'EPROD_1xY2zA3bC4dE5fG6', // Ecommerce Service Product Public ID

    // Product Info
    sku: 'PROD_001',
    weekId: 'WEEK_202602_01',
    name: '햄스터 사료 (1kg)',
    price: 15000,
    description: '프리미엄 햄스터 전용 사료',
    category: 'FOOD',

    // Stock Info
    stock: 45,
    isSoldOut: false,
    lastRecordedAt: new Date(Date.now() - 300000).toISOString(), // 5분 전

    // Timestamps
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), // 30일 전
    modifiedAt: new Date(Date.now() - 300000).toISOString(), // 5분 전
  },
  {
    // Public IDs
    publicId: 'PROD_2bC3dE4fG5hI6jK7',
    ecommerceProductId: 'EPROD_2yZ3aB4cD5eF6gH7',

    // Product Info
    sku: 'PROD_002',
    weekId: 'WEEK_202602_01',
    name: '햄스터 케이지 (대형)',
    price: 89000,
    description: '대형 햄스터용 2층 케이지',
    category: 'ETC',

    // Stock Info
    stock: 0,
    isSoldOut: true,
    lastRecordedAt: new Date(Date.now() - 7200000).toISOString(), // 2시간 전

    // Timestamps
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(), // 20일 전
    modifiedAt: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
  },
  {
    // Public IDs
    publicId: 'PROD_3cD4eF5gH6iJ7kL8',
    ecommerceProductId: 'EPROD_3zA4bC5dE6fG7hI8',

    // Product Info
    sku: 'PROD_003',
    weekId: 'WEEK_202602_01',
    name: '햄스터 간식 세트',
    price: 12000,
    description: '다양한 간식이 들어있는 세트',
    category: 'FOOD',

    // Stock Info
    stock: 120,
    isSoldOut: false,
    lastRecordedAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전

    // Timestamps
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), // 15일 전
    modifiedAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
  },
  {
    // Public IDs
    publicId: 'PROD_4dE5fG6hI7jK8lM9',
    ecommerceProductId: 'EPROD_4aB5cD6eF7gH8iJ9',

    // Product Info
    sku: 'PROD_004',
    weekId: 'WEEK_202602_01',
    name: '햄스터 러닝휠',
    price: 25000,
    description: '조용한 베어링 러닝휠',
    category: 'ETC',

    // Stock Info
    stock: 3,
    isSoldOut: false,
    lastRecordedAt: new Date(Date.now() - 3600000).toISOString(), // 1시간 전

    // Timestamps
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10일 전
    modifiedAt: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
  },
]

// Mock: Product 1의 Event Sourcing History
const mockProduct1Records: ProductRecord[] = [
  {
    recordPublicId: 'REC_1aB2cD3eF4gH5iJ6',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: 100,
    reason: 'INITIAL_STOCK',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    recordPublicId: 'REC_2bC3dE4fG5hI6jK7',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: -5,
    reason: 'STOCK_RESERVED (ORD_20260204_A1B2C3)',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    recordPublicId: 'REC_3cD4eF5gH6iJ7kL8',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: -3,
    reason: 'STOCK_RESERVED (ORD_20260204_X9Y8Z7)',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    recordPublicId: 'REC_4dE5fG6hI7jK8lM9',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: 3,
    reason: 'STOCK_RESTORED (ORD_20260204_X9Y8Z7 - Payment Failed)',
    createdAt: new Date(Date.now() - 86400000 * 20 + 5000).toISOString(),
  },
  {
    recordPublicId: 'REC_5eF6gH7iJ8kL9mN0',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: -10,
    reason: 'STOCK_RESERVED (ORD_20260204_K1L2M3)',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    recordPublicId: 'REC_6fG7hI8jK9lM0nO1',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: 50,
    reason: 'STOCK_REPLENISHMENT (입고)',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    recordPublicId: 'REC_7gH8iJ9kL0mN1oP2',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: -7,
    reason: 'STOCK_RESERVED (ORD_20260204_P4Q5R6)',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    recordPublicId: 'REC_8hI9jK0lM1nO2pQ3',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: -15,
    reason: 'STOCK_RESERVED (ORD_20260204_S7T8U9)',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    recordPublicId: 'REC_9iJ0kL1mN2oP3qR4',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: -20,
    reason: 'STOCK_RESERVED (ORD_20260204_V1W2X3)',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    recordPublicId: 'REC_0jK1lM2nO3pQ4rS5',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: -8,
    reason: 'STOCK_RESERVED (ORD_20260204_Y4Z5A6)',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    recordPublicId: 'REC_1kL2mN3oP4qR5sT6',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: -10,
    reason: 'STOCK_RESERVED (ORD_20260204_B7C8D9)',
    createdAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    recordPublicId: 'REC_2lM3nO4pQ5rS6tU7',
    productPublicId: 'PROD_1aB2cD3eF4gH5iJ6',
    stockDelta: -30,
    reason: 'STOCK_RESERVED (ORD_20260204_E1F2G3)',
    createdAt: new Date(Date.now() - 300000).toISOString(),
  },
]

// Mock: Product 2의 Event Sourcing History (품절)
const mockProduct2Records: ProductRecord[] = [
  {
    recordPublicId: 'REC_3mN4oP5qR6sT7uV8',
    productPublicId: 'PROD_2bC3dE4fG5hI6jK7',
    stockDelta: 20,
    reason: 'INITIAL_STOCK',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    recordPublicId: 'REC_4nO5pQ6rS7tU8vW9',
    productPublicId: 'PROD_2bC3dE4fG5hI6jK7',
    stockDelta: -5,
    reason: 'STOCK_RESERVED (ORD_20260204_H4I5J6)',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    recordPublicId: 'REC_5oP6qR7sT8uV9wX0',
    productPublicId: 'PROD_2bC3dE4fG5hI6jK7',
    stockDelta: -8,
    reason: 'STOCK_RESERVED (ORD_20260204_K7L8M9)',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    recordPublicId: 'REC_6pQ7rS8tU9vW0xY1',
    productPublicId: 'PROD_2bC3dE4fG5hI6jK7',
    stockDelta: -7,
    reason: 'STOCK_RESERVED (ORD_20260204_N1O2P3)',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2시간 전 품절
  },
]

// Mock: Product 3의 Event Sourcing History (재고 풍부)
const mockProduct3Records: ProductRecord[] = [
  {
    recordPublicId: 'REC_7qR8sT9uV0wX1yZ2',
    productPublicId: 'PROD_3cD4eF5gH6iJ7kL8',
    stockDelta: 200,
    reason: 'INITIAL_STOCK',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    recordPublicId: 'REC_8rS9tU0vW1xY2zA3',
    productPublicId: 'PROD_3cD4eF5gH6iJ7kL8',
    stockDelta: -30,
    reason: 'STOCK_RESERVED (ORD_20260204_Q4R5S6)',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    recordPublicId: 'REC_9sT0uV1wX2yZ3aB4',
    productPublicId: 'PROD_3cD4eF5gH6iJ7kL8',
    stockDelta: -50,
    reason: 'STOCK_RESERVED (ORD_20260204_T7U8V9)',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

// Mock: Product 4의 Event Sourcing History (재고 부족)
const mockProduct4Records: ProductRecord[] = [
  {
    recordPublicId: 'REC_0tU1vW2xY3zA4bC5',
    productPublicId: 'PROD_4dE5fG6hI7jK8lM9',
    stockDelta: 10,
    reason: 'INITIAL_STOCK',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    recordPublicId: 'REC_1uV2wX3yZ4aB5cD6',
    productPublicId: 'PROD_4dE5fG6hI7jK8lM9',
    stockDelta: -7,
    reason: 'STOCK_RESERVED (ORD_20260204_W1X2Y3)',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
]

// Helper: productPublicId로 ResourceDetail 조회
export function getMockResourceDetail(productPublicId: string): ResourceDetail | null {
  const product = mockProducts.find((p) => p.publicId === productPublicId)
  if (!product) return null

  let records: ProductRecord[] = []
  switch (productPublicId) {
    case 'PROD_1aB2cD3eF4gH5iJ6':
      records = mockProduct1Records
      break
    case 'PROD_2bC3dE4fG5hI6jK7':
      records = mockProduct2Records
      break
    case 'PROD_3cD4eF5gH6iJ7kL8':
      records = mockProduct3Records
      break
    case 'PROD_4dE5fG6hI7jK8lM9':
      records = mockProduct4Records
      break
    default:
      return null
  }

  return {
    product,
    records,
  }
}
