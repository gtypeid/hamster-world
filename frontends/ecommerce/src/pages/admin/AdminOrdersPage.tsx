import { AdminLayout } from '../../components/admin/AdminLayout'

const allOrders = [
  { id: 1, orderNumber: 'ORD-001', product: '프리미엄 도토리 세트', vendor: '도토리 장수 함돌이', customer: '햄찌사랑', amount: 15000, status: '배송준비', date: '2026-01-29 09:15' },
  { id: 2, orderNumber: 'ORD-002', product: '유기농 해바라기씨', vendor: '해바라기 농장 함순이', customer: '함스터맘', amount: 12000, status: '결제완료', date: '2026-01-29 08:30' },
  { id: 3, orderNumber: 'ORD-003', product: '럭셔리 쳇바퀴', vendor: '운동기구 함피트', customer: '쪼꼬미', amount: 35000, status: '배송중', date: '2026-01-28 15:20' },
  { id: 4, orderNumber: 'ORD-004', product: '아늑한 2층 하우스', vendor: '햄스터 건축가 함집사', customer: '햄순이', amount: 28000, status: '결제완료', date: '2026-01-28 10:15' },
  { id: 5, orderNumber: 'ORD-005', product: '프리미엄 목화 침구', vendor: '침구왕 함슬립', customer: '함집사', amount: 8000, status: '배송완료', date: '2026-01-27 14:30' },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case '결제완료': return 'bg-green-100 text-green-800'
    case '배송준비': return 'bg-yellow-100 text-yellow-800'
    case '배송중': return 'bg-blue-100 text-blue-800'
    case '배송완료': return 'bg-gray-100 text-gray-800'
    case '취소': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function AdminOrdersPage() {
  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">
            🛒 전체 주문 모니터링
          </h1>
          <p className="text-gray-600">플랫폼 전체 주문을 확인하세요</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">전체 주문</p>
            <p className="text-2xl font-bold text-hamster-brown">{allOrders.length}건</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">결제완료</p>
            <p className="text-2xl font-bold text-green-600">
              {allOrders.filter(o => o.status === '결제완료').length}건
            </p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">배송준비</p>
            <p className="text-2xl font-bold text-yellow-600">
              {allOrders.filter(o => o.status === '배송준비').length}건
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">배송중</p>
            <p className="text-2xl font-bold text-blue-600">
              {allOrders.filter(o => o.status === '배송중').length}건
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">배송완료</p>
            <p className="text-2xl font-bold text-gray-600">
              {allOrders.filter(o => o.status === '배송완료').length}건
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-hamster-brown text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">주문번호</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">상품명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">판매자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">구매자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">주문일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-hamster-brown">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.product}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.vendor}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {order.amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="mt-6 bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-hamster-brown mb-4">오늘의 요약</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">오늘 주문</p>
              <p className="text-3xl font-bold text-amber-600">47건</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">오늘 매출</p>
              <p className="text-3xl font-bold text-orange-600">1,250,000원</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">평균 주문액</p>
              <p className="text-3xl font-bold text-yellow-600">26,596원</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
