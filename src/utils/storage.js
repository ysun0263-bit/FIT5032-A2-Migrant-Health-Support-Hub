export const APPOINTMENTS_STORAGE_KEY = 'migrantHealthHub.appointments'

export function readStorageArray(key) {
  try {
    const rawValue = window.localStorage.getItem(key)

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
  window.localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []))
}
