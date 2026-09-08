<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import apiClient from '@/services/api'
import CountryLocationField from '@/components/CountryLocationField.vue'
import CheckboxDropdown from '@/components/CheckboxDropdown.vue'
import LoadingDatePicker from '@/components/LoadingDatePicker.vue'
import RoutePreviewMap from '@/components/RoutePreviewMap.vue'
import ResultsOverviewMap from '@/components/ResultsOverviewMap.vue'
import { vehicleTypes } from '@/data/vehicleTypes'
import { bodyTypes } from '@/data/bodyTypes'
import { formatThousands } from '@/utils/format'
import '@/assets/css/coursesviewcss.css'

function createDefaultFilter() {
  return {
    from: { mode: 'radius', country: '', countries: [], location: '', radius: '', lat: null, lng: null },
    to: { mode: 'radius', country: '', countries: [], location: '', radius: '', lat: null, lng: null },
    availableDate: { mode: '', start: '', end: '', dates: [] },
    vehicleTypes: [],
    bodyTypes: [],
    minLength: '',
    maxLength: '',
    minWeight: '',
    maxWeight: '',
    maxRate: '',
    page: 0,
    size: 10,
  }
}

const filter = ref(createDefaultFilter())
const showAdvanced = ref(false)

const trucks = ref([])
const totalPages = ref(1)
const loadingMore = ref(false)
const expandedId = ref(null)
// Postings the user has opened (clicked into) - grays out their row.
const viewedIds = ref(new Set())
// Bumped on every explicit "Find" click - the overview map only draws all current
// postings once this has fired at least once (see ResultsOverviewMap's searchTrigger).
const mapSearchTrigger = ref(0)

// "Radius" mode searches a single country (+ optional location/radius);
// "Country selection" mode searches across a whole set of countries at once.
function countryFilterParams(side, locationKey, radiusKey) {
  if (side.mode === 'countries') {
    return { countries: side.countries?.length ? side.countries : undefined }
  }
  return {
    countries: side.country ? [side.country] : undefined,
    [locationKey]: side.location || undefined,
    [radiusKey]: side.radius || undefined,
  }
}

async function loadTrucks({ append = false } = {}) {
  try {
    const f = filter.value

    const fromParams = countryFilterParams(f.from, 'fromLocation', 'fromRadius')
    const toParams = countryFilterParams(f.to, 'toLocation', 'toRadius')

    const params = {
      fromCountries: fromParams.countries,
      fromLocation: fromParams.fromLocation,
      fromRadius: fromParams.fromRadius,
      toCountries: toParams.countries,
      toLocation: toParams.toLocation,
      toRadius: toParams.toRadius,
      vehicleTypes: f.vehicleTypes.length ? f.vehicleTypes : undefined,
      bodyTypes: f.bodyTypes.length ? f.bodyTypes : undefined,
      minLength: f.minLength || undefined,
      maxLength: f.maxLength || undefined,
      minWeight: f.minWeight || undefined,
      maxWeight: f.maxWeight || undefined,
      maxRate: f.maxRate || undefined,
      page: f.page,
      size: f.size,
    }

    if (f.availableDate.mode === 'exact' && f.availableDate.dates.length) {
      const sorted = [...f.availableDate.dates].sort()
      params.availableStartDate = sorted[0]
      params.availableEndDate = sorted[sorted.length - 1]
    } else {
      params.availableStartDate = f.availableDate.start || undefined
      params.availableEndDate = f.availableDate.end || undefined
    }

    const res = await apiClient.get('/trucks/search', { params })
    const newTrucks = res.data.content || []
    trucks.value = append ? [...trucks.value, ...newTrucks] : newTrucks
    totalPages.value = res.data.totalPages || 1
  } catch (error) {
    console.error('Error loading trucks:', error)
  }
}

async function loadMoreTrucks() {
  if (loadingMore.value) return
  if (filter.value.page + 1 >= totalPages.value) return
  loadingMore.value = true
  filter.value.page += 1
  await loadTrucks({ append: true })
  loadingMore.value = false
}

function search() {
  filter.value.page = 0
  expandedId.value = null
  mapSearchTrigger.value++
  loadTrucks()
}

// Marks whatever posting is currently open as viewed - called right before navigating
// away from it (to another posting, or back to the overview map), so a posting only
// grays out once the user has actually moved on from looking at it.
function markViewed() {
  if (expandedId.value != null) viewedIds.value.add(expandedId.value)
}

function toggleRow(id) {
  markViewed()
  expandedId.value = expandedId.value === id ? null : id
}

// Always opens (never toggles closed) - used by the overview map, where clicking a
// route should show that posting regardless of what's currently selected.
function openTruck(id) {
  markViewed()
  expandedId.value = id
}

function closeDetail() {
  markViewed()
  expandedId.value = null
}

// Hovering a results-table row highlights that posting's route on the overview map.
const hoveredTruckId = ref(null)

const expandedTruck = computed(() => trucks.value.find((t) => t.id === expandedId.value) || null)

// How long ago a posting was created, e.g. "45 min", "2h>", "1 day 1h>".
function formatAge(createdAt) {
  if (!createdAt) return '—'
  const createdMs = new Date(createdAt).getTime()
  if (Number.isNaN(createdMs)) return '—'

  const diffMs = Date.now() - createdMs
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min`

  const totalHours = Math.ceil(diffMin / 60)
  if (totalHours < 24) return `${totalHours}h`

  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const dayLabel = `${days} day${days > 1 ? 's' : ''}`
  return hours > 0 ? `${dayLabel} ${hours}h` : dayLabel
}

function formatShortDate(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${Number.parseInt(d, 10)}.${Number.parseInt(m, 10)}`
}

function formatAvailable(t) {
  if (!t.availableStartDate) return '—'
  if (t.availableEndDate && t.availableEndDate !== t.availableStartDate) {
    const [ys, ms, ds] = t.availableStartDate.split('-')
    const [ye, me, de] = t.availableEndDate.split('-')
    if (ys === ye && ms === me) {
      return `${Number.parseInt(ds, 10)}-${Number.parseInt(de, 10)}.${Number.parseInt(ms, 10)}`
    }
    return `${formatShortDate(t.availableStartDate)}-${formatShortDate(t.availableEndDate)}`
  }
  return formatShortDate(t.availableStartDate)
}

function formatPlace(country, location) {
  if (!country) return '?'
  return location ? `${country}-${location}` : country
}

function formatOrigin(t) {
  if (t.fromMode === 'countries') {
    return t.fromCountries?.length ? t.fromCountries.join(', ') : '?'
  }
  return formatPlace(t.fromCountry, t.fromLocation)
}

function formatDestination(t) {
  if (t.toMode === 'countries') {
    return t.toCountries?.length ? t.toCountries.join(', ') : '?'
  }
  return formatPlace(t.toCountry, t.toLocation)
}

function formatTruckDescriptor(t) {
  const parts = []
  if (t.vehicleType?.length) parts.push(t.vehicleType.join(', '))
  if (t.vehicleWeight) parts.push(`${formatThousands(t.vehicleWeight)} kg`)
  if (t.vehicleLength) parts.push(`${formatThousands(t.vehicleLength)} m`)
  if (t.bodyType?.length) parts.push(t.bodyType.join(', '))
  return parts.length ? parts.join(' | ') : '—'
}

function formatRate(t) {
  return t.minimumRate ? `${formatThousands(t.minimumRate.toFixed(2))} €/km` : '-'
}

// One-line label for a posting, shown in the overview map's overlapping-point tooltip.
function formatTruckLabel(t) {
  const trip = `${formatOrigin(t)} → ${formatDestination(t)}`
  const rate = formatRate(t)
  return rate !== '-' ? `${trip} · ${rate}` : trip
}

function formatKm(km) {
  return km != null ? `${formatThousands(Math.round(km))} km` : '-'
}

// --- Infinite scroll: a sentinel div sits right after the results table.
const sentinelEl = ref(null)
let scrollObserver = null

function setupScrollObserver() {
  scrollObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        loadMoreTrucks()
      }
    },
    { rootMargin: '250px' },
  )
  if (sentinelEl.value) scrollObserver.observe(sentinelEl.value)
}

onMounted(() => {
  loadTrucks()
  nextTick(() => setupScrollObserver())
})

onUnmounted(() => {
  scrollObserver?.disconnect()
})
</script>

<template>
  <div class="courses-view-outer-container">
    <div class="courses-view-paper-block">
      <header class="freight-add-header-section">
        <h1 class="freight-add-page-title">Search trucks</h1>
      </header>

      <div class="courses-view-body">
        <section class="freight-filter-section">
          <div class="freight-filter-row st-main-row">
            <CountryLocationField v-model="filter.from" label="FROM" show-radius allow-multi-country />
            <CountryLocationField v-model="filter.to" label="TO" show-radius allow-multi-country />
            <LoadingDatePicker v-model="filter.availableDate" label="Available date" />
            <div class="filter-box">
              <label class="filter-label">Vehicle and body type</label>
              <div class="vb-group">
                <CheckboxDropdown v-model="filter.vehicleTypes" :options="vehicleTypes" placeholder="Vehicle" />
                <CheckboxDropdown v-model="filter.bodyTypes" :options="bodyTypes" placeholder="Body" />
              </div>
            </div>
          </div>

          <div class="advanced-toggle-row">
            <button type="button" class="advanced-toggle-btn" @click="showAdvanced = !showAdvanced">
              Advanced search {{ showAdvanced ? '▲' : '▼' }}
            </button>
          </div>

          <template v-if="showAdvanced">
            <div class="freight-filter-row secondary-row">
              <div class="filter-box">
                <label class="filter-label">Vehicle length</label>
                <div class="filter-range-group">
                  <div class="unit-input-group">
                    <input
                      v-model="filter.minLength"
                      type="number"
                      min="0"
                      inputmode="numeric"
                      placeholder="Min"
                      class="courses-view-input unit-input no-spin-input"
                    />
                    <span class="unit-suffix">m</span>
                  </div>
                  <span class="filter-range-sep"></span>
                  <div class="unit-input-group">
                    <input
                      v-model="filter.maxLength"
                      type="number"
                      min="0"
                      inputmode="numeric"
                      placeholder="Max"
                      class="courses-view-input unit-input no-spin-input"
                    />
                    <span class="unit-suffix">m</span>
                  </div>
                </div>
              </div>

              <div class="filter-box">
                <label class="filter-label">Vehicle weight</label>
                <div class="filter-range-group">
                  <div class="unit-input-group">
                    <input
                      v-model="filter.minWeight"
                      type="number"
                      min="0"
                      inputmode="numeric"
                      placeholder="Min"
                      class="courses-view-input unit-input no-spin-input"
                    />
                    <span class="unit-suffix">kg</span>
                  </div>
                  <span class="filter-range-sep"></span>
                  <div class="unit-input-group">
                    <input
                      v-model="filter.maxWeight"
                      type="number"
                      min="0"
                      inputmode="numeric"
                      placeholder="Max"
                      class="courses-view-input unit-input no-spin-input"
                    />
                    <span class="unit-suffix">kg</span>
                  </div>
                </div>
              </div>

              <div class="filter-box">
                <label class="filter-label">Max rate</label>
                <div class="unit-input-group">
                  <input
                    v-model="filter.maxRate"
                    type="number"
                    min="0"
                    step="0.01"
                    inputmode="numeric"
                    placeholder="Any"
                    class="courses-view-input unit-input no-spin-input"
                  />
                  <span class="unit-suffix">eur/km</span>
                </div>
              </div>
            </div>
          </template>

          <div class="find-row">
            <button @click="search" class="courses-view-search-btn find-action-btn">Find</button>
          </div>
        </section>

        <div class="st-results-layout">
          <div class="st-list-col">
            <div class="st-table-wrap">
              <table class="st-table">
                <thead>
                  <tr>
                    <th class="st-arrow-col"></th>
                    <th>Age</th>
                    <th>Truck</th>
                    <th>Available</th>
                    <th>Trip</th>
                    <th>KM</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="trucks.length === 0">
                    <tr>
                      <td colspan="7" class="st-empty-cell">No trucks found.</td>
                    </tr>
                  </template>
                  <tr
                    v-for="t in trucks"
                    :key="t.id"
                    class="st-row"
                    :class="{ expanded: expandedId === t.id, viewed: viewedIds.has(t.id) }"
                    @click="toggleRow(t.id)"
                    @mouseenter="hoveredTruckId = t.id"
                    @mouseleave="hoveredTruckId = null"
                  >
                    <td class="st-arrow-col">{{ expandedId === t.id ? '▼' : '▶' }}</td>
                    <td>{{ formatAge(t.updatedAt || t.createdAt) }}</td>
                    <td>{{ formatTruckDescriptor(t) }}</td>
                    <td>{{ formatAvailable(t) }}</td>
                    <td>
                      <div class="st-line"><span class="st-line-arrow">↓</span>{{ formatOrigin(t) }}</div>
                      <div class="st-row-sub st-line"><span class="st-line-arrow">↓</span>{{ formatDestination(t) }}</div>
                    </td>
                    <td>{{ formatKm(t.distanceKm) }}</td>
                    <td>{{ formatRate(t) }}</td>
                  </tr>
                </tbody>
              </table>
              <div ref="sentinelEl" class="st-scroll-sentinel"></div>
              <span v-if="loadingMore" class="st-scroll-status">Loading more...</span>
              <span v-else-if="trucks.length > 0 && filter.page + 1 >= totalPages" class="st-scroll-status"
                >No more results</span
              >
            </div>
          </div>

          <aside class="st-detail-sidebar">
            <div v-if="expandedTruck" class="st-detail-panel">
              <button
                type="button"
                class="st-detail-close-btn"
                title="Close - back to the results map"
                @click="closeDetail"
              >
                ✕
              </button>
              <div class="st-detail">
                <div class="st-detail-col">
                  <h4>Vehicle</h4>
                  <p v-if="expandedTruck.vehicleDescription">{{ expandedTruck.vehicleDescription }}</p>
                  <p>{{ expandedTruck.vehicleType?.length ? expandedTruck.vehicleType.join(', ') : '—' }}</p>
                  <img
                    v-if="expandedTruck.vehiclePhotoUrl"
                    :src="expandedTruck.vehiclePhotoUrl"
                    class="st-detail-photo"
                    alt="Vehicle photo"
                  />
                </div>
                <div class="st-detail-col">
                  <h4>Body</h4>
                  <p v-if="expandedTruck.bodyDescription">{{ expandedTruck.bodyDescription }}</p>
                  <p>{{ expandedTruck.bodyType?.length ? expandedTruck.bodyType.join(', ') : '—' }}</p>
                  <img
                    v-if="expandedTruck.bodyPhotoUrl"
                    :src="expandedTruck.bodyPhotoUrl"
                    class="st-detail-photo"
                    alt="Body photo"
                  />
                </div>
                <div class="st-detail-col">
                  <h4>Comments</h4>
                  <p>{{ expandedTruck.comments || '—' }}</p>
                </div>
                <div class="st-detail-col">
                  <h4>Route</h4>
                  <RoutePreviewMap
                    :from="{ mode: expandedTruck.fromMode, country: expandedTruck.fromCountry, location: expandedTruck.fromLocation }"
                    :to="{ mode: expandedTruck.toMode, country: expandedTruck.toCountry, location: expandedTruck.toLocation }"
                    :search-from="filter.from"
                    :search-to="filter.to"
                  />
                </div>
              </div>
            </div>
            <div class="st-detail-overview" v-show="!expandedTruck">
              <ResultsOverviewMap
                :results="trucks"
                :route-url="(id) => `/trucks/${id}/route`"
                :format-label="formatTruckLabel"
                :hovered-id="hoveredTruckId"
                :search-trigger="mapSearchTrigger"
                :search-from="filter.from"
                :search-to="filter.to"
                :active="!expandedTruck"
                @select="openTruck"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.freight-add-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 30px;
  padding-bottom: 10px;
}

.freight-add-page-title {
  font-weight: 300;
  font-size: 2.2rem;
  color: #d4a76a;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.freight-filter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fdfdfd;
  border: 1px solid #e0e0e0;
  padding: 20px;
  border-radius: 6px;
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 24px;
}

.freight-filter-row {
  display: grid;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
  align-items: start;
}

.st-main-row {
  grid-template-columns: repeat(4, 1fr);
}

.secondary-row {
  grid-template-columns: repeat(3, 1fr);
}

.vb-group {
  display: flex;
  gap: 4px;
  width: 100%;
  min-width: 0;
}

.vb-group > * {
  flex: 1;
  min-width: 0;
}

.filter-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.filter-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  white-space: nowrap;
}

.filter-range-group {
  display: flex;
  gap: 4px;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.filter-range-sep {
  width: 6px;
  flex-shrink: 0;
}

.courses-view-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.unit-input-group {
  position: relative;
  width: 100%;
  min-width: 0;
}

.unit-input {
  width: 100%;
  padding-right: 28px;
}

.no-spin-input::-webkit-outer-spin-button,
.no-spin-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.no-spin-input {
  -moz-appearance: textfield;
}

.unit-suffix {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: #999;
  pointer-events: none;
}

.advanced-toggle-row {
  display: flex;
}

.advanced-toggle-btn {
  background: transparent;
  border: none;
  color: #b55a30;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
}

.advanced-toggle-btn:hover {
  text-decoration: underline;
}

.find-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.find-action-btn {
  height: 42px;
  padding: 0 24px;
  white-space: nowrap;
}

/* Results table */
.st-table-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.st-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.st-table th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #999;
  padding: 8px 10px;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
}

.st-table td {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
  white-space: nowrap;
}

.st-arrow-col {
  width: 24px;
  text-align: center;
  color: #999;
}

.st-line {
  display: flex;
  align-items: center;
  gap: 4px;
}

.st-line-arrow {
  color: #999;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.st-row-sub {
  font-size: 0.8rem;
  color: #888;
  margin-top: 2px;
}

.st-row {
  cursor: pointer;
}

.st-row:hover {
  background: #fdf8f0;
}

.st-row.expanded {
  background: #fdf3e4;
}

.st-row.viewed {
  background: #f4f4f4;
}

.st-row.viewed:hover {
  background: #eee7db;
}

.st-empty-cell {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 24px 0;
}

.st-results-layout {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.st-list-col {
  flex: 1 1 auto;
  min-width: 0;
}

.st-detail-sidebar {
  flex: 0 0 380px;
  position: sticky;
  top: 20px;
}

.st-detail-panel {
  position: relative;
  background: #fdfcf9;
  padding: 20px 24px;
  border-left: 3px solid #d4a76a;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.st-detail-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: #999;
  font-size: 0.9rem;
  line-height: 1;
  padding: 6px;
  cursor: pointer;
}

.st-detail-close-btn:hover {
  color: #b3261e;
}

.st-detail-overview {
  border-radius: 8px;
  overflow: hidden;
}

.st-detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 10px 6px;
}

.st-detail-col h4 {
  margin: 0 0 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #b55a30;
  letter-spacing: 0.5px;
}

.st-detail-col p {
  margin: 0 0 6px;
  font-size: 0.85rem;
  color: #333;
}

.st-detail-photo {
  width: 100%;
  max-width: 160px;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.st-scroll-sentinel {
  height: 1px;
}

.st-scroll-status {
  display: block;
  text-align: center;
  font-size: 0.78rem;
  color: #999;
  padding: 6px 0 16px;
}

@media (max-width: 1100px) {
  .st-main-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .secondary-row {
    grid-template-columns: 1fr;
  }

  .st-results-layout {
    flex-direction: column;
  }

  .st-detail-sidebar {
    flex: 1 1 auto;
    width: 100%;
    position: static;
  }
}
</style>
