import { NavLink } from 'react-router-dom';

interface MenuItem {
  to: string;
  icon: string;
  label: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function Sidebar() {
  const menuSections: MenuSection[] = [
    {
      title: 'Main',
      items: [
        { to: '/', icon: '🏠', label: 'Home' },
        { to: '/services', icon: '🎯', label: 'Services' },
      ],
    },
    {
      title: 'Documentation',
      items: [
        { to: '/architecture', icon: '🏗️', label: 'Architecture' },
        { to: '/docs', icon: '📚', label: 'Documents' },
      ],
    },
    {
      title: 'Control',
      items: [
        { to: '/infrastructure', icon: '🎮', label: 'Infrastructure' },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-dark-sidebar border-r border-dark-border overflow-y-auto">
      <div className="p-6">
        {menuSections.map((section, idx) => (
          <div key={section.title} className={idx > 0 ? 'mt-8' : ''}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <nav className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-accent-orange text-white'
                        : 'text-gray-300 hover:bg-dark-hover hover:text-white'
                    }`
                  }
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
