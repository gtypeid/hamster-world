import { products } from './products'

export interface CartItem {
  productId: string
  quantity: number
}

// 더미 장바구니 데이터
export const dummyCartItems: CartItem[] = [
  { productId: '1', quantity: 2 },
  { productId: '3', quantity: 1 },
  { productId: '5', quantity: 3 },
]

// 장바구니 아이템에 상품 정보 결합
export const getCartItemsWithProducts = () => {
  return dummyCartItems.map(item => {
    const product = products.find(p => p.id === item.productId)
    return {
      cartItem: item,
      product: product!
    }
  })
}
