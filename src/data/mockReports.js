/**
 * mockReports.js
 *
 * Realistic sample hazard reports used across Phase 1 and Phase 2.
 * In Phase 3 this is replaced by live Supabase queries.
 *
 * Fields mirror the hazard_reports table that will be created later:
 *   id, title, description, location, category, severity, status,
 *   reported_by, created_at, updated_at, precautions_taken
 */

export const CATEGORIES = [
  'Electrical Hazards',
  'Fire Hazards',
  'Slips, Trips & Falls',
  'Machinery Hazards',
  'Chemical Hazards',
  'Ergonomic Hazards',
  'Other Hazards',
]

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export const STATUSES = [
  'Submitted',
  'Under Review',
  'Action in Progress',
  'Resolved',
  'Closed',
]

export const mockReports = [
  {
    id: 'HR-001',
    title: 'Exposed Electrical Wiring in Server Room',
    description:
      'Several wires are exposed near the main power distribution board in the server room on Floor 2. A cable tray cover is missing, leaving live conductors accessible.',
    location: 'IT Server Room — Floor 2',
    category: 'Electrical Hazards',
    severity: 'Critical',
    status: 'Action in Progress',
    reported_by: 'John Doe',
    created_at: '2026-09-28T08:15:00Z',
    updated_at: '2026-10-02T14:30:00Z',
    precautions_taken: 'Area cordoned off with warning tape. IT staff notified.',
  },
  {
    id: 'HR-002',
    title: 'Wet Floor Near Main Entrance — No Warning Sign',
    description:
      'Rainwater tracked in by foot traffic has created a slippery surface at the main lobby entrance. No wet-floor cone was placed by the cleaning crew.',
    location: 'Main Lobby — Ground Floor',
    category: 'Slips, Trips & Falls',
    severity: 'High',
    status: 'Resolved',
    reported_by: 'John Doe',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T11:45:00Z',
    precautions_taken: 'Informed reception staff verbally.',
  },
  {
    id: 'HR-003',
    title: 'Fire Extinguisher Overdue for Inspection',
    description:
      'The fire extinguisher mounted near the cafeteria kitchen has an inspection tag dated March 2025. It is overdue by more than six months.',
    location: 'Cafeteria Kitchen — Ground Floor',
    category: 'Fire Hazards',
    severity: 'Medium',
    status: 'Under Review',
    reported_by: 'John Doe',
    created_at: '2026-10-03T10:30:00Z',
    updated_at: '2026-10-04T09:00:00Z',
    precautions_taken: 'None taken — functional status unknown.',
  },
  {
    id: 'HR-004',
    title: 'Guard Rail Missing on Production Line Conveyor',
    description:
      'The safety guard rail on the north side of Conveyor B was removed for maintenance last week and has not been reinstalled. Workers are passing within 30 cm of moving parts.',
    location: 'Production Floor — North Wing',
    category: 'Machinery Hazards',
    severity: 'Critical',
    status: 'Submitted',
    reported_by: 'John Doe',
    created_at: '2026-10-05T07:45:00Z',
    updated_at: '2026-10-05T07:45:00Z',
    precautions_taken: 'Verbally warned nearby workers to keep distance.',
  },
  {
    id: 'HR-005',
    title: 'Chemical Storage Labels Faded and Illegible',
    description:
      'Labels on three chemical storage drums in the warehouse are sun-faded and can no longer be read. Contents and hazard class are unknown without opening the drums.',
    location: 'Warehouse — Chemical Storage Bay',
    category: 'Chemical Hazards',
    severity: 'High',
    status: 'Action in Progress',
    reported_by: 'John Doe',
    created_at: '2026-10-06T13:00:00Z',
    updated_at: '2026-10-08T10:15:00Z',
    precautions_taken: 'Drums isolated and bay access restricted.',
  },
  {
    id: 'HR-006',
    title: 'Ergonomic Concern — No Monitor Stands at Workstations',
    description:
      'Staff in the accounts department are working with monitors placed directly on desktops, causing prolonged neck flexion. Five workstations affected.',
    location: 'Accounts Department — Floor 3',
    category: 'Ergonomic Hazards',
    severity: 'Low',
    status: 'Closed',
    reported_by: 'John Doe',
    created_at: '2026-09-20T14:00:00Z',
    updated_at: '2026-09-25T16:00:00Z',
    precautions_taken: 'None — chronic issue rather than immediate danger.',
  },
  {
    id: 'HR-007',
    title: 'Blocked Emergency Exit — Storeroom Door',
    description:
      'Cardboard boxes have been stacked against the emergency exit door at the rear of the storeroom, making it impossible to open from the inside.',
    location: 'Storeroom — Ground Floor',
    category: 'Fire Hazards',
    severity: 'High',
    status: 'Submitted',
    reported_by: 'John Doe',
    created_at: '2026-10-10T08:20:00Z',
    updated_at: '2026-10-10T08:20:00Z',
    precautions_taken: 'Supervisor informed via phone.',
  },
]
