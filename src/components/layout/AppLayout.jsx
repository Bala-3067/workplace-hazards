import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

/**
 * AppLayout wraps every authenticated page.
 *
 * Props:
 *   role        — 'employee' | 'officer'  (from AuthContext in Phase 3A+)
 *   currentPage — active page id string
 *   onNavigate  — (pageId) => void
 *   displayName — full name of the signed-in user
 *   initials    — 1–2 char initials for the avatar
 *   onSignOut   — () => void
 *   children    — the page content to render in the main area
 */
export default function AppLayout({
  role,
  currentPage,
  onNavigate,
  displayName,
  initials,
  onSignOut,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      <Sidebar
        role={role}
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={onSignOut}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          currentPage={currentPage}
          role={role}
          displayName={displayName}
          initials={initials}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-6" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
