<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import apiClient from '@/services/api'
import { createRouteMap, drawRoute } from '@/composables/useLeafletRoute'

const props = defineProps({
  // Shaped like CountryLocationField's v-model: {mode, country, countries, location, radius}.
  // `mode` is optional - PostLoad's from/to have no mode and are always a single point.
  from: {
    type: Object,
    default: () => ({}),
  },
  to: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['route-result'])

const mapEl = ref(null)
const status = ref('idle') // idle | loading | success | error
const errorMessage = ref('')
let map = null
let debounceTimer = null

function sideRoutable(side) {
  if (!side) return false
  if (side.mode && side.mode !== 'radius') return false
  return !!(side.country && side.location && side.location.trim())
}

const modeBlocked = computed(() => {
  return (props.from?.mode && props.from.mode !== 'radius') || (props.to?.mode && props.to.mode !== 'radius')
})

const idleMessage = computed(() => {
  return modeBlocked.value
    ? "Route preview isn't available for multi-country search"
    : 'Enter both locations to preview the route'
})

async function fetchPreview() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    const res = await apiClient.post('/routes/preview', {
      fromLocation: props.from.location,
      fromCountry: props.from.country,
      toLocation: props.to.location,
      toCountry: props.to.country,
    })
    const { distanceKm, geometry } = res.data
    const latLngs = geometry.map((p) => [p.lat, p.lng])

    status.value = 'success'
    await nextTick() // let the map container become visible before Leaflet measures it

    if (!map) {
      map = createRouteMap(mapEl.value)
    }
    drawRoute(map, latLngs)

    emit('route-result', { valid: true, distanceKm })
  } catch (e) {
    console.error('Failed to preview route:', e)
    status.value = 'error'
    errorMessage.value = e.response?.data?.message || 'Could not calculate route'
    emit('route-result', { valid: false, distanceKm: null })
  }
}

function scheduleCheck() {
  clearTimeout(debounceTimer)
  if (!sideRoutable(props.from) || !sideRoutable(props.to)) {
    status.value = 'idle'
    errorMessage.value = ''
    emit('route-result', { valid: false, distanceKm: null })
    return
  }
  debounceTimer = setTimeout(fetchPreview, 600)
}

watch([() => props.from, () => props.to], scheduleCheck, { immediate: true })

onUnmounted(() => {
  clearTimeout(debounceTimer)
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="route-preview-map">
    <span v-if="status === 'idle'" class="route-preview-hint">{{ idleMessage }}</span>
    <span v-else-if="status === 'loading'" class="freight-scroll-status">Checking route…</span>
    <span v-else-if="status === 'error'" class="route-preview-error">{{ errorMessage }}</span>
    <div v-show="status === 'success'" ref="mapEl" class="route-preview-canvas"></div>
  </div>
</template>

<style scoped>
.route-preview-map {
  margin-top: 12px;
}

.route-preview-canvas {
  height: 220px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  z-index: 0;
}

.route-preview-hint,
.route-preview-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 90px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  font-size: 0.82rem;
  background: #fafafa;
  text-align: center;
  padding: 0 16px;
}

.route-preview-hint {
  color: #999;
}

.route-preview-error {
  color: #b3261e;
}
</style>
