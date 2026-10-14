import { useMemo, useState } from 'react'
import ReportDetailDrawer from '../components/ui/ReportDetailDrawer'
import SeverityBadge from '../components/ui/SeverityBadge'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import { CATEGORIES, SEVERITIES, STATUSES } from '../data/mockReports'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Filter defaults ──────────────────────────────────────────────────────────

const BLANK_FILTERS = {
  search:   '',
  status:   'All',
  severity: 'All',
  category: 'All',
  sort:     'newest',
}

// ─── Severity sort weight (for urgent panel ordering) ────────────────────────
const SEVERITY_WEIGHT = { Critical: 4, High: 3, Medium: 2, Low: 1 }

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OfficerDashboard
 *
 * Props:
 *   reports        — Report[]  shared state from App.jsx
 *   onUpdateReport — (id, changes) => void  from App.jsx
 *   onNavigate     — (pageId) => void
 */
export default function OfficerDashboard({ reports = [], onUpdateReport, onNavigate }) {
  const [filters, setFilters]             = useState(BLANK_FILTERS)
  const [selectedReport, setSelectedReport] = useState(null)

  // ── Filter helpers ──────────────────────────────────────────────────────────
  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters(BLANK_FILTERS)
  }

  const hasActiveFilters =
    filters.search   !== '' ||
    filters.status   !== 'All' ||
    filters.severity !== 'All' ||
    filters.category !== 'All' ||
    filters.sort     !== 'newest'

  // ── Stats (always from full reports array, never filtered) ──────────────────
  const stats = useMemo(() => ({
    total:    reports.length,
    open:     reports.filter(r => !['Resolved', 'Closed'].includes(r.status)).length,
    critical: reports.filter(r => r.severity === 'Critical' || r.severity === 'High').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
  }), [reports])

  // ── Urgent panel: Critical + High severity that are NOT resolved/closed ──────
  const urgentReports = useMemo(() =>
    reports
      .filter(r =>
        (r.severity === 'Critical' || r.severity === 'High') &&
        !['Resolved', 'Closed'].includes(r.status)
      )
      .sort((a, b) =>
        (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0)
      )
      .slice(0, 5),   // cap at 5 so the panel doesn't overflow
    [reports]
  )

  // ── Filtered report table ───────────────────────────────────────────────────
  const filteredReports = useMemo(() => {
    const q = filters.search.toLowerCase().trim()

    let result = reports.filter(r => {
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)

      const matchesStatus   = filters.status   === 'All' || r.status   === filters.status
      const matchesSeverity = filters.severity === 'All' || r.severity === filters.severity
      const matchesCategory = filters.category === 'All' || r.category === filters.category

      return matchesSearch && matchesStatus && matchesSeverity && matchesCategory
    })

    result = [...result].sort((a, b) => {
      const ta = new Date(a.created_at).getTime()
      const tb = new Date(b.created_at).getTime()
      return filters.sort === 'newest' ? tb - ta : ta - tb
    })

    return result
  }, [reports, filters])

  // ── When the selected report changes in shared state (e.g. after status save),
  //    keep the drawer in sync by reading the fresh version from reports.
  const liveSelectedReport = useMemo(() => {
    if (!selectedReport) return null
    return reports.find(r => r.id === selectedReport.id) ?? null
  }, [selectedReport, reports])

  // ── Officer callbacks ───────────────────────────────────────────────────────
  function handleStatusChange(reportId, newStatus) {
    onUpdateReport(reportId, { status: newStatus })
    // Keep selectedReport id alive so the drawer stays open and shows the new badge
    setSelectedReport(prev => prev ? { ...prev, id: reportId } : null)
  }

  function handleNoteSave(reportId, noteText) {
    onUpdateReport(reportId, { officer_note: noteText })
  }

  // ─── Shared control class ───────────────────────────────────────────────────
  const selectCls =
    'py-2 pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-slate-50 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-6 items-start">

      {/* ── Main content column ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Safety Officer Dashboard</h2>
            <p className="text-slate-500 text-sm mt-1">
              Monitor, manage, and resolve all reported workplace hazards.
            </p>
          </div>
          {/* Quick-link to full report list */}
          <button
            onClick={() => onNavigate('all-reports')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                       text-white text-sm font-semibold rounded-lg shadow-sm transition-colors
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span aria-hidden="true">📂</span>
            View All Reports
          </button>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Reports"
            value={stats.total}
            icon="📋"
            accentClass="bg-slate-100"
            iconClass="text-slate-600"
          />
          <StatCard
            label="Open Reports"
            value={stats.open}
            icon="🔓"
            accentClass="bg-blue-50"
            iconClass="text-blue-600"
          />
          <StatCard
            label="Critical / High"
            value={stats.critical}
            icon="🚨"
            accentClass="bg-red-50"
            iconClass="text-red-600"
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon="✅"
            accentClass="bg-emerald-50"
            iconClass="text-emerald-600"
          />
        </div>

        {/* ── Urgent hazards panel ─────────────────────────────────────────── */}
        {urgentReports.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg" aria-hidden="true">🚨</span>
              <h3 className="text-sm font-semibold text-red-800">
                Urgent Attention Required ({urgentReports.length})
              </h3>
              <span className="ml-auto text-xs text-red-500">Critical &amp; High severity — open only</span>
            </div>
            <div className="space-y-2">
              {urgentReports.map(report => (
                <div
                  key={report.id}
                  className="bg-white rounded-lg border border-red-100 px-4 py-3
                             flex flex-wrap items-center gap-3 text-sm"
                >
                  <span className="font-mono text-xs text-slate-400 w-16 flex-shrink-0">
                    {report.id}
                  </span>
                  <p className="font-medium text-slate-800 flex-1 min-w-40 leading-snug">
                    {report.title}
                  </p>
                  <span className="text-xs text-slate-500 hidden sm:block">{report.location}</span>
                  <SeverityBadge severity={report.severity} />
                  <StatusBadge status={report.status} />
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800
                               underline-offset-2 hover:underline focus:outline-none
                               focus:ring-2 focus:ring-blue-400 rounded"
                    aria-label={`Manage report: ${report.title}`}
                  >
                    Manage →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              placeholder="Search by ID, title, or location…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 w-full
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search reports"
            />
          </div>

          {/* Status */}
          <select value={filters.status}   onChange={e => setFilter('status', e.target.value)}   className={selectCls} aria-label="Filter by status">
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Severity */}
          <select value={filters.severity} onChange={e => setFilter('severity', e.target.value)} className={selectCls} aria-label="Filter by severity">
            <option value="All">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Category */}
          <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className={selectCls} aria-label="Filter by category">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Sort */}
          <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)} className={selectCls} aria-label="Sort reports">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Reports table / cards ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200">

          {/* Desktop table */}
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
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Submitted</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredReports.map(report => {
                    const isSelected = liveSelectedReport?.id === report.id
                    return (
                      <tr
                        key={report.id}
                        className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
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
                        <td className="px-4 py-4">
                          <button
                            onClick={() => setSelectedReport(isSelected ? null : report)}
                            className={[
                              'text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                              'focus:outline-none focus:ring-2 focus:ring-blue-500',
                              isSelected
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-slate-600 border border-slate-200 hover:bg-slate-50',
                            ].join(' ')}
                            aria-pressed={isSelected}
                            aria-label={`${isSelected ? 'Close' : 'Manage'} report: ${report.title}`}
                          >
                            {isSelected ? 'Close' : 'Manage'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <OfficerEmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredReports.length > 0 ? (
              filteredReports.map(report => {
                const isSelected = liveSelectedReport?.id === report.id
                return (
                  <div
                    key={report.id}
                    className={`px-5 py-4 space-y-2.5 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{report.title}</p>
                      <SeverityBadge severity={report.severity} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={report.status} />
                      <span className="font-mono text-xs text-slate-400">{report.id}</span>
                    </div>
                    <p className="text-xs text-slate-500">📍 {report.location}</p>
                    <p className="text-xs text-slate-500">🗂 {report.category}</p>
                    <p className="text-xs text-slate-400">📅 {formatDate(report.created_at)}</p>
                    <button
                      onClick={() => setSelectedReport(isSelected ? null : report)}
                      className={[
                        'text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        isSelected
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-slate-600 border border-slate-200 hover:bg-slate-50',
                      ].join(' ')}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? 'Close Details' : 'Manage Report'}
                    </button>
                  </div>
                )
              })
            ) : (
              <div className="px-5 py-8">
                <OfficerEmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
              </div>
            )}
          </div>

          {/* Footer count */}
          {filteredReports.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
              Showing {filteredReports.length} of {reports.length} total reports
            </div>
          )}
        </div>
      </div>

      {/* ── Detail / management drawer ─────────────────────────────────────── */}
      <ReportDetailDrawer
        report={liveSelectedReport}
        onClose={() => setSelectedReport(null)}
        onStatusChange={handleStatusChange}
        onNoteSave={handleNoteSave}
      />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function OfficerEmptyState({ hasFilters, onClear }) {
  return (
    <div className="py-16 text-center px-6">
      <p className="text-4xl mb-3" aria-hidden="true">🔎</p>
      <p className="font-semibold text-slate-700">No reports match your filters</p>
      <p className="text-slate-400 text-sm mt-1">
        Try adjusting your search or clearing the active filters.
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300
                     rounded-lg hover:bg-blue-50 transition-colors focus:outline-none
                     focus:ring-2 focus:ring-blue-400"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
