export function timestampToIso(value) {
  if (typeof value === 'string') {
    return value
  }

  return value?.toDate?.().toISOString() ?? ''
}
