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

async function writeProfile(account, role) {
  const now = new Date().toISOString()
  const values = {
    uid: { stringValue: account.localId },
    fullName: { stringValue: role === 'admin' ? 'Callable Admin' : 'Callable User' },
    email: { stringValue: account.email },
    role: { stringValue: role },
    active: { booleanValue: true },
    createdAt: { timestampValue: now },
    updatedAt: { timestampValue: now },
  }
  await request(`http://${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents/users/${account.localId}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: values }),
  })
}

async function invoke(data, idToken) {
  const response = await fetch(
    `http://${functionsHost}/${projectId}/australia-southeast1/sendEmail`,
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

before(async () => {
  assertEmulatorEnvironment()
  await request(`http://${authHost}/emulator/v1/projects/${projectId}/accounts`, { method: 'DELETE' })
  await request(`http://${firestoreHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`, { method: 'DELETE' })
  normalUser = await createAccount('callable.user@example.test', 'CallableUser123!')
  adminUser = await createAccount('callable.admin@example.test', 'CallableAdmin123!')
  await writeProfile(normalUser, 'user')
  await writeProfile(adminUser, 'admin')
})

after(() => {
  normalUser = undefined
  adminUser = undefined
})

test('1 guest callable invocation is unauthenticated', async () => {
  const result = await invoke(validEmail)
  assert.equal(result.body.error.status, 'UNAUTHENTICATED')
})

test('2 normal user callable invocation is permission-denied', async () => {
  const result = await invoke(validEmail, normalUser.idToken)
  assert.equal(result.body.error.status, 'PERMISSION_DENIED')
})

test('3 admin sends valid email without attachment in mock mode', async () => {
  const result = await invoke(validEmail, adminUser.idToken)
  assert.equal(result.status, 200)
  assert.equal(result.body.result.success, true)
  assert.match(result.body.result.id, /^mock-/)
})

test('4 admin sends valid PDF attachment in mock mode', async () => {
  const result = await invoke({
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
  const result = await invoke({ ...validEmail, to: 'invalid' }, adminUser.idToken)
  assert.equal(result.body.error.status, 'INVALID_ARGUMENT')
})

test('6 admin oversized decoded attachment is invalid-argument', async () => {
  const result = await invoke({
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
  const result = await invoke({
    ...validEmail,
    attachment: {
      filename: 'program.exe',
      contentType: 'application/pdf',
      base64: Buffer.from('test').toString('base64'),
    },
  }, adminUser.idToken)
  assert.equal(result.body.error.status, 'INVALID_ARGUMENT')
})
