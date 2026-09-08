<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import apiClient from '@/services/api'
import { createRouteMap, drawRoute, drawSearchCircles } from '@/composables/useLeafletRoute'

const props = defineProps({
  // Full API path to GET, e.g. `/courses/${id}/route` or `/trucks/${id}/route`.
  routeUrl: {
    type: String,
    required: true,
  },
  // Shaped like CountryLocationField's v-model: {radius, lat, lng}. The search filter's own
  // from/to (not this posting's) - drawn as light-blue radius circles for context on why this
  // posting matched.
  searchFrom: {
    type: Object,
    default: () => ({}),
  },
  searchTo: {
    type: Object,
    default: () => ({}),
  },
})

// Search-radius circles derived from the search filter's from/to - only for sides that
// actually have a radius set and a geocoded point to center on.
const searchCircles = computed(() => {
  return [props.searchFrom, props.searchTo]
    .filter((side) => side && side.radius && Number(side.radius) > 0 && side.lat != null && side.lng != null)
    .map((side) => ({ lat: side.lat, lng: side.lng, radiusKm: Number(side.radius) }))
})

const emit = defineEmits(['distance-loaded'])

const mapEl = ref(null)
const loading = ref(true)
const error = ref('')
let map = null

async function loadRoute() {
  loading.value = true
  error.value = ''
  try {
    const res = await apiClient.get(props.routeUrl)
    const { distanceKm, geometry } = res.data
    const latLngs = geometry.map((p) => [p.lat, p.lng])

    loading.value = false
    await nextTick() // let the map container become visible before Leaflet measures it

    if (!map) {
      map = createRouteMap(mapEl.value)
    }
    drawRoute(map, latLngs)
    drawSearchCircles(map, searchCircles.value)

    emit('distance-loaded', distanceKm)
  } catch (e) {
    console.error('Failed to load route:', e)
    error.value = e.response?.data?.message || 'Could not load route'
    loading.value = false
  }
}

onMounted(loadRoute)

// Redraws just the circles (no re-fetch) when the search filter's radius/point changes.
watch(searchCircles, (circles) => {
  if (map && !loading.value && !error.value) drawSearchCircles(map, circles)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="route-map">
    <span v-if="loading" class="freight-scroll-status">Loading route…</span>
    <span v-else-if="error" class="route-map-error">{{ error }}</span>
    <div v-show="!loading && !error" ref="mapEl" class="route-map-canvas"></div>
  </div>
</template>

<style scoped>
.route-map {
  margin-top: 20px;
}

.route-map-canvas {
  height: 260px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  z-index: 0;
}

.route-map-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  color: #b3261e;
  font-size: 0.85rem;
  background: #fafafa;
  text-align: center;
  padding: 0 16px;
}
</style>
