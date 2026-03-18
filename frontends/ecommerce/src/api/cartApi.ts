import { products } from '../data/products'
import type { CartItem } from '../data/cart'
import type { CartWithItems } from '../types/cart'
import { apiClient } from './client'
import { productApi } from './productApi'

// Mock cart storage (for local development without backend)
let mockCart: CartItem[] = [
  { productId: '1', quantity: 2 },
  { productId: '3', quantity: 1 },
  { productId: '5', quantity: 3 },
]

let mockItemIdCounter = 100 // Mock itemId 생성용

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface CartItemWithProduct {
  cartItem: {
    id: string // itemId for update/delete (publicId)
    productId: string
    quantity: number
  }
  product: {
    id: string
    name: string
    price: number
    images: string[]
    merchant: string
    stock: number
  }
}

// Flag to use real API or mock (set to false for mock, true for real API)
const USE_REAL_API = true

export const cartApi = {
  // 장바구니 조회
  async getCart(_token?: string): Promise<CartItemWithProduct[]> {
    if (USE_REAL_API) {
      try {
        const response = await apiClient.get<CartWithItems>('/carts')
        return response.data.items.map(item => ({
          cartItem: {
            id: item.cartItem.publicId,
            productId: item.cartItem.productPublicId,
            quantity: item.cartItem.quantity
          },
          product: {
            id: item.product.publicId,
            name: item.product.name,
            price: item.product.price,
            images: [item.product.imageUrl || '📦'],
            merchant: '', // TODO: Add merchant info from backend
            stock: item.product.stock,
          }
        }))
      } catch (error) {
        console.error('Failed to fetch cart:', error)
        throw new Error('장바구니를 불러오는데 실패했습니다')
      }
    }

    // Mock implementation
    await delay(200)
    return mockCart.map((item, index) => {
      const product = products.find(p => p.id === item.productId)
      if (!product) throw new Error('Product not found')
      return {
        cartItem: {
          id: String(mockItemIdCounter + index), // Mock itemId (String)
          productId: item.productId,
          quantity: item.quantity
        },
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          images: product.images,
          merchant: product.merchant,
          stock: product.stock,
        },
      }
    })
  },

  // 장바구니에 상품 추가
  async addToCart(productId: string, quantity: number = 1, _token?: string): Promise<void> {
    if (USE_REAL_API) {
      try {
        // Get current cart
        const currentCart = await apiClient.get<CartWithItems>('/carts')
        const currentItems = currentCart.data.items

        // Find existing item or add new one (compare with publicId)
        const existingItemIndex = currentItems.findIndex(
          item => item.product.publicId === productId
        )

        let newItems
        if (existingItemIndex >= 0) {
          // Update quantity - Use publicId for backend request
          newItems = currentItems.map((item, idx) =>
            idx === existingItemIndex
              ? {
                  productPublicId: item.product.publicId,
                  quantity: item.cartItem.quantity + quantity
                }
              : {
                  productPublicId: item.product.publicId,
                  quantity: item.cartItem.quantity
                }
          )
        } else {
          // Need to fetch product to get publicId - Use productApi to avoid duplication
          const productDetail = await productApi.getProductDetail(productId)
          newItems = [
            ...currentItems.map(item => ({
              productPublicId: item.product.publicId,
              quantity: item.cartItem.quantity
            })),
            {
              productPublicId: productDetail.publicId,
              quantity
            }
          ]
        }

        await apiClient.put<CartWithItems>('/carts', { items: newItems })
      } catch (error) {
        console.error('Failed to add to cart:', error)
        throw new Error('장바구니에 추가하는데 실패했습니다')
      }
      return
    }

    // Mock implementation
    await delay(200)
    const existingItem = mockCart.find(item => item.productId === productId)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      mockCart.push({ productId, quantity })
    }
  },

  // 장바구니 수량 변경
  async updateCartQuantity(itemId: string, quantity: number, _token?: string): Promise<void> {
    if (USE_REAL_API) {
      try {
        const currentCart = await apiClient.get<CartWithItems>('/carts')
        const currentItems = currentCart.data.items

        // Update quantity for the specific item - Use publicId
        const newItems = currentItems.map(item =>
          item.cartItem.publicId === itemId
            ? {
                productPublicId: item.product.publicId,
                quantity
              }
            : {
                productPublicId: item.product.publicId,
                quantity: item.cartItem.quantity
              }
        )

        await apiClient.put<CartWithItems>('/carts', { items: newItems })
      } catch (error) {
        console.error('Failed to update cart quantity:', error)
        throw new Error('수량 변경에 실패했습니다')
      }
      return
    }

    // Mock implementation
    await delay(200)
    const index = Number(itemId) - mockItemIdCounter
    if (mockCart[index]) {
      mockCart[index].quantity = quantity
    }
  },

  // 장바구니에서 상품 제거
  async removeFromCart(itemId: string, _token?: string): Promise<void> {
    if (USE_REAL_API) {
      try {
        const currentCart = await apiClient.get<CartWithItems>('/carts')
        const currentItems = currentCart.data.items

        // Filter out the item to remove - Use publicId
        const newItems = currentItems
          .filter(item => item.cartItem.publicId !== itemId)
          .map(item => ({
            productPublicId: item.product.publicId,
            quantity: item.cartItem.quantity
          }))

        await apiClient.put<CartWithItems>('/carts', { items: newItems })
      } catch (error) {
        console.error('Failed to remove from cart:', error)
        throw new Error('장바구니에서 제거하는데 실패했습니다')
      }
      return
    }

    // Mock implementation
    await delay(200)
    const index = Number(itemId) - mockItemIdCounter
    mockCart.splice(index, 1)
  },

  // 장바구니 전체 삭제
  async clearCart(_token?: string): Promise<void> {
    if (USE_REAL_API) {
      try {
        await apiClient.put<CartWithItems>('/carts', { items: [] })
      } catch (error) {
        console.error('Failed to clear cart:', error)
        throw new Error('장바구니를 비우는데 실패했습니다')
      }
      return
    }

    // Mock implementation
    await delay(200)
    mockCart = []
  },
}
