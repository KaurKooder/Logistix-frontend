<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import apiClient from '@/services/api'
import CountryLocationField from '@/components/CountryLocationField.vue'
import CheckboxDropdown from '@/components/CheckboxDropdown.vue'
import LoadingDatePicker from '@/components/LoadingDatePicker.vue'
import RoutePreviewMap from '@/components/RoutePreviewMap.vue'
import { vehicleTypes } from '@/data/vehicleTypes'
import { bodyTypes } from '@/data/bodyTypes'
import '@/assets/css/coursesviewcss.css'

function createDefaultFilter() {
  return {
    from: { mode: 'radius', country: '', countries: [], location: '', radius: '' },
    to: { mode: 'radius', country: '', countries: [], location: '', radius: '' },
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

// "Radius" mode searches a single country (+ optional location/radius);
// "Country selection" mode searches across a whole set of countries at once.
function countryFilterParams(side, locationKey) {
  if (side.mode === 'countries') {
    return { countries: side.countries?.length ? side.countries : undefined }
  }
  return {
    countries: side.country ? [side.country] : undefined,
    [locationKey]: side.location || undefined,
  }
}

async function loadTrucks({ append = false } = {}) {
  try {
    const f = filter.value

    const fromParams = countryFilterParams(f.from, 'fromLocation')
    const toParams = countryFilterParams(f.to, 'toLocation')

    const params = {
      fromCountries: fromParams.countries,
      fromLocation: fromParams.fromLocation,
      toCountries: toParams.countries,
      toLocation: toParams.toLocation,
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
  loadTrucks()
}

function toggleRow(id) {
  expandedId.value = expandedId.value === id ? null : id
}

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
  if (totalHours < 24) return `${totalHours}h>`

  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const dayLabel = `${days} day${days > 1 ? 's' : ''}`
  return hours > 0 ? `${dayLabel} ${hours}h>` : `${dayLabel}>`
}

function formatShortDate(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${Number.parseInt(m, 10)}/${Number.parseInt(d, 10)}`
}

function formatAvailable(t) {
  if (!t.availableStartDate) return '—'
  if (t.availableEndDate && t.availableEndDate !== t.availableStartDate) {
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
  if (t.vehicleWeight) parts.push(`${t.vehicleWeight} kg`)
  if (t.vehicleLength) parts.push(`${t.vehicleLength} m`)
  if (t.bodyType?.length) parts.push(t.bodyType.join(', '))
  return parts.length ? parts.join(' | ') : '—'
}

function formatRate(t) {
  return t.minimumRate ? `${t.minimumRate.toFixed(2)} €/km` : '-'
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

        <div class="st-table-wrap">
          <table class="st-table">
            <thead>
              <tr>
                <th class="st-arrow-col"></th>
                <th>Age</th>
                <th>Truck</th>
                <th>Available</th>
                <th>Origin</th>
                <th class="st-arrow-col"></th>
                <th>Destination</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="trucks.length === 0">
                <tr>
                  <td colspan="8" class="st-empty-cell">No trucks found.</td>
                </tr>
              </template>
              <template v-for="t in trucks" :key="t.id">
                <tr class="st-row" :class="{ expanded: expandedId === t.id }" @click="toggleRow(t.id)">
                  <td class="st-arrow-col">{{ expandedId === t.id ? '▼' : '▶' }}</td>
                  <td>{{ formatAge(t.createdAt) }}</td>
                  <td>{{ formatTruckDescriptor(t) }}</td>
                  <td>{{ formatAvailable(t) }}</td>
                  <td>{{ formatOrigin(t) }}</td>
                  <td class="st-arrow-col">→</td>
                  <td>{{ formatDestination(t) }}</td>
                  <td>{{ formatRate(t) }}</td>
                </tr>
                <tr v-if="expandedId === t.id" class="st-detail-row">
                  <td colspan="8">
                    <div class="st-detail">
                      <div class="st-detail-col">
                        <h4>Vehicle</h4>
                        <p v-if="t.vehicleDescription">{{ t.vehicleDescription }}</p>
                        <p>{{ t.vehicleType?.length ? t.vehicleType.join(', ') : '—' }}</p>
                        <img v-if="t.vehiclePhotoUrl" :src="t.vehiclePhotoUrl" class="st-detail-photo" alt="Vehicle photo" />
                      </div>
                      <div class="st-detail-col">
                        <h4>Body</h4>
                        <p v-if="t.bodyDescription">{{ t.bodyDescription }}</p>
                        <p>{{ t.bodyType?.length ? t.bodyType.join(', ') : '—' }}</p>
                        <img v-if="t.bodyPhotoUrl" :src="t.bodyPhotoUrl" class="st-detail-photo" alt="Body photo" />
                      </div>
                      <div class="st-detail-col">
                        <h4>Comments</h4>
                        <p>{{ t.comments || '—' }}</p>
                      </div>
                      <div class="st-detail-col">
                        <h4>Route</h4>
                        <RoutePreviewMap
                          :from="{ mode: t.fromMode, country: t.fromCountry, location: t.fromLocation }"
                          :to="{ mode: t.toMode, country: t.toCountry, location: t.toLocation }"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div ref="sentinelEl" class="st-scroll-sentinel"></div>
          <span v-if="loadingMore" class="st-scroll-status">Loading more...</span>
          <span v-else-if="trucks.length > 0 && filter.page + 1 >= totalPages" class="st-scroll-status"
            >No more results</span
          >
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

.st-row {
  cursor: pointer;
}

.st-row:hover {
  background: #fdf8f0;
}

.st-row.expanded {
  background: #fdf3e4;
}

.st-empty-cell {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 24px 0;
}

.st-detail-row td {
  white-space: normal;
  background: #fafafa;
}

.st-detail {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  .st-detail {
    grid-template-columns: 1fr;
  }
}
</style>
