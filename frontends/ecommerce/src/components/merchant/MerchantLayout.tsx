import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAlert } from '../../contexts/AlertContext'
import { useMyMerchant } from '../../hooks/useMerchant'

interface MerchantLayoutProps {
  children: ReactNode
}

const menuItems = [
  { path: '/merchant', label: '대시보드', icon: '📊' },
  { path: '/merchant/products', label: '상품 관리', icon: '📦' },
  { path: '/merchant/orders', label: '주문 관리', icon: '🛒' },
  { path: '/merchant/coupons', label: '쿠폰 관리', icon: '🎟️' },
  { path: '/merchant/settlement', label: '정산 관리', icon: '💰' },
  { path: '/merchant/settings', label: '스토어 설정', icon: '⚙️' },
]

export function MerchantLayout({ children }: MerchantLayoutProps) {
  const { showAlert, showConfirm } = useAlert()
  const location = useLocation()
  const { data: merchant } = useMyMerchant()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Merchant Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🐹</span>
            <div>
              <h2 className="font-bold text-hamster-brown">
                {merchant ? merchant.storeName : '스토어 이름'}
              </h2>
              <p className="text-xs text-gray-500">판매자</p>
            </div>
          </div>
          <Link
            to="/"
            className="text-sm text-hamster-orange hover:text-amber-600 flex items-center gap-1"
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
                        ? 'bg-amber-500 text-white font-bold'
                        : 'text-gray-700 hover:bg-hamster-beige'
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
          <button
            onClick={async () => {
              if (await showConfirm('로그아웃 하시겠습니까?')) {
                showAlert('로그아웃 기능은 준비 중입니다')
              }
            }}
            className="w-full text-sm text-gray-600 hover:text-hamster-orange py-2"
          >
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
