/**
 * security-rules-enhanced.test.mjs
 *
 * Phase 3A security rules tests — Firestore + Storage.
 * Runs against the Firebase Emulator, never against production.
 *
 * Start emulators first:
 *   firebase emulators:start --only firestore,auth,storage
 *
 * Run via launcher (sets correct cwd):
 *   node tests/run-tests.mjs
 */

import { after, before, describe, it } from 'node:test'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage'
import { Timestamp } from 'firebase/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const PROJECT_ID = 'hazard-reporting-test'

const EMPLOYEE_A_UID = 'employee-a-uid'
const EMPLOYEE_B_UID = 'employee-b-uid'
const OFFICER_UID    = 'officer-uid'
const NEW_USER_UID   = 'new-user-uid'

let testEnv

// ─── Setup / teardown ────────────────────────────────────────────────────────

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(join(__dirname, '..', 'firestore.rules'), 'utf8'),
      host:  'localhost',
      port:  8080,
    },
    storage: {
      rules: readFileSync(join(__dirname, '..', 'storage.rules'), 'utf8'),
      host:  'localhost',
      port:  9199,
    },
  })

  // Seed data bypassing rules
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()

    await db.doc(`users/${EMPLOYEE_A_UID}`).set({
      full_name: 'Alice Employee', email: 'alice@test.com',
      role: 'employee', department: null,
      created_at: Timestamp.now(), updated_at: Timestamp.now(),
    })
    await db.doc(`users/${EMPLOYEE_B_UID}`).set({
      full_name: 'Bob Employee', email: 'bob@test.com',
      role: 'employee', department: null,
      created_at: Timestamp.now(), updated_at: Timestamp.now(),
    })
    await db.doc(`users/${OFFICER_UID}`).set({
      full_name: 'Sarah Officer', email: 'sarah@test.com',
      role: 'officer', department: null,
      created_at: Timestamp.now(), updated_at: Timestamp.now(),
    })

    // Seeded report owned by Employee A
    await db.doc('hazard_reports/report-a-1').set({
      title: 'Wet floor', description: 'Slippery surface near entrance.',
      location: 'Main Lobby', category: 'Slips, Trips & Falls',
      severity: 'High', status: 'Submitted',
      reporter_id: EMPLOYEE_A_UID,
      observed_at: Timestamp.now(), created_at: Timestamp.now(), updated_at: Timestamp.now(),
    })
    // Seeded report owned by Employee B
    await db.doc('hazard_reports/report-b-1').set({
      title: "Bob's hazard", description: 'Unsafe near bay 3.',
      location: 'Warehouse Bay 3', category: 'Machinery Hazards',
      severity: 'Medium', status: 'Submitted',
      reporter_id: EMPLOYEE_B_UID,
      observed_at: Timestamp.now(), created_at: Timestamp.now(), updated_at: Timestamp.now(),
    })
    // Seeded note on report-a-1 (used by note-deletion tests)
    await db.doc('hazard_reports/report-a-1/notes/immutable-note').set({
      type: 'officer_note', body: 'Original.',
      author_id: OFFICER_UID, author_name: 'Sarah Officer',
      created_at: Timestamp.now(),
    })
  })
})

after(async () => {
  await testEnv.cleanup()
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const db    = (uid) => testEnv.authenticatedContext(uid).firestore()
const store = (uid) => testEnv.authenticatedContext(uid).storage()
const dbAnon = ()   => testEnv.unauthenticatedContext().firestore()

// ─── 1. User profiles ────────────────────────────────────────────────────────

describe('User profiles — create', () => {
  it('allows creating own profile with role employee', () =>
    assertSucceeds(
      db(NEW_USER_UID).doc(`users/${NEW_USER_UID}`).set({
        full_name: 'New User', email: 'new@test.com',
        role: 'employee', department: null,
        created_at: Timestamp.now(), updated_at: Timestamp.now(),
      })
    ))

  it('rejects creating profile for a different uid', () =>
    assertFails(
      db(NEW_USER_UID).doc(`users/${EMPLOYEE_A_UID}`).set({
        full_name: 'Imposter', email: 'x@test.com',
        role: 'employee', department: null,
        created_at: Timestamp.now(), updated_at: Timestamp.now(),
      })
    ))

  it('rejects role: officer on create (self-grant)', () =>
    assertFails(
      db(NEW_USER_UID).doc(`users/${NEW_USER_UID}`).set({
        full_name: 'Escalation', email: 'esc@test.com',
        role: 'officer',                    // ← must be rejected
        department: null,
        created_at: Timestamp.now(), updated_at: Timestamp.now(),
      })
    ))

  it('rejects missing role field', () =>
    assertFails(
      db(NEW_USER_UID).doc(`users/${NEW_USER_UID}`).set({
        full_name: 'No Role', email: 'nr@test.com',
        department: null,
        created_at: Timestamp.now(), updated_at: Timestamp.now(),
      })
    ))

  it('rejects empty full_name', () =>
    assertFails(
      db(NEW_USER_UID).doc(`users/${NEW_USER_UID}`).set({
        full_name: '', email: 'empty@test.com',
        role: 'employee', department: null,
        created_at: Timestamp.now(), updated_at: Timestamp.now(),
      })
    ))

  it('rejects empty email', () =>
    assertFails(
      db(NEW_USER_UID).doc(`users/${NEW_USER_UID}`).set({
        full_name: 'Bad Email', email: '',  // empty — rejected by size() > 0
        role: 'employee', department: null,
        created_at: Timestamp.now(), updated_at: Timestamp.now(),
      })
    ))
})

describe('User profiles — self-promotion prevention', () => {
  it('employee cannot update own role to officer', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc(`users/${EMPLOYEE_A_UID}`).update({
        role: 'officer',
      })
    ))

  it('employee cannot change created_at on update', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc(`users/${EMPLOYEE_A_UID}`).update({
        full_name: 'Updated Name',
        created_at: Timestamp.now(),   // ← immutable
        updated_at: Timestamp.now(),
      })
    ))

  it('unauthenticated cannot read any profile', () =>
    assertFails(
      dbAnon().doc(`users/${EMPLOYEE_A_UID}`).get()
    ))
})

// ─── 2. Hazard reports — create ──────────────────────────────────────────────

describe('Hazard reports — valid create', () => {
  it('employee can create a valid report', () =>
    assertSucceeds(
      db(EMPLOYEE_A_UID).doc('hazard_reports/new-valid').set({
        title: 'Exposed wiring', description: 'Near server room entrance.',
        location: 'Floor 2', category: 'Electrical Hazards',
        severity: 'High', status: 'Submitted',
        reporter_id: EMPLOYEE_A_UID,
        observed_at: Timestamp.now(), created_at: Timestamp.now(), updated_at: Timestamp.now(),
      })
    ))
})

describe('Hazard reports — field validation', () => {
  const base = {
    title: 'Test', description: 'Desc', location: 'Loc',
    category: 'Electrical Hazards', severity: 'Medium', status: 'Submitted',
    reporter_id: EMPLOYEE_A_UID,
    observed_at: Timestamp.now(), created_at: Timestamp.now(), updated_at: Timestamp.now(),
  }

  it('rejects invalid category', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/bad-cat').set({
        ...base, category: 'Made Up Hazard',
      })
    ))

  it('rejects invalid severity', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/bad-sev').set({
        ...base, severity: 'Extreme',
      })
    ))

  it('rejects non-Submitted initial status', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/bad-status').set({
        ...base, status: 'Resolved',
      })
    ))

  it('rejects client-supplied display_id', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/bad-did').set({
        ...base, display_id: 'HR-999',
      })
    ))

  it('rejects reporter_id that differs from auth uid (impersonation)', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/bad-rid').set({
        ...base, reporter_id: EMPLOYEE_B_UID,
      })
    ))

  it('rejects missing mandatory field (description)', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/missing-desc').set({
        title: 'No Desc', location: 'Loc',
        category: 'Electrical Hazards', severity: 'Medium', status: 'Submitted',
        reporter_id: EMPLOYEE_A_UID,
        observed_at: Timestamp.now(), created_at: Timestamp.now(), updated_at: Timestamp.now(),
      })
    ))

  it('rejects empty title', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/empty-title').set({
        ...base, title: '',
      })
    ))

  it('rejects string where timestamp expected (observed_at)', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/bad-ts').set({
        ...base, observed_at: 'yesterday',
      })
    ))
})

// ─── 3. Hazard reports — access control ─────────────────────────────────────

describe('Hazard reports — access control', () => {
  it('employee A cannot read employee B\'s report', () =>
    assertFails(db(EMPLOYEE_A_UID).doc('hazard_reports/report-b-1').get()))

  it('employee cannot update any report', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/report-a-1').update({
        status: 'Under Review', updated_at: Timestamp.now(),
      })
    ))

  it('officer can read any report', () =>
    assertSucceeds(db(OFFICER_UID).doc('hazard_reports/report-a-1').get()))

  it('officer can read another employee\'s report', () =>
    assertSucceeds(db(OFFICER_UID).doc('hazard_reports/report-b-1').get()))

  it('officer can update status + updated_at', () =>
    assertSucceeds(
      db(OFFICER_UID).doc('hazard_reports/report-a-1').update({
        status: 'Under Review', updated_at: Timestamp.now(),
      })
    ))

  it('officer cannot change reporter_id', () =>
    assertFails(
      db(OFFICER_UID).doc('hazard_reports/report-a-1').update({
        reporter_id: OFFICER_UID, updated_at: Timestamp.now(),
      })
    ))

  it('officer cannot change created_at', () =>
    assertFails(
      db(OFFICER_UID).doc('hazard_reports/report-a-1').update({
        created_at: Timestamp.now(), updated_at: Timestamp.now(),
      })
    ))

  it('officer cannot change observed_at', () =>
    assertFails(
      db(OFFICER_UID).doc('hazard_reports/report-a-1').update({
        observed_at: Timestamp.now(), updated_at: Timestamp.now(),
      })
    ))

  it('officer cannot change title', () =>
    assertFails(
      db(OFFICER_UID).doc('hazard_reports/report-a-1').update({
        title: 'Altered title', updated_at: Timestamp.now(),
      })
    ))

  it('officer cannot change description', () =>
    assertFails(
      db(OFFICER_UID).doc('hazard_reports/report-a-1').update({
        description: 'Altered', updated_at: Timestamp.now(),
      })
    ))

  it('officer cannot change category', () =>
    assertFails(
      db(OFFICER_UID).doc('hazard_reports/report-a-1').update({
        category: 'Fire Hazards', updated_at: Timestamp.now(),
      })
    ))

  it('officer cannot change severity', () =>
    assertFails(
      db(OFFICER_UID).doc('hazard_reports/report-a-1').update({
        severity: 'Low', updated_at: Timestamp.now(),
      })
    ))

  it('officer cannot delete a report', () =>
    assertFails(db(OFFICER_UID).doc('hazard_reports/report-a-1').delete()))

  it('employee cannot delete their own report', () =>
    assertFails(db(EMPLOYEE_A_UID).doc('hazard_reports/report-a-1').delete()))

  it('unauthenticated cannot read reports', () =>
    assertFails(dbAnon().doc('hazard_reports/report-a-1').get()))
})

// ─── 4. Notes — append-only ──────────────────────────────────────────────────

describe('Notes — append-only', () => {
  it('officer can create a note', () =>
    assertSucceeds(
      db(OFFICER_UID).doc('hazard_reports/report-a-1/notes/new-note').set({
        type: 'officer_note', body: 'Maintenance notified.',
        author_id: OFFICER_UID, author_name: 'Sarah Officer',
        created_at: Timestamp.now(),
      })
    ))

  it('employee cannot create a note', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/report-a-1/notes/emp-note').set({
        type: 'officer_note', body: 'Employee trying to add note.',
        author_id: EMPLOYEE_A_UID, author_name: 'Alice Employee',
        created_at: Timestamp.now(),
      })
    ))

  it('officer cannot update an existing note', () =>
    assertFails(
      db(OFFICER_UID).doc('hazard_reports/report-a-1/notes/immutable-note')
        .update({ body: 'Tampered.' })
    ))

  it('officer cannot delete a note', () =>
    assertFails(
      db(OFFICER_UID).doc('hazard_reports/report-a-1/notes/immutable-note').delete()
    ))

  it('employee cannot delete a note', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('hazard_reports/report-a-1/notes/immutable-note').delete()
    ))

  it('unauthenticated cannot read notes', () =>
    assertFails(
      dbAnon().doc('hazard_reports/report-a-1/notes/immutable-note').get()
    ))
})

// ─── 5. _counters ────────────────────────────────────────────────────────────

describe('_counters — inaccessible to all clients', () => {
  it('employee cannot read _counters', () =>
    assertFails(db(EMPLOYEE_A_UID).doc('_counters/reports').get()))

  it('officer cannot read _counters', () =>
    assertFails(db(OFFICER_UID).doc('_counters/reports').get()))

  it('unauthenticated cannot read _counters', () =>
    assertFails(dbAnon().doc('_counters/reports').get()))

  it('employee cannot write _counters', () =>
    assertFails(
      db(EMPLOYEE_A_UID).doc('_counters/reports').set({ next_id: 999 })
    ))
})

// ─── 6. Storage rules ────────────────────────────────────────────────────────

const TINY_IMAGE = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, // JPEG header bytes
])
const TEXT_DATA = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]) // "hello"

describe('Storage — uploads', () => {
  it('employee can upload an image to their own folder', () =>
    assertSucceeds(
      uploadBytes(
        ref(store(EMPLOYEE_A_UID), `hazard-photos/${EMPLOYEE_A_UID}/report-a-1/photo.jpg`),
        TINY_IMAGE,
        { contentType: 'image/jpeg' }
      )
    ))

  it('employee cannot upload to another employee\'s folder', () =>
    assertFails(
      uploadBytes(
        ref(store(EMPLOYEE_A_UID), `hazard-photos/${EMPLOYEE_B_UID}/report-b-1/photo.jpg`),
        TINY_IMAGE,
        { contentType: 'image/jpeg' }
      )
    ))

  it('unauthenticated cannot upload', () =>
    assertFails(
      uploadBytes(
        ref(testEnv.unauthenticatedContext().storage(), `hazard-photos/${EMPLOYEE_A_UID}/report-a-1/anon.jpg`),
        TINY_IMAGE,
        { contentType: 'image/jpeg' }
      )
    ))
})

describe('Storage — reads', () => {
  it('employee can read their own photo', () =>
    assertSucceeds(
      getBytes(
        ref(store(EMPLOYEE_A_UID), `hazard-photos/${EMPLOYEE_A_UID}/report-a-1/photo.jpg`)
      )
    ))

  it('employee cannot read another employee\'s photo', () =>
    assertFails(
      getBytes(
        ref(store(EMPLOYEE_A_UID), `hazard-photos/${EMPLOYEE_B_UID}/report-b-1/photo.jpg`)
      )
    ))

  it('unauthenticated cannot read any photo', () =>
    assertFails(
      getBytes(
        ref(testEnv.unauthenticatedContext().storage(), `hazard-photos/${EMPLOYEE_A_UID}/report-a-1/photo.jpg`)
      )
    ))
})

describe('Storage — deletes', () => {
  it('employee cannot delete their own photo', () =>
    assertFails(
      deleteObject(
        ref(store(EMPLOYEE_A_UID), `hazard-photos/${EMPLOYEE_A_UID}/report-a-1/photo.jpg`)
      )
    ))

  it('officer cannot delete a photo', () =>
    assertFails(
      deleteObject(
        ref(store(OFFICER_UID), `hazard-photos/${EMPLOYEE_A_UID}/report-a-1/photo.jpg`)
      )
    ))
})
