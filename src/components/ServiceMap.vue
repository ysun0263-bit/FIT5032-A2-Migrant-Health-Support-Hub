<script setup>
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { MELBOURNE_COORDINATES } from '../services/mapboxService.js'

const props = defineProps({
  token: { type: String, required: true },
  results: { type: Array, default: () => [] },
  userLocation: { type: Object, default: null },
  route: { type: Object, default: null },
})
const emit = defineEmits(['select', 'route-request', 'map-error', 'ready'])

let mapboxgl
let map
let resultMarkers = []
let userMarker
let destroyed = false
const routeSourceId = 'selected-health-service-route'
const routeLayerId = 'selected-health-service-route-line'

function removeResultMarkers() {
  resultMarkers.forEach((marker) => marker.remove())
  resultMarkers = []
}

function popupContent(result) {
  const content = document.createElement('div')
  const heading = document.createElement('strong')
  const address = document.createElement('p')
  const button = document.createElement('button')
  heading.textContent = result.name
  address.textContent = result.address
  button.type = 'button'
  button.className = 'map-popup-action'
  button.textContent = 'Get Route'
  button.addEventListener('click', () => emit('route-request', result))
  content.append(heading, address, button)
  return content
}

function syncResultMarkers() {
  if (!map || !mapboxgl) return
  removeResultMarkers()
  resultMarkers = props.results.map((result) => {
    const markerButton = document.createElement('button')
    markerButton.type = 'button'
    markerButton.className = 'service-map-marker'
    markerButton.setAttribute('aria-label', `View ${result.name} on map`)
    markerButton.addEventListener('click', () => emit('select', result))
    const popup = new mapboxgl.Popup({ offset: 22 }).setDOMContent(popupContent(result))
    return new mapboxgl.Marker({ element: markerButton })
      .setLngLat([result.coordinates.longitude, result.coordinates.latitude])
      .setPopup(popup)
      .addTo(map)
  })
}

function syncUserMarker() {
  if (!map || !mapboxgl) return
  userMarker?.remove()
  userMarker = undefined
  if (!props.userLocation) return
  userMarker = new mapboxgl.Marker({ color: '#1d4ed8' })
    .setLngLat([props.userLocation.longitude, props.userLocation.latitude])
    .setPopup(new mapboxgl.Popup({ offset: 20 }).setText('Your current location'))
    .addTo(map)
}

function removeRoute() {
  if (!map?.isStyleLoaded()) return
  if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId)
  if (map.getSource(routeSourceId)) map.removeSource(routeSourceId)
}

function syncRoute() {
  if (!map?.isStyleLoaded()) return
  if (!props.route?.geometry) {
    removeRoute()
    return
  }
  const existingSource = map.getSource(routeSourceId)
  if (existingSource) {
    existingSource.setData(props.route.geometry)
  } else {
    map.addSource(routeSourceId, { type: 'geojson', data: props.route.geometry })
    map.addLayer({
      id: routeLayerId,
      type: 'line',
      source: routeSourceId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#b45309', 'line-width': 6, 'line-opacity': 0.9 },
    })
  }

  const coordinates = props.route.geometry.coordinates ?? []
  if (coordinates.length > 1) {
    const bounds = coordinates.reduce(
      (currentBounds, coordinate) => currentBounds.extend(coordinate),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
    )
    map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 700 })
  }
}

function focusResult(result) {
  if (!map || !result?.coordinates) return
  map.easeTo({
    center: [result.coordinates.longitude, result.coordinates.latitude],
    zoom: 14,
    duration: 650,
  })
  const index = props.results.findIndex((item) => item.id === result.id)
  if (index >= 0) resultMarkers[index]?.togglePopup()
}

function focusUser() {
  if (!map || !props.userLocation) return
  map.easeTo({
    center: [props.userLocation.longitude, props.userLocation.latitude],
    zoom: 13,
    duration: 650,
  })
}

defineExpose({ focusResult, focusUser })

onMounted(async () => {
  try {
    const imported = await import('mapbox-gl')
    if (destroyed) return
    mapboxgl = imported.default ?? imported
    mapboxgl.accessToken = props.token
    map = new mapboxgl.Map({
      container: 'health-service-map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [MELBOURNE_COORDINATES.longitude, MELBOURNE_COORDINATES.latitude],
      zoom: 11,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.on('load', () => {
      syncResultMarkers()
      syncUserMarker()
      syncRoute()
      emit('ready')
    })
    map.on('error', () => emit('map-error', 'The map could not be displayed. Search results remain available below.'))
  } catch {
    emit('map-error', 'The map could not be displayed. Search results remain available below.')
  }
})

watch(() => props.results, () => nextTick(syncResultMarkers), { deep: true })
watch(() => props.userLocation, () => nextTick(syncUserMarker), { deep: true })
watch(() => props.route, () => nextTick(syncRoute), { deep: true })

onBeforeUnmount(() => {
  destroyed = true
  removeResultMarkers()
  userMarker?.remove()
  map?.remove()
  map = undefined
})
</script>

<template>
  <div
    id="health-service-map"
    class="service-map"
    role="application"
    aria-label="Interactive map of nearby health service search results"
  ></div>
</template>
