import { useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { useAlert } from '../../contexts/AlertContext'

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  products: number
  sales: number
  joinDate: string
  status: '승인대기' | '활성' | '정지'
}

const dummyVendors: Vendor[] = [
  { id: '1', name: '도토리 장수 함돌이', email: 'hamdol@example.com', phone: '010-1234-5678', products: 28, sales: 5420000, joinDate: '2025-01-15', status: '활성' },
  { id: '2', name: '해바라기 농장 함순이', email: 'hamsoon@example.com', phone: '010-2345-6789', products: 15, sales: 4890000, joinDate: '2025-02-20', status: '활성' },
  { id: '3', name: '장난감 공방 함토이', email: 'hamtoy@example.com', phone: '010-3456-7890', products: 0, sales: 0, joinDate: '2026-01-29', status: '승인대기' },
  { id: '4', name: '운동기구 함피트', email: 'hamfit@example.com', phone: '010-4567-8901', products: 12, sales: 3120000, joinDate: '2025-03-10', status: '활성' },
  { id: '5', name: '부적절 판매자', email: 'bad@example.com', phone: '010-5678-9012', products: 5, sales: 120000, joinDate: '2025-12-01', status: '정지' },
]

export function AdminVendorsPage() {
  const { showAlert, showConfirm } = useAlert()
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('전체')
  const [vendors, setVendors] = useState<Vendor[]>(dummyVendors)

  const filteredVendors = statusFilter === '전체'
    ? vendors
    : vendors.filter(v => v.status === statusFilter)

  const handleVendorStatusChange = (vendorId: string, newStatus: Vendor['status']) => {
    setVendors(vendors.map(v =>
      v.id === vendorId ? { ...v, status: newStatus } : v
    ))
    if (selectedVendor?.id === vendorId) {
      setSelectedVendor({ ...selectedVendor, status: newStatus })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '승인대기': return 'bg-yellow-100 text-yellow-800'
      case '활성': return 'bg-green-100 text-green-800'
      case '정지': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">
            🏪 판매자 관리
          </h1>
          <p className="text-gray-600">판매자를 승인하고 관리하세요</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">전체 판매자</p>
            <p className="text-2xl font-bold text-hamster-brown">{dummyVendors.length}명</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">활성 판매자</p>
            <p className="text-2xl font-bold text-green-600">{dummyVendors.filter(v => v.status === '활성').length}명</p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">승인 대기</p>
            <p className="text-2xl font-bold text-yellow-600">{dummyVendors.filter(v => v.status === '승인대기').length}명</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">정지</p>
            <p className="text-2xl font-bold text-red-600">{dummyVendors.filter(v => v.status === '정지').length}명</p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {['전체', '승인대기', '활성', '정지'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-hamster-brown text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-hamster-brown text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">판매자명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">연락처</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">상품 수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">총 매출</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">가입일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-hamster-brown">
                      #{vendor.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {vendor.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {vendor.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {vendor.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {vendor.products}개
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {vendor.sales.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {vendor.joinDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedVendor(vendor)}
                        className="text-sm text-hamster-orange hover:text-amber-600 font-medium"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Detail Modal */}
        {selectedVendor && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-hamster-brown">판매자 상세</h2>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Vendor Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">판매자명</span>
                    <span className="font-bold">{selectedVendor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">이메일</span>
                    <span>{selectedVendor.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">연락처</span>
                    <span>{selectedVendor.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">가입일</span>
                    <span>{selectedVendor.joinDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상태</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedVendor.status)}`}>
                      {selectedVendor.status}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">등록 상품</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedVendor.products}개</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">총 매출</p>
                    <p className="text-2xl font-bold text-green-600">{selectedVendor.sales.toLocaleString()}원</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedVendor.status === '승인대기' && (
                    <>
                      <button
                        onClick={async () => {
                          if (await showConfirm(`"${selectedVendor.name}" 판매자를 승인하시겠습니까?`)) {
                            handleVendorStatusChange(selectedVendor.id, '활성')
                            showAlert(`"${selectedVendor.name}" 판매자가 승인되었습니다! ✅`)
                          }
                        }}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700"
                      >
                        승인하기
                      </button>
                      <button
                        onClick={async () => {
                          if (await showConfirm(`"${selectedVendor.name}" 판매자를 거부하시겠습니까?`)) {
                            setVendors(vendors.filter(v => v.id !== selectedVendor.id))
                            setSelectedVendor(null)
                            showAlert(`"${selectedVendor.name}" 판매자가 거부되었습니다`)
                          }
                        }}
                        className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700"
                      >
                        거부하기
                      </button>
                    </>
                  )}
                  {selectedVendor.status === '활성' && (
                    <button
                      onClick={async () => {
                        if (await showConfirm(`"${selectedVendor.name}" 판매자를 정지하시겠습니까?`)) {
                          handleVendorStatusChange(selectedVendor.id, '정지')
                          showAlert(`"${selectedVendor.name}" 판매자가 정지되었습니다 ⛔`)
                        }
                      }}
                      className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700"
                    >
                      판매자 정지
                    </button>
                  )}
                  {selectedVendor.status === '정지' && (
                    <button
                      onClick={async () => {
                        if (await showConfirm(`"${selectedVendor.name}" 판매자의 정지를 해제하시겠습니까?`)) {
                          handleVendorStatusChange(selectedVendor.id, '활성')
                          showAlert(`"${selectedVendor.name}" 판매자의 정지가 해제되었습니다 ✅`)
                        }
                      }}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700"
                    >
                      정지 해제
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
