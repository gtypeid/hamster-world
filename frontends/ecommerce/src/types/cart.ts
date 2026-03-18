export interface Cart {
  publicId: string  // 클라이언트 노출용 ID (Snowflake String)
  userPublicId: string  // User의 publicId
  name?: string
  createdAt: string
  modifiedAt?: string
}

export interface CartItem {
  publicId: string  // 클라이언트 노출용 ID (Snowflake String)
  cartPublicId: string  // Cart의 publicId
  productPublicId: string  // Product의 publicId
  quantity: number
  createdAt: string
  modifiedAt?: string
}

export interface Product {
  publicId: string  // 클라이언트 노출용 ID (Snowflake String)
  sku: string
  name: string
  description?: string
  imageUrl?: string
  category: string
  price: number
  stock: number
  isSoldOut: boolean
  lastStockSyncedAt?: string
  createdAt?: string
  modifiedAt?: string
}

export interface CartItemWithProduct {
  cartItem: CartItem
  product: Product
}

export interface CartWithItems {
  cart: Cart
  items: CartItemWithProduct[]
}

export interface CartItemRequest {
  productPublicId: string
  quantity: number
}

export interface CartItemsUpdateRequest {
  items: CartItemRequest[]
}

export interface CartItemSearchRequest {
  productPublicIds?: string[]
  page?: number
  size?: number
  sort?: 'ASC' | 'DESC'
}
