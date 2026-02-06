import { NavLink } from 'react-router-dom'

interface MenuItem {
  to: string
  icon: string
  label: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

export function Sidebar() {
  const menuSections: MenuSection[] = [
    {
      title: '🛒 Ecommerce Service',
      items: [
        { to: '/ecommerce/orders', icon: '', label: '주문 관리' }
      ]
    },
    {
      title: '💸 Cash Gateway',
      items: [
        { to: '/gateway/processes', icon: '', label: '통신 프로세스' }
      ]
    },
    {
      title: '📦 Payment Service',
      items: [
        { to: '/payment/resource', icon: '', label: '자원 관리' },
        { to: '/payment/transactions', icon: '', label: '거래 내역' }
      ]
    }
  ]

  return (
    <aside className="w-64 bg-orange-50 border-r border-orange-200 min-h-screen">
      <nav className="p-4">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
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
                  {item.icon && <span className="text-2xl">{item.icon}</span>}
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
