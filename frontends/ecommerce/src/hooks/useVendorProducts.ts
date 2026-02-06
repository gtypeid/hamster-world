import { useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorProductApi } from '../api/vendorProductApi'
import type { CreateProductRequest, UpdateProductRequest, AdjustStockRequest } from '../api/vendorProductApi'

/**
 * 상품 생성
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateProductRequest) => vendorProductApi.createProduct(request),
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
      vendorProductApi.updateProduct(id, request),
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
      vendorProductApi.adjustStock(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}
