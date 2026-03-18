import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

const menuItems = [
  { path: '/admin', label: '대시보드', icon: '📊' },
  { path: '/admin/vendors', label: '판매자 관리', icon: '🏪' },
  { path: '/admin/products', label: '상품 관리', icon: '📦' },
  { path: '/admin/orders', label: '주문 모니터링', icon: '🛒' },
  { path: '/admin/users', label: '사용자 관리', icon: '👥' },
  { path: '/admin/statistics', label: '통계', icon: '📈' },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Admin Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">👑</span>
            <div>
              <h2 className="font-bold text-hamster-brown">플랫폼 관리자</h2>
              <p className="text-xs text-gray-500">Hamster World</p>
            </div>
          </div>
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-hamster-brown flex items-center gap-1"
          >
            ← 쇼핑몰로 돌아가기
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-amber-500 text-white font-bold shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full text-sm text-gray-600 hover:text-hamster-brown py-2">
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
