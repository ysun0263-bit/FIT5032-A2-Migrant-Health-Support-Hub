const SEARCH_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/forward'
const DIRECTIONS_ENDPOINT = 'https://api.mapbox.com/directions/v5/mapbox'

export const MELBOURNE_COORDINATES = Object.freeze({ longitude: 144.9631, latitude: -37.8136 })
export const SUPPORTED_ROUTE_PROFILES = Object.freeze(['walking', 'driving'])

export class MapboxServiceError extends Error {
  constructor(message, code = 'unknown') {
    super(message)
    this.name = 'MapboxServiceError'
    this.code = code
  }
}

export function isPublicMapboxToken(token) {
  return typeof token === 'string' && token.trim().startsWith('pk.')
}

export function isValidCoordinates(value) {
  return Boolean(
    value &&
      Number.isFinite(value.longitude) &&
      Number.isFinite(value.latitude) &&
      value.longitude >= -180 &&
      value.longitude <= 180 &&
      value.latitude >= -90 &&
      value.latitude <= 90,
  )
}

function requirePublicToken(token) {
  if (!isPublicMapboxToken(token)) {
    throw new MapboxServiceError('Map configuration is not available.', 'configuration')
  }
  return token.trim()
}

function requireCoordinates(value, label) {
  if (!isValidCoordinates(value)) {
    throw new MapboxServiceError(`${label} coordinates are invalid.`, 'invalid-coordinates')
  }
  return value
}

export function buildSearchUrl({
  query,
  token,
  proximity = MELBOURNE_COORDINATES,
  limit = 8,
}) {
  const trimmedQuery = typeof query === 'string' ? query.trim() : ''
  if (!trimmedQuery) {
    throw new MapboxServiceError('Enter a health service to search for.', 'empty-query')
  }

  const safeToken = requirePublicToken(token)
  const safeProximity = isValidCoordinates(proximity) ? proximity : MELBOURNE_COORDINATES
  const params = new URLSearchParams({
    q: trimmedQuery,
    access_token: safeToken,
    country: 'AU',
    types: 'poi',
    limit: String(Math.min(Math.max(Number(limit) || 8, 1), 10)),
    proximity: `${safeProximity.longitude},${safeProximity.latitude}`,
  })
  return `${SEARCH_ENDPOINT}?${params}`
}

export function normalizeSearchResult(feature) {
  const properties = feature?.properties ?? {}
  const rawCoordinates = properties.coordinates ?? {}
  const geometryCoordinates = feature?.geometry?.coordinates

  const coordinates = {
    longitude: Number(rawCoordinates.longitude ?? geometryCoordinates?.[0]),
    latitude: Number(rawCoordinates.latitude ?? geometryCoordinates?.[1]),
  }

  const resultId = feature?.id ?? properties.mapbox_id

  if (!resultId || !isValidCoordinates(coordinates)) {
    return null
  }

  const categories = properties.poi_category ?? properties.category
  const category = Array.isArray(categories) ? categories[0] : categories

  return {
    id: String(resultId),
    name: properties.name || feature.text || 'Unnamed health service',
    address:
      properties.full_address ||
      [properties.address, properties.place_formatted].filter(Boolean).join(', ') ||
      feature.place_name ||
      'Address not provided',
    coordinates,
    category: category || 'Category not provided',
    distance: Number.isFinite(Number(properties.distance))
      ? Number(properties.distance)
      : null,
  }
}

function friendlyHttpError(status) {
  if (status === 401 || status === 403) {
    return new MapboxServiceError('Map access is not authorised. Check the public token configuration.', 'authorisation')
  }
  if (status === 429) {
    return new MapboxServiceError('Map search is temporarily busy. Please wait and try again.', 'rate-limit')
  }
  return new MapboxServiceError('The map service could not complete the request.', 'http')
}

async function fetchJson(url, { fetchImpl, signal }) {
  let response
  try {
    response = await fetchImpl(url, { signal })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new MapboxServiceError('The map service could not be reached. Check your connection.', 'network')
  }
  if (!response.ok) throw friendlyHttpError(response.status)
  return response.json()
}

export async function searchHealthServices({
  query,
  token,
  proximity,
  limit = 8,
  signal,
  fetchImpl = fetch,
}) {
  const url = buildSearchUrl({ query, token, proximity, limit })
  const data = await fetchJson(url, { fetchImpl, signal })
  return (Array.isArray(data.features) ? data.features : [])
    .map(normalizeSearchResult)
    .filter(Boolean)
    .slice(0, 10)
}

export function buildDirectionsUrl({ origin, destination, profile = 'walking', token }) {
  requireCoordinates(origin, 'Origin')
  requireCoordinates(destination, 'Destination')
  if (!SUPPORTED_ROUTE_PROFILES.includes(profile)) {
    throw new MapboxServiceError('Choose a supported travel mode.', 'invalid-profile')
  }

  const safeToken = requirePublicToken(token)
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`
  const params = new URLSearchParams({
    alternatives: 'false',
    geometries: 'geojson',
    overview: 'full',
    steps: 'false',
    access_token: safeToken,
  })
  return `${DIRECTIONS_ENDPOINT}/${profile}/${coordinates}?${params}`
}

export async function getDirections({
  origin,
  destination,
  profile = 'walking',
  token,
  signal,
  fetchImpl = fetch,
}) {
  const url = buildDirectionsUrl({ origin, destination, profile, token })
  const data = await fetchJson(url, { fetchImpl, signal })
  const route = data.routes?.[0]
  if (!route?.geometry || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
    throw new MapboxServiceError('No route was found for the selected service.', 'no-route')
  }
  return { geometry: route.geometry, distance: route.distance, duration: route.duration }
}

export function formatDistance(metres) {
  if (!Number.isFinite(metres) || metres < 0) return 'Not available'
  if (metres < 1000) return `${Math.round(metres)} m`
  return `${(metres / 1000).toFixed(1)} km`
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'Not available'
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
}
