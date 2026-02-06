import { useState } from 'react'
import { VendorLayout } from '../../components/vendor/VendorLayout'
import { useAlert } from '../../contexts/AlertContext'

const settlements = [
  { month: '2026년 1월', sales: 5420000, commission: 542000, amount: 4878000, status: '정산 예정', date: '2026-02-05 예정' },
  { month: '2025년 12월', sales: 6230000, commission: 623000, amount: 5607000, status: '정산 완료', date: '2026-01-05' },
  { month: '2025년 11월', sales: 4890000, commission: 489000, amount: 4401000, status: '정산 완료', date: '2025-12-05' },
  { month: '2025년 10월', sales: 5120000, commission: 512000, amount: 4608000, status: '정산 완료', date: '2025-11-05' },
]

export function VendorSettlementPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('ALL') // ALL, 2026-01, 2025-12, etc.

  return (
    <VendorLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">
            💰 정산 관리
          </h1>
          <p className="text-gray-600">판매 수익을 확인하고 정산받으세요</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-amber-50 rounded-2xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">이번 달 매출</p>
            <p className="text-3xl font-bold text-amber-600 mb-1">5,420,000원</p>
            <p className="text-xs text-gray-500">수수료 제외 전</p>
          </div>
          <div className="bg-orange-50 rounded-2xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">정산 예정 금액</p>
            <p className="text-3xl font-bold text-orange-600 mb-1">4,878,000원</p>
            <p className="text-xs text-gray-500">2026-02-05 정산</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">누적 정산 금액</p>
            <p className="text-3xl font-bold text-yellow-600 mb-1">14,616,000원</p>
            <p className="text-xs text-gray-500">3개월 합계</p>
          </div>
        </div>

        {/* Settlement Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <p className="font-bold text-blue-900 mb-1">정산 안내</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 정산은 매월 5일에 진행됩니다</li>
                <li>• 플랫폼 수수료 10%가 차감됩니다</li>
                <li>• 정산 계좌는 "스토어 설정" 메뉴에서 변경할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Period Filter */}
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">조회 기간:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">전체</option>
            <option value="2026-01">2026년 1월</option>
            <option value="2025-12">2025년 12월</option>
            <option value="2025-11">2025년 11월</option>
            <option value="2025-10">2025년 10월</option>
          </select>
        </div>

        {/* Settlement History */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-hamster-brown">정산 내역</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산월</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 매출</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수수료 (10%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산 금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">정산일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {settlements.map((settlement, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-hamster-brown">
                      {settlement.month}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {settlement.sales.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      -{settlement.commission.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      {settlement.amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        settlement.status === '정산 완료'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {settlement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {settlement.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settlement Details */}
        <div className="mt-6 bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-bold text-hamster-brown mb-4 flex items-center gap-2">
            <span className="text-xl">📈</span>
            정산 통계
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">평균 월 매출</p>
              <p className="text-2xl font-bold text-hamster-brown">5,415,000원</p>
              <p className="text-xs text-gray-500 mt-1">최근 4개월 기준</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">평균 정산액</p>
              <p className="text-2xl font-bold text-green-600">4,873,500원</p>
              <p className="text-xs text-gray-500 mt-1">수수료 제외 후</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">총 수수료</p>
              <p className="text-2xl font-bold text-red-600">2,166,000원</p>
              <p className="text-xs text-gray-500 mt-1">누적 합계</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">총 정산 횟수</p>
              <p className="text-2xl font-bold text-blue-600">4회</p>
              <p className="text-xs text-gray-500 mt-1">2025년 10월 ~ 2026년 1월</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="flex-1">
              <p className="text-sm text-amber-900">
                <strong>정산 계좌 관리:</strong> 정산 계좌 정보는
                <a href="/vendor/settings" className="text-amber-600 hover:text-amber-700 font-bold mx-1 underline">
                  스토어 설정
                </a>
                메뉴에서 변경하실 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  )
}
