import { computed, reactive } from 'vue'
import { DEMO_ADMIN_ACCOUNT } from '../data/demoAccounts.js'
import { createId } from '../utils/ids.js'
import { generateSalt, hashPassword, verifyPassword } from '../utils/password.js'
import { normaliseEmail } from '../utils/authValidation.js'
import {
  SESSION_STORAGE_KEY,
  USERS_STORAGE_KEY,
  readStorageArray,
  readStorageObject,
  removeStorageItem,
  writeStorageArray,
  writeStorageObject,
} from '../utils/storage.js'

const state = reactive({
  users: [],
  session: null,
  ready: false,
  error: '',
})

export const currentUser = computed(() => {
  if (!state.session?.userId) {
    return null
  }

  return state.users.find((user) => user.id === state.session.userId && user.active) ?? null
})

export const isAuthenticated = computed(() => Boolean(currentUser.value))
export const isAdmin = computed(() => currentUser.value?.role === 'admin')

function persistUsers() {
  writeStorageArray(USERS_STORAGE_KEY, state.users)
}

function setSession(userId) {
  state.session = {
    userId,
    createdAt: new Date().toISOString(),
  }
  writeStorageObject(SESSION_STORAGE_KEY, state.session)
}

function clearSession() {
  state.session = null
  removeStorageItem(SESSION_STORAGE_KEY)
}

function publicUser(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    active: user.active,
  }
}

export function getUsers() {
  return state.users.map(publicUser)
}

export function getInternalUsersForValidation() {
  return state.users
}

export async function seedDemoAdmin() {
  const adminEmail = normaliseEmail(DEMO_ADMIN_ACCOUNT.email)
  const existingAdmin = state.users.find((user) => normaliseEmail(user.email) === adminEmail)

  if (existingAdmin) {
    return
  }

  const passwordSalt = generateSalt()
  const passwordHash = await hashPassword(DEMO_ADMIN_ACCOUNT.password, passwordSalt)
  state.users = [
    {
      id: createId('user'),
      fullName: DEMO_ADMIN_ACCOUNT.fullName,
      email: adminEmail,
      passwordHash,
      passwordSalt,
      role: 'admin',
      createdAt: new Date().toISOString(),
      active: true,
    },
    ...state.users,
  ]
  persistUsers()
}

export async function initialiseAuth() {
  state.users = readStorageArray(USERS_STORAGE_KEY).filter((user) =>
    ['user', 'admin'].includes(user.role),
  )

  try {
    await seedDemoAdmin()
    const session = readStorageObject(SESSION_STORAGE_KEY)
    const sessionUser = state.users.find((user) => user.id === session?.userId && user.active)
    state.session = sessionUser ? session : null

    if (!sessionUser) {
      clearSession()
    }
  } catch (error) {
    state.error = error.message
    clearSession()
  } finally {
    state.ready = true
  }
}

export async function register({ fullName, email, password }) {
  const normalisedEmail = normaliseEmail(email)

  if (state.users.some((user) => normaliseEmail(user.email) === normalisedEmail)) {
    throw new Error('An account with this email already exists.')
  }

  const passwordSalt = generateSalt()
  const passwordHash = await hashPassword(password, passwordSalt)
  const user = {
    id: createId('user'),
    fullName: fullName.trim(),
    email: normalisedEmail,
    passwordHash,
    passwordSalt,
    role: 'user',
    createdAt: new Date().toISOString(),
    active: true,
  }

  state.users = [user, ...state.users]
  persistUsers()
  setSession(user.id)
  return publicUser(user)
}

export async function login({ email, password }) {
  const normalisedEmail = normaliseEmail(email)
  const user = state.users.find(
    (candidate) => normaliseEmail(candidate.email) === normalisedEmail && candidate.active,
  )

  if (!user) {
    throw new Error('Email or password is incorrect.')
  }

  const matches = await verifyPassword(password, user.passwordSalt, user.passwordHash)

  if (!matches) {
    throw new Error('Email or password is incorrect.')
  }

  setSession(user.id)
  return publicUser(user)
}

export function logout() {
  clearSession()
}
