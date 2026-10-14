import { useMemo, useState } from 'react'
import ReportDetailDrawer from '../components/ui/ReportDetailDrawer'
import SeverityBadge from '../components/ui/SeverityBadge'
import StatusBadge from '../components/ui/StatusBadge'
import { CATEGORIES, SEVERITIES, STATUSES } from '../data/mockReports'

// ─── Identity ─────────────────────────────────────────────────────────────────
// Must match the value set in NewReportPage and the mock seed data.
// In Phase 3 this comes from the authenticated Supabase user.
const MOCK_CURRENT_USER = 'John Doe'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]

// ─── Blank filter state ───────────────────────────────────────────────────────
const BLANK_FILTERS = {
  search:   '',
  status:   'All',
  severity: 'All',
  sort:     'newest',
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * MyReportsPage
 *
 * Props:
 *   reports    — Report[]  shared from App.jsx (includes newly submitted ones)
 *   onNavigate — (pageId) => void
 */
export default function MyReportsPage({ reports = [], onNavigate }) {
  // ── Filter / sort state ─────────────────────────────────────────────────────
  const [filters, setFilters] = useState(BLANK_FILTERS)

  // ── Detail drawer state ─────────────────────────────────────────────────────
  const [selectedReport, setSelectedReport] = useState(null)

  // ── Update a single filter key ──────────────────────────────────────────────
  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters(BLANK_FILTERS)
  }

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'All' ||
    filters.severity !== 'All' ||
    filters.sort !== 'newest'

  // ── Derived: filter to current user, then apply search/filters/sort ─────────
  const myReports = useMemo(
    () => reports.filter(r => r.reported_by === MOCK_CURRENT_USER),
    [reports]
  )

  const filteredReports = useMemo(() => {
    const q = filters.search.toLowerCase().trim()

    let result = myReports.filter(r => {
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)

      const matchesStatus   = filters.status   === 'All' || r.status   === filters.status
      const matchesSeverity = filters.severity === 'All' || r.severity === filters.severity

      return matchesSearch && matchesStatus && matchesSeverity
    })

    // Sort
    result = [...result].sort((a, b) => {
      const ta = new Date(a.created_at).getTime()
      const tb = new Date(b.created_at).getTime()
      return filters.sort === 'newest' ? tb - ta : ta - tb
    })

    return result
  }, [myReports, filters])

  // ── Print handler ───────────────────────────────────────────────────────────
  function handlePrint() {
    window.print()
  }

  // ── Shared select / input className ────────────────────────────────────────
  const selectCls =
    'py-2 pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-slate-50 ' +
    'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent'

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    // Outer wrapper: on xl+ the drawer sits beside the list as a second column
    <div className="flex gap-6 items-start print-full-width">

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-noprint>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">My Reports</h2>
            <p className="text-slate-500 text-sm mt-1">
              Showing {myReports.length} report{myReports.length !== 1 ? 's' : ''} submitted by you.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Print button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                         border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50
                         transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M6.75 15.75v3h10.5v-3M6.75 8.25V3h10.5v5.25M4.5 8.25h15a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75V9a.75.75 0 0 1 .75-.75Z" />
              </svg>
              Print
            </button>

            {/* New report shortcut */}
            <button
              onClick={() => onNavigate('new-report')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600
                         text-white text-sm font-semibold rounded-lg shadow-sm transition-colors
                         focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
            >
              <span aria-hidden="true">➕</span>
              New Report
            </button>
          </div>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div
          className="bg-white rounded-xl border border-slate-200 px-4 py-3
                     flex flex-wrap gap-3 items-center"
          data-noprint
        >
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
              aria-hidden="true"
            >🔍</span>
            <input
              type="search"
              placeholder="Search by ID, title, or location…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 w-full
                         focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              aria-label="Search reports"
            />
          </div>

          {/* Status */}
          <select
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
            className={selectCls}
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Severity */}
          <select
            value={filters.severity}
            onChange={e => setFilter('severity', e.target.value)}
            className={selectCls}
            aria-label="Filter by severity"
          >
            <option value="All">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={e => setFilter('sort', e.target.value)}
            className={selectCls}
            aria-label="Sort reports"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Clear filters — only when something is active */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-orange-600 hover:text-orange-700
                         focus:outline-none focus:underline whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Report list card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200">

          {/* ── Desktop table ────────────────────────────────────────────── */}
          <div className="hidden md:block overflow-x-auto">
            {filteredReports.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">ID</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide" data-noprint>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredReports.map(report => {
                    const isSelected = selectedReport?.id === report.id
                    return (
                      <tr
                        key={report.id}
                        className={`transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">{report.id}</td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-800 leading-snug">{report.title}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-500 text-xs">{report.location}</td>
                        <td className="px-4 py-4 text-slate-500 text-xs">{report.category}</td>
                        <td className="px-4 py-4"><SeverityBadge severity={report.severity} /></td>
                        <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">
                          {formatDate(report.created_at)}
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={report.status} /></td>
                        <td className="px-4 py-4" data-noprint>
                          <button
                            onClick={() => setSelectedReport(
                              isSelected ? null : report
                            )}
                            className={[
                              'text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                              'focus:outline-none focus:ring-2 focus:ring-orange-400',
                              isSelected
                                ? 'bg-orange-100 text-orange-700'
                                : 'text-slate-600 border border-slate-200 hover:bg-slate-50',
                            ].join(' ')}
                            aria-pressed={isSelected}
                            aria-label={`${isSelected ? 'Close details for' : 'View details for'} ${report.title}`}
                          >
                            {isSelected ? 'Close' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState
                hasFilters={hasActiveFilters}
                totalOwn={myReports.length}
                onClear={clearFilters}
                onNavigate={onNavigate}
              />
            )}
          </div>

          {/* ── Mobile cards ─────────────────────────────────────────────── */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredReports.length > 0 ? (
              filteredReports.map(report => {
                const isSelected = selectedReport?.id === report.id
                return (
                  <div
                    key={report.id}
                    className={`px-5 py-4 space-y-2.5 ${isSelected ? 'bg-orange-50' : ''}`}
                  >
                    {/* Title + severity */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{report.title}</p>
                      <SeverityBadge severity={report.severity} />
                    </div>

                    {/* Status + ID */}
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={report.status} />
                      <span className="font-mono text-xs text-slate-400">{report.id}</span>
                    </div>

                    {/* Meta */}
                    <p className="text-xs text-slate-500">📍 {report.location}</p>
                    <p className="text-xs text-slate-500">🗂 {report.category}</p>
                    <p className="text-xs text-slate-400">📅 {formatDate(report.created_at)}</p>

                    {/* Action */}
                    <div data-noprint>
                      <button
                        onClick={() => setSelectedReport(isSelected ? null : report)}
                        className={[
                          'text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-orange-400',
                          isSelected
                            ? 'bg-orange-100 text-orange-700'
                            : 'text-slate-600 border border-slate-200 hover:bg-slate-50',
                        ].join(' ')}
                        aria-pressed={isSelected}
                        aria-label={`${isSelected ? 'Close details for' : 'View details for'} ${report.title}`}
                      >
                        {isSelected ? 'Close Details' : 'View Details'}
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="px-5 py-8">
                <EmptyState
                  hasFilters={hasActiveFilters}
                  totalOwn={myReports.length}
                  onClear={clearFilters}
                  onNavigate={onNavigate}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredReports.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400" data-noprint>
              Showing {filteredReports.length} of {myReports.length} your reports
            </div>
          )}
        </div>
      </div>

      {/* ── Detail drawer ─────────────────────────────────────────────────── */}
      <ReportDetailDrawer
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, totalOwn, onClear, onNavigate }) {
  // Case 1: user has no reports at all
  if (totalOwn === 0) {
    return (
      <div className="py-16 text-center px-6">
        <p className="text-4xl mb-3" aria-hidden="true">📋</p>
        <p className="font-semibold text-slate-700">No reports yet</p>
        <p className="text-slate-400 text-sm mt-1">
          You have not submitted any hazard reports. Use the button below to report a hazard.
        </p>
        <button
          onClick={() => onNavigate('new-report')}
          className="mt-5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm
                     font-semibold rounded-lg transition-colors focus:outline-none
                     focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
        >
          Report a Hazard
        </button>
      </div>
    )
  }

  // Case 2: reports exist but filters/search returned nothing
  return (
    <div className="py-16 text-center px-6">
      <p className="text-4xl mb-3" aria-hidden="true">🔎</p>
      <p className="font-semibold text-slate-700">No reports match your filters</p>
      <p className="text-slate-400 text-sm mt-1">
        Try adjusting your search terms or clearing the active filters.
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-300
                     rounded-lg hover:bg-orange-50 transition-colors focus:outline-none
                     focus:ring-2 focus:ring-orange-400"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
