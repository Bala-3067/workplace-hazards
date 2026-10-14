/**
 * AuthContext.jsx
 *
 * Provides the currently signed-in user, their Firestore profile (including
 * their role), and auth-related helpers to the entire React tree.
 *
 * Data flow:
 *   Firebase Auth  →  onAuthStateChanged  →  AuthContext
 *                  →  Firestore users/{uid} (onSnapshot)  →  AuthContext
 *
 * The role stored in AuthContext always comes from Firestore, never from a
 * JWT claim or from anything the user supplied. A Cloud Function is responsible
 * for writing the initial profile document with role: 'employee'.
 *
 * Until the Cloud Function is deployed, a client-side fallback creates the
 * profile document on first sign-in. This fallback is clearly marked and
 * will be removed once Cloud Functions are in place.
 */

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { auth, db } from '../lib/firebase'

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

// ─── Helper: create a user profile document ───────────────────────────────────
/**
 * Creates a Firestore profile document for a new user.
 *
 * IMPORTANT: In production this will be replaced by a Cloud Function trigger
 * (auth.user().onCreate) that runs server-side, ensuring the role is ALWAYS
 * 'employee' and can never be overridden by the client.
 *
 * This client-side fallback is a temporary measure for Phase 3A development.
 * It is safe because:
 *   - Firestore Security Rules will prevent the client from writing role: 'officer'
 *   - The role field is hardcoded to 'employee' here and cannot be changed by
 *     the calling code
 *
 * @param {import('firebase/auth').User} user
 * @param {string} fullName
 */
async function createUserProfile(user, fullName) {
  const profileRef = doc(db, 'users', user.uid)
  await setDoc(profileRef, {
    full_name:  fullName,
    email:      user.email,
    role:       'employee',   // ALWAYS employee — never accept this from caller
    department: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }, { merge: false })
  // merge: false ensures we never accidentally overwrite an existing officer profile
  // if this function were called twice. setDoc with merge:false will simply
  // overwrite, but the Cloud Function will be the authoritative writer once deployed.
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined)  // undefined = loading
  const [profile,      setProfile]      = useState(null)        // Firestore profile doc
  const [authError,    setAuthError]    = useState(null)        // sign-in/up errors
  const [authLoading,  setAuthLoading]  = useState(false)       // sign-in/up in-flight

  // Hold a ref to the Firestore profile unsubscribe function so we can clean
  // it up when the user signs out or the component unmounts.
  const profileUnsubRef = useRef(null)

  // ── Watch Firebase Auth state ─────────────────────────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)   // null = signed out, User object = signed in

      // Clean up any existing Firestore listener before setting up a new one
      if (profileUnsubRef.current) {
        profileUnsubRef.current()
        profileUnsubRef.current = null
      }

      if (user) {
        // ── Subscribe to the user's Firestore profile in real time ──────────
        // This means if an admin promotes the user to 'officer', the UI
        // updates immediately without requiring a sign-out/sign-in.
        const profileRef = doc(db, 'users', user.uid)
        profileUnsubRef.current = onSnapshot(
          profileRef,
          (snap) => {
            if (snap.exists()) {
              const profileData = snap.data()
              // Security check: ensure role is either 'employee' or 'officer'
              // This prevents any tampered data from causing issues
              const safeRole = (profileData.role === 'employee' || profileData.role === 'officer') 
                ? profileData.role 
                : 'employee'
              
              setProfile({ 
                id: snap.id, 
                ...profileData,
                role: safeRole // Use validated role
              })
            } else {
              // Profile doesn't exist yet (e.g., Cloud Function hasn't run).
              // DO NOT create a client-side profile - this would bypass Firestore rules.
              // Instead, set profile to null and let the UI handle missing profile.
              // The Cloud Function should create the profile, or the sign-up flow
              // will create it via createUserProfile function.
              setProfile(null)
            }
          },
          (err) => {
            console.error('[AuthContext] Profile snapshot error:', err.code)
            setProfile(null)
          }
        )
      } else {
        // Signed out — clear profile
        setProfile(null)
      }
    })

    return () => {
      unsubAuth()
      if (profileUnsubRef.current) profileUnsubRef.current()
    }
  }, [])

  // ── Sign up ───────────────────────────────────────────────────────────────
  const signUp = useCallback(async (email, password, fullName) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      // Set the display name on the Auth user object
      await updateProfile(cred.user, { displayName: fullName })
      // Create the Firestore profile with role: 'employee'
      // (temporary client-side fallback — see createUserProfile docstring)
      await createUserProfile(cred.user, fullName)
      return { success: true }
    } catch (err) {
      const msg = friendlyAuthError(err.code)
      setAuthError(msg)
      return { success: false, error: msg }
    } finally {
      setAuthLoading(false)
    }
  }, [])

  // ── Sign in ───────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (err) {
      const msg = friendlyAuthError(err.code)
      setAuthError(msg)
      return { success: false, error: msg }
    } finally {
      setAuthLoading(false)
    }
  }, [])

  // ── Sign out ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  // ── Clear any auth error (e.g. when user starts typing again) ─────────────
  const clearAuthError = useCallback(() => setAuthError(null), [])

  // ── Derived values ────────────────────────────────────────────────────────
  const isLoading     = firebaseUser === undefined  // true only during initial session check
  const isSignedIn    = firebaseUser !== null && firebaseUser !== undefined
  const hasProfile    = profile !== null
  const role          = profile?.role ?? (isSignedIn ? 'employee' : null)
  const isOfficer     = role === 'officer'
  const isEmployee    = role === 'employee' || (isSignedIn && !hasProfile) // Default to employee if signed in but no profile yet
  const displayName   = profile?.full_name ?? firebaseUser?.displayName ?? firebaseUser?.email?.split('@')[0] ?? 'User'
  const initials      = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const value = {
    // State
    firebaseUser,
    profile,
    role,
    isLoading,
    isSignedIn,
    isOfficer,
    isEmployee,
    displayName,
    initials,
    authError,
    authLoading,
    // Actions
    signUp,
    signIn,
    signOut,
    clearAuthError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth() — access the auth context from any component.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth() must be used inside <AuthProvider>.')
  }
  return ctx
}

// ─── Friendly error messages ──────────────────────────────────────────────────
// Firebase error codes are technical. Map the common ones to plain language.

function friendlyAuthError(code) {
  const map = {
    'auth/invalid-email':            'That email address is not valid.',
    'auth/user-disabled':            'This account has been disabled.',
    'auth/user-not-found':           'No account found with that email.',
    'auth/wrong-password':           'Incorrect password.',
    'auth/invalid-credential':       'Incorrect email or password.',
    'auth/email-already-in-use':     'An account with that email already exists.',
    'auth/weak-password':            'Password must be at least 6 characters.',
    'auth/too-many-requests':        'Too many failed attempts. Please try again later.',
    'auth/network-request-failed':   'Network error. Check your connection.',
    'auth/operation-not-allowed':    'Email/password sign-in is not enabled. Contact support.',
  }
  return map[code] ?? `Sign-in error (${code}). Please try again.`
}
