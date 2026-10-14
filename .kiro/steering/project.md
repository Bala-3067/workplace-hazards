# Hazard Reporting System — Project Steering

## What this project is
A workplace hazard reporting web app. Employees submit hazard reports; safety officers review and action them. Built with React 19, Vite, Tailwind CSS 4, and Firebase (Auth, Firestore, Storage).

## Tech stack
- **Frontend**: React 19, Vite 8, Tailwind CSS 4, `@tailwindcss/vite`
- **Backend/DB**: Firebase 11 — Firestore, Auth (email/password), Storage
- **Linter**: oxlint (`npm run lint`)
- **Security tests**: `@firebase/rules-unit-testing@4.0.1`, Node built-in test runner
- **Runtime**: Node 24, Java 21 required for Firestore emulator

## Project structure
```
src/
  pages/          — full-page route components
  components/
    ui/           — reusable display components (badges, cards, drawers)
    layout/       — AppLayout, Sidebar, Topbar
  context/        — AuthContext (role, profile, signIn/signUp/signOut)
  lib/            — firebase.js (single Firebase init, emulator wiring)
  data/           — static lookup data (categories, severities, etc.)
firestore.rules   — Firestore security rules
storage.rules     — Storage security rules
tests/            — security rules tests (run against emulator only)
```

## Roles
- **employee** — submits reports, reads own reports and notes
- **officer** — reads all reports, updates status, adds notes
- Role is always read from Firestore `users/{uid}.role`, never from JWT claims

## Key conventions
- Role is sourced from Firestore, not auth tokens
- `display_id` (e.g. HR-001) is set by Cloud Function, never by the client
- All timestamps must be Firestore `Timestamp`, not JS `Date`
- Report `status` on create must always be `'Submitted'`
- No client-side deletes of any document or file
- Notes are append-only — no update or delete
- `_counters` collection is server-managed only, no client access

## Firebase emulator ports
| Service   | Port |
|-----------|------|
| Auth      | 9099 |
| Firestore | 8080 |
| Storage   | 9199 |
| UI        | 4000 |

## How to run
- **Everything at once**: double-click `start.bat`
- **Dev server only**: `dev.bat` or `npm run dev`
- **Emulators only**: run `start.bat` then kill the Vite window, or open a cmd window and run the firebase command with JAVA_HOME set (see start.bat for exact command)
- **Security tests**: `run-tests.bat` (emulators must already be running)
- **Build**: `build.bat` or `npm run build`

## Environment
- `.env` is required and gitignored — copy `.env.example` and fill in Firebase config
- `VITE_USE_EMULATORS=true` in `.env` connects to local emulators
- Never commit `.env`

## Phase status
- ✅ Phase 3A: Security rules written and tested against emulator
- ❌ Phase 3B: Cloud Functions (display_id generation, officer custom claims) — not started
- ❌ Phase 3C: Officer photo access via signed URLs — not started
- ❌ Connecting report pages to live Firestore — not started, do not do this yet
- ❌ Deployment — not started, do not deploy

## Do not
- Deploy Firebase rules or the app
- Connect real Firestore data to report pages
- Modify `.firebaserc` without verifying the project ID first
- Print or log `.env` contents
- Trust `request.auth.token.role` in Storage rules — use signed URLs for officer photo access
