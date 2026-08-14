export const APPOINTMENTS_STORAGE_KEY = 'migrantHealthHub.appointments'
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
