import { useParams, useNavigate, Link } from 'react-router-dom'
import { useOrderDetail, useCancelOrder } from '../hooks/useOrders'
import { useAlert } from '../contexts/AlertContext'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../types/order'

export function OrderDetailPage() {
  const { orderPublicId } = useParams<{ orderPublicId: string }>()
  const navigate = useNavigate()
  const { showAlert, showConfirm } = useAlert()
  const { data: orderDetail, isLoading, error } = useOrderDetail(orderPublicId)
  const cancelOrder = useCancelOrder()

  const handleCancelOrder = async () => {
    if (!orderPublicId) return

    if (await showConfirm('주문을 취소하시겠습니까?')) {
      try {
        await cancelOrder.mutateAsync(orderPublicId)
        showAlert('주문이 취소되었습니다')
      } catch (error) {
        showAlert(error instanceof Error ? error.message : '주문 취소에 실패했습니다')
      }
    }
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-7xl animate-bounce block mb-4">🐹</span>
          <p className="text-xl text-gray-600">주문 상세를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !orderDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-7xl block mb-4">⚠️</span>
          <p className="text-xl text-red-600 mb-4">
            {error instanceof Error ? error.message : '주문 정보를 불러올 수 없습니다'}
          </p>
          <button
            onClick={() => navigate('/mypage')}
            className="inline-block bg-amber-500 text-white px-6 py-3 rounded-full font-bold hover:bg-amber-600 transition-colors"
          >
            마이페이지로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const totalPrice = orderDetail.items.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/mypage')}
            className="text-amber-600 hover:text-amber-700 mb-4 flex items-center gap-2"
          >
            ← 마이페이지로 돌아가기
          </button>
          <h1 className="text-3xl font-bold text-amber-900 mb-2">주문 상세</h1>
          <p className="text-gray-600">주문번호: {orderDetail.orderNumber}</p>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-amber-900 mb-2">주문 정보</h2>
              <p className="text-sm text-gray-500">
                주문일시: {orderDetail.createdAt ? new Date(orderDetail.createdAt).toLocaleString('ko-KR') : '-'}
              </p>
              <p className="text-xs text-gray-400 mt-1">주문 ID: {orderDetail.orderPublicId}</p>
            </div>
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${ORDER_STATUS_COLORS[orderDetail.status]}`}>
              {ORDER_STATUS_LABELS[orderDetail.status]}
            </span>
          </div>

          {orderDetail.gatewayPaymentPublicId && (
            <div className="border-t pt-4 mb-4">
              <p className="text-sm text-gray-600">결제 ID</p>
              <p className="text-xs text-gray-400 break-all">{orderDetail.gatewayPaymentPublicId}</p>
            </div>
          )}

          {orderDetail.status === 'PAYMENT_APPROVED' && (
            <div className="border-t pt-4">
              <button
                onClick={handleCancelOrder}
                disabled={cancelOrder.isPending}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {cancelOrder.isPending ? '취소 처리 중...' : '주문 취소'}
              </button>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">주문 상품</h2>

          <div className="space-y-4">
            {orderDetail.items.map((item) => (
              <div key={item.orderItemPublicId} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                {/* Product Image */}
                <Link
                  to={`/products/${item.productPublicId}`}
                  className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl w-24 h-24 flex items-center justify-center flex-shrink-0"
                >
                  {item.productImageUrl ? (
                    <img src={item.productImageUrl} alt={item.productName} className="w-16 h-16 object-cover" />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </Link>

                {/* Product Info */}
                <div className="flex-1">
                  <Link
                    to={`/products/${item.productPublicId}`}
                    className="font-bold text-lg text-amber-900 hover:text-amber-700"
                  >
                    {item.productName}
                  </Link>
                  <p className="text-sm text-gray-500 mb-2">수량: {item.quantity}개</p>
                  <p className="text-xl font-bold text-amber-600">{item.price.toLocaleString()}원</p>
                  <p className="text-xs text-gray-400 mt-1">상품 ID: {item.productPublicId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">결제 정보</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>상품 금액</span>
              <span>{totalPrice.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>배송비</span>
              <span className="text-green-600 font-medium">무료</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
              <span>총 결제 금액</span>
              <span className="text-amber-600">{orderDetail.totalPrice.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
