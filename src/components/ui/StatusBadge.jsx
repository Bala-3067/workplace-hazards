/**
 * StatusBadge
 * Renders a colour-coded pill for each report status in the workflow.
 */

const styles = {
  'Submitted':          'bg-blue-50    text-blue-800    ring-blue-300',
  'Under Review':       'bg-purple-50  text-purple-800  ring-purple-300',
  'Action in Progress': 'bg-amber-50   text-amber-800   ring-amber-300',
  'Resolved':           'bg-emerald-50 text-emerald-800 ring-emerald-300',
  'Closed':             'bg-slate-100  text-slate-600   ring-slate-300',
}

// Dot colour matching the badge
const dotStyles = {
  'Submitted':          'bg-blue-500',
  'Under Review':       'bg-purple-500',
  'Action in Progress': 'bg-amber-500',
  'Resolved':           'bg-emerald-500',
  'Closed':             'bg-slate-400',
}

export default function StatusBadge({ status }) {
  const cls    = styles[status]    ?? 'bg-slate-100 text-slate-600 ring-slate-300'
  const dotCls = dotStyles[status] ?? 'bg-slate-400'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} aria-hidden="true" />
      {status}
    </span>
  )
}
