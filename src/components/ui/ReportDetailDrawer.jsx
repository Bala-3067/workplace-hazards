import { useEffect, useState } from 'react'
import { STATUSES } from '../../data/mockReports'
import SeverityBadge from './SeverityBadge'
import StatusBadge from './StatusBadge'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ReportDetailDrawer
 * A slide-in right-hand panel showing full report details.
 *
 * Props (all pages):
 *   report        — Report | null   the report to show; null hides the drawer
 *   onClose       — () => void
 *
 * Props (officer only — omit to make the drawer read-only):
 *   onStatusChange — (reportId, newStatus) => void
 *   onNoteSave     — (reportId, noteText)  => void   (mock — not persisted)
 */
export default function ReportDetailDrawer({
  report,
  onClose,
  onStatusChange,   // officer only
  onNoteSave,       // officer only
}) {
  const isOpen       = report !== null
  const isOfficer    = typeof onStatusChange === 'function'

  // ── Local state for the officer action form ──────────────────────────────
  const [draftStatus, setDraftStatus] = useState('')
  const [noteText,    setNoteText]    = useState('')
  const [feedback,    setFeedback]    = useState(null) // { type: 'success'|'error', msg }

  // Reset local form whenever a different report is opened
  useEffect(() => {
    if (report) {
      setDraftStatus(report.status)
      setNoteText(report.officer_note ?? '')
      setFeedback(null)
    }
  }, [report?.id])   // only re-run when the selected report ID changes

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleStatusSave() {
    if (!draftStatus || draftStatus === report.status) {
      setFeedback({ type: 'error', msg: 'Please select a different status before saving.' })
      return
    }
    onStatusChange(report.id, draftStatus)
    setFeedback({ type: 'success', msg: `Status updated to "${draftStatus}".` })
  }

  function handleNoteSave() {
    if (!noteText.trim()) {
      setFeedback({ type: 'error', msg: 'Note cannot be empty.' })
      return
    }
    onNoteSave(report.id, noteText.trim())
    setFeedback({ type: 'success', msg: 'Note saved (mock — not persisted after refresh).' })
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop — small screens only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 xl:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Report details"
        aria-hidden={!isOpen}
        className={[
          'fixed top-0 right-0 h-full z-30 bg-white border-l border-slate-200',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'w-full sm:w-[26rem]',
          'xl:static xl:z-auto xl:translate-x-0 xl:h-auto xl:flex-shrink-0',
          isOpen ? 'translate-x-0' : 'translate-x-full xl:hidden',
        ].join(' ')}
      >
        {/* ── Drawer header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-800">
            {isOfficer ? 'Manage Report' : 'Report Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100
                       transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Close details panel"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        {report && (
          <div className="flex-1 overflow-y-auto text-sm">

            {/* Report information section */}
            <div className="px-5 py-5 space-y-5">

              {/* ID + badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {report.id}
                </span>
                <SeverityBadge severity={report.severity} />
                <StatusBadge status={report.status} />
              </div>

              {/* Title */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Title</p>
                <p className="font-semibold text-slate-800 leading-snug">{report.title}</p>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{report.description}</p>
              </div>

              <hr className="border-slate-100" />

              <DetailRow label="Location"            value={report.location}                                   icon="📍" />
              <DetailRow label="Category"            value={report.category}                                   icon="🗂" />
              <DetailRow label="Date & Time Observed" value={formatDateTime(report.observed_at ?? report.created_at)} icon="🕐" />
              <DetailRow label="Submitted On"        value={formatDate(report.created_at)}                    icon="📅" />
              <DetailRow label="Reported By"         value={report.reported_by}                               icon="👤" />

              {report.precautions_taken ? (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Immediate Action Taken
                  </p>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{report.precautions_taken}</p>
                </div>
              ) : (
                <DetailRow label="Immediate Action Taken" value="None recorded" icon="🛡" muted />
              )}

              {report.photo_name && (
                <DetailRow label="Photo Evidence" value={`📎 ${report.photo_name}`} icon="📷" />
              )}
            </div>

            {/* ── Officer action section ─────────────────────────────────── */}
            {isOfficer && (
              <div className="border-t border-slate-200 px-5 py-5 space-y-5 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Officer Actions
                </p>

                {/* Feedback banner */}
                {feedback && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={[
                      'px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2',
                      feedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200',
                    ].join(' ')}
                  >
                    <span aria-hidden="true">{feedback.type === 'success' ? '✅' : '⚠'}</span>
                    {feedback.msg}
                  </div>
                )}

                {/* Status update */}
                <div className="space-y-2">
                  <label htmlFor="drawer-status" className="text-xs font-semibold text-slate-600 block">
                    Update Status
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="drawer-status"
                      value={draftStatus}
                      onChange={e => { setDraftStatus(e.target.value); setFeedback(null) }}
                      className="flex-1 py-2 pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleStatusSave}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold
                                 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                                 focus:ring-offset-2 whitespace-nowrap"
                    >
                      Save Status
                    </button>
                  </div>
                </div>

                {/* Corrective-action note */}
                <div className="space-y-2">
                  <label htmlFor="drawer-note" className="text-xs font-semibold text-slate-600 block">
                    Corrective-Action Note
                    <span className="ml-1 font-normal text-slate-400">(mock — not persisted)</span>
                  </label>
                  <textarea
                    id="drawer-note"
                    rows={3}
                    value={noteText}
                    onChange={e => { setNoteText(e.target.value); setFeedback(null) }}
                    placeholder="Describe the corrective action taken or planned…"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               resize-y min-h-[72px] placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleNoteSave}
                    className="w-full py-2 border border-slate-200 text-slate-700 text-xs font-semibold
                               rounded-lg hover:bg-white transition-colors focus:outline-none
                               focus:ring-2 focus:ring-slate-300"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}

// ─── Helper sub-component ─────────────────────────────────────────────────────

function DetailRow({ label, value, icon, muted = false }) {
  return (
    <div className="flex gap-3">
      <span className="text-base w-5 flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
        <p className={`mt-0.5 leading-snug ${muted ? 'text-slate-400 italic' : 'text-slate-700'}`}>{value}</p>
      </div>
    </div>
  )
}
