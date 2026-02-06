import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '../api/cartApi'
import { useAuth } from '../contexts/AuthContext'

// 장바구니 조회
export function useCart() {
  const { token, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart(token || undefined),
    // 로그인 상태일 때만 장바구니 조회
    enabled: isAuthenticated && !!token,
  })
}

// 장바구니에 상품 추가
export function useAddToCart() {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) =>
      cartApi.addToCart(productId, quantity || 1, token || undefined),
    onSuccess: () => {
      // 장바구니 캐시 무효화 → 자동 리페치
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

// 장바구니 수량 변경
export function useUpdateCartQuantity() {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateCartQuantity(itemId, quantity, token || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

// 장바구니에서 상품 제거
export function useRemoveFromCart() {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation({
    mutationFn: (itemId: string) =>
      cartApi.removeFromCart(itemId, token || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

// 장바구니 전체 삭제
export function useClearCart() {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation({
    mutationFn: () => cartApi.clearCart(token || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}
