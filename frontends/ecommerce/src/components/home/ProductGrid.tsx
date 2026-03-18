import { Link } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useAddToCart } from '../../hooks/useCart'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../contexts/AuthContext'
import { requireAuth } from '../../utils/auth'

interface ProductGridProps {
  selectedCategory: string
  searchQuery?: string
}

export function ProductGrid({ selectedCategory, searchQuery }: ProductGridProps) {
  const { showAlert } = useAlert()
  const { user } = useAuth()
  const { data: allProducts = [], isLoading, error } = useProducts()
  const addToCart = useAddToCart()

  // 카테고리 필터링
  let products = selectedCategory === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === selectedCategory)

  // 검색어 필터링
  if (searchQuery) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    requireAuth(
      user,
      () => {
        addToCart.mutate(
          { productId, quantity: 1 },
          {
            onSuccess: () => {
              showAlert('장바구니에 추가되었습니다! 🛒')
            },
          }
        )
      },
      showAlert
    )
  }

  if (isLoading) {
    return (
      <section id="products-section" className="max-w-7xl mx-auto px-4 py-12 bg-gray-50">
        <div className="text-center py-20">
          <span className="text-7xl animate-bounce block mb-4">🐹</span>
          <p className="text-xl text-gray-600">상품을 불러오는 중...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="products-section" className="max-w-7xl mx-auto px-4 py-12 bg-gray-50">
        <div className="text-center py-20">
          <span className="text-7xl block mb-4">😵</span>
          <p className="text-xl text-red-600">상품을 불러오는데 실패했습니다</p>
        </div>
      </section>
    )
  }

  return (
    <section id="products-section" className="max-w-7xl mx-auto px-4 py-12 bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-bold text-hamster-brown">
          {searchQuery
            ? `🔍 "${searchQuery}" 검색 결과`
            : selectedCategory === 'all' ? '⭐ 인기 상품' : `${selectedCategory} 상품`}
        </h3>
        <div className="text-sm text-gray-600">
          총 {products.length}개의 상품
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden group"
          >
            {/* Product Image */}
            <div className="bg-gradient-to-br from-hamster-ivory to-hamster-beige h-48 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-7xl">{product.images[0]}</span>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h4 className="font-bold text-lg text-hamster-brown mb-2 line-clamp-2">
                {product.name}
              </h4>

              {/* 별점 및 리뷰 개수 */}
              {product.reviewCount > 0 ? (
                <div className="flex items-center gap-1 text-sm mb-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`${
                          star <= Math.round(product.averageRating || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-600">
                    ({product.reviewCount.toLocaleString()})
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-400 mb-4">
                  리뷰 없음
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-hamster-orange">
                  {product.price.toLocaleString()}원
                </span>
                <button
                  onClick={(e) => handleAddToCart(e, product.id)}
                  disabled={addToCart.isPending}
                  className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {addToCart.isPending ? '...' : '담기'}
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
