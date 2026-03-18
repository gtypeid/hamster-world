import { useParams, Link } from 'react-router-dom'
import { useProductDetail, useProducts } from '../hooks/useProducts'
import { ProductInfo } from '../components/product/ProductInfo'
import { ProductTabs } from '../components/product/ProductTabs'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: productDetail, isLoading, error } = useProductDetail(id!)
  const { data: allProducts = [] } = useProducts() // 비슷한 상품용

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-9xl animate-bounce block mb-4">🐹</span>
          <p className="text-xl text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 또는 상품 없음
  if (error || !productDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-9xl block mb-4">😵</span>
          <h1 className="text-3xl font-bold text-hamster-brown mb-4">
            상품을 찾을 수 없습니다
          </h1>
          <Link
            to="/"
            className="inline-block bg-amber-500 text-white px-6 py-3 rounded-full font-bold hover:bg-amber-600 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // 비슷한 상품 (같은 카테고리)
  const relatedProducts = allProducts
    .filter(p => p.category === productDetail.category && p.id !== productDetail.publicId)
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-hamster-orange">홈</Link>
          <span>›</span>
          <span className="hover:text-hamster-orange cursor-pointer">{productDetail.category}</span>
          <span>›</span>
          <span className="text-hamster-brown font-medium">{productDetail.name}</span>
        </div>
      </div>

      {/* Product Main Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image Gallery */}
          <div>
            {productDetail.imageUrl ? (
              <div className="bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-2xl p-8 flex items-center justify-center h-96">
                <img
                  src={productDetail.imageUrl}
                  alt={productDetail.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-2xl p-8 flex items-center justify-center h-96">
                <span className="text-9xl">📦</span>
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            <ProductInfo productDetail={productDetail} />
          </div>
        </div>

        {/* Product Details & Reviews */}
        <ProductTabs productDetail={productDetail} />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-gray-50 py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-hamster-brown mb-6">
              🌟 비슷한 상품
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/products/${relatedProduct.id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-4 group"
                >
                  <div className="bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-lg h-32 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <span className="text-5xl">{relatedProduct.images[0]}</span>
                  </div>
                  <h3 className="font-bold text-sm text-hamster-brown mb-1 line-clamp-2">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-lg font-bold text-hamster-orange">
                    {relatedProduct.price.toLocaleString()}원
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
