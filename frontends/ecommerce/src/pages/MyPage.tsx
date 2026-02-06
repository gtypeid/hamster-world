import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAlert } from '../contexts/AlertContext'
import { userService } from '../services/userService'
import { useMyOrders } from '../hooks/useOrders'
import { useCreateMerchant } from '../hooks/useMerchant'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../types/order'
import type { User } from '../types/user'

export function MyPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user: authUser, token, login } = useAuth()
  const { showAlert, showConfirm } = useAlert()
  const createMerchant = useCreateMerchant()
  const [activeTab, setActiveTab] = useState<'orders' | 'info' | 'wishlist' | 'merchant'>('info')
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기 (로컬 타임존 기준)
  const getTodayString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [dateFrom, setDateFrom] = useState<string>(getTodayString())
  const [dateTo, setDateTo] = useState<string>(getTodayString())

  // 판매자 신청 폼 데이터
  const [merchantForm, setMerchantForm] = useState({
    // 사업자 정보
    businessName: '',
    businessNumber: '',
    representativeName: '',
    // 스토어 정보
    storeName: '',
    contactEmail: userData?.email || '',
    contactPhone: '',
    // 정산 정보
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  })

  // 주문 목록 조회 - 'orders' 탭이 활성화될 때만 실행
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useMyOrders(
    {
      from: dateFrom || undefined,
      to: dateTo || undefined
    },
    activeTab === 'orders' // enabled 조건 추가
  )

  // 로그인 안 되어 있으면 홈으로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // 판매자 신청 핸들러
  const handleApplyForMerchant = async () => {
    // 필수 필드 검증
    if (!merchantForm.businessName || !merchantForm.businessNumber || !merchantForm.representativeName) {
      showAlert('사업자 정보를 모두 입력해주세요.')
      return
    }
    if (!merchantForm.storeName || !merchantForm.contactEmail || !merchantForm.contactPhone) {
      showAlert('스토어 정보를 모두 입력해주세요.')
      return
    }
    if (!merchantForm.bankName || !merchantForm.accountNumber || !merchantForm.accountHolder) {
      showAlert('정산 정보를 모두 입력해주세요.')
      return
    }

    const confirmed = await showConfirm(
      '판매자 신청을 진행하시겠습니까?\n\n입력하신 정보로 판매자 계정이 생성됩니다.'
    )

    if (!confirmed) return

    try {
      await createMerchant.mutateAsync(merchantForm)
      showAlert('판매자 신청이 완료되었습니다! 🎉\n\n판매자 센터를 이용할 수 있습니다.')

      // 회원정보 탭으로 이동
      setActiveTab('info')

      // 사용자 데이터 다시 불러오기
      if (authUser?.id && token) {
        const user = await userService.getCurrentUser(authUser.id, token)
        setUserData(user)
      }
    } catch (error) {
      console.error('Merchant application failed:', error)
      showAlert('판매자 신청에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // 사용자 데이터 로드
  useEffect(() => {
    async function fetchUserData() {
      if (!authUser?.id || !token) {
        setError('사용자 정보를 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const user = await userService.getCurrentUser(authUser.id, token)
        setUserData(user)
      } catch (err) {
        console.error('Failed to fetch user data:', err)
        setError('사용자 정보를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [authUser?.id, token])

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-7xl animate-bounce block mb-4">🐹</span>
          <p className="text-xl text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러
  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-7xl block mb-4">⚠️</span>
          <p className="text-xl text-red-600 mb-4">{error || '사용자 정보를 불러올 수 없습니다.'}</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-5xl">👤</span>
            <div>
              <h1 className="text-3xl font-bold text-amber-900">
                {userData.name}님의 마이페이지
              </h1>
              <p className="text-gray-600">{userData.email}</p>
              <p className="text-sm text-gray-500">가입일: {new Date(userData.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-4 font-bold transition-colors ${
                activeTab === 'info'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-500 hover:text-amber-500'
              }`}
            >
              회원 정보
            </button>
            {/* 주문 내역 - USER 역할일 때만 표시 */}
            {userData.role === 'USER' && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-4 font-bold transition-colors ${
                  activeTab === 'orders'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-500 hover:text-amber-500'
                }`}
              >
                주문 내역
              </button>
            )}
            {/* 찜한 상품 - USER 역할일 때만 표시 */}
            {userData.role === 'USER' && (
              <button
                onClick={() => setActiveTab('wishlist')}
                className={`flex-1 py-4 font-bold transition-colors ${
                  activeTab === 'wishlist'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-500 hover:text-amber-500'
                }`}
              >
                찜한 상품
              </button>
            )}
            {/* 판매자 신청 탭 - USER 역할일 때만 표시 */}
            {userData.role === 'USER' && (
              <button
                onClick={() => setActiveTab('merchant')}
                className={`flex-1 py-4 font-bold transition-colors ${
                  activeTab === 'merchant'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-500 hover:text-amber-500'
                }`}
              >
                판매자 신청
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-amber-900 mb-4">주문 내역</h2>

              {/* Filters */}
              <div className="bg-white rounded-2xl shadow-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date From Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Date To Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(dateFrom !== getTodayString() || dateTo !== getTodayString()) && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setDateFrom(getTodayString())
                        setDateTo(getTodayString())
                      }}
                      className="text-sm text-gray-600 hover:text-amber-600 font-medium"
                    >
                      필터 초기화
                    </button>
                  </div>
                )}
              </div>
            </div>

            {ordersLoading ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <span className="text-7xl animate-bounce block mb-4">🐹</span>
                <p className="text-xl text-gray-600">주문 내역을 불러오는 중...</p>
              </div>
            ) : ordersError ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <span className="text-7xl block mb-4">😵</span>
                <p className="text-xl text-red-600 mb-4">주문 내역을 불러오는데 실패했습니다</p>
                <p className="text-gray-600">{ordersError instanceof Error ? ordersError.message : '알 수 없는 오류'}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <span className="text-7xl block mb-4">📦</span>
                <p className="text-xl text-gray-600 mb-4">주문 내역이 없습니다</p>
                <Link
                  to="/"
                  className="inline-block bg-amber-500 text-white px-6 py-3 rounded-full font-bold hover:bg-amber-600 transition-colors"
                >
                  쇼핑하러 가기
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.orderPublicId} className="bg-white rounded-2xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </p>
                      <p className="font-bold text-lg">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{order.orderPublicId}</p>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">총 {order.itemCount}개 상품</p>
                    {order.gatewayPaymentPublicId && (
                      <p className="text-xs text-gray-400">결제 ID: {order.gatewayPaymentPublicId}</p>
                    )}
                  </div>

                  <div className="border-t pt-4 flex justify-between items-center">
                    <span className="text-lg font-bold">총 결제 금액</span>
                    <span className="text-2xl font-bold text-amber-600">
                      {order.totalPrice.toLocaleString()}원
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/orders/${order.orderPublicId}`)}
                      className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      주문 상세
                    </button>
                    {order.status === 'PAYMENT_APPROVED' && (
                      <button
                        onClick={() => showAlert('주문 취소 기능은 준비 중입니다')}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        주문 취소
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-900 mb-4">회원 정보</h2>

            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
              <div className="border-b pb-4">
                <label className="text-sm text-gray-500 block mb-1">이름</label>
                <p className="font-medium">{userData.name}</p>
              </div>

              <div className="border-b pb-4">
                <label className="text-sm text-gray-500 block mb-1">사용자명</label>
                <p className="font-medium">{userData.username}</p>
              </div>

              <div className="border-b pb-4">
                <label className="text-sm text-gray-500 block mb-1">이메일</label>
                <p className="font-medium">{userData.email}</p>
              </div>

              <div className="border-b pb-4">
                <label className="text-sm text-gray-500 block mb-1">권한</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  userData.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                  userData.role === 'MERCHANT' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {userData.role}
                </span>
              </div>

              <div className="border-b pb-4">
                <label className="text-sm text-gray-500 block mb-1">Public ID</label>
                <p className="font-medium text-xs break-all">{userData.publicId}</p>
              </div>

              <div className="pt-4">
                <label className="text-sm text-gray-500 block mb-1">가입일</label>
                <p className="font-medium">{new Date(userData.createdAt).toLocaleString('ko-KR')}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-900 mb-4">찜한 상품</h2>

            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <span className="text-7xl block mb-4">❤️</span>
              <p className="text-xl text-gray-600 mb-4">찜한 상품이 없습니다</p>
              <Link
                to="/"
                className="inline-block bg-amber-500 text-white px-6 py-3 rounded-full font-bold hover:bg-amber-600 transition-colors"
              >
                상품 둘러보기
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'merchant' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-900 mb-4">판매자 신청</h2>

            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="text-center mb-8">
                <span className="text-7xl block mb-4">🏪</span>
                <h3 className="text-2xl font-bold text-amber-900 mb-2">
                  햄스터 나라 마켓 판매자가 되어보세요!
                </h3>
                <p className="text-gray-600">
                  사업자 정보를 입력하고 판매자로 등록하세요
                </p>
              </div>

              {/* 사업자 정보 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-4">📋 사업자 정보</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상호명 *</label>
                    <input
                      type="text"
                      value={merchantForm.businessName}
                      onChange={(e) => setMerchantForm({ ...merchantForm, businessName: e.target.value })}
                      placeholder="예: 햄스터 상회"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">사업자등록번호 *</label>
                    <input
                      type="text"
                      value={merchantForm.businessNumber}
                      onChange={(e) => setMerchantForm({ ...merchantForm, businessNumber: e.target.value })}
                      placeholder="예: 123-45-67890"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">대표자명 *</label>
                    <input
                      type="text"
                      value={merchantForm.representativeName}
                      onChange={(e) => setMerchantForm({ ...merchantForm, representativeName: e.target.value })}
                      placeholder="예: 홍길동"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 스토어 정보 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-4">🏪 스토어 정보</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">스토어명 *</label>
                    <input
                      type="text"
                      value={merchantForm.storeName}
                      onChange={(e) => setMerchantForm({ ...merchantForm, storeName: e.target.value })}
                      placeholder="예: 햄스터 용품 전문점"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">연락처 이메일 *</label>
                    <input
                      type="email"
                      value={merchantForm.contactEmail}
                      onChange={(e) => setMerchantForm({ ...merchantForm, contactEmail: e.target.value })}
                      placeholder="예: store@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">연락처 전화번호 *</label>
                    <input
                      type="tel"
                      value={merchantForm.contactPhone}
                      onChange={(e) => setMerchantForm({ ...merchantForm, contactPhone: e.target.value })}
                      placeholder="예: 010-1234-5678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 정산 정보 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-4">💰 정산 정보</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">은행명 *</label>
                    <input
                      type="text"
                      value={merchantForm.bankName}
                      onChange={(e) => setMerchantForm({ ...merchantForm, bankName: e.target.value })}
                      placeholder="예: 국민은행"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">계좌번호 *</label>
                    <input
                      type="text"
                      value={merchantForm.accountNumber}
                      onChange={(e) => setMerchantForm({ ...merchantForm, accountNumber: e.target.value })}
                      placeholder="예: 123456-78-901234"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">예금주 *</label>
                    <input
                      type="text"
                      value={merchantForm.accountHolder}
                      onChange={(e) => setMerchantForm({ ...merchantForm, accountHolder: e.target.value })}
                      placeholder="예: 홍길동"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  * 표시된 항목은 필수 입력 항목입니다. 플랫폼 수수료율은 3.5%이며, 정산 주기는 주간 단위입니다.
                </p>
              </div>

              <button
                onClick={handleApplyForMerchant}
                disabled={createMerchant.isPending}
                className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold hover:bg-amber-600 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMerchant.isPending ? '신청 중...' : '판매자 신청하기'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
