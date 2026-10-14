/**
 * LoginPage.jsx
 *
 * Sign-in and self-registration form.
 * Rendered by App.jsx when no authenticated session exists.
 *
 * Uses AuthContext for sign-in / sign-up logic.
 * All error messages come from AuthContext (never raw Firebase error codes).
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// ─── Validation ───────────────────────────────────────────────────────────────

function validateSignIn(email, password) {
  const errors = {}
  if (!email.trim())       errors.email    = 'Email is required.'
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email address.'
  if (!password)           errors.password = 'Password is required.'
  return errors
}

function validateSignUp(email, password, confirmPassword, fullName) {
  const errors = {}
  if (!fullName.trim())    errors.fullName = 'Full name is required.'
  else if (fullName.trim().length < 2) errors.fullName = 'Full name must be at least 2 characters.'
  if (!email.trim())       errors.email    = 'Email is required.'
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email address.'
  if (!password)           errors.password = 'Password is required.'
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters.'
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls = (hasError) =>
  [
    'w-full px-3 py-2 text-sm rounded-lg border bg-white',
    'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent',
    'transition-colors placeholder:text-slate-400',
    hasError ? 'border-red-400 bg-red-50' : 'border-slate-200',
  ].join(' ')

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { signIn, signUp, authLoading, authError, clearAuthError } = useAuth()

  const [mode,   setMode]   = useState('signin')   // 'signin' | 'signup'
  const [fields, setFields] = useState({
    email: '', password: '', confirmPassword: '', fullName: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [successMsg,  setSuccessMsg]  = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name])  setFieldErrors(prev => ({ ...prev, [name]: undefined }))
    if (authError)          clearAuthError()
    if (successMsg)         setSuccessMsg('')
  }

  function switchMode(newMode) {
    setMode(newMode)
    setFields({ email: '', password: '', confirmPassword: '', fullName: '' })
    setFieldErrors({})
    setSuccessMsg('')
    clearAuthError()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccessMsg('')

    if (mode === 'signin') {
      const errors = validateSignIn(fields.email, fields.password)
      if (Object.keys(errors).length) { setFieldErrors(errors); return }
      await signIn(fields.email, fields.password)
      // App.jsx will redirect automatically once isSignedIn becomes true
    } else {
      const errors = validateSignUp(
        fields.email, fields.password, fields.confirmPassword, fields.fullName
      )
      if (Object.keys(errors).length) { setFieldErrors(errors); return }
      const result = await signUp(fields.email, fields.password, fields.fullName)
      if (result.success) {
        setSuccessMsg('Account created! Signing you in…')
      }
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">

      {/* App logo / brand */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center">
          <span className="text-white text-2xl" aria-hidden="true">⚠</span>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800 leading-tight">Hazard Reporting</p>
          <p className="text-xs text-slate-500">Workplace Safety System</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-sm p-8">

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-slate-100 p-1 mb-6 gap-1">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={[
              'flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors',
              mode === 'signin'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={[
              'flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors',
              mode === 'signup'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Full name — sign-up only */}
          {mode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                Full Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fields.fullName}
                onChange={handleChange}
                placeholder="e.g. Jane Smith"
                aria-invalid={!!fieldErrors.fullName}
                aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                className={inputCls(!!fieldErrors.fullName)}
              />
              {fieldErrors.fullName && (
                <p id="fullName-error" role="alert" className="text-xs text-red-600">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email Address <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete={mode === 'signin' ? 'email' : 'new-email'}
              value={fields.email}
              onChange={handleChange}
              placeholder="you@company.com"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              className={inputCls(!!fieldErrors.email)}
            />
            {fieldErrors.email && (
              <p id="email-error" role="alert" className="text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={fields.password}
              onChange={handleChange}
              placeholder={mode === 'signup' ? 'Minimum 6 characters' : ''}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className={inputCls(!!fieldErrors.password)}
            />
            {fieldErrors.password && (
              <p id="password-error" role="alert" className="text-xs text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Confirm password — sign-up only */}
          {mode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm Password <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={fields.confirmPassword}
                onChange={handleChange}
                aria-invalid={!!fieldErrors.confirmPassword}
                aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                className={inputCls(!!fieldErrors.confirmPassword)}
              />
              {fieldErrors.confirmPassword && (
                <p id="confirmPassword-error" role="alert" className="text-xs text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Firebase auth error banner */}
          {authError && (
            <div role="alert" className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg
                                          text-xs text-red-700 flex items-center gap-2">
              <span aria-hidden="true">⚠</span>
              {authError}
            </div>
          )}

          {/* Success banner */}
          {successMsg && (
            <div role="status" className="px-3 py-2 bg-emerald-50 border border-emerald-200
                                          rounded-lg text-xs text-emerald-700 flex items-center gap-2">
              <span aria-hidden="true">✅</span>
              {successMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300
                       text-white text-sm font-semibold rounded-lg shadow-sm transition-colors
                       focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2
                       flex items-center justify-center gap-2 mt-2"
          >
            {authLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full
                                  animate-spin" aria-hidden="true" />
                {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Sign-up note */}
        {mode === 'signup' && (
          <p className="mt-4 text-xs text-slate-400 text-center leading-relaxed">
            New accounts are automatically registered as employees.
            Contact your safety administrator to request officer access.
          </p>
        )}
      </div>
    </div>
  )
}
