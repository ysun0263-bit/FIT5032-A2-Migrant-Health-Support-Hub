import { readFile } from 'node:fs/promises'
import { after, before, beforeEach, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

const projectId = 'demo-migrant-health-hub'
let testEnv

function profile(uid, email, role = 'user') {
  return {
    uid,
    fullName: `Test ${uid}`,
    email,
    role,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

function appointment(id, userId) {
  return {
    id,
    userId,
    fullName: `Test ${userId}`,
    email: `${userId}@example.test`,
    language: 'English',
    supportTopic: 'Finding a GP',
    preferredDate: '2026-08-20',
    preferredTime: '10:30',
    contactPreference: 'Email',
    notes: '',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

function slottedAppointment(id, userId, date = '2026-08-20', time = '10:00') {
  return {
    ...appointment(id, userId),
    preferredDate: date,
    preferredTime: time,
    slotKey: `${date}__${time}`,
  }
}

function bookingSlot(appointmentId, date = '2026-08-20', time = '10:00') {
  return {
    slotKey: `${date}__${time}`,
    appointmentId,
    date,
    time,
    createdAt: serverTimestamp(),
  }
}

async function reserveSlot(context, appointmentId, userId, date = '2026-08-20', time = '10:00') {
  const database = context.firestore()
  const appointmentReference = doc(database, 'appointments', appointmentId)
  const slotReference = doc(database, 'bookingSlots', `${date}__${time}`)

  return runTransaction(database, async (transaction) => {
    const existingSlot = await transaction.get(slotReference)

    if (existingSlot.exists()) {
      throw new Error('slot-conflict')
    }

    transaction.set(appointmentReference, slottedAppointment(appointmentId, userId, date, time))
    transaction.set(slotReference, bookingSlot(appointmentId, date, time))
  })
}

function rating(userId, resourceId, score = 4) {
  return {
    userId,
    resourceId,
    score,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data)
  })
}

async function seedAdmin() {
  await seed('users/admin-user', profile('admin-user', 'admin@example.test', 'admin'))
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
})

after(async () => {
  await testEnv.cleanup()
})

describe('users regression', () => {
  test('1 user reads own profile', async () => {
    await seed('users/user-a', profile('user-a', 'user-a@example.test'))
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertSucceeds(getDoc(doc(context.firestore(), 'users/user-a')))
  })

  test('2 user cannot read another profile', async () => {
    await seed('users/user-b', profile('user-b', 'user-b@example.test'))
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertFails(getDoc(doc(context.firestore(), 'users/user-b')))
  })

  test('3 user cannot self-promote', async () => {
    await seed('users/user-a', profile('user-a', 'user-a@example.test'))
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertFails(
      updateDoc(doc(context.firestore(), 'users/user-a'), {
        role: 'admin',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  test('4 admin reads users', async () => {
    await seedAdmin()
    await seed('users/user-a', profile('user-a', 'user-a@example.test'))
    const context = testEnv.authenticatedContext('admin-user', { email: 'admin@example.test' })
    const snapshot = await assertSucceeds(getDocs(collection(context.firestore(), 'users')))
    assert.equal(snapshot.size, 2)
  })
})

describe('appointments', () => {
  test('5 authenticated user creates own appointment', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertSucceeds(reserveSlot(context, 'appointment-a', 'user-a'))
  })

  test('6 user cannot create appointment for another UID', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertFails(
      setDoc(doc(context.firestore(), 'appointments/appointment-b'), appointment('appointment-b', 'user-b')),
    )
  })

  test('7 guest cannot create appointment', async () => {
    const context = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(context.firestore(), 'appointments/appointment-a'), appointment('appointment-a', 'user-a')),
    )
  })

  test('8 user reads own appointment', async () => {
    await seed('appointments/appointment-a', appointment('appointment-a', 'user-a'))
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertSucceeds(getDoc(doc(context.firestore(), 'appointments/appointment-a')))
  })

  test('9 user cannot read another appointment', async () => {
    await seed('appointments/appointment-a', appointment('appointment-a', 'user-a'))
    const context = testEnv.authenticatedContext('user-b', { email: 'user-b@example.test' })
    await assertFails(getDoc(doc(context.firestore(), 'appointments/appointment-a')))
  })

  test('10 user deletes own appointment', async () => {
    await seed('appointments/appointment-a', appointment('appointment-a', 'user-a'))
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertSucceeds(deleteDoc(doc(context.firestore(), 'appointments/appointment-a')))
  })

  test('11 user cannot delete another appointment', async () => {
    await seed('appointments/appointment-a', appointment('appointment-a', 'user-a'))
    const context = testEnv.authenticatedContext('user-b', { email: 'user-b@example.test' })
    await assertFails(deleteDoc(doc(context.firestore(), 'appointments/appointment-a')))
  })

  test('12 user cannot change appointment status', async () => {
    await seed('appointments/appointment-a', appointment('appointment-a', 'user-a'))
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertFails(
      updateDoc(doc(context.firestore(), 'appointments/appointment-a'), {
        status: 'confirmed',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  test('13 admin reads all appointments', async () => {
    await seedAdmin()
    await seed('appointments/appointment-a', appointment('appointment-a', 'user-a'))
    await seed('appointments/appointment-b', appointment('appointment-b', 'user-b'))
    const context = testEnv.authenticatedContext('admin-user', { email: 'admin@example.test' })
    const snapshot = await assertSucceeds(
      getDocs(collection(context.firestore(), 'appointments')),
    )
    assert.equal(snapshot.size, 2)
  })

  test('14 admin changes appointment status', async () => {
    await seedAdmin()
    await seed('appointments/appointment-a', appointment('appointment-a', 'user-a'))
    const context = testEnv.authenticatedContext('admin-user', { email: 'admin@example.test' })
    await assertSucceeds(
      updateDoc(doc(context.firestore(), 'appointments/appointment-a'), {
        status: 'confirmed',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  test('15 admin cannot change appointment userId', async () => {
    await seedAdmin()
    await seed('appointments/appointment-a', appointment('appointment-a', 'user-a'))
    const context = testEnv.authenticatedContext('admin-user', { email: 'admin@example.test' })
    await assertFails(
      updateDoc(doc(context.firestore(), 'appointments/appointment-a'), {
        userId: 'user-b',
        updatedAt: serverTimestamp(),
      }),
    )
  })
})

describe('booking slot security', () => {
  test('25 guest cannot create a booking slot', async () => {
    const context = testEnv.unauthenticatedContext()
    await assertFails(reserveSlot(context, 'appointment-a', 'user-a'))
  })

  test('26 user creates an own valid appointment and slot atomically', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertSucceeds(reserveSlot(context, 'appointment-a', 'user-a'))
    const slotSnapshot = await getDoc(doc(context.firestore(), 'bookingSlots/2026-08-20__10:00'))
    assert.equal(slotSnapshot.data().appointmentId, 'appointment-a')
  })

  test('27 user cannot create a slot linked to another UID', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertFails(reserveSlot(context, 'appointment-b', 'user-b'))
  })

  test('28 user cannot overwrite an occupied slot', async () => {
    await seed('appointments/appointment-a', slottedAppointment('appointment-a', 'user-a'))
    await seed('bookingSlots/2026-08-20__10:00', bookingSlot('appointment-a'))
    const context = testEnv.authenticatedContext('user-b', { email: 'user-b@example.test' })
    await assertFails(
      setDoc(
        doc(context.firestore(), 'bookingSlots/2026-08-20__10:00'),
        bookingSlot('appointment-b'),
      ),
    )
  })

  test('29 user cannot delete another user slot', async () => {
    await seed('appointments/appointment-a', slottedAppointment('appointment-a', 'user-a'))
    await seed('bookingSlots/2026-08-20__10:00', bookingSlot('appointment-a'))
    const context = testEnv.authenticatedContext('user-b', { email: 'user-b@example.test' })
    await assertFails(deleteDoc(doc(context.firestore(), 'bookingSlots/2026-08-20__10:00')))
  })

  test('30 owner releases own appointment and slot atomically', async () => {
    await seed('appointments/appointment-a', slottedAppointment('appointment-a', 'user-a'))
    await seed('bookingSlots/2026-08-20__10:00', bookingSlot('appointment-a'))
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    const database = context.firestore()

    await assertSucceeds(
      runTransaction(database, async (transaction) => {
        transaction.delete(doc(database, 'appointments/appointment-a'))
        transaction.delete(doc(database, 'bookingSlots/2026-08-20__10:00'))
      }),
    )
  })

  test('31 admin can cancel an appointment and release its slot', async () => {
    await seedAdmin()
    await seed('appointments/appointment-a', slottedAppointment('appointment-a', 'user-a'))
    await seed('bookingSlots/2026-08-20__10:00', bookingSlot('appointment-a'))
    const context = testEnv.authenticatedContext('admin-user', { email: 'admin@example.test' })
    const database = context.firestore()

    await assertSucceeds(
      runTransaction(database, async (transaction) => {
        transaction.update(doc(database, 'appointments/appointment-a'), {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
        })
        transaction.delete(doc(database, 'bookingSlots/2026-08-20__10:00'))
      }),
    )
  })

  test('32 invalid booking slot schema is denied', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    const database = context.firestore()
    const batch = writeBatch(database)
    batch.set(
      doc(database, 'appointments/appointment-a'),
      slottedAppointment('appointment-a', 'user-a'),
    )
    batch.set(doc(database, 'bookingSlots/2026-08-20__10:00'), {
      ...bookingSlot('appointment-a'),
      email: 'private@example.test',
    })
    await assertFails(batch.commit())
  })
})

describe('booking conflict consistency', () => {
  test('33 concurrent reservations allow exactly one appointment and one slot', async () => {
    const userA = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    const userB = testEnv.authenticatedContext('user-b', { email: 'user-b@example.test' })
    const results = await Promise.allSettled([
      reserveSlot(userA, 'appointment-a', 'user-a'),
      reserveSlot(userB, 'appointment-b', 'user-b'),
    ])

    assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1)
    assert.equal(results.filter(({ status }) => status === 'rejected').length, 1)

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore()
      assert.equal((await getDocs(collection(database, 'appointments'))).size, 1)
      assert.equal((await getDocs(collection(database, 'bookingSlots'))).size, 1)
    })
  })

  test('34 delete releases a slot so another user can rebook it', async () => {
    const userA = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    const userB = testEnv.authenticatedContext('user-b', { email: 'user-b@example.test' })
    await reserveSlot(userA, 'appointment-a', 'user-a')

    const databaseA = userA.firestore()
    await runTransaction(databaseA, async (transaction) => {
      transaction.delete(doc(databaseA, 'appointments/appointment-a'))
      transaction.delete(doc(databaseA, 'bookingSlots/2026-08-20__10:00'))
    })

    await assertSucceeds(reserveSlot(userB, 'appointment-b', 'user-b'))
  })

  test('35 admin cancel releases a slot so another user can rebook it', async () => {
    await seedAdmin()
    const userA = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    const userB = testEnv.authenticatedContext('user-b', { email: 'user-b@example.test' })
    const admin = testEnv.authenticatedContext('admin-user', { email: 'admin@example.test' })
    await reserveSlot(userA, 'appointment-a', 'user-a')

    const adminDatabase = admin.firestore()
    await runTransaction(adminDatabase, async (transaction) => {
      transaction.update(doc(adminDatabase, 'appointments/appointment-a'), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      })
      transaction.delete(doc(adminDatabase, 'bookingSlots/2026-08-20__10:00'))
    })

    await assertSucceeds(reserveSlot(userB, 'appointment-b', 'user-b'))
  })

  test('36 admin confirm keeps the slot occupied', async () => {
    await seedAdmin()
    const userA = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    const admin = testEnv.authenticatedContext('admin-user', { email: 'admin@example.test' })
    await reserveSlot(userA, 'appointment-a', 'user-a')
    await assertSucceeds(
      updateDoc(doc(admin.firestore(), 'appointments/appointment-a'), {
        status: 'confirmed',
        updatedAt: serverTimestamp(),
      }),
    )
    assert.equal(
      (await getDoc(doc(admin.firestore(), 'bookingSlots/2026-08-20__10:00'))).exists(),
      true,
    )
  })

  test('37 completed appointment retains its historical slot consistently', async () => {
    await seedAdmin()
    const userA = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    const admin = testEnv.authenticatedContext('admin-user', { email: 'admin@example.test' })
    await reserveSlot(userA, 'appointment-a', 'user-a')
    await assertSucceeds(
      updateDoc(doc(admin.firestore(), 'appointments/appointment-a'), {
        status: 'completed',
        updatedAt: serverTimestamp(),
      }),
    )
    assert.equal(
      (await getDoc(doc(admin.firestore(), 'bookingSlots/2026-08-20__10:00'))).exists(),
      true,
    )
  })
})

describe('ratings', () => {
  test('16 guest cannot create rating', async () => {
    const context = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(context.firestore(), 'ratings/user-a__finding-a-gp'), rating('user-a', 'finding-a-gp')),
    )
  })

  test('17 authenticated user creates own rating', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertSucceeds(
      setDoc(doc(context.firestore(), 'ratings/user-a__finding-a-gp'), rating('user-a', 'finding-a-gp')),
    )
  })

  test('18 user cannot create rating under another identity', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertFails(
      setDoc(doc(context.firestore(), 'ratings/user-b__finding-a-gp'), rating('user-b', 'finding-a-gp')),
    )
  })

  test('19 score zero is denied', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertFails(
      setDoc(doc(context.firestore(), 'ratings/user-a__finding-a-gp'), rating('user-a', 'finding-a-gp', 0)),
    )
  })

  test('20 score six is denied', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertFails(
      setDoc(doc(context.firestore(), 'ratings/user-a__finding-a-gp'), rating('user-a', 'finding-a-gp', 6)),
    )
  })

  test('21 valid score update is allowed', async () => {
    await seed('ratings/user-a__finding-a-gp', rating('user-a', 'finding-a-gp', 4))
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertSucceeds(
      updateDoc(doc(context.firestore(), 'ratings/user-a__finding-a-gp'), {
        score: 5,
        updatedAt: serverTimestamp(),
      }),
    )
  })

  test('22 user cannot change resourceId', async () => {
    await seed('ratings/user-a__finding-a-gp', rating('user-a', 'finding-a-gp'))
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertFails(
      updateDoc(doc(context.firestore(), 'ratings/user-a__finding-a-gp'), {
        resourceId: 'interpreters',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  test('23 user cannot change userId', async () => {
    await seed('ratings/user-a__finding-a-gp', rating('user-a', 'finding-a-gp'))
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    await assertFails(
      updateDoc(doc(context.firestore(), 'ratings/user-a__finding-a-gp'), {
        userId: 'user-b',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  test('24 guest can read ratings', async () => {
    await seed('ratings/user-a__finding-a-gp', rating('user-a', 'finding-a-gp'))
    const context = testEnv.unauthenticatedContext()
    const snapshot = await assertSucceeds(
      getDoc(doc(context.firestore(), 'ratings/user-a__finding-a-gp')),
    )
    assert.equal(snapshot.data().score, 4)
  })
})
