import { MerchantLayout } from '../../components/merchant/MerchantLayout'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock 통계 데이터
const stats = [
  { label: '오늘 매출', value: '1,250,000원', icon: '💰', change: '+12%', trend: 'up' },
  { label: '오늘 주문', value: '47건', icon: '🛒', change: '+8%', trend: 'up' },
  { label: '방문자', value: '1,234명', icon: '👥', change: '+5%', trend: 'up' },
  { label: '상품 수', value: '28개', icon: '📦', change: '-', trend: 'neutral' },
]

// 최근 7일 매출 데이터
const salesData = [
  { date: '01/23', sales: 850000, orders: 32 },
  { date: '01/24', sales: 920000, orders: 38 },
  { date: '01/25', sales: 1100000, orders: 45 },
  { date: '01/26', sales: 980000, orders: 41 },
  { date: '01/27', sales: 1050000, orders: 43 },
  { date: '01/28', sales: 1200000, orders: 48 },
  { date: '01/29', sales: 1250000, orders: 47 },
]

// 카테고리별 매출
const categoryData = [
  { name: '간식', value: 4500000, percent: 45 },
  { name: '운동기구', value: 3000000, percent: 30 },
  { name: '장난감', value: 1500000, percent: 15 },
  { name: '기타', value: 1000000, percent: 10 },
]

// 시간대별 주문
const hourlyOrderData = [
  { hour: '00-03', orders: 2 },
  { hour: '03-06', orders: 1 },
  { hour: '06-09', orders: 8 },
  { hour: '09-12', orders: 15 },
  { hour: '12-15', orders: 12 },
  { hour: '15-18', orders: 18 },
  { hour: '18-21', orders: 22 },
  { hour: '21-24', orders: 9 },
]

// 최근 주문
const recentOrders = [
  { id: 'ORD-001', product: '프리미엄 도토리 세트', customer: '햄찌사랑', amount: 15000, status: '배송준비', time: '10분 전' },
  { id: 'ORD-002', product: '유기농 해바라기씨', customer: '함스터맘', amount: 12000, status: '결제완료', time: '25분 전' },
  { id: 'ORD-003', product: '프리미엄 도토리 세트', customer: '쪼꼬미', amount: 15000, status: '배송중', time: '1시간 전' },
  { id: 'ORD-004', product: '건강 간식 믹스', customer: '햄순이', amount: 18000, status: '결제완료', time: '2시간 전' },
  { id: 'ORD-005', product: '프리미엄 도토리 세트', customer: '함집사', amount: 15000, status: '배송완료', time: '3시간 전' },
]

// 파이 차트 색상
const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']

export function MerchantDashboardPage() {
  return (
    <MerchantLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">대시보드</h1>
          <p className="text-gray-600">판매자 현황을 한눈에 확인하세요</p>
        </div>

        {/* Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div className="flex-1">
              <p className="text-sm text-blue-900">
                <strong>개발 중:</strong> 현재 Mock 데이터를 표시하고 있습니다.
                백엔드 통계 API 연동 후 실제 데이터로 대체될 예정입니다.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{stat.icon}</span>
                {stat.change !== '-' && (
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    stat.trend === 'up'
                      ? 'text-green-600 bg-green-50'
                      : 'text-red-600 bg-red-50'
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-hamster-brown">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 매출 추이 차트 */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-hamster-brown mb-4">최근 7일 매출 추이</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString() + '원'}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="매출"
                  dot={{ fill: '#F59E0B', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 카테고리별 매출 파이 차트 */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-hamster-brown mb-4">카테고리별 매출 비중</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString() + '원'} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {categoryData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-gray-500">({item.value.toLocaleString()}원)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 시간대별 주문 바 차트 */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-hamster-brown mb-4">시간대별 주문량</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyOrderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => value + '건'}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="orders" fill="#10B981" name="주문 건수" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 주문 건수 추이 */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-hamster-brown mb-4">최근 7일 주문 건수</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => value + '건'}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="주문 건수"
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-hamster-brown">최근 주문</h2>
            <a
              href="/merchant/orders"
              className="text-hamster-orange hover:text-amber-600 text-sm font-medium"
            >
              전체보기 →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문번호</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">구매자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-hamster-brown">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.product}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {order.amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === '배송완료' ? 'bg-gray-100 text-gray-800' :
                        order.status === '배송중' ? 'bg-blue-100 text-blue-800' :
                        order.status === '배송준비' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MerchantLayout>
  )
}
