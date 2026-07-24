export const APPOINTMENTS_STORAGE_KEY = 'migrantHealthHub.appointments'
export const USERS_STORAGE_KEY = 'migrantHealthHub.users'
export const SESSION_STORAGE_KEY = 'migrantHealthHub.session'
export const RATINGS_STORAGE_KEY = 'migrantHealthHub.ratings'

function getLocalStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null
}

export function readStorageArray(key) {
  try {
    const storage = getLocalStorage()
    const rawValue = storage?.getItem(key)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

export function writeStorageArray(key, value) {
  getLocalStorage()?.setItem(key, JSON.stringify(Array.isArray(value) ? value : []))
}

export function readStorageObject(key) {
  try {
    const storage = getLocalStorage()
    const rawValue = storage?.getItem(key)

    if (!rawValue) {
      return null
    }

    const parsedValue = JSON.parse(rawValue)
    return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)
      ? parsedValue
      : null
  } catch {
    return null
  }
}

export function writeStorageObject(key, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    removeStorageItem(key)
    return
  }

  getLocalStorage()?.setItem(key, JSON.stringify(value))
}

export function removeStorageItem(key) {
  getLocalStorage()?.removeItem(key)
}
