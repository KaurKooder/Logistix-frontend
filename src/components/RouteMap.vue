<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import apiClient from '@/services/api'
import { createRouteMap, drawRoute } from '@/composables/useLeafletRoute'

const props = defineProps({
  // Full API path to GET, e.g. `/courses/${id}/route` or `/trucks/${id}/route`.
  routeUrl: {
    type: String,
    required: true,
  },
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

    emit('distance-loaded', distanceKm)
  } catch (e) {
    console.error('Failed to load route:', e)
    error.value = e.response?.data?.message || 'Could not load route'
    loading.value = false
  }
}

onMounted(loadRoute)

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
