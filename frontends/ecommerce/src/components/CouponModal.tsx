import { useMyAvailableCoupons } from '../hooks/useCoupon'
import type { UserCouponDto } from '../types/coupon'

interface CouponModalProps {
  isOpen: boolean
  onClose: () => void
  totalPrice: number
  onSelectCoupon: (coupon: UserCouponDto, discountAmount: number) => void
}

/**
 * 쿠폰 선택 모달
 *
 * 사용 가능한 쿠폰 목록을 보여주고, 선택한 쿠폰을 부모 컴포넌트로 전달
 */
export function CouponModal({ isOpen, onClose, totalPrice, onSelectCoupon }: CouponModalProps) {
  const { data: coupons = [], isLoading } = useMyAvailableCoupons()

  if (!isOpen) return null

  const handleSelectCoupon = (coupon: UserCouponDto) => {
    // TODO: 실제로는 couponPolicy 정보가 필요함
    // 현재는 UserCouponDto에 할인 정보가 없어서 임시로 0원 처리
    // 백엔드에 UserCouponDto 응답에 CouponPolicy 정보 포함 요청 필요
    const discountAmount = 0 // 임시값

    onSelectCoupon(coupon, discountAmount)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-hamster-brown">
              🎫 사용 가능한 쿠폰
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              주문 금액: {totalPrice.toLocaleString()}원
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-bounce">🎫</div>
              <p className="text-gray-500">쿠폰을 불러오는 중...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😢</div>
              <p className="text-gray-500 mb-2">사용 가능한 쿠폰이 없습니다</p>
              <p className="text-sm text-gray-400">
                쿠폰 코드를 입력하여 쿠폰을 받아보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <CouponCard
                  key={coupon.publicId}
                  coupon={coupon}
                  totalPrice={totalPrice}
                  onSelect={() => handleSelectCoupon(coupon)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 쿠폰 카드 컴포넌트
 */
function CouponCard({
  coupon,
  totalPrice: _totalPrice,
  onSelect
}: {
  coupon: UserCouponDto
  totalPrice: number
  onSelect: () => void
}) {
  // TODO: CouponPolicy 정보가 필요
  // 현재는 UserCouponDto에 할인 정보가 없어서 표시 제한적

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const isExpiringSoon = () => {
    const expiresAt = new Date(coupon.expiresAt)
    const now = new Date()
    const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200 hover:border-amber-400 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎫</span>
            <h3 className="text-lg font-bold text-gray-900">
              {coupon.couponName || '쿠폰'}
            </h3>
          </div>
          <p className="text-sm text-gray-600 font-mono">
            {coupon.couponCode}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">발급일</span>
          <span className="text-gray-900 font-medium">
            {formatDate(coupon.issuedAt)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">만료일</span>
          <span className={`font-medium ${isExpiringSoon() ? 'text-red-600' : 'text-gray-900'}`}>
            {formatDate(coupon.expiresAt)}
            {isExpiringSoon() && (
              <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                곧 만료
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 할인 금액 표시 - CouponPolicy 정보 필요 */}
      <div className="bg-white rounded-lg p-3 mb-3 text-center">
        <p className="text-sm text-gray-500 mb-1">할인 금액</p>
        <p className="text-xl font-bold text-hamster-orange">
          계산 중...
        </p>
        <p className="text-xs text-gray-400 mt-1">
          ⚠️ 할인 정보는 백엔드 API 수정 필요
        </p>
      </div>

      <button
        onClick={onSelect}
        className="w-full py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
      >
        이 쿠폰 사용하기
      </button>
    </div>
  )
}
