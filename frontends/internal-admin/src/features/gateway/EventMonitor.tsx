// 더미 데이터
const dummyEvents = [
  { id: 1, eventType: 'StockReservationRequestedEvent', attemptId: 123, topic: 'stock-reservation-requests', timestamp: '2026-01-30 14:30:01', status: 'sent' },
  { id: 2, eventType: 'PaymentCompletedEvent', attemptId: 123, topic: 'payment-completed', timestamp: '2026-01-30 14:30:05', status: 'sent' },
  { id: 3, eventType: 'StockReservationRequestedEvent', attemptId: 124, topic: 'stock-reservation-requests', timestamp: '2026-01-30 14:25:12', status: 'sent' },
  { id: 4, eventType: 'PaymentFailedEvent', attemptId: 124, topic: 'payment-failed', timestamp: '2026-01-30 14:25:16', status: 'sent' },
]

export function EventMonitor() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-hamster-brown mb-2">
          📡 이벤트 발행 현황
        </h2>
        <p className="text-gray-600">Cash Gateway → Kafka 이벤트 모니터링</p>
      </div>

      {/* Topic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">stock-reservation-requests</p>
          <p className="text-2xl font-bold text-amber-600">
            {dummyEvents.filter(e => e.topic === 'stock-reservation-requests').length}건
          </p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">payment-completed</p>
          <p className="text-2xl font-bold text-green-600">
            {dummyEvents.filter(e => e.topic === 'payment-completed').length}건
          </p>
        </div>
        <div className="bg-red-50 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">payment-failed</p>
          <p className="text-2xl font-bold text-red-600">
            {dummyEvents.filter(e => e.topic === 'payment-failed').length}건
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-hamster-orange">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Event Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Attempt ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Topic
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                발행 시각
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dummyEvents.map((event) => (
              <tr key={event.id} className="hover:bg-orange-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {event.eventType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                  #{event.attemptId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                  {event.topic}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ {event.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {event.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            총 <span className="font-bold text-hamster-orange">{dummyEvents.length}</span>개의 이벤트 발행
          </p>
        </div>
      </div>
    </div>
  )
}
