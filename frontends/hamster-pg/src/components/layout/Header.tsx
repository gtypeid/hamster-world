export function Header() {
  return (
    <header className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-wiggle">🐹</span>
          <div>
            <h1 className="text-2xl font-bold text-hamster-brown">
              Hamster PG
            </h1>
            <p className="text-xs text-hamster-orange">
              관리자 페이지
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">👤 Admin</span>
        </div>
      </div>
    </header>
  )
}
