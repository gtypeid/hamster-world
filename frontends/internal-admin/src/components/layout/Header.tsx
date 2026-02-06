import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-wiggle">🐹</span>
          <div>
            <h1 className="text-2xl font-bold text-hamster-brown">
              Internal Admin
            </h1>
            <p className="text-xs text-hamster-orange">
              Cash Gateway + Payment Service 통합 관리
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  👤 {user.name || user.username}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email}
                </p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-hamster-orange text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
