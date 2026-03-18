import { useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { useAlert } from '../../contexts/AlertContext'

const dummyUsers = [
  { id: '1', name: '햄찌사랑', email: 'hamjji@example.com', phone: '010-1111-2222', joinDate: '2025-12-15', orderCount: 24, totalSpent: 360000, status: '활성' },
  { id: '2', name: '함스터맘', email: 'hammom@example.com', phone: '010-2222-3333', joinDate: '2026-01-05', orderCount: 15, totalSpent: 225000, status: '활성' },
  { id: '3', name: '쪼꼬미', email: 'jjokomi@example.com', phone: '010-3333-4444', joinDate: '2025-11-20', orderCount: 8, totalSpent: 120000, status: '활성' },
  { id: '4', name: '햄순이', email: 'hamsoon@example.com', phone: '010-4444-5555', joinDate: '2026-01-10', orderCount: 32, totalSpent: 480000, status: '활성' },
  { id: '5', name: '부적절유저', email: 'bad@example.com', phone: '010-5555-6666', joinDate: '2025-10-01', orderCount: 2, totalSpent: 30000, status: '정지' },
]

export function AdminUsersPage() {
  const { showAlert, showConfirm } = useAlert()
  const [users, setUsers] = useState(dummyUsers)
  const [selectedUser, setSelectedUser] = useState<typeof dummyUsers[0] | null>(null)

  const handleUserStatusChange = (userId: string, newStatus: '활성' | '정지') => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, status: newStatus } : u
    ))
    if (selectedUser?.id === userId) {
      setSelectedUser({ ...selectedUser, status: newStatus })
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">
            👥 사용자 관리
          </h1>
          <p className="text-gray-600">가입 회원을 관리하세요</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">전체 회원</p>
            <p className="text-2xl font-bold text-hamster-brown">{dummyUsers.length}명</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">활성 회원</p>
            <p className="text-2xl font-bold text-green-600">
              {dummyUsers.filter(u => u.status === '활성').length}명
            </p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">정지 회원</p>
            <p className="text-2xl font-bold text-red-600">
              {dummyUsers.filter(u => u.status === '정지').length}명
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">신규 회원 (이번 달)</p>
            <p className="text-2xl font-bold text-blue-600">2명</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-hamster-brown text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">연락처</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">가입일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">주문 수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">총 구매액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dummyUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-hamster-brown">
                      #{user.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.joinDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.orderCount}건
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {user.totalSpent.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === '활성'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          상세
                        </button>
                        {user.status === '활성' ? (
                          <button
                            onClick={async () => {
                              if (await showConfirm(`"${user.name}" 사용자를 정지하시겠습니까?`)) {
                                handleUserStatusChange(user.id, '정지')
                                showAlert(`"${user.name}" 사용자가 정지되었습니다 ⛔`)
                              }
                            }}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            정지
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (await showConfirm(`"${user.name}" 사용자의 정지를 해제하시겠습니까?`)) {
                                handleUserStatusChange(user.id, '활성')
                                showAlert(`"${user.name}" 사용자의 정지가 해제되었습니다 ✅`)
                              }
                            }}
                            className="text-sm text-green-600 hover:text-green-800 font-medium"
                          >
                            해제
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Insights */}
        <div className="mt-6 bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-hamster-brown mb-4">회원 인사이트</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">평균 주문 수</p>
              <p className="text-3xl font-bold text-purple-600">16.2건</p>
              <p className="text-xs text-gray-500 mt-1">회원 1인당</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">평균 구매액</p>
              <p className="text-3xl font-bold text-orange-600">243,000원</p>
              <p className="text-xs text-gray-500 mt-1">회원 1인당</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">VIP 회원 (30만원 이상)</p>
              <p className="text-3xl font-bold text-teal-600">2명</p>
              <p className="text-xs text-gray-500 mt-1">전체의 40%</p>
            </div>
          </div>
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-hamster-brown">사용자 상세</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">사용자명</span>
                    <span className="font-bold">{selectedUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">이메일</span>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">연락처</span>
                    <span>{selectedUser.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">가입일</span>
                    <span>{selectedUser.joinDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상태</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedUser.status === '활성'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">주문 수</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedUser.orderCount}건</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">총 구매액</p>
                    <p className="text-2xl font-bold text-green-600">{selectedUser.totalSpent.toLocaleString()}원</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedUser.status === '활성' ? (
                    <button
                      onClick={async () => {
                        if (await showConfirm(`"${selectedUser.name}" 사용자를 정지하시겠습니까?`)) {
                          handleUserStatusChange(selectedUser.id, '정지')
                          showAlert(`"${selectedUser.name}" 사용자가 정지되었습니다 ⛔`)
                        }
                      }}
                      className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700"
                    >
                      사용자 정지
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (await showConfirm(`"${selectedUser.name}" 사용자의 정지를 해제하시겠습니까?`)) {
                          handleUserStatusChange(selectedUser.id, '활성')
                          showAlert(`"${selectedUser.name}" 사용자의 정지가 해제되었습니다 ✅`)
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
