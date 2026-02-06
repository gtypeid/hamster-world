// 백엔드 응답을 프론트엔드 형식으로 변환하는 어댑터

import type { Product } from '../data/products'
import type { BackendProduct, CartItemWithProduct } from '../types/api'

/**
 * 백엔드 ProductResponse를 프론트엔드 Product로 변환
 *
 * MSA 아키텍처:
 * - 백엔드는 publicId (Snowflake String)만 반환
 * - 프론트엔드는 id를 publicId로 사용
 *
 * 백엔드 응답 (ProductResponse.kt):
 * - publicId, sku, name, description, imageUrl, category, price, stock, isSoldOut
 *
 * 프론트엔드 형식:
 * - id(=publicId), name, price, images[], vendor, rating, soldCount, description, details, stock, category
 */
export function adaptProduct(backendProduct: BackendProduct): Product {
  // imageUrl을 배열로 변환 (없으면 기본 이모지)
  const images = backendProduct.imageUrl
    ? [backendProduct.imageUrl]
    : ['📦'] // 기본 이미지

  // 백엔드 호환성: publicId 또는 id(임시) 사용
  const productId = backendProduct.publicId || (backendProduct as any).id?.toString() || 'unknown'

  return {
    id: productId,  // publicId (String) 또는 임시 id
    sku: backendProduct.sku,
    name: backendProduct.name,
    price: backendProduct.price,
    images: images,
    vendor: '햄스터 월드', // TODO: 백엔드에 vendor 필드 추가 필요
    averageRating: backendProduct.averageRating ?? 0, // 실제 평균 평점
    reviewCount: backendProduct.reviewCount ?? 0, // 실제 리뷰 개수
    description: backendProduct.description || '',
    details: backendProduct.description || '', // TODO: 상세 HTML 필드 분리 필요
    stock: backendProduct.stock,
    isSoldOut: backendProduct.isSoldOut,
    category: backendProduct.category
  }
}

/**
 * 백엔드 Product 배열을 프론트엔드 형식으로 변환
 */
export function adaptProducts(backendProducts: BackendProduct[]): Product[] {
  return backendProducts.map(adaptProduct)
}

/**
 * 프론트엔드 장바구니 형식으로 변환
 */
export interface FrontendCartItem {
  id: string // cartItem publicId (수정/삭제 시 필요)
  productId: string // product publicId
  quantity: number
}

export interface FrontendCartItemWithProduct {
  cartItem: FrontendCartItem
  product: {
    id: string // product publicId
    name: string
    price: number
    images: string[]
    vendor: string
    stock: number
  }
}

export function adaptCartItem(data: CartItemWithProduct): FrontendCartItemWithProduct {
  return {
    cartItem: {
      id: data.cartItem.publicId,
      productId: data.cartItem.productPublicId,
      quantity: data.cartItem.quantity
    },
    product: {
      id: data.product.publicId,
      name: data.product.name,
      price: data.product.price,
      images: data.product.imageUrl ? [data.product.imageUrl] : ['📦'],
      vendor: '햄스터 상점',
      stock: data.product.stock
    }
  }
}

export function adaptCartItems(items: CartItemWithProduct[]): FrontendCartItemWithProduct[] {
  return items.map(adaptCartItem)
}
