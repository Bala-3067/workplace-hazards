import { useState } from 'react'
import FormField from '../components/ui/FormField'
import SeverityBadge from '../components/ui/SeverityBadge'
import StatusBadge from '../components/ui/StatusBadge'
import { CATEGORIES, SEVERITIES } from '../data/mockReports'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

/** Returns "YYYY-MM-DDTHH:MM" in local time — the value format <input type="datetime-local"> needs. */
function localDateTimeValue() {
  const now = new Date()
  // Pad to ensure correct format
  const pad = n => String(n).padStart(2, '0')
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}`
  )
}

/** Generate the next report ID based on the existing list, e.g. "HR-008" */
function generateId(reports) {
  if (!reports.length) return 'HR-001'
  const highest = reports.reduce((max, r) => {
    const n = parseInt(r.id.replace('HR-', ''), 10)
    return isNaN(n) ? max : Math.max(max, n)
  }, 0)
  return `HR-${String(highest + 1).padStart(3, '0')}`
}

// ─── Shared input class ───────────────────────────────────────────────────────
// Applied to every text/select/textarea so they all look identical.
const inputCls = (hasError) =>
  [
    'w-full px-3 py-2 text-sm rounded-lg border bg-white',
    'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent',
    'transition-colors placeholder:text-slate-400',
    hasError ? 'border-red-400 bg-red-50' : 'border-slate-200',
  ].join(' ')

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(fields, photo) {
  const errs = {}

  if (!fields.title.trim())
    errs.title = 'Hazard title is required.'
  else if (fields.title.trim().length < 5)
    errs.title = 'Title must be at least 5 characters.'
  else if (fields.title.trim().length > 100)
    errs.title = 'Title must be 100 characters or fewer.'

  if (!fields.description.trim())
    errs.description = 'Description is required.'
  else if (fields.description.trim().length < 20)
    errs.description = 'Description must be at least 20 characters.'
  else if (fields.description.trim().length > 1000)
    errs.description = 'Description must be 1 000 characters or fewer.'

  if (!fields.location.trim())
    errs.location = 'Workplace location is required.'

  if (!fields.category)
    errs.category = 'Please select a hazard category.'

  if (!fields.severity)
    errs.severity = 'Please select a severity level.'

  if (!fields.observedAt)
    errs.observedAt = 'Date and time observed is required.'

  if (photo) {
    if (!ACCEPTED_IMAGE_TYPES.includes(photo.type))
      errs.photo = 'Only JPEG, PNG, GIF, WebP, or SVG images are accepted.'
    else if (photo.size > MAX_FILE_BYTES)
      errs.photo = 'Image must be 5 MB or smaller.'
  }

  return errs
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * NewReportPage
 *
 * Props:
 *   reports          — Report[] current list (used to generate the next ID)
 *   onReportSubmitted — (newReport) => void  callback to App.jsx
 *   onNavigate        — (pageId) => void
 */
export default function NewReportPage({ reports = [], onReportSubmitted, onNavigate }) {
  // ── Form state ──────────────────────────────────────────────────────────────
  const blankForm = {
    title:       '',
    description: '',
    location:    '',
    category:    '',
    severity:    '',
    observedAt:  localDateTimeValue(),
    precautions: '',
  }

  const [fields,      setFields]      = useState(blankForm)
  const [photo,       setPhoto]       = useState(null)      // File | null
  const [photoPreview, setPhotoPreview] = useState(null)    // object URL | null
  const [errors,      setErrors]      = useState({})
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(null)      // the created report | null

  // ── Field helpers ───────────────────────────────────────────────────────────

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    // Clear the error for this field as soon as the user edits it
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0] ?? null
    // Always revoke the previous preview URL to avoid memory leaks
    if (photoPreview) URL.revokeObjectURL(photoPreview)

    if (!file) {
      setPhoto(null)
      setPhotoPreview(null)
      setErrors(prev => ({ ...prev, photo: undefined }))
      return
    }

    // Validate immediately so the user gets instant feedback
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setPhoto(null)
      setPhotoPreview(null)
      setErrors(prev => ({ ...prev, photo: 'Only JPEG, PNG, GIF, WebP, or SVG images are accepted.' }))
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setPhoto(null)
      setPhotoPreview(null)
      setErrors(prev => ({ ...prev, photo: 'Image must be 5 MB or smaller.' }))
      e.target.value = ''
      return
    }

    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setErrors(prev => ({ ...prev, photo: undefined }))
  }

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null)
    setPhotoPreview(null)
    setErrors(prev => ({ ...prev, photo: undefined }))
    // Reset the file input so the same file can be re-selected if needed
    const input = document.getElementById('photo')
    if (input) input.value = ''
  }

  // ── Submission ──────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(fields, photo)
    if (Object.keys(errs).length) {
      setErrors(errs)
      // Scroll to the first error so it's visible on mobile
      const firstErrorId = Object.keys(errs)[0]
      document.getElementById(firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)

    // Simulate a brief async operation (e.g. future API call)
    await new Promise(resolve => setTimeout(resolve, 600))

    const newReport = {
      id:               generateId(reports),
      title:            fields.title.trim(),
      description:      fields.description.trim(),
      location:         fields.location.trim(),
      category:         fields.category,
      severity:         fields.severity,
      status:           'Submitted',
      reported_by:      'John Doe',             // mock — replaced by auth in Phase 3
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
      precautions_taken: fields.precautions.trim(),
      observed_at:      new Date(fields.observedAt).toISOString(),
      photo_name:       photo ? photo.name : null,
    }

    onReportSubmitted(newReport)
    setSubmitting(false)
    setSubmitted(newReport)

    // Clean up the preview URL now that we're done with it
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
  }

  function handleSubmitAnother() {
    setFields(blankForm)
    setPhoto(null)
    setPhotoPreview(null)
    setErrors({})
    setSubmitted(null)
  }

  // ─── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-2xl">
            ✅
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Report Submitted</h2>
            <p className="text-slate-500 text-sm mt-1">
              Your hazard report has been submitted to the safety team.
            </p>
          </div>

          {/* Summary card */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-left space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Report ID</span>
              <span className="font-mono font-semibold text-slate-800">{submitted.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Severity</span>
              <SeverityBadge severity={submitted.severity} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={submitted.status} />
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-500 shrink-0">Title</span>
              <span className="text-slate-700 text-right">{submitted.title}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            The safety team will review your report and update the status shortly.
            You can track progress in your dashboard.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm
                         font-semibold rounded-lg transition-colors focus:outline-none
                         focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleSubmitAnother}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm
                         font-semibold rounded-lg hover:bg-slate-50 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Report a Hazard</h2>
        <p className="text-slate-500 text-sm mt-1">
          Accurate details help the safety team respond quickly and effectively.
          Fields marked <span className="text-red-500 font-medium">*</span> are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="Hazard report form">

        {/* ── Section 1: Hazard details ──────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Hazard Details
          </h3>

          {/* Title */}
          <FormField
            id="title"
            label="Hazard Title"
            required
            hint="Give a short, clear title, e.g. 'Exposed wiring near server rack'"
            error={errors.title}
          >
            <input
              id="title"
              name="title"
              type="text"
              value={fields.title}
              onChange={handleChange}
              placeholder="e.g. Exposed wiring near server rack"
              maxLength={100}
              aria-describedby={errors.title ? 'title-error' : undefined}
              aria-invalid={!!errors.title}
              className={inputCls(!!errors.title)}
            />
            <p className="text-xs text-slate-400 text-right -mt-0.5">
              {fields.title.length}/100
            </p>
          </FormField>

          {/* Description */}
          <FormField
            id="description"
            label="Hazard Description"
            required
            hint="Describe exactly what the hazard is, where it is, and who might be affected."
            error={errors.description}
          >
            <textarea
              id="description"
              name="description"
              rows={4}
              value={fields.description}
              onChange={handleChange}
              placeholder="Describe the hazard in detail…"
              maxLength={1000}
              aria-describedby={errors.description ? 'description-error' : undefined}
              aria-invalid={!!errors.description}
              className={`${inputCls(!!errors.description)} resize-y min-h-[96px]`}
            />
            <p className="text-xs text-slate-400 text-right -mt-0.5">
              {fields.description.length}/1000
            </p>
          </FormField>

          {/* Location */}
          <FormField
            id="location"
            label="Workplace Location / Department"
            required
            hint="Be specific, e.g. 'Warehouse — Bay 3' or 'Finance Department — Floor 4'"
            error={errors.location}
          >
            <input
              id="location"
              name="location"
              type="text"
              value={fields.location}
              onChange={handleChange}
              placeholder="e.g. Production Floor — North Wing"
              aria-describedby={errors.location ? 'location-error' : undefined}
              aria-invalid={!!errors.location}
              className={inputCls(!!errors.location)}
            />
          </FormField>
        </section>

        {/* ── Section 2: Classification ──────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 mt-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Classification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Category */}
            <FormField
              id="category"
              label="Hazard Category"
              required
              error={errors.category}
            >
              <select
                id="category"
                name="category"
                value={fields.category}
                onChange={handleChange}
                aria-describedby={errors.category ? 'category-error' : undefined}
                aria-invalid={!!errors.category}
                className={inputCls(!!errors.category)}
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </FormField>

            {/* Severity */}
            <FormField
              id="severity"
              label="Severity Level"
              required
              error={errors.severity}
            >
              <select
                id="severity"
                name="severity"
                value={fields.severity}
                onChange={handleChange}
                aria-describedby={errors.severity ? 'severity-error' : undefined}
                aria-invalid={!!errors.severity}
                className={inputCls(!!errors.severity)}
              >
                <option value="">Select severity…</option>
                {SEVERITIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Severity guide */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { level: 'Low',      desc: 'Minor, no immediate danger' },
              { level: 'Medium',   desc: 'Could cause injury if unaddressed' },
              { level: 'High',     desc: 'Likely to cause serious injury' },
              { level: 'Critical', desc: 'Immediate danger to life or health' },
            ].map(({ level, desc }) => (
              <div key={level} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="pt-0.5"><SeverityBadge severity={level} /></div>
                <p className="text-xs text-slate-500 leading-tight">{desc}</p>
              </div>
            ))}
          </div>

          {/* Date / time observed */}
          <FormField
            id="observedAt"
            label="Date and Time Observed"
            required
            hint="When did you first notice this hazard?"
            error={errors.observedAt}
          >
            <input
              id="observedAt"
              name="observedAt"
              type="datetime-local"
              value={fields.observedAt}
              onChange={handleChange}
              aria-describedby={errors.observedAt ? 'observedAt-error' : undefined}
              aria-invalid={!!errors.observedAt}
              className={inputCls(!!errors.observedAt)}
            />
          </FormField>
        </section>

        {/* ── Section 3: Additional information ─────────────────────────── */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 mt-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Additional Information
          </h3>

          {/* Immediate action */}
          <FormField
            id="precautions"
            label="Immediate Action Taken"
            hint="Optional — describe any steps you have already taken to reduce the risk."
            error={errors.precautions}
          >
            <textarea
              id="precautions"
              name="precautions"
              rows={3}
              value={fields.precautions}
              onChange={handleChange}
              placeholder="e.g. Cordoned off area with hazard tape and informed supervisor."
              className={`${inputCls(false)} resize-y min-h-[72px]`}
            />
          </FormField>

          {/* Photo upload */}
          <FormField
            id="photo"
            label="Photo Evidence"
            hint="Optional — JPEG, PNG, GIF, WebP, or SVG. Maximum 5 MB."
            error={errors.photo}
          >
            {/* Show preview if a valid photo is selected */}
            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Selected photo preview"
                  className="w-full max-h-48 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 w-7 h-7 bg-slate-800/70 hover:bg-red-600
                             text-white rounded-full flex items-center justify-center text-sm
                             transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                  aria-label="Remove selected photo"
                >
                  ✕
                </button>
                <p className="text-xs text-slate-500 mt-1.5">
                  📎 {photo.name} ({(photo.size / 1024).toFixed(0)} KB)
                </p>
              </div>
            ) : (
              /* Upload zone */
              <label
                htmlFor="photo"
                className={[
                  'flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-lg border-2',
                  'border-dashed cursor-pointer transition-colors',
                  errors.photo
                    ? 'border-red-300 bg-red-50 hover:bg-red-100'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300',
                ].join(' ')}
              >
                <span className="text-3xl" aria-hidden="true">📷</span>
                <span className="text-sm font-medium text-slate-600">Click to select a photo</span>
                <span className="text-xs text-slate-400">JPEG, PNG, GIF, WebP, SVG — max 5 MB</span>
                <input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handlePhotoChange}
                  className="sr-only"
                  aria-describedby={errors.photo ? 'photo-error' : undefined}
                />
              </label>
            )}
          </FormField>
        </section>

        {/* ── Form actions ───────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold
                       rounded-lg hover:bg-slate-50 transition-colors focus:outline-none
                       focus:ring-2 focus:ring-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300
                       text-white text-sm font-semibold rounded-lg shadow-sm transition-colors
                       focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2
                       flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <>
                <span aria-hidden="true">⚠</span>
                Submit Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
