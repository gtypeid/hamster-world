import { NavLink } from 'react-router-dom'

export function Sidebar() {
  const navItems = [
    { to: '/mids', icon: '🌰', label: 'MID 관리' },
    { to: '/payments', icon: '🎡', label: '거래 내역' },
  ]

  return (
    <aside className="w-64 bg-orange-50 border-r border-orange-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-hamster-orange text-white'
                  : 'text-gray-700 hover:bg-orange-100'
              }`
            }
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
