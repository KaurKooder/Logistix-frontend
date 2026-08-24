<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'
import apiClient from '@/services/api'
import { createRouteMap } from '@/composables/useLeafletRoute'

const props = defineProps({
  // Array of full result objects (freight/truck DTOs) - only `id` is required, the rest
  // is passed through to `formatLabel` for the overlapping-point info tooltip.
  results: {
    type: Array,
    default: () => [],
  },
  // Builds the GET route URL for a result id, e.g. (id) => `/courses/${id}/route`.
  routeUrl: {
    type: Function,
    required: true,
  },
  // Builds the one-line label shown in a point's info tooltip for a given result.
  formatLabel: {
    type: Function,
    default: (item) => `#${item.id}`,
  },
  // Currently hovered result id (driven by the results table). Before a search has run,
  // hovering fetches and previews just that one route. After a search, it highlights that
  // route among the already-drawn ones and dims the rest.
  hoveredId: {
    type: [Number, String],
    default: null,
  },
  // Bump this (e.g. ++ on every "Find" click) to eagerly fetch and draw every current
  // result's route + point markers. Before the first bump, the map stays blank except for
  // whatever's being hover-previewed - see the class doc below.
  searchTrigger: {
    type: [Number, String],
    default: 0,
  },
  // Shaped like CountryLocationField's v-model: {radius, lat, lng}. Drawn as light-blue
  // "search radius" circles for context.
  searchFrom: {
    type: Object,
    default: () => ({}),
  },
  searchTo: {
    type: Object,
    default: () => ({}),
  },
  // Whether this map is currently the visible one (the parent may keep it mounted but
  // hidden via v-show behind a detail panel, to preserve its fetched routes). Leaflet
  // computes a 0x0 size while its container is display:none, so the map needs a resize
  // nudge when it becomes visible again.
  active: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['select'])

const mapEl = ref(null)
let map = null
let searchCircleGroup = null

// Becomes true on the first searchTrigger bump (an explicit "Find") and stays true from
// then on for this component instance - before that, the map shows nothing but whatever
// single route is being hover-previewed, per the product spec: don't dump every currently
// loaded posting onto the map before the user has actually searched.
const populated = ref(false)

// id -> {geometry, item}. Fetched lazily (single hover preview) or eagerly (post-search
// batch) - either way cached for the life of this component, since routes aren't cached
// server-side (each fetch hits the routing provider fresh).
const routeCache = new Map()
// ids whose route request failed (not found, or no concrete point to route between -
// e.g. a "country selection" truck posting) - skipped on retry.
const failedIds = new Set()
const itemById = new Map()

// id -> polyline, only for routes currently drawn on the map (a subset of routeCache
// before a search - only the hover-previewed one; everything in routeCache after).
const lineLayers = new Map()
let pointLayerGroup = null // clustered start/end markers, rebuilt whenever the drawn set changes
let previewLineLayer = null // the single pre-search hover-preview line, drawn outside routeCache's normal set
let previewMarkers = null
let previewToken = 0

const showNoResultsHint = computed(() => populated.value && props.results.length === 0)

async function runPool(items, worker, concurrency = 4) {
  let index = 0
  async function next() {
    const i = index++
    if (i >= items.length) return
    await worker(items[i])
    await next()
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next))
}

async function fetchRoute(id) {
  if (routeCache.has(id)) return routeCache.get(id)
  if (failedIds.has(id)) return null
  try {
    const res = await apiClient.get(props.routeUrl(id))
    const geometry = res.data?.geometry
    if (!geometry?.length) {
      failedIds.add(id)
      return null
    }
    const entry = { geometry }
    routeCache.set(id, entry)
    return entry
  } catch {
    failedIds.add(id) // e.g. not found, or no single point to route between
    return null
  }
}

function pointDivIcon(count) {
  const size = count > 1 ? 20 : 10
  const html =
    count > 1
      ? `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#5b4636;` +
        `color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;` +
        `justify-content:center;border:2px solid #fff;box-shadow:0 0 0 1px #5b4636;">${count}</div>`
      : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#5b4636;` +
        `border:1px solid #fff;box-shadow:0 0 0 1px #5b4636;"></div>`
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

// Builds the hover tooltip content via safe DOM construction (never innerHTML) - result
// labels/descriptions are free text a user typed, so they must never be interpreted as HTML.
function buildTooltipContent(entries) {
  const container = document.createElement('div')
  container.style.cssText = 'font-size:12px; line-height:1.5; max-width:220px;'
  for (const { side, item } of entries) {
    const line = document.createElement('div')
    const prefix = document.createElement('strong')
    prefix.textContent = side === 'from' ? 'Loading: ' : 'Unloading: '
    line.appendChild(prefix)
    line.appendChild(document.createTextNode(props.formatLabel(item)))
    container.appendChild(line)
  }
  return container
}

// Groups every drawn route's two endpoints by rounded coordinate (~11m) so postings that
// share a location (e.g. the same zip code) render as one marker instead of a stack of
// identical overlapping dots.
function rebuildPointGroups(ids) {
  if (pointLayerGroup) {
    map.removeLayer(pointLayerGroup)
    pointLayerGroup = null
  }
  const groups = new Map()
  for (const id of ids) {
    const entry = routeCache.get(id)
    if (!entry) continue
    const geometry = entry.geometry
    const points = [
      { side: 'from', p: geometry[0] },
      { side: 'to', p: geometry[geometry.length - 1] },
    ]
    for (const { side, p } of points) {
      const key = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`
      if (!groups.has(key)) groups.set(key, { lat: p.lat, lng: p.lng, entries: [] })
      groups.get(key).entries.push({ id, side, item: itemById.get(id) })
    }
  }

  const markers = [...groups.values()].map((group) => {
    const marker = L.marker([group.lat, group.lng], { icon: pointDivIcon(group.entries.length) })
    marker.bindTooltip(buildTooltipContent(group.entries), { direction: 'right', offset: [8, -8] })
    if (group.entries.length === 1) {
      marker.on('click', () => emit('select', group.entries[0].id))
    }
    return marker
  })
  if (markers.length) {
    pointLayerGroup = L.layerGroup(markers).addTo(map)
  }
}

function addLineLayer(id, geometry, opts = {}) {
  const latLngs = geometry.map((p) => [p.lat, p.lng])
  const line = L.polyline(latLngs, { color: '#d4a76a', weight: 2, opacity: 0.35, ...opts })
  line.on('click', () => emit('select', id))
  line.addTo(map)
  lineLayers.set(id, line)
  return line
}

function drawCircles() {
  if (searchCircleGroup) {
    map.removeLayer(searchCircleGroup)
    searchCircleGroup = null
  }
  const circles = [props.searchFrom, props.searchTo]
    .filter((s) => s && s.radius && Number(s.radius) > 0 && s.lat != null && s.lng != null)
    .map((s) =>
      L.circle([s.lat, s.lng], {
        radius: Number(s.radius) * 1000,
        color: '#4a90d9',
        weight: 1.5,
        fillColor: '#4a90d9',
        fillOpacity: 0.1,
      }),
    )
  if (circles.length) {
    searchCircleGroup = L.layerGroup(circles).addTo(map)
  }
}

function fitToKnownLayers() {
  const parts = [...lineLayers.values()]
  if (searchCircleGroup) parts.push(...searchCircleGroup.getLayers())
  if (!parts.length) return
  map.fitBounds(L.featureGroup(parts).getBounds(), { padding: [24, 24] })
}

function applyHoverStyle() {
  const hovered = populated.value ? props.hoveredId : null
  for (const [id, line] of lineLayers) {
    const isHovered = hovered != null && id === hovered
    const isDimmed = hovered != null && !isHovered
    line.setStyle({ weight: isHovered ? 5 : 2, opacity: isDimmed ? 0.1 : isHovered ? 0.95 : 0.35 })
    if (isHovered) line.bringToFront()
  }
}

// Pre-search: hovering a row fetches (if needed) and draws just that one route as a
// temporary preview, removed again on mouseleave. Cancels cleanly if the user moves the
// mouse to a different row before the fetch resolves.
async function updatePreview() {
  const token = ++previewToken
  if (previewLineLayer) {
    map.removeLayer(previewLineLayer)
    previewLineLayer = null
  }
  if (previewMarkers) {
    map.removeLayer(previewMarkers)
    previewMarkers = null
  }

  const id = props.hoveredId
  if (id == null) return

  const entry = await fetchRoute(id)
  if (token !== previewToken || !entry) return // superseded by a newer hover, or fetch failed

  const latLngs = entry.geometry.map((p) => [p.lat, p.lng])
  previewLineLayer = L.polyline(latLngs, { color: '#d4a76a', weight: 4, opacity: 0.9 }).addTo(map)
  previewMarkers = L.layerGroup([
    L.circleMarker(latLngs[0], { radius: 5, color: '#5b4636', weight: 1, fillColor: '#5b4636', fillOpacity: 0.9 }),
    L.circleMarker(latLngs[latLngs.length - 1], {
      radius: 5,
      color: '#5b4636',
      weight: 1,
      fillColor: '#fff',
      fillOpacity: 0.9,
    }),
  ]).addTo(map)
  map.invalidateSize()
  map.fitBounds(previewLineLayer.getBounds(), { padding: [40, 40] })
}

// Fetches every current result's route (skipping what's already cached) and draws the
// full set - lines + clustered point markers - then fits the view to all of it.
async function populateAll() {
  if (!map) return
  const ids = props.results.map((r) => r.id)
  ids.forEach((id) => itemById.set(id, props.results.find((r) => r.id === id)))

  await runPool(
    ids.filter((id) => !routeCache.has(id) && !failedIds.has(id)),
    fetchRoute,
  )

  for (const id of ids) {
    if (!lineLayers.has(id) && routeCache.has(id)) {
      addLineLayer(id, routeCache.get(id).geometry)
    }
  }
  // Drop lines for ids no longer in the result set (e.g. a fresh search replaced the list).
  for (const id of [...lineLayers.keys()]) {
    if (!ids.includes(id)) {
      map.removeLayer(lineLayers.get(id))
      lineLayers.delete(id)
    }
  }

  rebuildPointGroups(ids)
  applyHoverStyle()
  await nextTick()
  map.invalidateSize()
  fitToKnownLayers()
}

onMounted(async () => {
  await nextTick()
  map = createRouteMap(mapEl.value)
  map.setView([54.5, 15], 4) // rough Europe view before anything has loaded
  drawCircles()
  if (populated.value) await populateAll()
})

watch(
  () => props.searchTrigger,
  async () => {
    populated.value = true
    if (previewLineLayer) {
      map.removeLayer(previewLineLayer)
      previewLineLayer = null
    }
    if (previewMarkers) {
      map.removeLayer(previewMarkers)
      previewMarkers = null
    }
    await populateAll()
  },
)
// Once populated, further result-list changes (infinite scroll "load more", a fresh
// search replacing the list) keep the map in sync without needing another explicit trigger.
watch(
  () => props.results.map((r) => r.id).join(','),
  () => {
    if (populated.value) populateAll()
  },
)
watch(
  [() => props.searchFrom, () => props.searchTo],
  () => {
    if (!map) return
    drawCircles()
    fitToKnownLayers()
  },
  { deep: true },
)
watch(() => props.hoveredId, () => {
  if (populated.value) applyHoverStyle()
  else updatePreview()
})
watch(() => props.active, (isActive) => {
  if (isActive && map) {
    nextTick(() => map.invalidateSize())
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  routeCache.clear()
  failedIds.clear()
  itemById.clear()
  lineLayers.clear()
})
</script>

<template>
  <div class="results-overview-map">
    <span v-if="showNoResultsHint" class="rom-hint">No results to show on the map.</span>
    <div v-show="!showNoResultsHint" ref="mapEl" class="rom-canvas"></div>
  </div>
</template>

<style scoped>
.rom-canvas {
  height: 480px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  z-index: 0;
}

.rom-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 480px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  color: #999;
  font-size: 0.85rem;
  text-align: center;
  padding: 0 16px;
}
</style>
