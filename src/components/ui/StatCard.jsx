/**
 * StatCard
 * Displays a single KPI metric with an icon, label, value, and optional accent colour.
 *
 * Props:
 *   label       — string, e.g. "Total Reports"
 *   value       — number
 *   icon        — emoji or string used as the icon
 *   accentClass — Tailwind bg class for the icon background, e.g. "bg-blue-100"
 *   iconClass   — Tailwind text class for the icon colour, e.g. "text-blue-600"
 */
export default function StatCard({ label, value, icon, accentClass = 'bg-slate-100', iconClass = 'text-slate-600' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${accentClass}`}>
        <span className={iconClass} aria-hidden="true">{icon}</span>
      </div>
      {/* Text */}
      <div>
        <p className="text-sm text-slate-500 leading-tight">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}
