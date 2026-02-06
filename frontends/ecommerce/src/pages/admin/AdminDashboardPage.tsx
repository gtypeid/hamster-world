import { AdminLayout } from '../../components/admin/AdminLayout'
import { useAlert } from '../../contexts/AlertContext'

const platformStats = [
  { label: '총 매출 (이번 달)', value: '42,500,000원', icon: '💰', change: '+15%', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  { label: '활성 판매자', value: '127명', icon: '🏪', change: '+8', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  { label: '전체 상품', value: '3,456개', icon: '📦', change: '+234', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  { label: '가입 회원', value: '12,345명', icon: '👥', change: '+456', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
]

const topVendors = [
  { rank: 1, name: '도토리 장수 함돌이', sales: 5420000, products: 28, orders: 1234 },
  { rank: 2, name: '해바라기 농장 함순이', sales: 4890000, products: 15, orders: 987 },
  { rank: 3, name: '운동기구 함피트', sales: 3120000, products: 12, orders: 456 },
  { rank: 4, name: '햄스터 건축가 함집사', sales: 2850000, products: 22, orders: 678 },
  { rank: 5, name: '침구왕 함슬립', sales: 2430000, products: 8, orders: 2341 },
]

const recentActivities = [
  { type: '판매자', action: '새 판매자 "장난감 공방 함토이" 승인 대기 중', time: '5분 전', icon: '🏪' },
  { type: '상품', action: '부적절한 상품 신고: "프리미엄 도토리 세트"', time: '15분 전', icon: '⚠️' },
  { type: '주문', action: '고액 주문 발생: 1,500,000원', time: '30분 전', icon: '💰' },
  { type: '사용자', action: '신규 회원 가입 32건', time: '1시간 전', icon: '👥' },
]

export function AdminDashboardPage() {
  const { showAlert } = useAlert()

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">
            👑 플랫폼 대시보드
          </h1>
          <p className="text-gray-600">Hamster World 전체 현황을 확인하세요</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {platformStats.map((stat) => (
            <div key={stat.label} className={`${stat.bgColor} rounded-2xl shadow-md p-6`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{stat.icon}</span>
                <span className={`text-sm font-bold ${stat.textColor} bg-white px-3 py-1 rounded-full`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Vendors */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-amber-500 text-white">
              <h2 className="text-xl font-bold">🏆 이번 달 TOP 판매자</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topVendors.map((vendor) => (
                  <div key={vendor.rank} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      vendor.rank === 1 ? 'bg-yellow-500' :
                      vendor.rank === 2 ? 'bg-gray-400' :
                      vendor.rank === 3 ? 'bg-amber-600' :
                      'bg-gray-300'
                    }`}>
                      {vendor.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-hamster-brown">{vendor.name}</p>
                      <div className="flex gap-3 text-xs text-gray-600 mt-1">
                        <span>상품 {vendor.products}개</span>
                        <span>주문 {vendor.orders.toLocaleString()}건</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-hamster-orange">{vendor.sales.toLocaleString()}원</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-hamster-brown">📋 최근 활동</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <span className="text-3xl">{activity.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold bg-hamster-beige text-hamster-brown px-2 py-1 rounded">
                          {activity.type}
                        </span>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                      <p className="text-sm text-gray-700">{activity.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-hamster-brown mb-4">⚡ 빠른 작업</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => showAlert('판매자 승인 페이지로 이동하는 기능은 준비 중입니다')}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-hamster-orange hover:bg-hamster-ivory transition-all text-center"
            >
              <span className="text-3xl block mb-2">✅</span>
              <span className="text-sm font-medium text-gray-700">판매자 승인</span>
            </button>
            <button
              onClick={() => showAlert('상품 검토 페이지로 이동하는 기능은 준비 중입니다')}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-hamster-orange hover:bg-hamster-ivory transition-all text-center"
            >
              <span className="text-3xl block mb-2">🔍</span>
              <span className="text-sm font-medium text-gray-700">상품 검토</span>
            </button>
            <button
              onClick={() => showAlert('통계 보고서 기능은 준비 중입니다')}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-hamster-orange hover:bg-hamster-ivory transition-all text-center"
            >
              <span className="text-3xl block mb-2">📊</span>
              <span className="text-sm font-medium text-gray-700">통계 보고서</span>
            </button>
            <button
              onClick={() => showAlert('공지사항 작성 기능은 준비 중입니다')}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-hamster-orange hover:bg-hamster-ivory transition-all text-center"
            >
              <span className="text-3xl block mb-2">📢</span>
              <span className="text-sm font-medium text-gray-700">공지사항</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
