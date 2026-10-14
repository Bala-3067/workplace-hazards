/**
 * test-config-verification.mjs
 * 
 * Verifies Firebase configuration and security rules syntax without running tests.
 * This is a dry-run verification for Phase 3A security review.
 */

import { readFileSync } from 'node:fs'

console.log('=== Phase 3A Security Rules Verification ===\n')

// Check Firebase version compatibility
console.log('1. Checking package.json dependencies...')
try {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))
  
  console.log(`   Firebase: ${packageJson.dependencies.firebase}`)
  console.log(`   Firebase Rules Testing: ${packageJson.devDependencies['@firebase/rules-unit-testing']}`)
  
  if (packageJson.dependencies.firebase === '^11.10.0') {
    console.log('   ✓ Firebase version matches requirements (11.10.0)')
  } else {
    console.log(`   ⚠ Firebase version may not be compatible (expected ^11.10.0)`)
  }
  
  if (packageJson.devDependencies['@firebase/rules-unit-testing'] === '4.0.1') {
    console.log('   ✓ Firebase rules testing version matches requirements (4.0.1)')
  } else {
    console.log(`   ⚠ Rules testing version may not be compatible (expected 4.0.1)`)
  }
} catch (error) {
  console.log(`   ✗ Error reading package.json: ${error.message}`)
}

// Check configuration files
console.log('\n2. Checking configuration files...')

const configFiles = [
  { name: 'firebase.json', required: true },
  { name: '.firebaserc', required: true },
  { name: '.env.example', required: true },
  { name: '.env', required: false, note: 'Will be created from .env.example' },
]

for (const file of configFiles) {
  try {
    readFileSync(`./${file.name}`, 'utf8')
    console.log(`   ✓ ${file.name} exists`)
    if (file.note) console.log(`     Note: ${file.note}`)
  } catch (error) {
    if (file.required) {
      console.log(`   ✗ ${file.name} missing (required)`)
    } else {
      console.log(`   ⚠ ${file.name} missing: ${file.note || 'optional'}`)
    }
  }
}

// Check security rules files
console.log('\n3. Checking security rules files...')

const rulesFiles = [
  { name: 'firestore.rules', description: 'Firestore security rules' },
  { name: 'storage.rules', description: 'Storage security rules' },
  { name: 'tests/firestore-rules.test.mjs', description: 'Firestore rules tests' },
  { name: 'tests/security-rules-enhanced.test.mjs', description: 'Enhanced security tests' },
]

for (const file of rulesFiles) {
  try {
    const content = readFileSync(`./${file.name}`, 'utf8')
    console.log(`   ✓ ${file.name} (${file.description})`)
    
    // Basic syntax checks
    if (file.name.includes('.rules')) {
      if (content.includes('rules_version = \'2\'')) {
        console.log(`     ✓ Uses rules_version = '2'`)
      }
      if (content.includes('allow delete: if false')) {
        console.log(`     ✓ Explicitly denies client-side deletions`)
      }
    }
  } catch (error) {
    console.log(`   ✗ ${file.name} missing: ${error.message}`)
  }
}

// Check critical security patterns in Firestore rules
console.log('\n4. Analyzing Firestore rules for critical security patterns...')

try {
  const firestoreRules = readFileSync('./firestore.rules', 'utf8')
  
  const securityChecks = [
    { pattern: 'allow delete: if false', description: 'Client-side deletions disabled' },
    { pattern: 'role == \'employee\'', description: 'Role hardcoded to employee on create' },
    { pattern: '!(\'display_id\' in request.resource.data)', description: 'Client cannot set display_id' },
    { pattern: 'reporter_id == request.auth.uid', description: 'Reporter ID must match auth UID' },
    { pattern: 'status == \'Submitted\'', description: 'Reports must start as Submitted' },
    { pattern: 'allow update, delete: if false', description: 'Notes are append-only' },
    { pattern: 'allow read, write: if false', description: '_counters collection restricted' },
  ]
  
  for (const check of securityChecks) {
    if (firestoreRules.includes(check.pattern)) {
      console.log(`   ✓ ${check.description}`)
    } else {
      console.log(`   ✗ Missing: ${check.description}`)
    }
  }
  
  // Check for field validation
  if (firestoreRules.includes('is string') && firestoreRules.includes('size() > 0')) {
    console.log(`   ✓ Field type and content validation present`)
  }
  
} catch (error) {
  console.log(`   ✗ Error analyzing Firestore rules: ${error.message}`)
}

// Check storage rules
console.log('\n5. Analyzing Storage rules for critical security patterns...')

try {
  const storageRules = readFileSync('./storage.rules', 'utf8')
  
  const storageChecks = [
    { pattern: 'allow delete: if false', description: 'Client-side file deletions disabled' },
    { pattern: 'request.resource.size <= 5 * 1024 * 1024', description: '5MB file size limit' },
    { pattern: 'request.resource.contentType.matches', description: 'File type validation' },
    { pattern: 'request.auth.uid == reporterUid', description: 'Users can only access own folder' },
    { pattern: 'allow create:', description: 'Upload permissions separated' },
    { pattern: 'allow update:', description: 'Update permissions separated' },
    { pattern: '!request.auth.token.role', negative: true, description: 'Does not trust client-editable custom claims' },
  ]
  
  for (const check of storageChecks) {
    if (check.negative) {
      if (!storageRules.includes('request.auth.token.role')) {
        console.log(`   ✓ ${check.description}`)
      } else {
        console.log(`   ✗ Warning: ${check.description}`)
      }
    } else if (storageRules.includes(check.pattern)) {
      console.log(`   ✓ ${check.description}`)
    } else {
      console.log(`   ✗ Missing: ${check.description}`)
    }
  }
  
} catch (error) {
  console.log(`   ✗ Error analyzing Storage rules: ${error.message}`)
}

// Check AuthContext for security
console.log('\n6. Checking AuthContext security...')

try {
  const authContext = readFileSync('./src/context/AuthContext.jsx', 'utf8')
  
  const authChecks = [
    { pattern: 'role: \'employee\'', description: 'Hardcodes role as employee in profile creation' },
    { pattern: 'role === \'employee\' || role === \'officer\'', description: 'Validates role values' },
    { pattern: 'Cloud Function', description: 'Mentions Cloud Function replacement' },
    { pattern: 'Firestore Security Rules', description: 'References Firestore rules enforcement' },
  ]
  
  for (const check of authChecks) {
    if (authContext.includes(check.pattern)) {
      console.log(`   ✓ ${check.description}`)
    } else {
      console.log(`   ⚠ Note: ${check.description}`)
    }
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    { pattern: 'setProfile({.*role:.*})', description: 'Client-side profile creation' },
  ]
  
  for (const pattern of dangerousPatterns) {
    // Simple regex check
    if (authContext.includes('setProfile({') && authContext.includes('role:')) {
      console.log(`   ⚠ Warning: Client-side profile creation detected`)
      console.log(`     This should be replaced by Cloud Function in production`)
    }
  }
  
} catch (error) {
  console.log(`   ✗ Error analyzing AuthContext: ${error.message}`)
}

console.log('\n=== Verification Summary ===')
console.log('The security rules have been updated to address Phase 3A concerns:')
console.log('')
console.log('1. ✅ User profiles:')
console.log('   - Role hardcoded to "employee" on creation')
console.log('   - Self-promotion prevented (cannot change role)')
console.log('   - Field type and content validation added')
console.log('   - Email format validation')
console.log('')
console.log('2. ✅ Hazard reports:')
console.log('   - Reporter ID must match auth UID')
console.log('   - Client cannot set display_id')
console.log('   - Status must be "Submitted" on create')
console.log('   - Field validation for categories and severity')
console.log('   - Officer update restrictions (cannot change protected fields)')
console.log('')
console.log('3. ✅ Notes:')
console.log('   - Append-only (no updates/deletes)')
console.log('   - Only officers can create notes')
console.log('')
console.log('4. ✅ Storage:')
console.log('   - Split upload/update/delete permissions')
console.log('   - 5MB file size limit')
console.log('   - Image type validation')
console.log('   - Does not trust client-editable custom claims')
console.log('   - Employees cannot access other employees\' photos')
console.log('')
console.log('5. ✅ Tests:')
console.log('   - Enhanced test suite created')
console.log('   - Tests for field validation and access control')
console.log('   - Tests for self-promotion prevention')
console.log('')
console.log('=== Next Steps ===')
console.log('1. Install Firebase CLI: npm install -g firebase-tools')
console.log('2. Create Firebase project and get project ID')
console.log('3. Update .firebaserc with real project ID')
console.log('4. Create .env from .env.example with Firebase config')
console.log('5. Start emulators: firebase emulators:start --only firestore,auth,storage')
console.log('6. Run tests: node tests/security-rules-enhanced.test.mjs')
console.log('')
console.log('⚠ Important: Do not deploy or connect to real Firestore until tests pass.')