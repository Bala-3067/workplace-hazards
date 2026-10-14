# Workplace Hazard Reporting System — Requirements

> Extracted from the original project specification provided in the development
> conversation and from confirmed decisions made during Phase 3 planning.
> Nothing in this document is invented. Unknown or unconfirmed requirements are
> marked **[UNKNOWN — decision needed]**.

---

## 1. Project Overview

A responsive web application allowing employees to report workplace hazards and
safety officers to monitor, manage, and resolve those reports.

**Tech stack (confirmed):**
- Frontend: React 19 + Vite 8 + Tailwind CSS v4
- Backend: Firebase Authentication, Cloud Firestore, Firebase Storage
- Cloud Functions: required for trusted server-side logic (role assignment, HR-ID generation)
- Language: JavaScript

---

## 2. User Roles

### 2.1 Employee (default role)
Assigned automatically to every newly registered user via a Cloud Function.
Users must never be able to assign themselves a higher role.

**Permissions:**
- Register and sign in
- Submit new hazard reports
- Upload photos on a report they are submitting
- View their own submitted reports only
- Search and filter their own reports
- View full details of their own reports
- Track status updates on their own reports

**Restrictions:**
- Cannot view any other employee's reports
- Cannot change the status of any report
- Cannot add corrective-action notes
- Cannot access the officer dashboard

### 2.2 Safety Officer
Role assigned by a database administrator only — never by the user themselves
or through any self-service UI.

**Permissions:**
- View and manage all reports from all employees
- View full report details including photos
- Change report status (any of the 5 statuses)
- Add corrective-action / investigation notes
- View officer dashboard with statistics
- View urgent/critical hazard panel
- Filter by status, severity, category, and location

**Restrictions:**
- Cannot assign or remove the officer role via the UI
- Cannot delete reports (no delete permission via client)

### 2.3 Administrator
**[UNKNOWN — decision needed]**
The spec mentions administrative tasks (user role management) but does not
define a separate admin role or admin UI. Current plan: role promotion is done
directly in the Firebase console or via the Admin SDK by a developer.

---

## 3. Hazard Report Fields

| Field | Type | Required | Constraints |
|---|---|---|---|
| Display ID | string `HR-NNN` | Yes | Server-generated, sequential, atomic |
| Title | string | Yes | 5–100 characters |
| Description | string | Yes | 20–1000 characters |
| Workplace location / department | string | Yes | Min 2 characters |
| Hazard category | enum | Yes | See §3.1 |
| Severity level | enum | Yes | See §3.2 |
| Date and time observed | datetime | Yes | Defaults to current local time |
| Immediate action taken | string | No | Optional free text |
| Photo evidence | image file | No | JPEG, PNG, GIF, WebP, SVG; max 5 MB |

### 3.1 Hazard categories (fixed list)
- Electrical Hazards
- Fire Hazards
- Slips, Trips & Falls
- Machinery Hazards
- Chemical Hazards
- Ergonomic Hazards
- Other Hazards

### 3.2 Severity levels (fixed list)
- Low — minor, no immediate danger
- Medium — could cause injury if unaddressed
- High — likely to cause serious injury
- Critical — immediate danger to life or health

---

## 4. Report Status Workflow

Status transitions are controlled by safety officers only.
Employees cannot change status.

```
Submitted → Under Review → Action in Progress → Resolved → Closed
```

All five statuses must be selectable by officers (not enforced as a linear
one-way chain in the current design — officers may set any status).

**Status badge colours (UI):**
- Submitted: blue
- Under Review: purple
- Action in Progress: amber
- Resolved: emerald/green
- Closed: slate/grey

---

## 5. Employee Dashboard

- Summary stat cards: Total Reports, Open Reports, Critical Hazards, Resolved
- Recent reports table (desktop) / cards (mobile)
- Columns: ID, title, location, category, severity, date, status
- Search: title or location
- Filter: by status
- Empty state when no results

## 6. My Reports Page

- All reports submitted by the current signed-in employee
- Search: ID, title, or location
- Filters: status, severity
- Sort: newest / oldest
- Detail view: slide-in drawer (read-only for employees)
- Print layout: hides sidebar, topbar, and controls

## 7. Safety Officer Dashboard

- Summary stat cards: Total, Open, Critical/High, Resolved
- Urgent hazard panel: Critical + High severity, open status, top 5
- Full report management table (desktop) / cards (mobile)
- Search: ID, title, location
- Filters: status, severity, category
- Sort: newest / oldest
- Detail/manage drawer: read report + change status + add note

## 8. Corrective-Action Notes

Officers can add investigation and corrective-action notes to any report.
Notes must be recorded as an **append-only audit log** — previous notes are
never overwritten or deleted.

Each note stores:
- Note type: `status_change` | `officer_note` | `system`
- Body text
- Author ID and display name
- Old status / new status (for status_change type)
- Timestamp

**[UNKNOWN — decision needed]** Whether employees can see the notes on their
own reports in the current phase. Not addressed in the original spec.

---

## 9. Photo Requirements

- Accepted formats: JPEG, PNG, GIF, WebP, SVG
- Maximum file size: 5 MB (enforced both client-side and in Storage rules)
- Storage path: `hazard-photos/{reporterUid}/{reportId}/{filename}`
- Access: reporter can read own photos; officer can read all photos
- Photos are not publicly accessible
- URLs are generated on demand (Firebase `getDownloadURL`)
- Photo deletion after submission: **[UNKNOWN — decision needed]**

---

## 10. Authentication

- Provider: Firebase Email/Password
- Registration: open self-registration (any employee can create an account)
- New accounts: always receive `role: 'employee'` via a Cloud Function trigger,
  never from client-supplied data
- Role promotion to `officer`: admin-only, via Firebase console or Admin SDK
- Email verification: **[UNKNOWN — decision needed]**
- Session persistence: **[UNKNOWN — decision needed]** (browser local vs session)

---

## 11. User Profile

Each user has a Firestore document at `users/{uid}`:
- `full_name` — displayed in Topbar and report details
- `email` — from Firebase Auth
- `role` — `'employee'` | `'officer'`, never client-writable
- `department` — optional
- `created_at`, `updated_at` — timestamps

---

## 12. Security Requirements (confirmed)

- Firestore and Storage must default to **deny all**
- No unauthenticated access to any data
- No authenticated-but-wrong-role access to protected data
- Users cannot assign themselves roles
- Users cannot alter `reporter_id` on existing reports
- Users cannot change report IDs
- Service-account JSON, Admin SDK credentials, and private keys must never
  appear in frontend code
- Firebase config API key is public by design — security is enforced by rules

---

## 13. Report ID Generation

- Format: `HR-001`, `HR-002`, … (zero-padded to 3+ digits)
- Generated server-side by a Cloud Function using a Firestore transaction
  (atomic counter in `_counters/reports` document)
- Client never generates or supplies the display ID
- Firestore document ID remains the auto-generated Firestore ID (UUID-like);
  display ID is a separate field

---

## 14. Real-Time Updates

- Officer and employee dashboards use Firestore `onSnapshot` listeners for
  live updates without manual refresh
- This was confirmed as a requirement in Phase 3 planning

---

## 15. Implementation Phases

| Phase | Description | Status |
|---|---|---|
| T-01 | Vite + React + Tailwind scaffold | ✅ Complete |
| T-02 | AppLayout, Sidebar, Topbar | ✅ Complete |
| T-03 | Employee Dashboard (mock data) | ✅ Complete |
| T-04 | Hazard Report Form (mock submit) | ✅ Complete |
| T-05 | My Reports page (mock data) | ✅ Complete |
| T-06 | Safety Officer Dashboard (mock data) | ✅ Complete |
| T-07 | All Reports Page (officer) | ⏳ Stub |
| T-08 | Corrective Actions Page (officer) | ⏳ Stub |
| Phase 3A | Firebase foundation + auth + security rules | 🔄 In progress |
| Phase 3B | Firestore data layer (replace mock data) | ⏳ Pending |
| Phase 3C | Photo uploads (Firebase Storage) | ⏳ Pending |
| Phase 3D | Cloud Functions (role assignment, HR-IDs) | ⏳ Pending |
| Phase 4 | RLS / security hardening | ⏳ Pending |
| Phase 5 | Officer corrective-action workflow | ⏳ Pending |
| Phase 6 | Testing and deployment | ⏳ Pending |

---

## 16. Open Questions (decision needed before implementation)

| # | Question |
|---|---|
| Q1 | Should employees be required to verify their email before submitting reports? |
| Q2 | Session persistence: keep signed in after browser close, or expire on close? |
| Q3 | Can employees see corrective-action notes on their own reports? |
| Q4 | Can a reporter delete or replace a photo after submission? |
| Q5 | Is there a separate admin role/UI, or is admin access always via Firebase console? |
| Q6 | Should there be a maximum number of photos per report, or always one? |
