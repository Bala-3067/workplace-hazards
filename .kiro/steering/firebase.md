---
inclusion: fileMatch
fileMatchPattern: "src/lib/firebase.js"
---

# Firebase Client Guidelines

## Initialization (`src/lib/firebase.js`)
- All six `VITE_FIREBASE_*` env vars are validated at startup — missing any throws immediately
- Emulator connections are wired when `VITE_USE_EMULATORS=true`
- Never import Firebase Admin SDK in the frontend
- Never hard-code config values — always use `import.meta.env`

## AuthContext (`src/context/AuthContext.jsx`)
- Role always comes from Firestore `users/{uid}.role` via `onSnapshot`
- The `onSnapshot` fallback when profile doesn't exist must set `profile` to `null`, not a fake object with `role: 'employee'` — that bypasses Firestore rules
- `createUserProfile` hardcodes `role: 'employee'` and is a temporary client-side fallback until Cloud Functions are deployed
- Derived `role` in context falls back to `'employee'` only when signed in — never fabricate an officer role client-side
- The `safeRole` guard ensures only `'employee'` or `'officer'` values are used from Firestore

## Firestore writes from components
- Always use `serverTimestamp()` for `created_at` and `updated_at` when writing from React components (not `new Date()` or `Timestamp.now()`)
- `serverTimestamp()` is from `'firebase/firestore'`
- Never set `display_id` from client code

## Storage uploads
- Upload path must be `hazard-photos/{uid}/{reportId}/{filename}`
- Validate file type and size client-side before attempting upload (mirrors server rules)
- Never attempt to delete files from client code
