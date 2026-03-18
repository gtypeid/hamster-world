import { useMutation, useQueryClient } from '@tanstack/react-query'
import { merchantProductApi } from '../api/merchantProductApi'
import type { CreateProductRequest, UpdateProductRequest, AdjustStockRequest } from '../api/merchantProductApi'

/**
 * 상품 생성
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateProductRequest) => merchantProductApi.createProduct(request),
    onSuccess: () => {
      // 상품 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

/**
 * 상품 수정
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateProductRequest }) =>
      merchantProductApi.updateProduct(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

/**
 * 재고 조정
 */
export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: AdjustStockRequest }) =>
      merchantProductApi.adjustStock(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}
