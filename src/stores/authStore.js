import { computed, reactive } from 'vue'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { firebaseAuth, firestoreDb } from '../firebase/firebase.js'
import { normaliseEmail } from '../utils/authValidation.js'

const state = reactive({
  profile: null,
  users: [],
  ready: false,
  error: '',
})

let initialisePromise
let unsubscribeAdminUsers

export const currentUser = computed(() => state.profile)
export const isAuthenticated = computed(() => Boolean(state.profile?.active))
export const isAdmin = computed(() => state.profile?.role === 'admin' && state.profile?.active)
export const authReady = computed(() => state.ready)

function timestampToIso(value) {
  if (typeof value === 'string') {
    return value
  }

  return value?.toDate?.().toISOString() ?? ''
}

function publicProfile(uid, data) {
  return {
    id: uid,
    uid,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    active: data.active,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

function validProfile(uid, authEmail, data) {
  return (
    data?.uid === uid &&
    typeof data.fullName === 'string' &&
    normaliseEmail(data.email ?? '') === normaliseEmail(authEmail ?? '') &&
    ['user', 'admin'].includes(data.role) &&
    typeof data.active === 'boolean'
  )
}

function stopAdminUsersSubscription() {
  unsubscribeAdminUsers?.()
  unsubscribeAdminUsers = undefined
}

function startAdminUsersSubscription(profile) {
  stopAdminUsersSubscription()
  state.users = [profile]

  if (profile.role !== 'admin') {
    return
  }

  unsubscribeAdminUsers = onSnapshot(
    collection(firestoreDb, 'users'),
    (snapshot) => {
      state.users = snapshot.docs
        .map((profileDocument) => publicProfile(profileDocument.id, profileDocument.data()))
        .filter((user) => ['user', 'admin'].includes(user.role))
    },
    () => {
      state.error = 'The user directory could not be loaded.'
      state.users = [profile]
    },
  )
}

function clearCurrentUser() {
  stopAdminUsersSubscription()
  state.profile = null
  state.users = []
}

function profileError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

async function loadProfile(firebaseUser) {
  const snapshot = await getDoc(doc(firestoreDb, 'users', firebaseUser.uid))

  if (!snapshot.exists()) {
    throw profileError('profile/missing', 'Your account profile is not available.')
  }

  const data = snapshot.data()

  if (!validProfile(firebaseUser.uid, firebaseUser.email, data)) {
    throw profileError('profile/invalid', 'Your account profile is invalid.')
  }

  if (!data.active) {
    throw profileError('profile/inactive', 'Your account is inactive.')
  }

  const profile = publicProfile(firebaseUser.uid, data)
  state.profile = profile
  state.error = ''
  startAdminUsersSubscription(profile)
  return profile
}

function safeRegistrationMessage(error) {
  if (error?.code === 'auth/email-already-in-use') {
    return 'An account with this email already exists.'
  }

  if (error?.code === 'auth/weak-password') {
    return 'The password does not meet the authentication requirements.'
  }

  if (error?.code === 'auth/invalid-email') {
    return 'Enter a valid email address.'
  }

  return 'Account creation could not be completed. Please try again.'
}

export function getUsers() {
  return state.users.map((user) => ({ ...user }))
}

export function initialiseAuth() {
  if (initialisePromise) {
    return initialisePromise
  }

  initialisePromise = new Promise((resolve) => {
    let initialStateHandled = false

    const finishInitialState = () => {
      state.ready = true

      if (!initialStateHandled) {
        initialStateHandled = true
        resolve()
      }
    }

    onAuthStateChanged(
      firebaseAuth,
      async (firebaseUser) => {
        if (!firebaseUser) {
          clearCurrentUser()
          state.error = ''
          finishInitialState()
          return
        }

        try {
          await loadProfile(firebaseUser)
        } catch (error) {
          clearCurrentUser()
          state.error = 'Your authenticated account profile could not be loaded.'

          if (error?.code === 'profile/inactive') {
            await signOut(firebaseAuth)
          }
        } finally {
          finishInitialState()
        }
      },
      () => {
        clearCurrentUser()
        state.error = 'Authentication could not be initialized.'
        finishInitialState()
      },
    )
  })

  return initialisePromise
}

export async function register({ fullName, email, password }) {
  const normalisedEmail = normaliseEmail(email)
  let credential
  let profileCreated = false

  try {
    credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      normalisedEmail,
      password,
    )
    const profileReference = doc(firestoreDb, 'users', credential.user.uid)

    await setDoc(profileReference, {
      uid: credential.user.uid,
      fullName: fullName.trim(),
      email: normaliseEmail(credential.user.email ?? normalisedEmail),
      role: 'user',
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    profileCreated = true

    return await loadProfile(credential.user)
  } catch (error) {
    if (credential?.user && !profileCreated) {
      try {
        await deleteUser(credential.user)
      } catch {
        await signOut(firebaseAuth).catch(() => {})
      }
      clearCurrentUser()
    }

    throw new Error(safeRegistrationMessage(error))
  }
}

export async function login({ email, password, rememberMe = false }) {
  try {
    await setPersistence(
      firebaseAuth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence,
    )
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      normaliseEmail(email),
      password,
    )

    try {
      return await loadProfile(credential.user)
    } catch {
      await signOut(firebaseAuth)
      clearCurrentUser()
      throw new Error('Email or password is incorrect.')
    }
  } catch {
    throw new Error('Email or password is incorrect.')
  }
}

export async function logout() {
  clearCurrentUser()
  await signOut(firebaseAuth)
}
