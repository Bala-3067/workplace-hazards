/**
 * Topbar.jsx
 *
 * Phase 3A change: displayName and initials now come from AppLayout props
 * (which gets them from AuthContext) instead of being hardcoded mock strings.
 * The prop interface is backward-compatible — if props are omitted, it falls
 * back to safe defaults so no existing tests break.
 */

const pageTitles = {
  'dashboard':           'Dashboard',
  'new-report':          'Submit New Report',
  'my-reports':          'My Reports',
  'all-reports':         'All Reports',
  'corrective-actions':  'Corrective Actions',
}

export default function Topbar({ currentPage, role, displayName, initials, onMenuClick }) {
  const title       = pageTitles[currentPage] ?? 'Hazard Reporting'
  const name        = displayName ?? (role === 'officer' ? 'Safety Officer' : 'Employee')
  const avatarChars = initials    ?? (role === 'officer' ? 'SO' : 'EM')
  const roleLabel   = role === 'officer' ? 'Safety Officer' : 'Employee'

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 flex-shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100
                   hover:text-slate-700 transition-colors"
        aria-label="Open navigation menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-slate-800 flex-1">{title}</h1>

      {/* User info + avatar */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-800 leading-tight">{name}</p>
          <p className="text-xs text-slate-500">{roleLabel}</p>
        </div>
        <div
          className={[
            'w-9 h-9 rounded-full flex items-center justify-center',
            'text-white text-sm font-bold flex-shrink-0',
            role === 'officer' ? 'bg-blue-600' : 'bg-emerald-600',
          ].join(' ')}
          aria-hidden="true"
        >
          {avatarChars}
        </div>
      </div>
    </header>
  )
}
