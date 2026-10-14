/**
 * FormField
 * Wraps a form control with a label, optional required marker,
 * hint text, and an accessible error message.
 *
 * Props:
 *   id       — links <label> to the control via htmlFor
 *   label    — visible label text
 *   required — shows a red asterisk when true
 *   hint     — optional small hint below the label
 *   error    — error string; renders the error message when non-empty
 *   children — the actual <input>, <select>, or <textarea>
 */
export default function FormField({ id, label, required = false, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      {/* Label row */}
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">*</span>
        )}
      </label>

      {/* Optional hint */}
      {hint && (
        <p className="text-xs text-slate-400 -mt-0.5">{hint}</p>
      )}

      {/* Control */}
      {children}

      {/* Error message — linked to the field via aria-describedby on the input */}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}
