import { useQuery } from '@tanstack/react-query'
import { productApi } from '../api/productApi'

// 전체 상품 목록 조회
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: productApi.getProducts,
  })
}

// 카테고리별 상품 조회
export function useProductsByCategory(category: string) {
  return useQuery({
    queryKey: ['products', 'category', category],
    queryFn: () => productApi.getProductsByCategory(category),
  })
}

// 상품 상세 조회
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getProduct(id),
    enabled: !!id, // id가 있을 때만 쿼리 실행
  })
}

// 상품 상세 조회 (판매자 정보 포함)
export function useProductDetail(id: string) {
  return useQuery({
    queryKey: ['product', 'detail', id],
    queryFn: () => productApi.getProductDetail(id),
    enabled: !!id,
  })
}

// 상품 리뷰 조회
export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['product', productId, 'reviews'],
    queryFn: () => productApi.getProductReviews(productId),
    enabled: !!productId,
  })
}
