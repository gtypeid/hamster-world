import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { VendorLayout } from '../../components/vendor/VendorLayout'
import { useAlert } from '../../contexts/AlertContext'
import { useProductDetail } from '../../hooks/useProducts'
import { useBoards, useBoard } from '../../hooks/useBoards'
import { useCreateComment } from '../../hooks/useComments'
import { vendorProductApi } from '../../api/vendorProductApi'

type Tab = 'inquiries' | 'reviews' | 'info'

export function VendorProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showAlert, showConfirm } = useAlert()
  const [activeTab, setActiveTab] = useState<Tab>('inquiries')
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockAmount, setStockAmount] = useState('')
  const [stockReason, setStockReason] = useState('추가 입고')
  const [formData, setFormData] = useState({
    name: '',
    category: 'FOOD',
    price: '',
    imageUrl: '',
    description: ''
  })

  // Fetch product detail
  const { data: productDetail, isLoading: productLoading } = useProductDetail(id || '')

  // Fetch reviews
  const { data: reviewsData } = useBoards({
    productPublicId: id || '',
    category: 'REVIEW',
    sort: 'DESC'
  })

  // Fetch inquiries
  const { data: inquiriesData } = useBoards({
    productPublicId: id || '',
    category: 'INQUIRY',
    sort: 'DESC'
  })

  // Fetch expanded item detail (with comments)
  const { data: itemDetail } = useBoard(expandedItemId || undefined)

  const createCommentMutation = useCreateComment()

  const reviews = reviewsData || []
  const inquiries = inquiriesData || []

  const handleCommentSubmit = async (boardPublicId: string) => {
    if (!commentText.trim()) {
      showAlert('답변 내용을 입력해주세요.')
      return
    }

    try {
      await createCommentMutation.mutateAsync({
        boardPublicId,
        data: { content: commentText }
      })
      setCommentText('')
      setReplyingToId(null)
      showAlert('답변이 등록되었습니다! 💬')
    } catch (error) {
      showAlert('답변 등록에 실패했습니다')
      console.error('Failed to create comment:', error)
    }
  }

  const handleOpenEditModal = () => {
    if (!productDetail) return

    setFormData({
      name: productDetail.name,
      category: productDetail.category,
      price: productDetail.price.toString(),
      imageUrl: productDetail.imageUrl || '',
      description: productDetail.description || ''
    })
    setShowEditModal(true)
  }

  const handleSaveProduct = async () => {
    if (!id || !formData.name || !formData.price) {
      showAlert('상품명과 가격은 필수 입력 항목입니다.')
      return
    }

    try {
      await vendorProductApi.updateProduct(id, {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        category: formData.category,
        price: Number(formData.price)
      })

      showAlert('상품이 수정되었습니다.')
      setShowEditModal(false)
      window.location.reload() // 상품 정보 다시 불러오기
    } catch (error) {
      showAlert('상품 수정에 실패했습니다.')
      console.error('Failed to update product:', error)
    }
  }

  const handleStockAdjust = async () => {
    if (!id || !stockAmount) {
      showAlert('조정 수량을 입력해주세요.')
      return
    }

    const stock = Number(stockAmount)
    if (isNaN(stock) || stock === 0) {
      showAlert('올바른 수량을 입력해주세요.')
      return
    }

    try {
      await vendorProductApi.adjustStock(id, {
        stock,
        reason: stockReason
      })

      showAlert('재고 조정 요청이 완료되었습니다.')
      setShowStockModal(false)
      setStockAmount('')
      setStockReason('추가 입고')
      window.location.reload() // 재고 정보 다시 불러오기
    } catch (error) {
      showAlert('재고 조정 요청에 실패했습니다.')
      console.error('Failed to adjust stock:', error)
    }
  }

  const handleDelete = async () => {
    if (!productDetail) return

    if (await showConfirm(`"${productDetail.name}" 상품을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      showAlert('상품 삭제 기능은 준비 중입니다.')
      // TODO: Implement delete product API
    }
  }

  if (productLoading) {
    return (
      <VendorLayout>
        <div className="p-8 text-center">
          <span className="text-6xl block mb-4 animate-bounce">🐹</span>
          <p className="text-gray-600">상품 정보를 불러오는 중...</p>
        </div>
      </VendorLayout>
    )
  }

  if (!productDetail) {
    return (
      <VendorLayout>
        <div className="p-8 text-center">
          <span className="text-6xl block mb-4">📦</span>
          <p className="text-gray-600">상품을 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/merchant/products')}
            className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </VendorLayout>
    )
  }

  const tabs = [
    { id: 'inquiries' as Tab, label: '문의 관리', icon: '💬', count: inquiries.length },
    { id: 'reviews' as Tab, label: '리뷰 관리', icon: '⭐', count: reviews.length },
    { id: 'info' as Tab, label: '상품 정보', icon: '📝' },
  ]

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0)
    return (sum / reviews.length).toFixed(1)
  }

  return (
    <VendorLayout>
      <div className="p-8">
        {/* Product Header */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-start gap-6">
            {productDetail.imageUrl ? (
              <div className="w-32 h-32 bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-xl flex items-center justify-center flex-shrink-0">
                <img
                  src={productDetail.imageUrl}
                  alt={productDetail.name}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-7xl">📦</span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-hamster-brown mb-2">{productDetail.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="text-2xl font-bold text-amber-600">{productDetail.price.toLocaleString()}원</span>
                <span>|</span>
                <span>재고 <strong>{productDetail.stock}</strong>개</span>
                <span>|</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  !productDetail.isSoldOut ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {!productDetail.isSoldOut ? '판매중' : '품절'}
                </span>
                <span>|</span>
                <span>평점 ⭐ {calculateAverageRating()}</span>
              </div>
              <p className="text-gray-700 mb-4">{productDetail.description || '상품 설명이 없습니다.'}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/merchant/products')}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  목록으로
                </button>
                <button
                  onClick={handleOpenEditModal}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                >
                  수정
                </button>
                <button
                  onClick={() => setShowStockModal(true)}
                  className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
                >
                  재고 조정
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-2xl shadow-md">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'border-b-2 border-amber-500 text-amber-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-2xl shadow-md p-6">
          {/* 문의 관리 탭 */}
          {activeTab === 'inquiries' && (
            <div>
              <h2 className="text-2xl font-bold text-hamster-brown mb-6">💬 문의 관리</h2>

              {inquiries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-6xl block mb-4">💬</span>
                  <p>아직 문의가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inquiry) => (
                    <div key={inquiry.publicId} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💬</span>
                          <div>
                            <span className="font-bold text-hamster-brown">{inquiry.authorName}</span>
                            <span className="text-sm text-gray-500 ml-3">
                              {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                        {inquiry.commentCount !== undefined && inquiry.commentCount > 0 && (
                          <span className="text-sm text-blue-600 font-medium">
                            답변 완료 ({inquiry.commentCount}개)
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-hamster-brown mb-2">{inquiry.title}</h4>
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-700">{inquiry.content}</p>
                      </div>

                      {/* 댓글 보기 버튼 */}
                      {inquiry.commentCount !== undefined && inquiry.commentCount > 0 && (
                        <button
                          onClick={() => setExpandedItemId(expandedItemId === inquiry.publicId ? null : inquiry.publicId)}
                          className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
                        >
                          <span>답변 보기 ({inquiry.commentCount}개)</span>
                          <span>{expandedItemId === inquiry.publicId ? '▲' : '▼'}</span>
                        </button>
                      )}

                      {/* 댓글 목록 */}
                      {expandedItemId === inquiry.publicId && itemDetail && (
                        <div className="mb-4 space-y-2">
                          {itemDetail.comments.map((comment) => (
                            <div key={comment.publicId} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-blue-900">{comment.authorName}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                                </p>
                              </div>
                              <p className="text-gray-700">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 답변 작성 폼 */}
                      {replyingToId === inquiry.publicId ? (
                        <div>
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="문의에 답변을 작성하세요..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCommentSubmit(inquiry.publicId)}
                              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                            >
                              답변 등록
                            </button>
                            <button
                              onClick={() => {
                                setReplyingToId(null)
                                setCommentText('')
                              }}
                              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingToId(inquiry.publicId)}
                          className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                        >
                          답변 작성
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 리뷰 관리 탭 */}
          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-bold text-hamster-brown mb-6">⭐ 리뷰 관리</h2>

              {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-6xl block mb-4">⭐</span>
                  <p>아직 리뷰가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.publicId} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-hamster-brown">{review.authorName}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-xl ${star <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>

                      <h4 className="font-bold text-hamster-brown mb-2">{review.title}</h4>
                      <p className="text-gray-700">{review.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 상품 정보 탭 */}
          {activeTab === 'info' && (
            <div>
              <h2 className="text-2xl font-bold text-hamster-brown mb-6">📝 상품 정보</h2>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">기본 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">SKU</p>
                      <p className="font-medium">{productDetail.sku}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">카테고리</p>
                      <p className="font-medium">{productDetail.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">판매 가격</p>
                      <p className="font-medium">{productDetail.price.toLocaleString()}원</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">재고 수량</p>
                      <p className="font-medium">{productDetail.stock}개</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">평균 평점</p>
                      <p className="font-medium">⭐ {calculateAverageRating()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">리뷰 수</p>
                      <p className="font-medium">{reviews.length}개</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">상품 설명</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {productDetail.description || '상품 설명이 없습니다.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Product Modal */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-hamster-brown">
                  ✏️ 상품 수정
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* 상품명 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    상품명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 프리미엄 도토리 세트"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 카테고리 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      카테고리 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="FOOD">간식</option>
                      <option value="SPORTS">운동기구</option>
                      <option value="FURNITURE">가구</option>
                      <option value="TOYS">장난감</option>
                      <option value="OTHER">기타</option>
                    </select>
                  </div>

                  {/* 가격 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      가격 (원) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="15000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* 이미지 URL */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    이미지 URL (또는 이모지)
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg 또는 🌰"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* 상품 설명 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    상품 설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="상품에 대한 자세한 설명을 입력해주세요"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {showStockModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-hamster-brown">
                    📦 재고 조정
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    현재 재고: <span className="font-bold text-hamster-orange">{productDetail.stock}개</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowStockModal(false)
                    setStockAmount('')
                    setStockReason('추가 입고')
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 조정 수량 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      조정 수량 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={stockAmount}
                      onChange={(e) => setStockAmount(e.target.value)}
                      placeholder="예: 50 (증가) 또는 -10 (감소)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      양수: 재고 증가 | 음수: 재고 감소
                    </p>
                  </div>

                  {/* 조정 사유 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      조정 사유 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={stockReason}
                      onChange={(e) => setStockReason(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="추가 입고">추가 입고</option>
                      <option value="재고 정정">재고 정정</option>
                      <option value="폐기">폐기</option>
                      <option value="반품 입고">반품 입고</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>

                {/* 미리보기 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">조정 후 예상 재고:</span>
                    <span className="text-lg font-bold text-hamster-orange">
                      {stockAmount ? productDetail.stock + Number(stockAmount) : productDetail.stock}개
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowStockModal(false)
                    setStockAmount('')
                    setStockReason('추가 입고')
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleStockAdjust}
                  className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600"
                >
                  조정 요청
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  )
}
