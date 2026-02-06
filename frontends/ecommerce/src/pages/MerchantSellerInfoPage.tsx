import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { merchantApi } from '../api/merchantApi'

/**
 * 판매자 공개 정보 페이지
 *
 * 비로그인 사용자도 접근 가능한 판매자 스토어 정보
 */
export function MerchantSellerInfoPage() {
  const { merchantId } = useParams<{ merchantId: string }>()

  const { data: merchant, isLoading, error } = useQuery({
    queryKey: ['merchant', 'seller', merchantId],
    queryFn: () => merchantApi.getMerchantSellerInfo(merchantId!),
    enabled: !!merchantId
  })

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-9xl animate-bounce block mb-4">🐹</span>
          <p className="text-xl text-gray-600">판매자 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 또는 판매자 없음
  if (error || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-9xl block mb-4">😵</span>
          <h1 className="text-3xl font-bold text-hamster-brown mb-4">
            판매자 정보를 찾을 수 없습니다
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Merchant Header */}
      <div className="bg-gradient-to-r from-hamster-peach via-hamster-beige to-hamster-ivory border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full flex items-center justify-center shadow-lg">
              {merchant.storeImageUrl ? (
                <img
                  src={merchant.storeImageUrl}
                  alt={merchant.storeName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-6xl">🐹</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-hamster-brown mb-2">{merchant.storeName}</h1>
              <p className="text-gray-600">판매자 정보</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 소개 */}
          {merchant.storeDescription && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-hamster-brown mb-4">소개</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{merchant.storeDescription}</p>
            </div>
          )}

          {/* 연락처 & 운영 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-hamster-brown mb-4 flex items-center gap-2">
                <span>📞</span>
                연락처
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">이메일</span>
                  <span className="font-medium">{merchant.contactEmail}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">전화번호</span>
                  <span className="font-medium">{merchant.contactPhone}</span>
                </div>
              </div>
            </div>

            {/* Operating Hours & Business Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-hamster-brown mb-4">기타 정보</h3>
              <div className="space-y-3">
                {merchant.operatingHours && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">운영 시간</span>
                    <span className="font-medium">{merchant.operatingHours}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">상호명</span>
                  <span className="font-medium">{merchant.businessName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">사업자 유형</span>
                  <span className="font-medium">개인 판매자</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
