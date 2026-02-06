// 더미 데이터
const dummySettlements = [
  { id: 1, type: '결제승인', attemptId: 123, amount: 15000, balance: 1250000, timestamp: '2026-01-30 14:30:05' },
  { id: 2, type: '결제취소', attemptId: 122, amount: -8000, balance: 1235000, timestamp: '2026-01-30 14:20:12' },
  { id: 3, type: '결제승인', attemptId: 121, amount: 12000, balance: 1243000, timestamp: '2026-01-30 14:10:30' },
  { id: 4, type: '결제승인', attemptId: 120, amount: 35000, balance: 1231000, timestamp: '2026-01-30 13:55:45' },
]

export function SettlementManagement() {
  const currentBalance = 1250000

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-hamster-brown mb-2">
          💰 정산 관리
        </h2>
        <p className="text-gray-600">Payment Service - Settlement 이벤트 소싱</p>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-md p-8 mb-6">
        <p className="text-sm opacity-90 mb-2">현재 정산금</p>
        <p className="text-5xl font-bold mb-1">{currentBalance.toLocaleString()}원</p>
        <p className="text-xs opacity-75">실시간 재집계 (SettlementRecord SUM)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">오늘의 입금</p>
          <p className="text-2xl font-bold text-green-600">
            +{dummySettlements.filter(s => s.amount > 0).reduce((sum, s) => sum + s.amount, 0).toLocaleString()}원
          </p>
        </div>
        <div className="bg-red-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">오늘의 출금</p>
          <p className="text-2xl font-bold text-red-600">
            {dummySettlements.filter(s => s.amount < 0).reduce((sum, s) => sum + s.amount, 0).toLocaleString()}원
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">거래 건수</p>
          <p className="text-2xl font-bold text-blue-600">
            {dummySettlements.length}건
          </p>
        </div>
      </div>

      {/* Settlement Records */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-hamster-brown">정산금 변동 이력 (SettlementRecord)</h3>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-hamster-orange">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Attempt ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                금액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                잔액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                발생 시각
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dummySettlements.map((record) => (
              <tr key={record.id} className="hover:bg-orange-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    record.amount > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                  #{record.attemptId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-bold ${
                    record.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {record.amount > 0 ? '+' : ''}{record.amount.toLocaleString()}원
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.balance.toLocaleString()}원
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            총 <span className="font-bold text-hamster-orange">{dummySettlements.length}</span>건의 정산 기록
          </p>
        </div>
      </div>
    </div>
  )
}
