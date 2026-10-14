/**
 * firebase.js
 *
 * Initialises the Firebase app using Vite environment variables.
 * This file is the ONLY place in the frontend that reads Firebase config.
 *
 * Security notes:
 * - Firebase API keys are NOT secret. They identify the project so Firebase
 *   knows which project to talk to. Security is enforced by Firestore Security
 *   Rules and Storage Security Rules — NOT by keeping the key private.
 * - NEVER import the Firebase Admin SDK here. The Admin SDK bypasses all
 *   security rules and belongs only in Cloud Functions.
 * - NEVER hard-code config values here. They must come from .env so they are
 *   not committed to version control.
 *
 * All config values are validated at startup. If any are missing, the app
 * throws a clear error before any user action can occur.
 */

import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

// ─── Validate environment variables ──────────────────────────────────────────
// All six values are required. A missing value causes a build-time / startup
// error rather than a silent runtime failure.
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const missingVars = REQUIRED_ENV_VARS.filter(
  key => !import.meta.env[key]
)

if (missingVars.length > 0) {
  throw new Error(
    `[Firebase] Missing environment variables: ${missingVars.join(', ')}\n` +
    'Copy .env.example to .env and fill in your Firebase project values.'
  )
}

// ─── Firebase config object ───────────────────────────────────────────────────
// Values come from Vite env — NEVER log or expose these at runtime.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// ─── Initialize Firebase ──────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig)

// ─── Service exports ──────────────────────────────────────────────────────────
// Export only the service instances needed by the app. Nothing else from
// this file should be exported.
export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)

// ─── Emulator connections ─────────────────────────────────────────────────────
// When running locally with `firebase emulators:start`, Vite sets
// VITE_USE_EMULATORS=true (see .env.example). This block connects the SDK
// to the local emulators instead of production Firebase.
//
// This block is ONLY active during local development. It is never active in
// a production build because the env var is not set in production.
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth,       'http://localhost:9099',             { disableWarnings: true })
  connectFirestoreEmulator(db,    'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 9199)
  console.info('[Firebase] Connected to local emulators.')
}
