<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import CountryLocationField from '@/components/CountryLocationField.vue'
import CheckboxDropdown from '@/components/CheckboxDropdown.vue'
import LoadingDatePicker from '@/components/LoadingDatePicker.vue'
import RoutePreviewMap from '@/components/RoutePreviewMap.vue'
import { vehicleTypes } from '@/data/vehicleTypes'
import { bodyTypes } from '@/data/bodyTypes'
import '@/assets/css/coursesviewcss.css'

const router = useRouter()

function createEmptyTruck() {
  return {
    vehicleType: [],
    vehicleDescription: '',
    vehicleLength: '',
    vehicleWeight: '',
    vehiclePhotoUrl: '',
    bodyType: [],
    bodyDescription: '',
    bodyLength: '',
    bodyWeight: '',
    bodyPhotoUrl: '',
    from: { mode: 'radius', country: '', countries: [], location: '', radius: '' },
    to: { mode: 'radius', country: '', countries: [], location: '', radius: '' },
    availableDate: { mode: '', start: '', end: '', dates: [] },
    minimumRate: '',
    comments: '',
  }
}

const newTruck = ref(createEmptyTruck())

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const isUploadingVehiclePhoto = ref(false)
const isUploadingBodyPhoto = ref(false)

const vehiclePhotoInput = ref(null)
const bodyPhotoInput = ref(null)

const myTrucks = ref([])
const loadingTrucks = ref(false)

// Decode JWT token to get user info
function getUserFromToken() {
  const token = localStorage.getItem('jwt')
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return {
      name: decoded.sub,
      userId: decoded.userId,
      role: decoded.roles?.[0],
      ...decoded,
    }
  } catch (e) {
    console.error('Error decoding token:', e)
    return null
  }
}

const user = computed(() => getUserFromToken())
const isLoggedIn = computed(() => user.value !== null)

onMounted(() => {
  if (!isLoggedIn.value) {
    router.push('/users')
    return
  }
  fetchMyTrucks()
})

function resetForm() {
  newTruck.value = createEmptyTruck()
}

async function fetchMyTrucks() {
  loadingTrucks.value = true
  try {
    const res = await apiClient.get('/trucks/mine')
    myTrucks.value = res.data
  } catch (error) {
    console.error('Error fetching trucks:', error)
  } finally {
    loadingTrucks.value = false
  }
}

async function uploadPhoto(file) {
  const formData = new FormData()
  formData.append('file', file)
  // Don't set Content-Type manually - the apiClient instance defaults to
  // application/json, and a hand-set "multipart/form-data" header has no
  // boundary parameter, which breaks the upload server-side. Explicitly
  // unsetting it here lets the browser generate the correct header (with
  // boundary) for the FormData body.
  const res = await apiClient.post('/uploads/photo', formData, {
    headers: { 'Content-Type': undefined },
  })
  return res.data.url
}

async function onVehiclePhotoSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  isUploadingVehiclePhoto.value = true
  errorMessage.value = ''
  try {
    newTruck.value.vehiclePhotoUrl = await uploadPhoto(file)
  } catch (error) {
    console.error('Error uploading vehicle photo:', error)
    errorMessage.value =
      error.response?.data?.message ||
      (error.response
        ? `Foto üleslaadimine ebaõnnestus (HTTP ${error.response.status})`
        : 'Foto üleslaadimine ebaõnnestus - serveriga ei saanud ühendust!')
  } finally {
    isUploadingVehiclePhoto.value = false
    e.target.value = ''
  }
}

async function onBodyPhotoSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  isUploadingBodyPhoto.value = true
  errorMessage.value = ''
  try {
    newTruck.value.bodyPhotoUrl = await uploadPhoto(file)
  } catch (error) {
    console.error('Error uploading body photo:', error)
    errorMessage.value =
      error.response?.data?.message ||
      (error.response
        ? `Foto üleslaadimine ebaõnnestus (HTTP ${error.response.status})`
        : 'Foto üleslaadimine ebaõnnestus - serveriga ei saanud ühendust!')
  } finally {
    isUploadingBodyPhoto.value = false
    e.target.value = ''
  }
}

function hasLocation(side) {
  return side.mode === 'countries' ? (side.countries || []).length > 0 : !!side.country
}

// A route can only be computed when both sides are in "radius" mode (one concrete point) -
// "countries" mode is a fuzzy multi-country area with nothing to geocode, so route
// validation is skipped entirely for it and submission works as before.
const routeValid = ref(false)
const bothSidesRoutable = computed(
  () => newTruck.value.from.mode === 'radius' && newTruck.value.to.mode === 'radius',
)

function onRouteResult({ valid }) {
  routeValid.value = valid
}

function hasAvailableDate() {
  const ad = newTruck.value.availableDate
  return ad.mode === 'exact' ? ad.dates.length > 0 : !!ad.start
}

// Exact dates mode may hold several dates - the truck is available across that
// whole span, so the earliest becomes the start and the latest the end.
function resolveAvailableDates() {
  const ad = newTruck.value.availableDate
  if (ad.mode === 'exact') {
    const sorted = [...(ad.dates || [])].sort()
    return {
      start: sorted[0] || '',
      end: sorted.length > 1 ? sorted[sorted.length - 1] : undefined,
    }
  }
  if (ad.mode === 'period') {
    return { start: ad.start || '', end: ad.end || undefined }
  }
  return { start: '', end: undefined }
}

function buildSidePayload(side, prefix, payload) {
  payload[`${prefix}Mode`] = side.mode
  if (side.mode === 'countries') {
    payload[`${prefix}Countries`] = side.countries.length ? side.countries : undefined
  } else {
    payload[`${prefix}Country`] = side.country || undefined
    payload[`${prefix}Location`] = side.location || undefined
    payload[`${prefix}Radius`] = side.radius ? Number.parseInt(side.radius, 10) : undefined
  }
}

async function createTruck() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!hasLocation(newTruck.value.from) || !hasLocation(newTruck.value.to) || !hasAvailableDate()) {
    errorMessage.value = 'Palun täida kohustuslikud väljad: From, To, Available date!'
    return
  }
  if (bothSidesRoutable.value && !routeValid.value) {
    errorMessage.value = 'Marsruuti ei õnnestunud kaardil kinnitada - palun kontrolli From/To asukohti!'
    return
  }

  isLoading.value = true

  try {
    const { start, end } = resolveAvailableDates()

    const payload = {
      vehicleType: newTruck.value.vehicleType.length ? newTruck.value.vehicleType : undefined,
      vehicleDescription: newTruck.value.vehicleDescription || undefined,
      vehicleLength: newTruck.value.vehicleLength
        ? Number.parseFloat(newTruck.value.vehicleLength)
        : undefined,
      vehicleWeight: newTruck.value.vehicleWeight
        ? Number.parseFloat(newTruck.value.vehicleWeight)
        : undefined,
      vehiclePhotoUrl: newTruck.value.vehiclePhotoUrl || undefined,
      bodyType: newTruck.value.bodyType.length ? newTruck.value.bodyType : undefined,
      bodyDescription: newTruck.value.bodyDescription || undefined,
      bodyLength: newTruck.value.bodyLength ? Number.parseFloat(newTruck.value.bodyLength) : undefined,
      bodyWeight: newTruck.value.bodyWeight ? Number.parseFloat(newTruck.value.bodyWeight) : undefined,
      bodyPhotoUrl: newTruck.value.bodyPhotoUrl || undefined,
      availableStartDate: start,
      availableEndDate: end,
      minimumRate: newTruck.value.minimumRate
        ? Number.parseFloat(newTruck.value.minimumRate)
        : undefined,
      comments: newTruck.value.comments || undefined,
    }

    buildSidePayload(newTruck.value.from, 'from', payload)
    buildSidePayload(newTruck.value.to, 'to', payload)

    await apiClient.post('/trucks', payload)

    successMessage.value = 'Veok edukalt lisatud!'
    resetForm()
    await fetchMyTrucks()
  } catch (error) {
    console.error('Error creating truck:', error)
    errorMessage.value =
      error.response?.data?.message ||
      (error.response
        ? `Viga veoki lisamisel (HTTP ${error.response.status})`
        : 'Viga veoki lisamisel - serveriga ei saanud ühendust!')
  } finally {
    isLoading.value = false
  }
}

async function onDeleteTruck(id) {
  if (!window.confirm('Kustuta see veoki postitus?')) return
  try {
    await apiClient.delete(`/trucks/${id}`)
    await fetchMyTrucks()
  } catch (error) {
    console.error('Error deleting truck:', error)
  }
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

function computeStatus(t) {
  const refDate = t.availableEndDate || t.availableStartDate
  if (!refDate) return 'ACTIVE'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(refDate) < today ? 'EXPIRED' : 'ACTIVE'
}
</script>

<template>
  <div class="courses-view-outer-container">
    <div class="courses-view-paper-block">
      <header class="freight-add-header-section">
        <h1 class="freight-add-page-title">Post truck</h1>
      </header>

      <div class="courses-view-body">
        <div v-if="successMessage" class="freight-add-success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="freight-add-error">
          {{ errorMessage }}
        </div>

        <section class="freight-filter-section">
          <div class="pt-type-row">
            <div class="pt-type-box">
              <h3 class="pt-type-heading">Vehicle type</h3>
              <div class="pt-type-body">
                <div class="pt-type-main">
                  <div class="filter-box">
                    <label class="filter-label">Description</label>
                    <input
                      v-model="newTruck.vehicleDescription"
                      placeholder="Year, model etc."
                      :disabled="isLoading"
                      class="courses-view-input"
                    />
                  </div>
                  <div class="pt-type-controls">
                    <CheckboxDropdown
                      v-model="newTruck.vehicleType"
                      :options="vehicleTypes"
                      placeholder="Vehicle type"
                    />
                    <div class="unit-input-group">
                      <input
                        v-model.number="newTruck.vehicleLength"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Length"
                        :disabled="isLoading"
                        class="courses-view-input unit-input no-spin-input"
                      />
                      <span class="unit-suffix">m</span>
                    </div>
                    <div class="unit-input-group">
                      <input
                        v-model.number="newTruck.vehicleWeight"
                        type="number"
                        step="1"
                        min="0"
                        placeholder="Weight"
                        :disabled="isLoading"
                        class="courses-view-input unit-input no-spin-input"
                      />
                      <span class="unit-suffix">kg</span>
                    </div>
                  </div>
                </div>
                <div class="pt-photo-box">
                  <input
                    ref="vehiclePhotoInput"
                    type="file"
                    accept="image/*"
                    class="pt-photo-hidden-input"
                    @change="onVehiclePhotoSelected"
                  />
                  <button
                    type="button"
                    class="pt-photo-btn"
                    :disabled="isUploadingVehiclePhoto"
                    @click="vehiclePhotoInput?.click()"
                  >
                    {{
                      isUploadingVehiclePhoto
                        ? 'Uploading...'
                        : newTruck.vehiclePhotoUrl
                          ? 'Change photo'
                          : 'Attach photo'
                    }}
                  </button>
                  <img
                    v-if="newTruck.vehiclePhotoUrl"
                    :src="newTruck.vehiclePhotoUrl"
                    class="pt-photo-preview"
                    alt="Vehicle photo"
                  />
                </div>
              </div>
            </div>

            <div class="pt-type-box">
              <h3 class="pt-type-heading">Body type</h3>
              <div class="pt-type-body">
                <div class="pt-type-main">
                  <div class="filter-box">
                    <label class="filter-label">Description</label>
                    <input
                      v-model="newTruck.bodyDescription"
                      placeholder="Year, model etc."
                      :disabled="isLoading"
                      class="courses-view-input"
                    />
                  </div>
                  <div class="pt-type-controls">
                    <CheckboxDropdown
                      v-model="newTruck.bodyType"
                      :options="bodyTypes"
                      placeholder="Body type"
                    />
                    <div class="unit-input-group">
                      <input
                        v-model.number="newTruck.bodyLength"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Length"
                        :disabled="isLoading"
                        class="courses-view-input unit-input no-spin-input"
                      />
                      <span class="unit-suffix">m</span>
                    </div>
                    <div class="unit-input-group">
                      <input
                        v-model.number="newTruck.bodyWeight"
                        type="number"
                        step="1"
                        min="0"
                        placeholder="Weight"
                        :disabled="isLoading"
                        class="courses-view-input unit-input no-spin-input"
                      />
                      <span class="unit-suffix">kg</span>
                    </div>
                  </div>
                </div>
                <div class="pt-photo-box">
                  <input
                    ref="bodyPhotoInput"
                    type="file"
                    accept="image/*"
                    class="pt-photo-hidden-input"
                    @change="onBodyPhotoSelected"
                  />
                  <button
                    type="button"
                    class="pt-photo-btn"
                    :disabled="isUploadingBodyPhoto"
                    @click="bodyPhotoInput?.click()"
                  >
                    {{
                      isUploadingBodyPhoto
                        ? 'Uploading...'
                        : newTruck.bodyPhotoUrl
                          ? 'Change photo'
                          : 'Attach photo'
                    }}
                  </button>
                  <img
                    v-if="newTruck.bodyPhotoUrl"
                    :src="newTruck.bodyPhotoUrl"
                    class="pt-photo-preview"
                    alt="Body photo"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="freight-filter-row pt-route-row">
            <CountryLocationField
              v-model="newTruck.from"
              label="FROM"
              :allow-multi-country="true"
              :show-radius="true"
              location-placeholder="ZIP / City"
            />
            <CountryLocationField
              v-model="newTruck.to"
              label="TO"
              :allow-multi-country="true"
              :show-radius="true"
              location-placeholder="ZIP / City"
            />
            <LoadingDatePicker v-model="newTruck.availableDate" label="Available date *" />
            <div class="filter-box">
              <label class="filter-label">Minimum rate</label>
              <div class="unit-input-group">
                <input
                  v-model.number="newTruck.minimumRate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  :disabled="isLoading"
                  class="courses-view-input unit-input no-spin-input"
                />
                <span class="unit-suffix">eur/km</span>
              </div>
            </div>
          </div>

          <RoutePreviewMap :from="newTruck.from" :to="newTruck.to" @route-result="onRouteResult" />

          <div class="filter-box pt-comments-box">
            <label class="filter-label">Comments</label>
            <textarea
              v-model="newTruck.comments"
              placeholder="Additional notes about this truck or route..."
              rows="5"
              :disabled="isLoading"
              class="courses-view-input freight-add-textarea"
            ></textarea>
          </div>

          <div class="find-row">
            <button @click="createTruck" class="courses-view-search-btn find-action-btn" :disabled="isLoading">
              {{ isLoading ? 'Saving...' : 'Add truck' }}
            </button>
          </div>
        </section>

        <section class="pt-my-trucks-section">
          <h2 class="pt-my-trucks-title">My Trucks</h2>

          <div v-if="loadingTrucks" class="pt-trucks-status">Loading…</div>
          <div v-else-if="!myTrucks.length" class="pt-trucks-status">No trucks posted yet.</div>

          <table v-else class="pt-trucks-table">
            <thead>
              <tr>
                <th class="pt-check-col"></th>
                <th>Age</th>
                <th>Truck</th>
                <th>Available</th>
                <th>Origin</th>
                <th class="pt-arrow-col"></th>
                <th>Destination</th>
                <th>Rate</th>
                <th>Status</th>
                <th class="pt-menu-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in myTrucks" :key="t.id">
                <td class="pt-check-col"><input type="checkbox" /></td>
                <td>{{ formatAge(t.createdAt) }}</td>
                <td>{{ formatTruckDescriptor(t) }}</td>
                <td>{{ formatAvailable(t) }}</td>
                <td>{{ formatOrigin(t) }}</td>
                <td class="pt-arrow-col">→</td>
                <td>{{ formatDestination(t) }}</td>
                <td>{{ formatRate(t) }}</td>
                <td>
                  <span class="pt-status-badge" :class="computeStatus(t).toLowerCase()">{{
                    computeStatus(t)
                  }}</span>
                </td>
                <td class="pt-menu-col">
                  <button type="button" class="pt-row-menu-btn" title="Delete" @click="onDeleteTruck(t.id)">
                    ⋮
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
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

.freight-add-success {
  background-color: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #c3e6cb;
}

.freight-add-error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
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

.pt-route-row {
  grid-template-columns: repeat(4, 1fr);
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

.freight-add-textarea {
  resize: vertical;
  font-family: inherit;
}

.pt-comments-box {
  width: 50%;
  max-width: 50%;
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

/* Vehicle / body type boxes */
.pt-type-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.pt-type-box {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  background: #fff;
}

.pt-type-heading {
  margin: 0 0 12px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #b55a30;
}

.pt-type-body {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.pt-type-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.pt-type-controls {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 6px;
}

.pt-photo-box {
  flex: 0 0 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.pt-photo-hidden-input {
  display: none;
}

.pt-photo-btn {
  width: 100%;
  background: transparent;
  border: 1px dashed #d4a76a;
  color: #b55a30;
  padding: 10px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
}

.pt-photo-btn:hover {
  background: #fdf3e4;
}

.pt-photo-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.pt-photo-preview {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

/* My Trucks table */
.pt-my-trucks-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pt-my-trucks-title {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.pt-trucks-status {
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
  padding: 10px 0;
}

.pt-trucks-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.pt-trucks-table th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #999;
  padding: 8px 10px;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
}

.pt-trucks-table td {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
  white-space: nowrap;
}

.pt-check-col {
  width: 28px;
}

.pt-arrow-col {
  width: 24px;
  text-align: center;
  color: #999;
}

.pt-menu-col {
  width: 32px;
  text-align: center;
}

.pt-status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid #ccc;
  color: #666;
}

.pt-status-badge.expired {
  border-color: #e0b3b3;
  color: #a33;
  background: #fbeaea;
}

.pt-status-badge.active {
  border-color: #b8dcc0;
  color: #2e7d4f;
  background: #eaf7ee;
}

.pt-row-menu-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 1rem;
  padding: 2px 6px;
}

.pt-row-menu-btn:hover {
  color: #333;
}

@media (max-width: 1100px) {
  .pt-route-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .pt-type-row {
    grid-template-columns: 1fr;
  }
  .pt-type-controls {
    grid-template-columns: 1fr;
  }
  .pt-comments-box {
    width: 100%;
    max-width: 100%;
  }
}
</style>
