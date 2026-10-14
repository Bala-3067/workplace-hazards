---
inclusion: fileMatch
fileMatchPattern: "*.rules"
---

# Security Rules Guidelines

When editing `firestore.rules` or `storage.rules`, follow these constraints:

## Firestore rules
- Default deny-all wildcard `match /{document=**}` must stay at the top
- Role is read via `callerIsEmployee()` / `callerIsOfficer()` helper functions
- These helpers use `get()` with `.data.get('role', null)` — do NOT use `exists()` inside `allow create` rules (causes emulator evaluation errors)
- Do not call `callerIsEmployee/Officer` inside `allow update` on `/users/{uid}` — it creates a circular self-reference on the document being written
- Timestamps must be validated with `is timestamp`
- Email validation: use `email.size() > 0` only — `.matches()` with complex regex causes emulator evaluation errors
- `display_id` must never be settable by clients
- Notes sub-collection: `allow update, delete: if false` — always append-only
- `_counters`: `allow read, write: if false` always

## Storage rules
- Use separate `allow create`, `allow update`, `allow delete` — never `allow write`
- `allow delete: if false` always — deletion is Cloud Function only
- Image type: `request.resource.contentType.matches('image/(jpg|jpeg|png|gif|webp)')`
- Size limit: `request.resource.size <= 5 * 1024 * 1024`
- Do NOT use `request.auth.token.role` for officer access — not trusted
- Officer photo access in Phase 3A is via server-generated signed URLs

## Running tests after rule changes
Tests are in `tests/security-rules-enhanced.test.mjs`.
Run via `run-tests.bat` (emulators must be running first via `start.bat`).
Do not claim tests pass unless `run-tests.bat` actually exits 0.
