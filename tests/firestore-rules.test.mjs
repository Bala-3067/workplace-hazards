/**
 * firestore-rules.test.mjs
 *
 * Security rules unit tests for Firestore.
 * Runs against the Firebase Emulator — NOT against production.
 *
 * Prerequisites:
 *   1. Install the Firebase CLI:  npm install -g firebase-tools
 *   2. Install test helper:       npm install --save-dev @firebase/rules-unit-testing
 *   3. Start emulators:           firebase emulators:start --only firestore,auth
 *   4. Run this file:             node tests/firestore-rules.test.mjs
 *
 * Test coverage:
 *   - Unauthenticated access is denied (all collections)
 *   - Employee can read own reports, not others'
 *   - Employee cannot update reports
 *   - Employee cannot set role to 'officer' on their own profile
 *   - Employee cannot supply display_id on report create
 *   - Employee cannot set reporter_id to another user's uid
 *   - Officer can read all reports
 *   - Officer can update report status
 *   - Officer cannot delete reports
 *   - Notes are append-only (no update or delete)
 *   - _counters collection is inaccessible to all clients
 */

import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const rulesPath  = join(__dirname, '..', 'firestore.rules')

// ─── Test environment ─────────────────────────────────────────────────────────

/** @type {RulesTestEnvironment} */
let testEnv

const PROJECT_ID = 'hazard-reporting-test'

// Simulated UIDs
const EMPLOYEE_A_UID  = 'employee-a-uid'
const EMPLOYEE_B_UID  = 'employee-b-uid'
const OFFICER_UID     = 'officer-uid'

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(rulesPath, 'utf8'),
      host:  'localhost',
      port:  8080,
    },
  })

  // Seed: create user profile docs directly (bypassing rules) so role checks work
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await db.doc(`users/${EMPLOYEE_A_UID}`).set({
      full_name: 'Alice Employee', email: 'alice@test.com',
      role: 'employee', department: null,
      created_at: new Date(), updated_at: new Date(),
    })
    await db.doc(`users/${EMPLOYEE_B_UID}`).set({
      full_name: 'Bob Employee', email: 'bob@test.com',
      role: 'employee', department: null,
      created_at: new Date(), updated_at: new Date(),
    })
    await db.doc(`users/${OFFICER_UID}`).set({
      full_name: 'Sarah Officer', email: 'sarah@test.com',
      role: 'officer', department: null,
      created_at: new Date(), updated_at: new Date(),
    })
    // Seed: a report owned by employee A
    await db.doc('hazard_reports/report-a-1').set({
      title: 'Wet floor', description: 'Slippery surface near entrance.',
      location: 'Main Lobby', category: 'Slips, Trips & Falls',
      severity: 'High', status: 'Submitted',
      reporter_id: EMPLOYEE_A_UID,
      observed_at: new Date(), created_at: new Date(), updated_at: new Date(),
    })
  })
})

after(async () => {
  await testEnv.cleanup()
})

// ─── Helper: get a Firestore instance as a specific user ──────────────────────

function dbAs(uid, tokenOverrides = {}) {
  return testEnv.authenticatedContext(uid, tokenOverrides).firestore()
}

function dbUnauthenticated() {
  return testEnv.unauthenticatedContext().firestore()
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Unauthenticated access', () => {
  it('denies reading users collection', async () => {
    await assertFails(
      dbUnauthenticated().doc(`users/${EMPLOYEE_A_UID}`).get()
    )
  })

  it('denies reading hazard_reports', async () => {
    await assertFails(
      dbUnauthenticated().doc('hazard_reports/report-a-1').get()
    )
  })

  it('denies writing hazard_reports', async () => {
    await assertFails(
      dbUnauthenticated().doc('hazard_reports/new-report').set({
        title: 'Test', reporter_id: 'anyone',
      })
    )
  })
})

describe('Employee A — own data', () => {
  it('can read their own profile', async () => {
    await assertSucceeds(
      dbAs(EMPLOYEE_A_UID).doc(`users/${EMPLOYEE_A_UID}`).get()
    )
  })

  it('can read their own report', async () => {
    await assertSucceeds(
      dbAs(EMPLOYEE_A_UID).doc('hazard_reports/report-a-1').get()
    )
  })

  it('can create a valid report with reporter_id = own uid', async () => {
    await assertSucceeds(
      dbAs(EMPLOYEE_A_UID).doc('hazard_reports/new-valid-report').set({
        title: 'Exposed wiring',
        description: 'Exposed wires near the server room entrance on floor 2.',
        location: 'Server Room Floor 2',
        category: 'Electrical Hazards',
        severity: 'Critical',
        status: 'Submitted',
        reporter_id: EMPLOYEE_A_UID,
        observed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
    )
  })
})

describe('Employee A — cross-user access denied', () => {
  it('cannot read Employee B profile', async () => {
    await assertFails(
      dbAs(EMPLOYEE_A_UID).doc(`users/${EMPLOYEE_B_UID}`).get()
    )
  })

  it('cannot read a report owned by Employee B', async () => {
    // Seed a report owned by B
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('hazard_reports/report-b-1').set({
        title: "Bob's report", description: 'Something unsafe near bay 3.',
        location: 'Warehouse Bay 3', category: 'Machinery Hazards',
        severity: 'Medium', status: 'Submitted',
        reporter_id: EMPLOYEE_B_UID,
        observed_at: new Date(), created_at: new Date(), updated_at: new Date(),
      })
    })
    await assertFails(
      dbAs(EMPLOYEE_A_UID).doc('hazard_reports/report-b-1').get()
    )
  })

  it('cannot update a report (any report)', async () => {
    await assertFails(
      dbAs(EMPLOYEE_A_UID).doc('hazard_reports/report-a-1').update({
        status: 'Resolved',
      })
    )
  })
})

describe('Employee role escalation — denied', () => {
  it('cannot set own role to officer', async () => {
    await assertFails(
      dbAs(EMPLOYEE_A_UID).doc(`users/${EMPLOYEE_A_UID}`).update({
        role: 'officer',
      })
    )
  })

  it('cannot create a report with reporter_id = another user', async () => {
    await assertFails(
      dbAs(EMPLOYEE_A_UID).doc('hazard_reports/impersonation-attempt').set({
        title: 'Fake report',
        description: 'Attempting to submit as another user identity.',
        location: 'Somewhere',
        category: 'Other Hazards',
        severity: 'Low',
        status: 'Submitted',
        reporter_id: EMPLOYEE_B_UID,   // ← wrong uid
        observed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
    )
  })

  it('cannot supply a display_id on report create', async () => {
    await assertFails(
      dbAs(EMPLOYEE_A_UID).doc('hazard_reports/display-id-attempt').set({
        title: 'Display ID injection',
        description: 'Trying to set my own display ID instead of the server.',
        location: 'Test Location',
        category: 'Other Hazards',
        severity: 'Low',
        status: 'Submitted',
        reporter_id: EMPLOYEE_A_UID,
        display_id: 'HR-001',          // ← must be rejected
        observed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
    )
  })

  it('cannot create a report with status other than Submitted', async () => {
    await assertFails(
      dbAs(EMPLOYEE_A_UID).doc('hazard_reports/status-injection').set({
        title: 'Status injection attempt',
        description: 'Trying to create a report already marked as Resolved.',
        location: 'Test Location',
        category: 'Other Hazards',
        severity: 'Low',
        status: 'Resolved',            // ← must be rejected
        reporter_id: EMPLOYEE_A_UID,
        observed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
    )
  })
})

describe('Officer access', () => {
  it('can read any report', async () => {
    await assertSucceeds(
      dbAs(OFFICER_UID).doc('hazard_reports/report-a-1').get()
    )
  })

  it('can read any user profile', async () => {
    await assertSucceeds(
      dbAs(OFFICER_UID).doc(`users/${EMPLOYEE_A_UID}`).get()
    )
  })

  it('can update report status', async () => {
    await assertSucceeds(
      dbAs(OFFICER_UID).doc('hazard_reports/report-a-1').update({
        status: 'Under Review',
        updated_at: new Date(),
      })
    )
  })

  it('cannot delete a report', async () => {
    await assertFails(
      dbAs(OFFICER_UID).doc('hazard_reports/report-a-1').delete()
    )
  })

  it('cannot change the reporter_id on a report', async () => {
    await assertFails(
      dbAs(OFFICER_UID).doc('hazard_reports/report-a-1').update({
        reporter_id: OFFICER_UID,   // ← must be rejected
        updated_at: new Date(),
      })
    )
  })

  it('can create a note on a report', async () => {
    await assertSucceeds(
      dbAs(OFFICER_UID)
        .doc('hazard_reports/report-a-1/notes/note-1')
        .set({
          type: 'officer_note',
          body: 'Maintenance team notified.',
          author_id: OFFICER_UID,
          author_name: 'Sarah Officer',
          created_at: new Date(),
        })
    )
  })
})

describe('Notes — append-only enforcement', () => {
  it('officer cannot update an existing note', async () => {
    // Seed a note
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore()
        .doc('hazard_reports/report-a-1/notes/immutable-note')
        .set({
          type: 'officer_note',
          body: 'Original note text.',
          author_id: OFFICER_UID,
          author_name: 'Sarah Officer',
          created_at: new Date(),
        })
    })
    await assertFails(
      dbAs(OFFICER_UID)
        .doc('hazard_reports/report-a-1/notes/immutable-note')
        .update({ body: 'Tampered note text.' })
    )
  })

  it('officer cannot delete a note', async () => {
    await assertFails(
      dbAs(OFFICER_UID)
        .doc('hazard_reports/report-a-1/notes/immutable-note')
        .delete()
    )
  })

  it('employee cannot delete a note on their own report', async () => {
    await assertFails(
      dbAs(EMPLOYEE_A_UID)
        .doc('hazard_reports/report-a-1/notes/immutable-note')
        .delete()
    )
  })
})

describe('_counters collection', () => {
  it('is inaccessible to authenticated employees', async () => {
    await assertFails(
      dbAs(EMPLOYEE_A_UID).doc('_counters/reports').get()
    )
  })

  it('is inaccessible to authenticated officers', async () => {
    await assertFails(
      dbAs(OFFICER_UID).doc('_counters/reports').get()
    )
  })

  it('is inaccessible to unauthenticated callers', async () => {
    await assertFails(
      dbUnauthenticated().doc('_counters/reports').get()
    )
  })
})
