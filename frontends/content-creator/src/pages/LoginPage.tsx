import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const { isAuthenticated, login, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // 이미 로그인되어 있으면 메인 페이지로
    if (isAuthenticated && user?.isDeveloper) {
      navigate('/')
    }
  }, [isAuthenticated, user, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block animate-bounce mb-4">
              <span className="text-7xl">🐹</span>
            </div>
            <h1 className="text-3xl font-bold text-hamster-brown mb-2">
              Content Creator
            </h1>
            <p className="text-gray-600 text-sm">
              개발자 전용 컨텐츠 제작 도구
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  개발자 권한 필요
                </h3>
                <p className="text-sm text-blue-700">
                  이 시스템은 <strong>DEVELOPER</strong> 권한이 있는 사용자만 접근할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Services Info */}
          <div className="mb-6 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              제작 가능한 컨텐츠
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>🎮</span>
              <span>Progression (Quota, Archive, Milestone, Season)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>💰</span>
              <span>Payment (Coupon, Gacha)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>🚚</span>
              <span>Delivery (Rider, Region)</span>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={login}
            className="w-full bg-hamster-orange hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            Keycloak으로 로그인
          </button>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Hamster World Content Creator v1.0
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            🔒 모든 API 요청은 JWT 토큰으로 보호됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
