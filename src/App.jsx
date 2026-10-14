/**
 * App.jsx
 *
 * Root component. Controls which top-level view is displayed:
 *   1. Loading spinner  — while Firebase resolves the initial auth session
 *   2. LoginPage        — when no user is signed in
 *   3. The app shell    — when a user is signed in (mock data phase)
 *
 * Phase 3A change:
 *   - Wrapped with AuthProvider in main.jsx
 *   - Role now comes from AuthContext (Firestore profile) instead of a dev switcher
 *   - Mock data and prop contracts are UNCHANGED — all page components work as before
 *   - The dev role-switcher is replaced by the real role from Firebase Auth
 *
 * Phase 3B will replace useState(mockReports) with Firestore queries.
 */

import { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import { useAuth } from './context/AuthContext'
import { mockReports } from './data/mockReports'
import AllReportsPage from './pages/AllReportsPage'
import CorrectiveActionsPage from './pages/CorrectiveActionsPage'
import EmployeeDashboard from './pages/EmployeeDashboard'
import LoginPage from './pages/LoginPage'
import MyReportsPage from './pages/MyReportsPage'
import NewReportPage from './pages/NewReportPage'
import OfficerDashboard from './pages/OfficerDashboard'

// ─── Loading spinner ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500
                        rounded-full animate-spin mx-auto" aria-hidden="true" />
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const { isLoading, isSignedIn, isOfficer, role, displayName, initials, signOut } = useAuth()

  const [currentPage, setCurrentPage] = useState('dashboard')

  /**
   * Shared reports list — still mock data in Phase 3A.
   * Phase 3B will replace this with Firestore onSnapshot queries.
   * The prop contracts (reports, addReport, onUpdateReport) stay identical.
   */
  const [reports, setReports] = useState(mockReports)

  function addReport(newReport) {
    setReports(prev => [newReport, ...prev])
  }

  function updateReport(id, changes) {
    setReports(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, ...changes, updated_at: new Date().toISOString() }
          : r
      )
    )
  }

  // When role changes (e.g. from sign-out/sign-in as different user),
  // reset to dashboard to avoid showing a page from the wrong role's nav.
  function handleNavigate(pageId) {
    setCurrentPage(pageId)
  }

  // ── Render: loading ────────────────────────────────────────────────────────
  if (isLoading) return <LoadingScreen />

  // ── Render: not signed in ──────────────────────────────────────────────────
  if (!isSignedIn) return <LoginPage />

  // ── Render: signed in ─────────────────────────────────────────────────────
  function renderPage() {
    if (isOfficer) {
      switch (currentPage) {
        case 'all-reports':
          return <AllReportsPage reports={reports} onUpdateReport={updateReport} />
        case 'corrective-actions':
          return <CorrectiveActionsPage reports={reports} onUpdateReport={updateReport} />
        default:
          return (
            <OfficerDashboard
              reports={reports}
              onUpdateReport={updateReport}
              onNavigate={handleNavigate}
            />
          )
      }
    }

    // employee
    switch (currentPage) {
      case 'new-report':
        return (
          <NewReportPage
            reports={reports}
            onReportSubmitted={addReport}
            onNavigate={handleNavigate}
          />
        )
      case 'my-reports':
        return <MyReportsPage reports={reports} onNavigate={handleNavigate} />
      default:
        return <EmployeeDashboard reports={reports} onNavigate={handleNavigate} />
    }
  }

  return (
    <AppLayout
      role={role}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      displayName={displayName}
      initials={initials}
      onSignOut={signOut}
    >
      {renderPage()}
    </AppLayout>
  )
}
