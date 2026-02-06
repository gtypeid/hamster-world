import { useState } from 'react'
import { VendorLayout } from '../../components/vendor/VendorLayout'
import { useAlert } from '../../contexts/AlertContext'
import { useMerchantOrders, useMerchantOrderDetail } from '../../hooks/useOrders'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type OrderStatus } from '../../types/order'

// 한국 시간 기준 오늘 날짜 (YYYY-MM-DD)
const getTodayString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function VendorOrdersPage() {
  const { showAlert } = useAlert()
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>(undefined)
  const [dateFrom, setDateFrom] = useState<string>(getTodayString())
  const [dateTo, setDateTo] = useState<string>(getTodayString())
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  // 실제 API 호출
  const { data: orders = [], isLoading, error } = useMerchantOrders({
    status: selectedStatus,
    from: dateFrom || undefined,
    to: dateTo || undefined
  })

  // 상태별 카운트
  const statusCounts = {
    ALL: orders.length,
    PAYMENT_APPROVED: orders.filter(o => o.status === 'PAYMENT_APPROVED').length,
    PAYMENT_REQUESTED: orders.filter(o => o.status === 'PAYMENT_REQUESTED').length,
    PAYMENT_FAILED: orders.filter(o => o.status === 'PAYMENT_FAILED').length,
    CANCELED: orders.filter(o => o.status === 'CANCELED').length,
    CREATED: orders.filter(o => o.status === 'CREATED').length
  }

  // 총 매출 (내 상품만)
  const totalRevenue = orders
    .filter(o => o.status === 'PAYMENT_APPROVED')
    .reduce((sum, o) => sum + o.myItemsPrice, 0)

  // 주문 상세 조회 (펼쳐진 주문에 대해서만)
  const { data: orderDetail } = useMerchantOrderDetail(expandedOrderId || undefined)

  // 주문 행 클릭 핸들러
  const handleOrderClick = (orderPublicId: string) => {
    if (expandedOrderId === orderPublicId) {
      setExpandedOrderId(null) // 이미 펼쳐진 주문이면 접기
    } else {
      setExpandedOrderId(orderPublicId) // 새로운 주문 펼치기
    }
  }

  if (isLoading) {
    return (
      <VendorLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <span className="text-7xl animate-bounce block mb-4">🐹</span>
            <p className="text-xl text-gray-600">주문 내역을 불러오는 중...</p>
          </div>
        </div>
      </VendorLayout>
    )
  }

  if (error) {
    return (
      <VendorLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <span className="text-7xl block mb-4">😵</span>
            <p className="text-xl text-red-600 mb-4">주문 목록을 불러오는데 실패했습니다</p>
            <p className="text-gray-600">{error instanceof Error ? error.message : '알 수 없는 오류'}</p>
          </div>
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">주문 관리</h1>
          <p className="text-gray-600">내 상품에 대한 주문 내역을 확인하고 관리하세요</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">전체 주문</p>
            <p className="text-2xl font-bold text-hamster-brown">{statusCounts.ALL}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-4 border border-green-200">
            <p className="text-sm text-gray-600 mb-1">결제 완료</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.PAYMENT_APPROVED}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-sm p-4 border border-yellow-200">
            <p className="text-sm text-gray-600 mb-1">결제 대기</p>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.PAYMENT_REQUESTED}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-4 border border-red-200">
            <p className="text-sm text-gray-600 mb-1">실패/취소</p>
            <p className="text-2xl font-bold text-red-600">
              {statusCounts.PAYMENT_FAILED + statusCounts.CANCELED}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-sm p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">총 매출</p>
            <p className="text-2xl font-bold text-blue-600">
              {totalRevenue.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedStatus(undefined)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === undefined
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 ({statusCounts.ALL})
            </button>
            <button
              onClick={() => setSelectedStatus('PAYMENT_APPROVED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'PAYMENT_APPROVED'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              결제 완료 ({statusCounts.PAYMENT_APPROVED})
            </button>
            <button
              onClick={() => setSelectedStatus('PAYMENT_REQUESTED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'PAYMENT_REQUESTED'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              결제 대기 ({statusCounts.PAYMENT_REQUESTED})
            </button>
            <button
              onClick={() => setSelectedStatus('CREATED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'CREATED'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              주문 생성 ({statusCounts.CREATED})
            </button>
          </div>

          {/* Date Filters */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>
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
            {(selectedStatus || dateFrom || dateTo) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedStatus(undefined)
                    setDateFrom('')
                    setDateTo('')
                  }}
                  className="text-sm text-gray-600 hover:text-amber-600 font-medium"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <span className="text-7xl block mb-4">📦</span>
            <p className="text-xl text-gray-600 mb-2">주문 내역이 없습니다</p>
            <p className="text-sm text-gray-500">
              {selectedStatus ? '해당 상태의 주문이 없습니다' : '아직 주문이 들어오지 않았습니다'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      주문번호
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      구매자
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      내 상품 수량
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      내 상품 금액
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      전체 주문 금액
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      주문일시
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <>
                      <tr
                        key={order.orderPublicId}
                        onClick={() => handleOrderClick(order.orderPublicId)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">
                              {expandedOrderId === order.orderPublicId ? '▼' : '▶'}
                            </span>
                            <div>
                              <p className="font-medium text-hamster-brown">{order.orderNumber}</p>
                              <p className="text-xs text-gray-500">{order.orderPublicId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{order.userPublicId}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{order.myItemCount}개</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-hamster-brown">
                            {order.myItemsPrice.toLocaleString()}원
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {order.orderTotalPrice.toLocaleString()}원
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              ORDER_STATUS_COLORS[order.status]
                            }`}
                          >
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString('ko-KR') : '-'}
                        </td>
                      </tr>

                      {/* 주문 상세 (펼침) */}
                      {expandedOrderId === order.orderPublicId && orderDetail && (
                        <tr key={`${order.orderPublicId}-detail`}>
                          <td colSpan={7} className="px-6 py-6 bg-gray-50">
                            <div className="space-y-4">
                              {/* 주문 상품 목록 */}
                              <div>
                                <h4 className="font-bold text-hamster-brown mb-3">📦 주문 상품 (내 상품만)</h4>
                                <div className="bg-white rounded-lg p-4 space-y-3">
                                  {orderDetail.myItems.map((item) => (
                                    <div key={item.orderItemPublicId} className="flex items-center gap-4 pb-3 border-b border-gray-200 last:border-0">
                                      <div className="w-16 h-16 bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-lg flex items-center justify-center">
                                        {item.productImageUrl ? (
                                          <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-contain rounded-lg" />
                                        ) : (
                                          <span className="text-2xl">📦</span>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.productName}</p>
                                        <p className="text-sm text-gray-600">수량: {item.quantity}개</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-hamster-brown">{item.price.toLocaleString()}원</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 주문 정보 요약 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white rounded-lg p-4">
                                  <h4 className="font-bold text-hamster-brown mb-3">📋 주문 정보</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">주문번호</span>
                                      <span className="font-medium">{orderDetail.orderNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">주문자 ID</span>
                                      <span className="font-medium">{orderDetail.userPublicId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">결제 ID</span>
                                      <span className="font-medium">{orderDetail.gatewayPaymentPublicId || '-'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-4">
                                  <h4 className="font-bold text-hamster-brown mb-3">💰 금액 정보</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">내 상품 금액</span>
                                      <span className="font-bold text-hamster-brown">{orderDetail.myItemsPrice.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">전체 주문 금액</span>
                                      <span className="font-medium">{orderDetail.orderTotalPrice.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                      <span className="text-gray-600">주문 상태</span>
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ORDER_STATUS_COLORS[orderDetail.status]}`}>
                                        {ORDER_STATUS_LABELS[orderDetail.status]}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  )
}
