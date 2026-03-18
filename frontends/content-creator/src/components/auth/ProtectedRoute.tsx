import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * ProtectedRoute - 인증된 DEVELOPER만 접근 가능
 * - 로그인 안됨 → /login으로 리다이렉트
 * - DEVELOPER 권한 없음 → /login으로 리다이렉트 (AuthContext에서 자동 로그아웃)
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()

  // 로딩 중이면 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-6xl animate-bounce block mb-4">🐹</span>
          <p className="text-xl text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 로그인 안됨 또는 DEVELOPER 권한 없음
  if (!isAuthenticated || !user?.isDeveloper) {
    return <Navigate to="/login" replace />
  }

  // 인증되고 DEVELOPER 권한 있음
  return <>{children}</>
}
