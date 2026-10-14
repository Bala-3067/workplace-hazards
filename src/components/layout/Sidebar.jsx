/**
 * Sidebar.jsx
 *
 * Phase 3A change: Sign Out button now calls the real onSignOut prop
 * (from AuthContext via AppLayout) instead of doing nothing.
 * All navigation and styling are unchanged.
 */

const employeeNav = [
  { id: 'dashboard',  label: 'Dashboard',   icon: '🏠' },
  { id: 'new-report', label: 'New Report',   icon: '➕' },
  { id: 'my-reports', label: 'My Reports',   icon: '📋' },
]

const officerNav = [
  { id: 'dashboard',           label: 'Dashboard',          icon: '🏠' },
  { id: 'all-reports',         label: 'All Reports',         icon: '📂' },
  { id: 'corrective-actions',  label: 'Corrective Actions',  icon: '🔧' },
]

export default function Sidebar({ role, currentPage, onNavigate, isOpen, onClose, onSignOut }) {
  const navItems = role === 'officer' ? officerNav : employeeNav

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-30',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg" aria-hidden="true">⚠</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Hazard</p>
            <p className="text-xs text-slate-400">Reporting System</p>
          </div>
          <button
            className="ml-auto text-slate-400 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Role badge */}
        <div className="px-6 py-3 border-b border-slate-700">
          <span className={[
            'inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide',
            role === 'officer' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white',
          ].join(' ')}>
            {role === 'officer' ? 'Safety Officer' : 'Employee'}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1" role="list">
            {navItems.map((item) => {
              const isActive = currentPage === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => { onNavigate(item.id); onClose() }}
                    className={[
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                      'transition-colors duration-150 text-left',
                      isActive
                        ? 'bg-slate-700 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                       text-slate-400 hover:bg-slate-800 hover:text-white
                       transition-colors duration-150"
          >
            <span aria-hidden="true">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
