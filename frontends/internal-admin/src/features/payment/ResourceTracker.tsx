import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Navigable } from '@/components/navigation/Navigable'
import { fetchProductList } from '@/api/productService'
import type { Product } from '@/types/payment'

export function ResourceTracker() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<'all' | 'available' | 'soldout'>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const productRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // 데이터 로드
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchProductList()
        setProducts(data)
      } catch (err) {
        console.error('Failed to load products:', err)
        setError('상품 목록을 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  // URL 파라미터에서 searchBy 읽고 해당 아이템 찾아서 스크롤/하이라이트
  useEffect(() => {
    const searchByField = searchParams.get('searchBy')
    const searchValue = searchParams.get('searchValue')

    if (!searchByField || !searchValue || isLoading || products.length === 0) return

    // searchBy 조건에 맞는 Product 찾기
    let targetProduct: Product | undefined
    if (searchByField === 'publicId') {
      targetProduct = products.find((p) => p.publicId === searchValue)
    } else if (searchByField === 'ecommerceProductId') {
      targetProduct = products.find((p) => p.ecommerceProductId === searchValue)
    }

    if (!targetProduct) {
      console.warn(`Product not found: ${searchByField}=${searchValue}`)
      setSearchParams({}) // 파라미터 제거
      return
    }

    setHighlightedId(targetProduct.publicId)

    // 해당 아이템으로 스크롤 (헤더 영역 고려)
    setTimeout(() => {
      const element = productRefs.current[targetProduct.publicId]
      if (element) {
        // 헤더 높이만큼 offset 추가
        const headerOffset = 200 // 헤더 + 통계 카드 영역
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        })
      }
    }, 100)

    // 3초 후 하이라이트 제거 & URL 파라미터 제거
    const timer = setTimeout(() => {
      setHighlightedId(null)
      setSearchParams({}) // 파라미터 제거
    }, 3000)

    return () => clearTimeout(timer)
  }, [searchParams, isLoading, products, setSearchParams])

  // 필터링
  const filteredProducts =
    filter === 'all'
      ? products
      : filter === 'available'
        ? products.filter((p) => !p.isSoldOut)
        : products.filter((p) => p.isSoldOut)

  // 통계
  const stats = {
    total: products.length,
    available: products.filter((p) => !p.isSoldOut).length,
    soldOut: products.filter((p) => p.isSoldOut).length,
    lowStock: products.filter((p) => !p.isSoldOut && p.stock < 10).length,
  }

  const getStockStatusColor = (product: Product) => {
    if (product.isSoldOut) return 'bg-red-100 text-red-800'
    if (product.stock < 10) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStockStatusLabel = (product: Product) => {
    if (product.isSoldOut) return '🔴 품절'
    if (product.stock < 10) return '⚠️ 재고 부족'
    return '✅ 정상'
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-hamster-brown mb-2">📦 자원 관리</h2>
        <p className="text-gray-600">
          상품 자원 현황 및 Event Sourcing 이력 추적 (Public ID 기반)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl shadow-md p-4 border-2 border-blue-200">
          <p className="text-sm text-gray-600 mb-1">전체 자원</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}개</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">판매 가능</p>
          <p className="text-2xl font-bold text-green-600">{stats.available}개</p>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">재고 부족</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}개</p>
        </div>
        <div className="bg-red-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">품절</p>
          <p className="text-2xl font-bold text-red-600">{stats.soldOut}개</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-hamster-orange text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'available'
              ? 'bg-green-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          판매 가능만
        </button>
        <button
          onClick={() => setFilter('soldout')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'soldout'
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          품절만
        </button>
      </div>

      {isLoading && <LoadingSpinner />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {!isLoading && !error && filteredProducts.length === 0 && (
        <EmptyState message="자원이 없어요" submessage="상품이 등록되면 여기에 표시됩니다 📦" />
      )}

      {!isLoading && filteredProducts.length > 0 && (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const isHighlighted = highlightedId === product.publicId
            return (
              <div
                key={product.publicId}
                ref={(el) => (productRefs.current[product.publicId] = el)}
                className={`bg-white rounded-lg shadow-md transition-all duration-500 ${
                  isHighlighted ? 'ring-4 ring-blue-500 ring-offset-2' : ''
                }`}
              >
                {/* Product Card */}
                <div className="p-6 border-2 border-transparent hover:border-hamster-orange rounded-lg transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {/* Status Badge */}
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(product)}`}
                        >
                          {getStockStatusLabel(product)}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">{product.sku}</span>
                      </div>

                      {/* Product Name */}
                      <h3 className="text-lg font-bold text-hamster-brown mb-3">{product.name}</h3>

                      {/* Public IDs - Navigable */}
                      <div className="space-y-2 text-xs mb-3 font-mono">
                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                          <span className="text-gray-500 flex-shrink-0">Payment Product ID:</span>
                          <Navigable id={product.publicId} type="product-id" />
                        </div>
                        {product.ecommerceProductId && (
                          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                            <span className="text-gray-500 flex-shrink-0">Ecommerce Product ID:</span>
                            <Navigable id={product.ecommerceProductId} type="ecommerce-product-id" />
                          </div>
                        )}
                      </div>

                      {/* Stock Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">현재 재고:</span>{' '}
                          <span className="text-2xl font-bold text-hamster-brown">
                            {product.stock}개
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">가격:</span>{' '}
                          <span className="font-bold text-hamster-brown">
                            ₩{product.price.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">카테고리:</span>{' '}
                          <span className="font-medium">{product.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Week ID:</span>{' '}
                          <span className="font-medium">{product.weekId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
