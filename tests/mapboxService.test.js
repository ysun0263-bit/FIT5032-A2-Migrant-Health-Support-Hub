import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MapboxServiceError,
  buildDirectionsUrl,
  buildSearchUrl,
  formatDistance,
  formatDuration,
  getDirections,
  normalizeSearchResult,
  searchHealthServices,
} from '../src/services/mapboxService.js'

const token = 'pk.test-public-token'
const origin = { longitude: 144.96, latitude: -37.81 }
const destination = { longitude: 145.01, latitude: -37.86 }

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

test('search result normalisation preserves compatibility with feature.id', () => {
  const result = normalizeSearchResult({
    id: 'poi.1',
    geometry: { coordinates: [145.02, -37.9] },
    properties: {
      name: 'Community Clinic',
      full_address: '1 Health Street, Melbourne VIC',
      poi_category: ['medical clinic'],
      distance: 1280,
    },
  })
  assert.deepEqual(result, {
    id: 'poi.1',
    name: 'Community Clinic',
    address: '1 Health Street, Melbourne VIC',
    category: 'medical clinic',
    distance: 1280,
    coordinates: { longitude: 145.02, latitude: -37.9 },
  })
})

test('real Search Box schema uses properties.mapbox_id when feature.id is absent', () => {
  const result = normalizeSearchResult({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [144.9557, -37.8077],
    },
    properties: {
      mapbox_id: 'dXJuOm1ieHBvaTo1NGY2M2M4OC0xNjIyLTRmNjUtYmMzOC1iMjgxM2MxN2Q5YzQ',
      name: 'Royal Melbourne Hospital',
      full_address: '300 Grattan Street, Parkville VIC 3050, Australia',
      poi_category: ['hospital'],
    },
  })

  assert.notEqual(result, null)
  assert.equal(
    result.id,
    'dXJuOm1ieHBvaTo1NGY2M2M4OC0xNjIyLTRmNjUtYmMzOC1iMjgxM2MxN2Q5YzQ',
  )
  assert.equal(result.name, 'Royal Melbourne Hospital')
  assert.equal(result.address, '300 Grattan Street, Parkville VIC 3050, Australia')
  assert.deepEqual(result.coordinates, { longitude: 144.9557, latitude: -37.8077 })
})

test('missing address and category receive honest fallback text', () => {
  const result = normalizeSearchResult({ id: 'poi.2', geometry: { coordinates: [145, -37.8] }, properties: { name: 'Clinic' } })
  assert.equal(result.address, 'Address not provided')
  assert.equal(result.category, 'Category not provided')
})

test('invalid coordinates cause a result to be ignored', () => {
  assert.equal(normalizeSearchResult({ id: 'bad', geometry: { coordinates: [500, -37] } }), null)
})

test('distance and duration are formatted without excessive decimals', () => {
  assert.equal(formatDistance(3200), '3.2 km')
  assert.equal(formatDistance(450), '450 m')
  assert.equal(formatDuration(2460), '41 min')
  assert.equal(formatDuration(4380), '1 hr 13 min')
})

test('search URL encodes the query and limits results', () => {
  const url = new URL(buildSearchUrl({ query: 'mental health & clinic', token, limit: 50 }))
  assert.equal(url.searchParams.get('q'), 'mental health & clinic')
  assert.equal(url.searchParams.get('country'), 'AU')
  assert.equal(url.searchParams.get('types'), 'poi')
  assert.equal(url.searchParams.get('limit'), '10')
})

test('empty search query is rejected', () => {
  assert.throws(() => buildSearchUrl({ query: '   ', token }), MapboxServiceError)
})

test('secret token is rejected before a request is made', () => {
  assert.throws(() => buildSearchUrl({ query: 'clinic', token: 'sk.secret' }), /configuration/i)
})

test('directions URL accepts walking and rejects unsupported profiles', () => {
  assert.match(buildDirectionsUrl({ origin, destination, profile: 'walking', token }), /mapbox\/walking/)
  assert.throws(() => buildDirectionsUrl({ origin, destination, profile: 'flying', token }), /supported travel mode/i)
})

test('mock search success normalises results', async () => {
  const results = await searchHealthServices({
    query: 'clinic', token, fetchImpl: async () => response({ features: [{ id: 'poi.3', geometry: { coordinates: [145, -37.8] }, properties: { name: 'Clinic' } }] }),
  })
  assert.equal(results.length, 1)
  assert.equal(results[0].name, 'Clinic')
})

test('mock search zero results returns an empty list', async () => {
  assert.deepEqual(await searchHealthServices({ query: 'clinic', token, fetchImpl: async () => response({ features: [] }) }), [])
})

test('mock search HTTP error is converted to a friendly error', async () => {
  await assert.rejects(() => searchHealthServices({ query: 'clinic', token, fetchImpl: async () => response({}, 429) }), /temporarily busy/i)
})

test('mock directions success returns route geometry and summary data', async () => {
  const route = await getDirections({ origin, destination, token, fetchImpl: async () => response({ routes: [{ geometry: { type: 'LineString', coordinates: [[144.96, -37.81], [145.01, -37.86]] }, distance: 3200, duration: 2460 }] }) })
  assert.equal(route.distance, 3200)
  assert.equal(route.duration, 2460)
})

test('mock directions no-route response is rejected', async () => {
  await assert.rejects(() => getDirections({ origin, destination, token, fetchImpl: async () => response({ routes: [] }) }), /No route was found/i)
})

test('mock directions HTTP error is rejected without exposing raw data', async () => {
  await assert.rejects(() => getDirections({ origin, destination, token, fetchImpl: async () => response({ secret: 'hidden' }, 500) }), /could not complete/i)
})
