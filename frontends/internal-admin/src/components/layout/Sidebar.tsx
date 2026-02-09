import { NavLink } from 'react-router-dom'

interface MenuItem {
  to: string
  icon: string
  label: string
  external?: boolean
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
    },
    {
      title: '🔔 Notification Service',
      items: [
        { to: '/notification/deadletter', icon: '', label: '데드레터' },
        { to: '/notification/topology', icon: '', label: '토폴로지' }
      ]
    },
    {
      title: '🔗 External',
      items: [
        {
          to: import.meta.env.VITE_KEYCLOAK_ADMIN_URL,
          icon: '',
          label: '키클록',
          external: true
        },
        {
          to: import.meta.env.VITE_KAFKA_UI_URL,
          icon: '',
          label: '카프카',
          external: true
        },
        {
          to: import.meta.env.VITE_GRAFANA_URL,
          icon: '',
          label: '그라파나',
          external: true
        }
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
              {section.items.map((item) =>
                item.external ? (
                  <a
                    key={item.to}
                    href={item.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-orange-100"
                  >
                    {item.icon && <span className="text-2xl">{item.icon}</span>}
                    <span className="font-medium">{item.label}</span>
                    <span className="ml-auto text-xs text-gray-400">↗</span>
                  </a>
                ) : (
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
                )
              )}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
