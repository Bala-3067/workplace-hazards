import { useMemo, useState } from 'react'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import SeverityBadge from '../components/ui/SeverityBadge'
import { STATUSES } from '../data/mockReports'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format an ISO date string to a readable short date, e.g. "10 Oct 2026" */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * EmployeeDashboard
 *
 * Props:
 *   reports    — Report[] shared from App.jsx (includes newly submitted ones)
 *   onNavigate — (pageId) => void
 */
export default function EmployeeDashboard({ reports = [], onNavigate }) {
  // ── Filter state ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // ── Derived stats (recalculated whenever reports changes) ───────────────────
  const stats = useMemo(() => ({
    total:    reports.length,
    open:     reports.filter(r => !['Resolved', 'Closed'].includes(r.status)).length,
    critical: reports.filter(r => r.severity === 'Critical').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
  }), [reports])

  // ── Filtered reports ────────────────────────────────────────────────────────
  const filteredReports = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return reports.filter(report => {
      const matchesStatus = statusFilter === 'All' || report.status === statusFilter
      const matchesSearch =
        !q ||
        report.title.toLowerCase().includes(q) ||
        report.location.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [reports, searchQuery, statusFilter])

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Employee Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">
            Track and manage your submitted hazard reports.
          </p>
        </div>
        <button
          onClick={() => onNavigate('new-report')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600
                     text-white text-sm font-semibold rounded-lg shadow-sm transition-colors
                     focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
        >
          <span aria-hidden="true">⚠</span>
          Report a Hazard
        </button>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
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
          label="Critical Hazards"
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

      {/* ── Recent Reports section ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200">

        {/* Section header + filters */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-base font-semibold text-slate-800 flex-1">Recent Reports</h3>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" aria-hidden="true">🔍</span>
            <input
              type="search"
              placeholder="Search title or location…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50
                         focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
                         w-full sm:w-56"
              aria-label="Search reports by title or location"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-2 pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-slate-50
                       focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* ── Desktop table ──────────────────────────────────────────────── */}
        <div className="hidden md:block overflow-x-auto">
          {filteredReports.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{report.id}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800 leading-snug">{report.title}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{report.location}</td>
                    <td className="px-4 py-4 text-slate-500">{report.category}</td>
                    <td className="px-4 py-4">
                      <SeverityBadge severity={report.severity} />
                    </td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState onClear={() => { setSearchQuery(''); setStatusFilter('All') }} />
          )}
        </div>

        {/* ── Mobile card list ───────────────────────────────────────────── */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredReports.length > 0 ? (
            filteredReports.map(report => (
              <div key={report.id} className="px-5 py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800 text-sm leading-snug">{report.title}</p>
                  <SeverityBadge severity={report.severity} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={report.status} />
                  <span className="text-xs text-slate-400">{report.id}</span>
                </div>
                <p className="text-xs text-slate-500">📍 {report.location}</p>
                <p className="text-xs text-slate-500">🗂 {report.category}</p>
                <p className="text-xs text-slate-400">{formatDate(report.created_at)}</p>
              </div>
            ))
          ) : (
            <div className="px-5 py-8">
              <EmptyState onClear={() => { setSearchQuery(''); setStatusFilter('All') }} />
            </div>
          )}
        </div>

        {/* Footer: result count */}
        {filteredReports.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onClear }) {
  return (
    <div className="py-14 text-center">
      <p className="text-4xl mb-3" aria-hidden="true">🔎</p>
      <p className="text-slate-700 font-medium">No reports match your filters</p>
      <p className="text-slate-400 text-sm mt-1">Try adjusting your search or status filter.</p>
      <button
        onClick={onClear}
        className="mt-4 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-300
                   rounded-lg hover:bg-orange-50 transition-colors focus:outline-none
                   focus:ring-2 focus:ring-orange-400"
      >
        Clear filters
      </button>
    </div>
  )
}
