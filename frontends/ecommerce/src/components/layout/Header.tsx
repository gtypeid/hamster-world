import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../hooks/useCart'

export function Header() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading, user, login, logout, register } = useAuth()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const { data: cartItems = [] } = useCart()

  // 장바구니 뱃지: 상품 종류의 개수 (수량 합계가 아님)
  const cartItemCount = cartItems.length

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/')
    }
  }

  return (
    <header className="bg-white shadow-sm border-b-2 border-hamster-orange">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-4xl animate-wiggle">🐹</span>
            <div>
              <h1 className="text-2xl font-bold text-hamster-brown">Hamster World</h1>
              <p className="text-xs text-hamster-orange">햄스터 나라 마켓</p>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="도토리, 해바라기씨, 쳇바퀴..."
                className="w-full px-4 py-2 border-2 border-hamster-beige rounded-full focus:outline-none focus:border-hamster-orange transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1 rounded-full hover:bg-amber-600 transition-colors"
              >
                검색
              </button>
            </form>
          </div>

          {/* Right Menu */}
          <div className="flex items-center gap-4">
            {/* 판매자 센터 - MERCHANT 역할일 때만 표시 */}
            {user?.role === 'MERCHANT' && (
              <Link
                to="/merchant"
                className="flex items-center gap-1 text-hamster-brown hover:text-amber-500 transition-colors"
              >
                <span className="text-2xl">🏪</span>
                <span className="text-sm">판매자 센터</span>
              </Link>
            )}

            {/* 장바구니 - USER 역할일 때만 표시 */}
            {user?.role === 'USER' && (
              <Link
                to="/cart"
                className="flex items-center gap-1 text-hamster-brown hover:text-amber-500 transition-colors relative"
              >
                <span className="text-2xl">🛒</span>
                <span className="text-sm">장바구니</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/mypage"
                  className="flex items-center gap-2 text-hamster-brown hover:text-amber-500 transition-colors"
                >
                  <span className="text-xl">👤</span>
                  <span className="text-sm font-medium">{user?.username || '마이페이지'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={register}
                  disabled={isLoading}
                  className="bg-white text-amber-500 border-2 border-amber-500 px-4 py-2 rounded-full hover:bg-amber-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  회원가입
                </button>
                <button
                  onClick={login}
                  disabled={isLoading}
                  className="bg-amber-500 text-white px-4 py-2 rounded-full hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '로딩 중...' : '로그인'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="w-full relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="도토리, 해바라기씨 검색..."
              className="w-full px-4 py-2 border-2 border-hamster-beige rounded-full focus:outline-none focus:border-hamster-orange"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1 rounded-full hover:bg-amber-600 transition-colors text-sm"
            >
              검색
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
