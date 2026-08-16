import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, beforeEach, test } from 'node:test'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import {
  buildAppointmentTrend,
  buildRatingDistribution,
  countAppointmentsByStatus,
  toMelbourneDateKey,
} from '../src/utils/adminAnalytics.js'

const projectId = 'demo-migrant-health-analytics'
let testEnv

function profile(uid, email, role) {
  const timestamp = Timestamp.fromDate(new Date('2026-08-10T00:00:00.000Z'))
  return { uid, fullName: `Analytics ${role}`, email, role, active: true, createdAt: timestamp, updatedAt: timestamp }
}

function appointment(id, userId, status, createdAt) {
  return {
    id,
    userId,
    fullName: 'Analytics User',
    email: 'analytics.user@example.test',
    language: 'English',
    supportTopic: 'Finding a GP',
    preferredDate: '2026-09-10',
    preferredTime: '10:00',
    slotKey: '2026-09-10__10:00',
    contactPreference: 'Email',
    notes: '',
    status,
    createdAt,
    updatedAt: createdAt,
  }
}

function waitForSnapshot(subscribe, predicate, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe?.()
      reject(new Error('Timed out waiting for a real-time Firestore update.'))
    }, timeoutMs)
    let unsubscribe
    unsubscribe = subscribe((value) => {
      if (!predicate(value)) return
      clearTimeout(timeout)
      unsubscribe?.()
      resolve(value)
    }, (error) => {
      clearTimeout(timeout)
      unsubscribe?.()
      reject(error)
    })
  })
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  })
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore()
    await setDoc(doc(database, 'users/admin-user'), profile('admin-user', 'admin@example.test', 'admin'))
    await setDoc(doc(database, 'users/analytics-user'), profile('analytics-user', 'analytics.user@example.test', 'user'))
  })
})

after(async () => {
  await testEnv.cleanup()
})

test('appointment snapshot updates status totals and Melbourne trend without refresh', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const createdAt = Timestamp.fromDate(new Date('2026-08-12T02:00:00.000Z'))
    await setDoc(
      doc(context.firestore(), 'appointments/existing-appointment'),
      appointment('existing-appointment', 'analytics-user', 'confirmed', createdAt),
    )
  })

  const adminDatabase = testEnv.authenticatedContext('admin-user', {
    email: 'admin@example.test',
  }).firestore()
  const initial = await waitForSnapshot(
    (onData, onError) => onSnapshot(collection(adminDatabase, 'appointments'), (snapshot) => {
      onData(snapshot.docs.map((item) => item.data()))
    }, onError),
    (appointments) => appointments.length === 1,
  )
  assert.equal(countAppointmentsByStatus(initial).pending, 0)

  const userDatabase = testEnv.authenticatedContext('analytics-user', {
    email: 'analytics.user@example.test',
  }).firestore()
  const batch = writeBatch(userDatabase)
  const appointmentId = 'realtime-appointment'
  const slotKey = '2026-09-11__11:00'
  batch.set(doc(userDatabase, `appointments/${appointmentId}`), {
    ...appointment(appointmentId, 'analytics-user', 'pending', serverTimestamp()),
    preferredDate: '2026-09-11',
    preferredTime: '11:00',
    slotKey,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.set(doc(userDatabase, `bookingSlots/${slotKey}`), {
    slotKey,
    appointmentId,
    date: '2026-09-11',
    time: '11:00',
    createdAt: serverTimestamp(),
  })

  const updatePromise = waitForSnapshot(
    (onData, onError) => onSnapshot(collection(adminDatabase, 'appointments'), (snapshot) => {
      onData(snapshot.docs.map((item) => ({
        ...item.data(),
        createdAt: item.data().createdAt?.toDate().toISOString(),
      })))
    }, onError),
    (appointments) => appointments.length === 2,
  )
  await batch.commit()
  const updated = await updatePromise
  const counts = countAppointmentsByStatus(updated)
  const todayKey = toMelbourneDateKey(new Date())
  const trend = buildAppointmentTrend(updated, { range: '30', referenceDate: new Date() })

  assert.equal(counts.total, 2)
  assert.equal(counts.pending, 1)
  assert.equal(trend.find(({ date }) => date === todayKey)?.count, 1)
})

test('rating snapshot replaces a four-star count with five stars on update', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const timestamp = Timestamp.fromDate(new Date('2026-08-12T02:00:00.000Z'))
    await setDoc(doc(context.firestore(), 'ratings/analytics-user__finding-a-gp'), {
      userId: 'analytics-user',
      resourceId: 'finding-a-gp',
      score: 4,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  })

  const adminDatabase = testEnv.authenticatedContext('admin-user', {
    email: 'admin@example.test',
  }).firestore()
  const initial = await waitForSnapshot(
    (onData, onError) => onSnapshot(collection(adminDatabase, 'ratings'), (snapshot) => {
      onData(snapshot.docs.map((item) => item.data()))
    }, onError),
    (ratings) => ratings.length === 1,
  )
  assert.deepEqual(buildRatingDistribution(initial).map(({ count }) => count), [0, 0, 0, 1, 0])

  const userDatabase = testEnv.authenticatedContext('analytics-user', {
    email: 'analytics.user@example.test',
  }).firestore()
  const updatePromise = waitForSnapshot(
    (onData, onError) => onSnapshot(collection(adminDatabase, 'ratings'), (snapshot) => {
      onData(snapshot.docs.map((item) => item.data()))
    }, onError),
    (ratings) => ratings[0]?.score === 5,
  )
  await updateDoc(doc(userDatabase, 'ratings/analytics-user__finding-a-gp'), {
    score: 5,
    updatedAt: serverTimestamp(),
  })
  const updated = await updatePromise

  assert.deepEqual(buildRatingDistribution(updated).map(({ count }) => count), [0, 0, 0, 0, 1])
  assert.equal(updated.length, 1)
})
