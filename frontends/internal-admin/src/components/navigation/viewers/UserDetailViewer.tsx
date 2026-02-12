import { useState, useEffect } from 'react'
import type { ViewerProps } from '@/types/navigation'
import type { User } from '@/types/user'
import { fetchUserDetail } from '@/api/userService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FieldRenderer } from '../FieldRenderer'

/**
 * UserDetailViewer
 * - Ecommerce Service의 User 상세 정보 표시
 * - GenericDataViewer에서 data를 전달받아 사용 (API 호출은 GenericDataViewer가 담당)
 */
export function UserDetailViewer({ id, data: initialData }: ViewerProps) {
  const [user, setUser] = useState<User | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 이미 data가 전달되었으면 API 호출 안함
    if (initialData) {
      setUser(initialData)
      setIsLoading(false)
      return
    }

    // Fallback: data가 없으면 직접 API 호출 (하위 호환성)
    const loadUser = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchUserDetail(id)
        setUser(data)
      } catch (err) {
        console.error('Failed to load user detail:', err)
        setError('사용자 상세 정보를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [id, initialData])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p className="font-bold mb-2">❌ 오류 발생</p>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-gray-500 mt-2">User ID: {id}</p>
      </div>
    )
  }

  if (!user || !user.publicId) {
    return (
      <div className="text-center text-gray-500">
        <p className="font-bold mb-2">❌ 사용자를 찾을 수 없어요</p>
        <p className="text-sm">User ID: {id}</p>
      </div>
    )
  }

  const getRoleColor = () => {
    switch (user.role) {
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800'
      case 'MERCHANT':
        return 'bg-purple-100 text-purple-800'
      case 'DEVELOPER':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = () => {
    const labels = {
      CUSTOMER: '고객',
      MERCHANT: '판매자',
      DEVELOPER: '개발자',
    }
    return labels[user.role] || user.role
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">👤 사용자 정보</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Role:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor()}`}>
              {getRoleLabel()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">이름:</span>
            <span className="font-bold">{user.name}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Username:</span>
            <span className="font-mono font-medium">{user.username}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Email:</span>
            <span className="font-medium">{user.email}</span>
          </div>
        </div>
      </section>

      {/* Related IDs - Using FieldRenderer */}
      <FieldRenderer viewerType="user-detail" data={user} />

      {/* Additional System IDs (non-navigable) */}
      <section className="bg-gray-50 rounded-lg border border-gray-300 p-6">
        <h4 className="text-lg font-bold text-gray-700 mb-4">🔧 시스템 ID</h4>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex items-center gap-3 bg-white p-2 rounded">
            <span className="text-gray-500 flex-shrink-0">Keycloak User ID:</span>
            <span className="text-gray-600">{user.keycloakUserId}</span>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded">
            <span className="text-gray-500 flex-shrink-0">Internal ID:</span>
            <span className="text-gray-600">{user.id}</span>
          </div>
        </div>
      </section>

      {/* Keycloak Integration Info */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">🔐 Keycloak 연동 정보</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">인증 상태:</span>
            <span className="font-medium text-green-600">✅ 연동됨</span>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              💡 Keycloak으로 인증 및 권한 관리가 이루어집니다.
            </p>
          </div>
        </div>
      </section>

      {/* Timestamps */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">⏰ 생성 정보</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">가입일:</span>
            <span className="font-medium">
              {new Date(user.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-bold text-blue-900 mb-2">💡 참고</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 이 사용자의 주문 내역은 "주문 관리"에서 검색할 수 있습니다</li>
          <li>• MERCHANT 역할의 경우 판매자 정보가 별도로 관리됩니다</li>
          <li>• Keycloak에서 사용자 권한 및 인증 상태를 관리합니다</li>
        </ul>
      </section>
    </div>
  )
}
