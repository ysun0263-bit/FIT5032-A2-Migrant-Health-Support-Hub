<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import ServiceMap from '../components/ServiceMap.vue'
import SectionHeading from '../components/SectionHeading.vue'
import {
  formatDistance,
  formatDuration,
  getDirections,
  isPublicMapboxToken,
  searchHealthServices,
} from '../services/mapboxService.js'

const token = String(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '').trim()
const tokenIsPublic = isPublicMapboxToken(token)
const tokenError = !token
  ? 'Map configuration is not available.'
  : token.startsWith('sk.')
    ? 'Map configuration is invalid. A public Mapbox token is required.'
    : !tokenIsPublic
      ? 'Map configuration is invalid.'
      : ''

const query = ref('')
const results = ref([])
const selectedResult = ref(null)
const userLocation = ref(null)
const route = ref(null)
const travelMode = ref('walking')
const mapRef = ref()
const searching = ref(false)
const locating = ref(false)
const routing = ref(false)
const searchStatus = ref('Enter a service type and submit one search request.')
const locationStatus = ref('Location has not been requested.')
const routeStatus = ref('Choose a result and use your location to calculate a route.')
const mapStatus = ref('Map centred on Melbourne, Victoria.')
let searchController
let routeController
let searchGeneration = 0
let routeGeneration = 0

const routeSummary = computed(() => {
  if (!route.value || !selectedResult.value) return null
  return {
    destination: selectedResult.value.name,
    mode: travelMode.value === 'walking' ? 'Walking' : 'Driving',
    distance: formatDistance(route.value.distance),
    duration: formatDuration(route.value.duration),
  }
})

function errorMessage(error, fallback) {
  if (error?.name === 'AbortError') return ''
  return error?.message || fallback
}

async function handleSearch() {
  const trimmedQuery = query.value.trim()
  if (!trimmedQuery) {
    searchStatus.value = 'Enter a health service to search for.'
    return
  }

  searchController?.abort()
  routeController?.abort()
  searchController = new AbortController()
  const generation = ++searchGeneration
  routeGeneration += 1
  searching.value = true
  routing.value = false
  results.value = []
  selectedResult.value = null
  route.value = null
  routeStatus.value = 'Choose a result and use your location to calculate a route.'
  searchStatus.value = 'Searching for nearby health services...'

  try {
    const nextResults = await searchHealthServices({
      query: trimmedQuery,
      token,
      proximity: userLocation.value ?? undefined,
      limit: 8,
      signal: searchController.signal,
    })
    if (generation !== searchGeneration) return
    results.value = nextResults
    searchStatus.value = results.value.length
      ? `${results.value.length} health service result${results.value.length === 1 ? '' : 's'} found.`
      : 'No health services were found. Try a different search term.'
  } catch (error) {
    if (generation !== searchGeneration) return
    const message = errorMessage(error, 'Health service search could not be completed.')
    if (message) searchStatus.value = message
  } finally {
    if (generation === searchGeneration) searching.value = false
  }
}

function selectOnMap(result) {
  selectedResult.value = result
  mapRef.value?.focusResult(result)
}

function requestLocation() {
  if (!navigator.geolocation) {
    locationStatus.value = 'Your browser does not support location access. You can still search around Melbourne.'
    return
  }

  locating.value = true
  locationStatus.value = 'Waiting for location permission...'
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      userLocation.value = { longitude: coords.longitude, latitude: coords.latitude }
      routeController?.abort()
      routeGeneration += 1
      route.value = null
      routing.value = false
      routeStatus.value = 'Choose a result to calculate a route from your current location.'
      locating.value = false
      locationStatus.value = 'Your location is available for nearby searches and route planning.'
      mapRef.value?.focusUser()
    },
    (error) => {
      locating.value = false
      const detail = error.code === 1
        ? 'Location permission was denied.'
        : error.code === 2
          ? 'Your location is currently unavailable.'
          : 'The location request timed out.'
      locationStatus.value = `${detail} You can still search for health services around Melbourne.`
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
  )
}

async function calculateRoute(result = selectedResult.value) {
  selectedResult.value = result
  if (!userLocation.value) {
    routeStatus.value = 'Use your location first to calculate a route.'
    return
  }
  if (!result?.coordinates) {
    routeStatus.value = 'The selected service does not have usable coordinates.'
    return
  }

  routeController?.abort()
  routeController = new AbortController()
  const generation = ++routeGeneration
  routing.value = true
  routeStatus.value = `Calculating a ${travelMode.value} route to ${result.name}...`

  try {
    const nextRoute = await getDirections({
      origin: userLocation.value,
      destination: result.coordinates,
      profile: travelMode.value,
      token,
      signal: routeController.signal,
    })
    if (generation !== routeGeneration) return
    route.value = nextRoute
    routeStatus.value = `Route to ${result.name} is ready.`
  } catch (error) {
    if (generation !== routeGeneration) return
    const message = errorMessage(error, 'The route could not be calculated.')
    if (message) routeStatus.value = message
  } finally {
    if (generation === routeGeneration) routing.value = false
  }
}

function handleModeChange() {
  if (selectedResult.value && userLocation.value) calculateRoute(selectedResult.value)
}

onBeforeUnmount(() => {
  searchController?.abort()
  routeController?.abort()
})
</script>

<template>
  <section class="content-section page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Find Services"
      title="Find health services"
      text="Search Australian health service locations, view results on a map, and plan a walking or driving route from your current location."
    />

    <div v-if="tokenError" class="placeholder-notice" role="alert">
      <strong>{{ tokenError }}</strong>
      <p>The rest of the website remains available. Add a dedicated public token to enable service search and routing.</p>
    </div>

    <form class="search-panel service-search-form" aria-label="Health service search" @submit.prevent="handleSearch">
      <label for="health-service-query">
        Health service or place
        <input
          id="health-service-query"
          v-model="query"
          type="search"
          placeholder="For example: medical clinic or pharmacy"
          :disabled="!tokenIsPublic || searching"
        />
      </label>
      <div class="action-row">
        <button type="submit" class="button primary" :disabled="!tokenIsPublic || searching">
          {{ searching ? 'Searching...' : 'Search' }}
        </button>
        <button type="button" class="button secondary" :disabled="!tokenIsPublic || locating" @click="requestLocation">
          {{ locating ? 'Locating...' : 'Use my location' }}
        </button>
      </div>
      <p class="field-help">Search requests run only when you submit this form. Results are limited to Australia.</p>
      <p class="form-status" role="status" aria-live="polite">{{ searchStatus }}</p>
      <p class="form-status" role="status" aria-live="polite">{{ locationStatus }}</p>
    </form>

    <div v-if="tokenIsPublic" class="service-map-layout">
      <section class="service-results-panel" aria-labelledby="nearby-services-title">
        <div class="service-results-heading">
          <div>
            <p class="card-tag">Health Service Search</p>
            <h2 id="nearby-services-title">Nearby health services</h2>
          </div>
          <label for="travel-mode">
            Travel mode
            <select id="travel-mode" v-model="travelMode" :disabled="routing" @change="handleModeChange">
              <option value="walking">Walking</option>
              <option value="driving">Driving</option>
            </select>
          </label>
        </div>

        <div v-if="results.length" class="service-result-list">
          <article v-for="result in results" :key="result.id" class="service-result-card" :class="{ selected: selectedResult?.id === result.id }">
            <p class="card-tag">{{ result.category }}</p>
            <h3>{{ result.name }}</h3>
            <p>{{ result.address }}</p>
            <p v-if="result.distance !== null" class="service-distance">Approximately {{ formatDistance(result.distance) }} away</p>
            <div class="action-row">
              <button type="button" class="button secondary" @click="selectOnMap(result)">View on Map</button>
              <button type="button" class="button primary" :disabled="routing" @click="calculateRoute(result)">Get Route</button>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <h3>No search results yet</h3>
          <p>Try “medical clinic”, “hospital”, “pharmacy”, or “community health centre”.</p>
        </div>
      </section>

      <section class="map-panel" aria-labelledby="health-service-map-title">
        <h2 id="health-service-map-title">Service map</h2>
        <p class="field-help" role="status">{{ mapStatus }}</p>
        <ServiceMap
          ref="mapRef"
          :token="token"
          :results="results"
          :user-location="userLocation"
          :route="route"
          @select="selectOnMap"
          @route-request="calculateRoute"
          @ready="mapStatus = 'Map is ready.'"
          @map-error="mapStatus = $event"
        />
      </section>
    </div>

    <section class="route-summary-panel" aria-labelledby="route-summary-title">
      <p class="card-tag">Route information</p>
      <h2 id="route-summary-title">Selected route</h2>
      <p class="form-status" role="status" aria-live="polite">{{ routeStatus }}</p>
      <dl v-if="routeSummary" class="route-summary-grid">
        <div><dt>Destination</dt><dd>{{ routeSummary.destination }}</dd></div>
        <div><dt>Travel mode</dt><dd>{{ routeSummary.mode }}</dd></div>
        <div><dt>Distance</dt><dd>{{ routeSummary.distance }}</dd></div>
        <div><dt>Estimated travel time</dt><dd>{{ routeSummary.duration }}</dd></div>
      </dl>
    </section>

    <p class="location-privacy-note">
      Your location is requested only after you select “Use my location”. It stays in this page’s runtime state and is not saved to Firebase, local storage, analytics, or server logs.
    </p>
  </section>
</template>
