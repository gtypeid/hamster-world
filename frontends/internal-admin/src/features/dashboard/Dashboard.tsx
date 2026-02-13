export function Dashboard() {
  const stats = [
    { label: '오늘의 결제 요청', value: '47건', icon: '🎡', change: '+12%', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
    { label: '처리 성공률', value: '95.2%', icon: '✅', change: '+2.3%', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { label: '재고 부족 상품', value: '3개', icon: '⚠️', change: '-1', bgColor: 'bg-red-50', textColor: 'text-red-600' },
    { label: '오늘의 정산금', value: '1,250,000원', icon: '💰', change: '+15%', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  ]

  const recentActivities = [
    { type: 'Gateway', action: 'PaymentAttempt #123 - PG 승인 완료', time: '5분 전', icon: '✅' },
    { type: 'Payment', action: '재고 복구: PROD-001 (+5개)', time: '10분 전', icon: '📦' },
    { type: 'Gateway', action: 'PaymentAttempt #124 - PG 실패', time: '15분 전', icon: '❌' },
    { type: 'Payment', action: '정산금 증가: +15,000원', time: '20분 전', icon: '💰' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-hamster-brown mb-2">
          📊 통합 대시보드
        </h2>
        <p className="text-gray-600">Cash Gateway + Payment Service 전체 현황</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
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
        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-hamster-brown">🔧 서비스 상태</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <div>
                    <p className="font-bold text-gray-900">Cash Gateway</p>
                    <p className="text-xs text-gray-500">{import.meta.env.VITE_GATEWAY_API_URL}</p>
                  </div>
                </div>
                <span className="text-green-600 text-sm font-medium">정상</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <div>
                    <p className="font-bold text-gray-900">Payment Service</p>
                    <p className="text-xs text-gray-500">{import.meta.env.VITE_PAYMENT_API_URL}</p>
                  </div>
                </div>
                <span className="text-green-600 text-sm font-medium">정상</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <div>
                    <p className="font-bold text-gray-900">Kafka</p>
                    <p className="text-xs text-gray-500">Kafka Broker</p>
                  </div>
                </div>
                <span className="text-green-600 text-sm font-medium">정상</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-hamster-brown">📋 최근 활동</h3>
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
    </div>
  )
}
