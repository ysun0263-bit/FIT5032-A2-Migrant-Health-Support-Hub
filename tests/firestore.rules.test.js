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
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
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

describe('users security rules', () => {
  test('an authenticated user creates and reads their own standard profile', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    const reference = doc(context.firestore(), 'users/user-a')

    await assertSucceeds(setDoc(reference, profile('user-a', 'user-a@example.test')))
    const snapshot = await assertSucceeds(getDoc(reference))

    assert.equal(snapshot.data().role, 'user')
  })

  test('a user cannot create an admin profile', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })
    const reference = doc(context.firestore(), 'users/user-a')

    await assertFails(setDoc(reference, profile('user-a', 'user-a@example.test', 'admin')))
  })

  test('a user cannot create a profile for another UID', async () => {
    const context = testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' })

    await assertFails(
      setDoc(
        doc(context.firestore(), 'users/user-b'),
        profile('user-b', 'user-b@example.test'),
      ),
    )
  })

  test('a user can update their name but cannot change role', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'users/user-a'),
        profile('user-a', 'user-a@example.test'),
      )
    })
    const reference = doc(
      testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' }).firestore(),
      'users/user-a',
    )

    await assertSucceeds(
      updateDoc(reference, { fullName: 'Updated User A', updatedAt: serverTimestamp() }),
    )
    await assertFails(updateDoc(reference, { role: 'admin', updatedAt: serverTimestamp() }))
  })

  test('a user cannot read another profile', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'users/user-b'),
        profile('user-b', 'user-b@example.test'),
      )
    })
    const reference = doc(
      testEnv.authenticatedContext('user-a', { email: 'user-a@example.test' }).firestore(),
      'users/user-b',
    )

    await assertFails(getDoc(reference))
  })

  test('an unauthenticated client cannot read a profile', async () => {
    const reference = doc(testEnv.unauthenticatedContext().firestore(), 'users/user-a')

    await assertFails(getDoc(reference))
  })

  test('an active admin profile can list users', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'users/admin-user'),
        profile('admin-user', 'admin@example.test', 'admin'),
      )
      await setDoc(
        doc(context.firestore(), 'users/user-a'),
        profile('user-a', 'user-a@example.test'),
      )
    })
    const context = testEnv.authenticatedContext('admin-user', { email: 'admin@example.test' })

    const snapshot = await assertSucceeds(getDocs(collection(context.firestore(), 'users')))
    assert.equal(snapshot.size, 2)
  })
})
