import { useMids } from '../hooks/useMids'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { MidCreateForm } from './MidCreateForm'

export function MidList() {
  const { data: mids, isLoading, error } = useMids()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-hamster-brown mb-2">
          🌰 MID 관리
        </h2>
        <p className="text-gray-600">가맹점 정보를 관리합니다</p>
      </div>

      <MidCreateForm />

      {isLoading && <LoadingSpinner />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">
            😵 데이터를 불러오는데 실패했어요
          </p>
          <p className="text-sm text-red-500 mt-1">
            {error instanceof Error ? error.message : '알 수 없는 오류'}
          </p>
        </div>
      )}

      {!isLoading && !error && mids && mids.length === 0 && (
        <EmptyState
          message="아직 MID가 없어요"
          submessage="위의 버튼을 눌러 첫 MID를 만들어보세요! 🌰"
        />
      )}

      {!isLoading && !error && mids && mids.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-hamster-orange">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  MID ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  가맹점명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Secret Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  생성일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mids.map((mid) => (
                <tr key={mid.id} className="hover:bg-orange-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                    {mid.midId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {mid.merchantName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    <div className="max-w-xs truncate" title={mid.apiKey}>
                      {mid.apiKey}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mid.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {mid.isActive ? '✅ 활성' : '❌ 비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(mid.createdAt).toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              총 <span className="font-bold text-hamster-orange">{mids.length}</span>개의 MID
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
