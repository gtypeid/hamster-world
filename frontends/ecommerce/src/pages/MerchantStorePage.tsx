import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { products } from '../data/products'

type Tab = 'products' | 'reviews' | 'info'

export function MerchantStorePage() {
  const { merchantName } = useParams<{ merchantName: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('products')

  // 해당 판매자의 상품만 필터링
  const merchantProducts = products.filter(p => p.merchant === merchantName)

  // 판매자 정보 (실제로는 API에서 가져와야 함)
  const merchantInfo = {
    name: merchantName || '알 수 없는 판매자',
    rating: 4.8,
    reviewCount: 328,
    productCount: merchantProducts.length,
    soldCount: merchantProducts.reduce((sum, p) => sum + p.soldCount, 0),
    description: '햄스터들을 위한 최고의 상품을 제공하는 믿을 수 있는 판매자입니다. 신선한 도토리부터 튼튼한 쳇바퀴까지, 항상 최상의 품질을 보장합니다.',
    joinDate: '2024년 1월',
  }

  const tabs = [
    { id: 'products' as Tab, label: '판매 상품', icon: '📦' },
    { id: 'reviews' as Tab, label: '리뷰', icon: '⭐' },
    { id: 'info' as Tab, label: '판매자 정보', icon: 'ℹ️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Merchant Header */}
      <div className="bg-gradient-to-r from-hamster-peach via-hamster-beige to-hamster-ivory border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full flex items-center justify-center text-6xl shadow-lg">
              🐹
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-hamster-brown mb-2">{merchantInfo.name}</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-bold">{merchantInfo.rating}</span>
                  <span className="text-gray-600">({merchantInfo.reviewCount}개 리뷰)</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">상품 {merchantInfo.productCount}개</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">판매 {merchantInfo.soldCount.toLocaleString()}건</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600 font-bold'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'products' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-hamster-brown mb-2">판매 상품</h2>
              <p className="text-gray-600">총 {merchantProducts.length}개의 상품</p>
            </div>

            {merchantProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {merchantProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="bg-gradient-to-br from-hamster-ivory to-hamster-beige h-48 flex items-center justify-center">
                      <span className="text-7xl">{product.images[0]}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-hamster-brown mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl font-bold text-amber-600">{product.price.toLocaleString()}원</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span>{product.rating}</span>
                        </div>
                        <span>·</span>
                        <span>판매 {product.soldCount}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <span className="text-6xl block mb-4">📦</span>
                <p className="text-gray-600">아직 등록된 상품이 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-hamster-brown mb-2">판매자 리뷰</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-yellow-500">
                  <span>⭐</span>
                  <span className="text-2xl font-bold text-gray-900">{merchantInfo.rating}</span>
                </div>
                <span className="text-gray-600">({merchantInfo.reviewCount}개 리뷰)</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <span className="text-6xl block mb-4">💬</span>
              <p className="text-gray-600">판매자 리뷰 기능은 준비 중입니다.</p>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-hamster-brown mb-2">판매자 정보</h2>
            </div>

            <div className="space-y-6">
              {/* 소개 */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-hamster-brown mb-4">소개</h3>
                <p className="text-gray-700 leading-relaxed">{merchantInfo.description}</p>
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <span className="text-4xl block mb-2">📦</span>
                  <p className="text-sm text-gray-600 mb-1">판매 상품</p>
                  <p className="text-2xl font-bold text-hamster-brown">{merchantInfo.productCount}개</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <span className="text-4xl block mb-2">🛒</span>
                  <p className="text-sm text-gray-600 mb-1">총 판매량</p>
                  <p className="text-2xl font-bold text-hamster-brown">{merchantInfo.soldCount.toLocaleString()}건</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <span className="text-4xl block mb-2">⭐</span>
                  <p className="text-sm text-gray-600 mb-1">평균 평점</p>
                  <p className="text-2xl font-bold text-hamster-brown">{merchantInfo.rating}</p>
                </div>
              </div>

              {/* 추가 정보 */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-hamster-brown mb-4">기타 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">가입일</span>
                    <span className="font-medium">{merchantInfo.joinDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">사업자 유형</span>
                    <span className="font-medium">개인 판매자</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">배송 지역</span>
                    <span className="font-medium">햄스터 나라 전역</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
