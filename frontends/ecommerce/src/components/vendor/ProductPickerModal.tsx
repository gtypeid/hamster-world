import { useState, useMemo } from 'react'
import { useProducts } from '../../hooks/useProducts'
import type { Product } from '../../types/ecommerce'

interface ProductPickerModalProps {
  selectedProductIds: string[]
  onSelect: (productIds: string[]) => void
  onClose: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: '🌰 간식',
  FURNITURE: '🏠 집/용품',
  SPORTS: '🎡 운동기구',
  BEDDING: '🛏️ 침구',
  TOYS: '🎾 장난감',
}

export function ProductPickerModal({ selectedProductIds, onSelect, onClose }: ProductPickerModalProps) {
  const { data: products = [], isLoading } = useProducts()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | 'ALL'>('ALL')


  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedProductIds)

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !product.name.toLowerCase().includes(query) &&
          !(product.sku || '').toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // Category filter
      if (categoryFilter !== 'ALL' && product.category !== categoryFilter) {
        return false
      }

      return true
    })
  }, [products, searchQuery, categoryFilter])

  const handleToggleProduct = (productId: string) => {
    if (tempSelectedIds.includes(productId)) {
      setTempSelectedIds(tempSelectedIds.filter((id) => id !== productId))
    } else {
      setTempSelectedIds([...tempSelectedIds, productId])
    }
  }

  const handleConfirm = () => {
    onSelect(tempSelectedIds)
    onClose()
  }

  const isSelected = (productId: string) => tempSelectedIds.includes(productId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-hamster-brown">상품 선택</h2>
              <p className="text-sm text-gray-600 mt-1">
                {tempSelectedIds.length}개 선택됨
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상품 이름 또는 SKU로 검색..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">전체 카테고리</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {filteredProducts.length}개의 상품
          </p>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-sm">로딩 중...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product: any) => {
                const productId = product.id || product.productId
                const selected = isSelected(productId)
                return (
                  <div
                    key={productId}
                    className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                      selected
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleToggleProduct(productId)}
                  >
                    {/* Product Image */}
                    {(product.images?.[0] || product.imageUrl) && (
                      <img
                        src={product.images?.[0] || product.imageUrl}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}

                    {/* Product Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800 ml-2 flex-shrink-0">
                        {CATEGORY_LABELS[product.category] || product.category}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-1 mb-3">
                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">가격:</span>
                        <span className="text-sm font-bold text-hamster-orange">
                          {product.price.toLocaleString()}원
                        </span>
                      </div>

                      {/* Stock */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">재고:</span>
                        <span className="text-sm text-gray-700">{product.stock}개</span>
                      </div>

                      {/* Rating */}
                      {(product.averageRating || product.rating) > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">평점:</span>
                          <span className="text-sm text-gray-700">
                            ⭐ {(product.averageRating || product.rating).toFixed(1)} ({product.reviewCount})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Select Button */}
                    <div
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors text-center ${
                        selected
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {selected ? '선택됨 ✓' : '선택하기'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            <strong>{tempSelectedIds.length}개</strong>의 상품이 선택되었습니다
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
