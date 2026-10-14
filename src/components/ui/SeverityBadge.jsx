/**
 * SeverityBadge
 * Renders a colour-coded pill for Low / Medium / High / Critical severity.
 */

const styles = {
  Low:      'bg-slate-100  text-slate-700  ring-slate-300',
  Medium:   'bg-amber-100  text-amber-800  ring-amber-300',
  High:     'bg-orange-100 text-orange-800 ring-orange-300',
  Critical: 'bg-red-100    text-red-800    ring-red-300',
}

export default function SeverityBadge({ severity }) {
  const cls = styles[severity] ?? 'bg-slate-100 text-slate-600 ring-slate-300'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {severity}
    </span>
  )
}
