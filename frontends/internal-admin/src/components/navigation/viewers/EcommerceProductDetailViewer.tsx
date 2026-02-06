import { useState, useEffect } from 'react'
import type { ViewerProps } from '@/types/navigation'
import type { EcommerceProduct } from '@/types/ecommerce'
import { fetchEcommerceProductDetail } from '@/api/ecommerceProductService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Navigable } from '../Navigable'

/**
 * EcommerceProductDetailViewer
 * - Ecommerce Service의 Product 상세 정보 표시
 * - Payment Service와 재고 동기화 상태 표시
 * - 판매자(Merchant) 정보 표시
 * - 리뷰 통계 표시
 * - GenericDataViewer에서 data를 전달받아 사용 (API 호출은 GenericDataViewer가 담당)
 */
export function EcommerceProductDetailViewer({ id, data: initialData }: ViewerProps) {
  const [product, setProduct] = useState<EcommerceProduct | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 이미 data가 전달되었으면 API 호출 안함
    if (initialData) {
      setProduct(initialData)
      setIsLoading(false)
      return
    }

    // Fallback: data가 없으면 직접 API 호출 (하위 호환성)
    const loadProduct = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchEcommerceProductDetail(id)
        setProduct(data)
      } catch (err) {
        console.error('Failed to load ecommerce product detail:', err)
        setError('상품 상세 정보를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [id, initialData])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p className="font-bold mb-2">❌ 오류 발생</p>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-gray-500 mt-2">Ecommerce Product ID: {id}</p>
      </div>
    )
  }

  // product가 없거나 필수 필드가 없으면 early return (데이터 로딩 전이거나 에러)
  if (!product || !product.publicId) {
    return (
      <div className="text-center text-gray-500">
        <p className="font-bold mb-2">❌ 상품을 찾을 수 없어요</p>
        <p className="text-sm">Ecommerce Product ID: {id}</p>
      </div>
    )
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      FOOD: '🍽️ 사료',
      TOY: '🎾 장난감',
      ACCESSORY: '🎀 액세서리',
      CAGE: '🏠 케이지',
      BEDDING: '🛏️ 바닥재',
      ETC: '📦 기타',
    }
    return labels[category] || category
  }

  const getStockStatusColor = () => {
    if (product.isSoldOut) return 'bg-red-100 text-red-800'
    if (product.stock < 10) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStockStatusLabel = () => {
    if (product.isSoldOut) return '🔴 품절'
    if (product.stock < 10) return '⚠️ 재고 부족'
    return '✅ 정상'
  }

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">🛒 Ecommerce Product 정보</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor()}`}>
              {getStockStatusLabel()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">상품명:</span>
            <span className="font-bold">{product.name}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">SKU:</span>
            <span className="font-mono font-medium">{product.sku}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">카테고리:</span>
            <span className="font-medium">{getCategoryLabel(product.category)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">가격:</span>
            <span className="font-bold text-hamster-brown">
              ₩{product.price.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">재고:</span>
            <span className="text-2xl font-bold text-hamster-brown">{product.stock}개</span>
          </div>

          {product.description && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* Merchant Info */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">🏪 판매자 정보</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">상점명:</span>
            <span className="font-bold text-hamster-brown">{product.merchant.storeName}</span>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded font-mono text-xs">
            <span className="text-gray-500 flex-shrink-0">Merchant ID:</span>
            <span className="text-purple-600 font-medium">{product.merchant.publicId}</span>
          </div>
        </div>
      </section>

      {/* Review Stats */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">⭐ 리뷰 통계</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">평균 평점:</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-yellow-500">
                {product.averageRating.toFixed(1)}
              </span>
              <span className="text-gray-500">/ 5.0</span>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">리뷰 개수:</span>
            <span className="font-bold text-hamster-brown">{product.reviewCount}개</span>
          </div>

          {product.reviewCount === 0 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                아직 리뷰가 없습니다 📝
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Stock Sync Info */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">
          🔄 재고 동기화 (Payment Service)
        </h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">동기화 상태:</span>
            <span className="font-medium text-green-600">✅ 정상</span>
          </div>

          {product.lastStockSyncedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">마지막 동기화:</span>
              <span className="font-medium">
                {new Date(product.lastStockSyncedAt).toLocaleString('ko-KR')}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              💡 Payment Service가 ProductStockSynchronized 이벤트를 발행하면 자동으로 재고가
              동기화됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* Related IDs */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">🔗 관련 ID</h4>

        <div className="space-y-2 text-sm font-mono">
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
            <span className="text-gray-500 flex-shrink-0">Ecommerce Product ID:</span>
            <Navigable id={product.publicId} type="ecommerce-product-id" />
          </div>
        </div>
      </section>

      {/* Timestamps */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">⏰ 생성/수정 정보</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">생성일:</span>
            <span className="font-medium">
              {new Date(product.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>

          {product.modifiedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">수정일:</span>
              <span className="font-medium">
                {new Date(product.modifiedAt).toLocaleString('ko-KR')}
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
