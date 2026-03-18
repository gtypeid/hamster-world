import { useState } from 'react'
import type { ProductDetailResponse } from '../../types/api'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../contexts/AuthContext'
import { useBoards, useCreateBoard, useBoard } from '../../hooks/useBoards'
import { useCreateComment } from '../../hooks/useComments'
import { useMyMerchant } from '../../hooks/useMerchant'
import type { Board } from '../../types/board'
import { requireAuth } from '../../utils/auth'

interface ProductTabsProps {
  productDetail: ProductDetailResponse
}

export function ProductTabs({ productDetail }: ProductTabsProps) {
  const { showAlert } = useAlert()
  const { user } = useAuth()
  // MERCHANT 역할일 때만 머천트 정보 조회
  const { data: myMerchant } = useMyMerchant(user?.role === 'MERCHANT')
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'inquiry'>('details')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' })
  const [newInquiry, setNewInquiry] = useState({ title: '', content: '' })
  const [selectedInquiry, setSelectedInquiry] = useState<Board | null>(null)
  const [newComment, setNewComment] = useState('')
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null)

  // Fetch reviews (REVIEW category)
  const { data: reviewsData } = useBoards({
    productPublicId: productDetail.publicId,
    category: 'REVIEW',
    page: 0,
    size: 50,
    sort: 'DESC'
  })

  // Fetch inquiries (INQUIRY category)
  const { data: inquiriesData } = useBoards({
    productPublicId: productDetail.publicId,
    category: 'INQUIRY',
    page: 0,
    size: 50,
    sort: 'DESC'
  })

  const createBoardMutation = useCreateBoard()
  const createCommentMutation = useCreateComment()

  // 리스트 API는 배열을 직접 반환
  const productReviews = reviewsData || []
  const productInquiries = inquiriesData || []

  // 펼쳐진 문의의 상세 정보 조회 (댓글 포함)
  const { data: inquiryDetail } = useBoard(expandedInquiryId || undefined)

  const handleSubmitReview = async () => {
    if (!newReview.title.trim() || !newReview.content.trim()) {
      showAlert('제목과 내용을 모두 입력해주세요')
      return
    }

    try {
      await createBoardMutation.mutateAsync({
        productPublicId: productDetail.publicId,
        category: 'REVIEW',
        title: newReview.title,
        content: newReview.content,
        rating: newReview.rating
      })
      setNewReview({ rating: 5, title: '', content: '' })
      setShowReviewModal(false)
      showAlert('리뷰가 등록되었습니다! 🎉')
    } catch (error) {
      showAlert('리뷰 등록에 실패했습니다')
      console.error('Failed to create review:', error)
    }
  }

  const handleSubmitInquiry = async () => {
    if (!newInquiry.title.trim() || !newInquiry.content.trim()) {
      showAlert('제목과 내용을 모두 입력해주세요')
      return
    }

    try {
      await createBoardMutation.mutateAsync({
        productPublicId: productDetail.publicId,
        category: 'INQUIRY',
        title: newInquiry.title,
        content: newInquiry.content
      })
      setNewInquiry({ title: '', content: '' })
      setShowInquiryModal(false)
      showAlert('문의가 등록되었습니다! 📝')
    } catch (error) {
      showAlert('문의 등록에 실패했습니다')
      console.error('Failed to create inquiry:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!selectedInquiry || !newComment.trim()) {
      showAlert('댓글 내용을 입력해주세요')
      return
    }

    try {
      await createCommentMutation.mutateAsync({
        boardPublicId: selectedInquiry.publicId,
        data: { content: newComment }
      })
      setNewComment('')
      setSelectedInquiry(null)
      // 댓글 추가 후 펼쳐진 문의를 다시 로드하기 위해 상태 업데이트
      if (expandedInquiryId === selectedInquiry.publicId) {
        setExpandedInquiryId(selectedInquiry.publicId)
      }
      showAlert('댓글이 등록되었습니다! 💬')
    } catch (error) {
      showAlert('댓글 등록에 실패했습니다')
      console.error('Failed to create comment:', error)
    }
  }

  const calculateAverageRating = () => {
    if (productReviews.length === 0) return 0
    const sum = productReviews.reduce((acc, review) => acc + (review.rating || 0), 0)
    return (sum / productReviews.length).toFixed(1)
  }

  return (
    <div className="mt-12">
      {/* Tab Headers */}
      <div className="border-b-2 border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-4 px-2 font-bold text-lg transition-colors relative ${
              activeTab === 'details'
                ? 'text-hamster-orange'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            상품 상세
            {activeTab === 'details' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 px-2 font-bold text-lg transition-colors relative ${
              activeTab === 'reviews'
                ? 'text-hamster-orange'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            리뷰 ({productReviews.length})
            {activeTab === 'reviews' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('inquiry')}
            className={`pb-4 px-2 font-bold text-lg transition-colors relative ${
              activeTab === 'inquiry'
                ? 'text-hamster-orange'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            문의 ({productInquiries.length})
            {activeTab === 'inquiry' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-8">
        {activeTab === 'details' && (
          <div className="prose max-w-none">
            <div
              className="text-gray-700 space-y-4 whitespace-pre-wrap"
            >
              {productDetail.description || '상품 상세 설명이 없습니다.'}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Review Summary */}
            <div className="bg-hamster-ivory rounded-2xl p-6 flex items-center gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-hamster-orange mb-2">
                  {calculateAverageRating()}
                </div>
                <div className="flex items-center gap-0.5 justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-3xl ${star <= Math.round(Number(calculateAverageRating())) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 font-medium">{productReviews.length}개 리뷰</p>
              </div>
              <div className="flex-1">
                <button
                  onClick={() => requireAuth(user, () => setShowReviewModal(true), showAlert)}
                  className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
                >
                  리뷰 작성하기
                </button>
              </div>
            </div>

            {/* Reviews List */}
            {productReviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                아직 리뷰가 없습니다. 첫 리뷰를 작성해주세요!
              </div>
            ) : (
              <div className="space-y-4">
                {productReviews.map((review) => (
                  <div key={review.publicId} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🐹</span>
                        <div>
                          <p className="font-bold text-hamster-brown">{review.authorName}</p>
                          <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString('ko-KR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-2xl ${star <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm font-bold text-gray-700">
                          {review.rating || 0}.0
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-hamster-brown mb-2">{review.title}</h4>
                    <p className="text-gray-700">{review.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inquiry Tab */}
        {activeTab === 'inquiry' && (
          <div className="space-y-6">
            {/* Inquiry Header */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600">상품에 대해 궁금한 점을 문의해보세요</p>
              {/* 판매자(MERCHANT)가 아닐 때만 문의하기 버튼 표시 */}
              {user?.role !== 'MERCHANT' && (
                <button
                  onClick={() => requireAuth(user, () => setShowInquiryModal(true), showAlert)}
                  className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
                >
                  문의하기
                </button>
              )}
            </div>

            {/* Inquiries List */}
            {productInquiries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                아직 문의가 없습니다. 첫 문의를 남겨주세요!
              </div>
            ) : (
              <div className="space-y-4">
                {productInquiries.map((inquiry) => (
                  <div key={inquiry.publicId} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💬</span>
                        <div>
                          <p className="font-bold text-hamster-brown">{inquiry.authorName}</p>
                          <p className="text-sm text-gray-500">{new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* 답변하기 버튼: MERCHANT 역할이고, 본인 상품일 때만 표시 */}
                        {user?.role === 'MERCHANT' &&
                         myMerchant?.merchantPublicId === productDetail.merchant.publicId && (
                          <button
                            onClick={() => setSelectedInquiry(selectedInquiry?.publicId === inquiry.publicId ? null : inquiry)}
                            className="text-sm text-hamster-orange hover:text-hamster-brown transition-colors"
                          >
                            {selectedInquiry?.publicId === inquiry.publicId ? '닫기' : '답변하기'}
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="font-bold text-hamster-brown mb-2">{inquiry.title}</h4>
                    <p className="text-gray-700 mb-4">{inquiry.content}</p>

                    {/* 댓글 개수 및 보기 버튼 */}
                    {inquiry.commentCount !== undefined && inquiry.commentCount > 0 && (
                      <button
                        onClick={() => setExpandedInquiryId(expandedInquiryId === inquiry.publicId ? null : inquiry.publicId)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-hamster-orange transition-colors mb-4"
                      >
                        <span>💬 답변 {inquiry.commentCount}개</span>
                        <span>{expandedInquiryId === inquiry.publicId ? '▲' : '▼'}</span>
                      </button>
                    )}

                    {/* Comment form */}
                    {selectedInquiry?.publicId === inquiry.publicId && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="답변을 작성해주세요"
                          className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-hamster-orange resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => {
                              setSelectedInquiry(null)
                              setNewComment('')
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            취소
                          </button>
                          <button
                            onClick={handleSubmitComment}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                          >
                            등록
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 댓글 목록 (펼쳐진 경우) */}
                    {expandedInquiryId === inquiry.publicId && inquiryDetail && (
                      <div className="mt-4 space-y-3">
                        <div className="border-t border-gray-200 pt-4">
                          <h5 className="font-bold text-gray-700 mb-3">답변 목록</h5>
                          {inquiryDetail.comments.length === 0 ? (
                            <p className="text-sm text-gray-500">아직 답변이 없습니다.</p>
                          ) : (
                            <div className="space-y-3">
                              {inquiryDetail.comments.map((comment) => (
                                <div key={comment.publicId} className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="font-bold text-sm text-gray-700">{comment.authorName}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Write Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-hamster-brown">리뷰 작성</h2>
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setNewReview({ rating: 5, title: '', content: '' })
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                <div className="bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-lg w-16 h-16 flex items-center justify-center">
                  {productDetail.imageUrl ? (
                    <img src={productDetail.imageUrl} alt={productDetail.name} className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-hamster-brown">{productDetail.name}</p>
                  <p className="text-sm text-gray-600">{productDetail.merchant.storeName}</p>
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  별점
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="text-4xl hover:scale-110 transition-transform"
                    >
                      {star <= newReview.rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {newReview.rating}점
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  placeholder="리뷰 제목을 입력해주세요"
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-hamster-orange"
                  maxLength={100}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  리뷰 내용
                </label>
                <textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                  placeholder="상품에 대한 솔직한 리뷰를 남겨주세요"
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-hamster-orange resize-none"
                  rows={5}
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {newReview.content.length} / 500자
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    setNewReview({ rating: 5, title: '', content: '' })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Write Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-hamster-brown">문의하기</h2>
              <button
                onClick={() => {
                  setShowInquiryModal(false)
                  setNewInquiry({ title: '', content: '' })
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                <div className="bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-lg w-16 h-16 flex items-center justify-center">
                  {productDetail.imageUrl ? (
                    <img src={productDetail.imageUrl} alt={productDetail.name} className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-hamster-brown">{productDetail.name}</p>
                  <p className="text-sm text-gray-600">{productDetail.merchant.storeName}</p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={newInquiry.title}
                  onChange={(e) => setNewInquiry({ ...newInquiry, title: e.target.value })}
                  placeholder="문의 제목을 입력해주세요"
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-hamster-orange"
                  maxLength={100}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  문의 내용
                </label>
                <textarea
                  value={newInquiry.content}
                  onChange={(e) => setNewInquiry({ ...newInquiry, content: e.target.value })}
                  placeholder="궁금한 내용을 자세히 적어주세요"
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-hamster-orange resize-none"
                  rows={5}
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {newInquiry.content.length} / 500자
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowInquiryModal(false)
                    setNewInquiry({ title: '', content: '' })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitInquiry}
                  className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
