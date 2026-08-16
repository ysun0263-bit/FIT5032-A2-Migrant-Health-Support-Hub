const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST

function assertEmulatorEnvironment() {
  const localHost = (value) => /^(127\.0\.0\.1|localhost):\d+$/.test(value ?? '')

  if (!projectId?.startsWith('demo-') || !localHost(firestoreHost) || !localHost(authHost)) {
    throw new Error('Refusing to seed: a local Firebase Emulator and demo-* project are required.')
  }
}

function fields(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (typeof value === 'boolean') return [key, { booleanValue: value }]
      if (typeof value === 'number') return [key, { integerValue: String(value) }]
      if (value instanceof Date) return [key, { timestampValue: value.toISOString() }]
      return [key, { stringValue: String(value) }]
    }),
  )
}

async function request(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${url} failed with ${response.status}: ${await response.text()}`)
  }
  return response.status === 204 ? null : response.json()
}

async function writeDocument(collectionName, documentId, values) {
  const url = `http://${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${encodeURIComponent(documentId)}`
  await request(url, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: fields(values) }),
  })
}

assertEmulatorEnvironment()

await request(`http://${authHost}/emulator/v1/projects/${projectId}/accounts`, { method: 'DELETE' })
await request(`http://${firestoreHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`, { method: 'DELETE' })

const authResult = await request(
  `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'phase2b.admin@example.test',
      password: 'Phase2BAdmin123!',
      returnSecureToken: true,
    }),
  },
)
const userAuthResult = await request(
  `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'phase6c.user@example.test',
      password: 'Phase6CUser123!',
      returnSecureToken: true,
    }),
  },
)

const createdAt = new Date('2026-08-14T01:00:00.000Z')
const users = [
  { uid: authResult.localId, fullName: 'Phase Two B Admin', email: 'phase2b.admin@example.test', role: 'admin', active: true },
  { uid: userAuthResult.localId, fullName: 'Phase Six C User', email: 'phase6c.user@example.test', role: 'user', active: true },
  ...Array.from({ length: 11 }, (_, index) => ({
    uid: `seed-user-${String(index + 1).padStart(2, '0')}`,
    fullName: index === 10 ? '=Formula Check' : `Community User ${String(index + 1).padStart(2, '0')}`,
    email: `community.user.${String(index + 1).padStart(2, '0')}@example.test`,
    role: index === 8 ? 'admin' : 'user',
    active: index !== 9,
  })),
]

for (const [index, user] of users.entries()) {
  const timestamp = new Date(createdAt.getTime() + index * 60_000)
  await writeDocument('users', user.uid, {
    ...user,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

const topics = ['Finding a GP', 'Interpreter support', 'Health resource guidance']
const statuses = ['pending', 'confirmed', 'completed', 'cancelled']
const appointmentDaysAgo = [0, 1, 2, 3, 5, 6, 10, 15, 20, 29, 35, 60, 75, 89, 120]
const analyticsReferenceDate = new Date('2026-08-15T01:00:00.000Z')

for (let index = 0; index < 15; index += 1) {
  const number = String(index + 1).padStart(2, '0')
  const user = users[(index % (users.length - 1)) + 1]
  const timestamp = new Date(
    analyticsReferenceDate.getTime() - appointmentDaysAgo[index] * 24 * 60 * 60 * 1000,
  )
  await writeDocument('appointments', `seed-appointment-${number}`, {
    id: `seed-appointment-${number}`,
    userId: user.uid,
    fullName: `Appointment Person ${number}`,
    email: `appointment.${number}@example.test`,
    language: index % 2 ? 'Mandarin' : 'English',
    supportTopic: index === 14 ? '+Formula-safe topic' : topics[index % topics.length],
    preferredDate: `2026-09-${String((index % 20) + 1).padStart(2, '0')}`,
    preferredTime: `${String(9 + (index % 8)).padStart(2, '0')}:30`,
    contactPreference: index % 2 ? 'Email' : 'Phone call',
    notes: index === 14 ? '=Formula-safe notes' : `Emulator-only appointment ${number}`,
    status: statuses[index % statuses.length],
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

const resourceIds = ['finding-a-gp', 'mental-health-support', 'interpreter-services']
const ratingScores = [1, 2, 3, 4, 4, 5, 5, 5]

for (const [index, score] of ratingScores.entries()) {
  const user = users[(index % (users.length - 1)) + 1]
  const resourceId = resourceIds[index % resourceIds.length]
  const timestamp = new Date(createdAt.getTime() + (index + 50) * 60_000)
  await writeDocument('ratings', `${user.uid}__${resourceId}`, {
    userId: user.uid,
    resourceId,
    score,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

console.log(`Seeded ${users.length} users, 15 appointments, and ${ratingScores.length} ratings in ${projectId}.`)
