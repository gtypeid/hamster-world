import { useState, useEffect } from 'react'
import type { ViewerProps } from '@/types/navigation'
import type { ResourceDetail } from '@/types/payment'
import { fetchProductDetail } from '@/api/productService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Navigable } from '../Navigable'

/**
 * ProductDetailViewer
 * - Product 상세 정보 표시
 * - Event Sourcing 이력 (ProductRecord) 포함
 * - GenericDataViewer에서 data를 전달받아 사용 (API 호출은 GenericDataViewer가 담당)
 */
export function ProductDetailViewer({ id, data: initialData }: ViewerProps) {
  const [detail, setDetail] = useState<ResourceDetail | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 이미 data가 전달되었으면 API 호출 안함
    if (initialData) {
      setDetail(initialData)
      setIsLoading(false)
      return
    }

    // Fallback: data가 없으면 직접 API 호출 (하위 호환성)
    const loadDetail = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchProductDetail(id)
        setDetail(data)
      } catch (err) {
        console.error('Failed to load product detail:', err)
        setError('상품 상세 정보를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDetail()
  }, [id, initialData])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p className="font-bold mb-2">❌ 오류 발생</p>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-gray-500 mt-2">Product ID: {id}</p>
      </div>
    )
  }

  // detail이 없으면 early return (데이터 로딩 전이거나 에러)
  if (!detail || !detail.product) {
    return (
      <div className="text-center text-gray-500">
        <p className="font-bold mb-2">❌ 상품을 찾을 수 없어요</p>
        <p className="text-sm">Product ID: {id}</p>
      </div>
    )
  }

  const { product, records } = detail

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

  const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-600'
    if (amount < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getAmountLabel = (amount: number) => {
    if (amount > 0) return `+${amount}`
    return `${amount}`
  }

  const getReasonStyle = (reason: string) => {
    if (reason.includes('INITIAL') || reason.includes('REPLENISHMENT')) {
      return 'bg-blue-100 text-blue-800'
    }
    if (reason.includes('RESERVED')) {
      return 'bg-orange-100 text-orange-800'
    }
    if (reason.includes('RESTORED')) {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getReasonIcon = (reason: string) => {
    if (reason.includes('INITIAL') || reason.includes('REPLENISHMENT')) return '📦'
    if (reason.includes('RESERVED')) return '🔒'
    if (reason.includes('RESTORED')) return '♻️'
    return '📝'
  }

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">📦 상품 정보</h4>

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
            <span className="text-gray-500">현재 재고:</span>
            <span className="text-2xl font-bold text-hamster-brown">{product.stock}개</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">가격:</span>
            <span className="font-bold text-hamster-brown">
              ₩{product.price.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">카테고리:</span>
            <span className="font-medium">{product.category}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Week ID:</span>
            <span className="font-medium">{product.weekId}</span>
          </div>

          {product.description && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* Related IDs */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">🔗 관련 ID</h4>

        <div className="space-y-2 text-sm font-mono">
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
            <span className="text-gray-500 flex-shrink-0">Product ID (Payment):</span>
            <Navigable id={product.publicId} type="product-id" />
          </div>

          {product.ecommerceProductId && (
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
              <span className="text-gray-500 flex-shrink-0">Product ID (Ecommerce):</span>
              <Navigable id={product.ecommerceProductId} type="ecommerce-product-id" />
            </div>
          )}
        </div>
      </section>

      {/* Event Sourcing History */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">
          📝 Event Sourcing 이력 ({records.length}건)
        </h4>

        {records.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
            아직 이벤트 이력이 없습니다 📝
          </div>
        ) : (
          <div className="space-y-3">
            {records
              .slice()
              .reverse()
              .map((record, index) => {
                // 잔액 계산: 모든 이전 record의 stockDelta를 누적
                const currentIndex = records.length - 1 - index
                const balance = records
                  .slice(0, currentIndex + 1)
                  .reduce((sum, r) => sum + r.stockDelta, 0)

                return (
                  <div
                    key={record.recordPublicId}
                    className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-hamster-orange transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-hamster-orange text-white flex items-center justify-center font-bold text-sm">
                          #{records.length - index}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getReasonIcon(record.reason)}</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getReasonStyle(record.reason)}`}
                          >
                            {record.reason}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-2">
                          <div>
                            <span className="text-gray-500">변화량:</span>{' '}
                            <span className={`font-bold ${getAmountColor(record.stockDelta)}`}>
                              {getAmountLabel(record.stockDelta)}개
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">이후 잔액:</span>{' '}
                            <span className="font-bold text-hamster-brown">{balance}개</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex justify-between items-center font-mono">
                            <span>Record ID:</span>
                            <span className="text-gray-600">{record.recordPublicId}</span>
                          </div>
                          <div>{new Date(record.createdAt).toLocaleString('ko-KR')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </section>
    </div>
  )
}
