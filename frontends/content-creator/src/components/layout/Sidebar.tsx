import { NavLink } from 'react-router-dom'

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-6">
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            📈 Progression
          </h3>
          <div className="space-y-1">
            <NavLink
              to="/progression/quotas"
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-hamster-orange text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              정기 미션 관리
            </NavLink>
            <NavLink
              to="/progression/archives"
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-hamster-orange text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              뱃지 관리
            </NavLink>
            <NavLink
              to="/progression/seasons"
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-hamster-orange text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              시즌 프로모션
            </NavLink>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            🛒 E-commerce
          </h3>
          <div className="space-y-1">
            <NavLink
              to="/ecommerce/coupons"
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-hamster-orange text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              쿠폰 관리
            </NavLink>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            🚚 Delivery
          </h3>
          <NavLink
            to="/delivery/rider-promotions"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-hamster-orange text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            라이더 프로모션
          </NavLink>
        </section>
      </nav>
    </aside>
  )
}
