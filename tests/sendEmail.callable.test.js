import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

const projectId = process.env.GCLOUD_PROJECT
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST
const functionsHost = process.env.FUNCTIONS_EMULATOR_HOST

function assertEmulatorEnvironment() {
  const localHost = (value) => /^(127\.0\.0\.1|localhost):\d+$/.test(value ?? '')
  if (
    !projectId?.startsWith('demo-') ||
    !localHost(authHost) ||
    !localHost(firestoreHost) ||
    !localHost(functionsHost)
  ) {
    throw new Error('Callable tests require local Auth, Firestore, and Functions Emulators.')
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${url} failed with ${response.status}: ${JSON.stringify(payload)}`)
  }
  return payload
}

async function createAccount(email, password) {
  return request(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
}

async function writeProfile(account, role, active = true, fullName) {
  const now = new Date().toISOString()
  const values = {
    uid: { stringValue: account.localId },
    fullName: { stringValue: fullName ?? (role === 'admin' ? 'Callable Admin' : 'Callable User') },
    email: { stringValue: account.email },
    role: { stringValue: role },
    active: { booleanValue: active },
    createdAt: { timestampValue: now },
    updatedAt: { timestampValue: now },
  }
  await request(`http://${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents/users/${account.localId}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: values }),
  })
}

async function invoke(functionName, data, idToken) {
  const response = await fetch(
    `http://${functionsHost}/${projectId}/australia-southeast1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ data }),
    },
  )
  return { status: response.status, body: await response.json() }
}

const validEmail = {
  to: 'delivered@resend.dev',
  subject: 'Callable emulator verification',
  message: 'This message is delivered only to the local mock provider.',
}

let normalUser
let adminUser
let userB
let inactiveUser
let inactiveAdmin

before(async () => {
  assertEmulatorEnvironment()
  await request(`http://${authHost}/emulator/v1/projects/${projectId}/accounts`, { method: 'DELETE' })
  await request(`http://${firestoreHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`, { method: 'DELETE' })
  normalUser = await createAccount('callable.user@example.test', 'CallableUser123!')
  adminUser = await createAccount('callable.admin@example.test', 'CallableAdmin123!')
  userB = await createAccount('callable.user.b@example.test', 'CallableUserB123!')
  inactiveUser = await createAccount('callable.inactive@example.test', 'CallableInactive123!')
  inactiveAdmin = await createAccount('callable.inactive.admin@example.test', 'CallableInactiveAdmin123!')
  await writeProfile(normalUser, 'user', true, 'Callable User A')
  await writeProfile(adminUser, 'admin', true, 'Callable Admin')
  await writeProfile(userB, 'user', true, 'Callable User B')
  await writeProfile(inactiveUser, 'user', false, 'Callable Inactive User')
  await writeProfile(inactiveAdmin, 'admin', false, 'Callable Inactive Admin')

  for (let index = 1; index <= 9; index += 1) {
    const account = await createAccount(`browser.user.${index}@example.test`, `BrowserUser${index}123!`)
    await writeProfile(account, 'user', true, `Browser User ${String(index).padStart(2, '0')}`)
  }
})

after(() => {
  normalUser = undefined
  adminUser = undefined
  userB = undefined
  inactiveUser = undefined
  inactiveAdmin = undefined
})

test('1 guest callable invocation is unauthenticated', async () => {
  const result = await invoke('sendEmail', validEmail)
  assert.equal(result.body.error.status, 'UNAUTHENTICATED')
})

test('2 normal user callable invocation is permission-denied', async () => {
  const result = await invoke('sendEmail', validEmail, normalUser.idToken)
  assert.equal(result.body.error.status, 'PERMISSION_DENIED')
})

test('3 admin sends valid email without attachment in mock mode', async () => {
  const result = await invoke('sendEmail', validEmail, adminUser.idToken)
  assert.equal(result.status, 200)
  assert.equal(result.body.result.success, true)
  assert.match(result.body.result.id, /^mock-/)
})

test('4 admin sends valid PDF attachment in mock mode', async () => {
  const result = await invoke('sendEmail', {
    ...validEmail,
    attachment: {
      filename: 'information.pdf',
      contentType: 'application/pdf',
      base64: Buffer.from('%PDF-callable-test').toString('base64'),
    },
  }, adminUser.idToken)
  assert.equal(result.body.result.success, true)
})

test('5 admin invalid recipient is invalid-argument', async () => {
  const result = await invoke('sendEmail', { ...validEmail, to: 'invalid' }, adminUser.idToken)
  assert.equal(result.body.error.status, 'INVALID_ARGUMENT')
})

test('6 admin oversized decoded attachment is invalid-argument', async () => {
  const result = await invoke('sendEmail', {
    ...validEmail,
    attachment: {
      filename: 'large.pdf',
      contentType: 'application/pdf',
      base64: Buffer.alloc(3 * 1024 * 1024 + 1, 1).toString('base64'),
    },
  }, adminUser.idToken)
  assert.equal(result.body.error.status, 'INVALID_ARGUMENT')
})

test('7 admin forbidden filename is invalid even when its MIME claims PDF', async () => {
  const result = await invoke('sendEmail', {
    ...validEmail,
    attachment: {
      filename: 'program.exe',
      contentType: 'application/pdf',
      base64: Buffer.from('test').toString('base64'),
    },
  }, adminUser.idToken)
  assert.equal(result.body.error.status, 'INVALID_ARGUMENT')
})

const bulkEmail = {
  subject: 'Bulk callable emulator verification',
  message: 'Each selected user receives a private message from the local mock provider.',
}

test('8 guest bulk callable invocation is unauthenticated', async () => {
  const result = await invoke('sendBulkEmail', {
    ...bulkEmail,
    recipientUserIds: [normalUser.localId],
  })
  assert.equal(result.body.error.status, 'UNAUTHENTICATED')
})

test('9 normal user bulk callable invocation is permission-denied', async () => {
  const result = await invoke('sendBulkEmail', {
    ...bulkEmail,
    recipientUserIds: [userB.localId],
  }, normalUser.idToken)
  assert.equal(result.body.error.status, 'PERMISSION_DENIED')
})

test('10 inactive admin bulk callable invocation is permission-denied', async () => {
  const result = await invoke('sendBulkEmail', {
    ...bulkEmail,
    recipientUserIds: [normalUser.localId],
  }, inactiveAdmin.idToken)
  assert.equal(result.body.error.status, 'PERMISSION_DENIED')
})

test('11 admin bulk sends to two active users in mock mode', async () => {
  const result = await invoke('sendBulkEmail', {
    ...bulkEmail,
    recipientUserIds: [normalUser.localId, userB.localId],
  }, adminUser.idToken)
  assert.equal(result.status, 200)
  assert.equal(result.body.result.sentCount, 2)
  assert.equal(result.body.result.failedCount, 0)
  assert.equal(result.body.result.validRecipientCount, 2)
  assert.deepEqual(result.body.result.results.map(({ status }) => status), ['sent', 'sent'])
})

test('12 bulk callable deduplicates repeated UIDs', async () => {
  const result = await invoke('sendBulkEmail', {
    ...bulkEmail,
    recipientUserIds: [normalUser.localId, normalUser.localId, userB.localId],
  }, adminUser.idToken)
  assert.equal(result.body.result.requestedCount, 3)
  assert.equal(result.body.result.uniqueRecipientCount, 2)
  assert.equal(result.body.result.duplicateCount, 1)
  assert.equal(result.body.result.sentCount, 2)
})

test('13 bulk callable safely skips inactive and missing recipient profiles', async () => {
  const result = await invoke('sendBulkEmail', {
    ...bulkEmail,
    recipientUserIds: [normalUser.localId, inactiveUser.localId, 'missing-recipient-uid'],
  }, adminUser.idToken)
  assert.equal(result.body.result.sentCount, 1)
  assert.equal(result.body.result.skippedCount, 2)
  assert.equal(result.body.result.results.filter(({ status }) => status === 'skipped').length, 2)
})

test('14 bulk callable reuses attachment handling for every recipient', async () => {
  const result = await invoke('sendBulkEmail', {
    ...bulkEmail,
    recipientUserIds: [normalUser.localId, userB.localId],
    attachment: {
      filename: 'bulk-information.txt',
      contentType: 'text/plain',
      base64: Buffer.from('same attachment for both recipients').toString('base64'),
    },
  }, adminUser.idToken)
  assert.equal(result.body.result.sentCount, 2)
  assert.equal(result.body.result.failedCount, 0)
})

test('15 bulk callable rejects zero recipients', async () => {
  const result = await invoke('sendBulkEmail', {
    ...bulkEmail,
    recipientUserIds: [],
  }, adminUser.idToken)
  assert.equal(result.body.error.status, 'INVALID_ARGUMENT')
})

test('16 bulk callable rejects more than 50 recipients', async () => {
  const result = await invoke('sendBulkEmail', {
    ...bulkEmail,
    recipientUserIds: Array.from({ length: 51 }, (_, index) => `uid-${index}`),
  }, adminUser.idToken)
  assert.equal(result.body.error.status, 'INVALID_ARGUMENT')
})
