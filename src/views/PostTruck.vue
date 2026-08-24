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
import { formatThousands } from '@/utils/format'
import '@/assets/css/coursesviewcss.css'

const router = useRouter()

const COMMENTS_MAX_LENGTH = 500

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

function hasAvailableDate(ad) {
  return ad.mode === 'exact' ? ad.dates.length > 0 : !!ad.start
}

// Exact dates mode may hold several dates - the truck is available across that
// whole span, so the earliest becomes the start and the latest the end.
function resolveAvailableDates(ad) {
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

  if (
    !hasLocation(newTruck.value.from) ||
    !hasLocation(newTruck.value.to) ||
    !hasAvailableDate(newTruck.value.availableDate)
  ) {
    errorMessage.value = 'Palun täida kohustuslikud väljad: From, To, Available date!'
    return
  }
  if (bothSidesRoutable.value && !routeValid.value) {
    errorMessage.value = 'Marsruuti ei õnnestunud kaardil kinnitada - palun kontrolli From/To asukohti!'
    return
  }

  isLoading.value = true

  try {
    const { start, end } = resolveAvailableDates(newTruck.value.availableDate)

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

// --- My Trucks: expand a row to see full details + map, and edit in place ---
const expandedTruckId = ref(null)
const editingTruckId = ref(null)
const editForm = ref(null)
const isSavingEdit = ref(false)
const editError = ref('')
// Set when the user tried to reactivate a posting whose dates had already
// passed - see toggleTruckStatus/saveEditTruck. Drives the red date-field
// hint and, once the user fixes the dates and saves, actually flips active.
const reactivateIntent = ref(false)

function toggleTruckRow(id) {
  if (expandedTruckId.value === id) {
    expandedTruckId.value = null
    editingTruckId.value = null
    reactivateIntent.value = false
  } else {
    expandedTruckId.value = id
  }
}

function sideToFormShape(mode, country, location, radius, countries) {
  return mode === 'countries'
    ? { mode: 'countries', country: '', countries: [...(countries || [])], location: '', radius: '' }
    : { mode: 'radius', country: country || '', countries: [], location: location || '', radius: radius ? String(radius) : '' }
}

function startEditTruck(t) {
  editError.value = ''
  reactivateIntent.value = false
  editForm.value = {
    vehicleType: [...(t.vehicleType || [])],
    vehicleDescription: t.vehicleDescription || '',
    vehicleLength: t.vehicleLength ?? '',
    vehicleWeight: t.vehicleWeight ?? '',
    bodyType: [...(t.bodyType || [])],
    bodyDescription: t.bodyDescription || '',
    bodyLength: t.bodyLength ?? '',
    bodyWeight: t.bodyWeight ?? '',
    from: sideToFormShape(t.fromMode, t.fromCountry, t.fromLocation, t.fromRadius, t.fromCountries),
    to: sideToFormShape(t.toMode, t.toCountry, t.toLocation, t.toRadius, t.toCountries),
    availableDate: {
      mode: 'period',
      start: t.availableStartDate || '',
      end: t.availableEndDate || t.availableStartDate || '',
      dates: [],
    },
    minimumRate: t.minimumRate ?? '',
    comments: t.comments || '',
  }
  editingTruckId.value = t.id
}

function cancelEditTruck() {
  editingTruckId.value = null
  editForm.value = null
  editError.value = ''
  reactivateIntent.value = false
}

// Clicking the status badge toggles active/inactive. Deactivating is instant.
// Reactivating is instant too UNLESS the posting's dates already passed -
// then we can't just flip it back on (it would immediately show EXPIRED
// again), so instead we open edit mode and flag the date field so the user
// fixes it first; saveEditTruck actually sets active:true once they do.
async function toggleTruckStatus(t) {
  const currentlyActive = t.active !== false
  if (currentlyActive) {
    await putTruckActive(t, false)
    return
  }
  if (isDateExpired(t)) {
    // The edit form only renders inside the expanded detail row, which may
    // not be open yet if the badge was clicked straight from the table row.
    expandedTruckId.value = t.id
    startEditTruck(t)
    reactivateIntent.value = true
    return
  }
  await putTruckActive(t, true)
}

async function putTruckActive(t, active) {
  try {
    const payload = { ...t, active }
    delete payload.id
    delete payload.ownerId
    delete payload.createdAt
    delete payload.updatedAt
    delete payload.distanceKm
    const res = await apiClient.put(`/trucks/${t.id}`, payload)
    const idx = myTrucks.value.findIndex((x) => x.id === t.id)
    if (idx !== -1) myTrucks.value[idx] = res.data
  } catch (error) {
    console.error('Error updating truck status:', error)
  }
}

async function saveEditTruck(t) {
  const f = editForm.value
  if (!hasLocation(f.from) || !hasLocation(f.to) || !hasAvailableDate(f.availableDate)) {
    editError.value = 'Palun täida kohustuslikud väljad: From, To, Available date!'
    return
  }

  isSavingEdit.value = true
  editError.value = ''
  try {
    const { start, end } = resolveAvailableDates(f.availableDate)

    // A normal edit leaves active as it was; the reactivate-after-expiry flow
    // (see toggleTruckStatus) is the one case where saving should also flip
    // it back on - now that the date has presumably been fixed.
    const stillExpired = new Date(end || start) < new Date(new Date().setHours(0, 0, 0, 0))
    const active = reactivateIntent.value ? !stillExpired : t.active !== false

    const payload = {
      vehicleType: f.vehicleType.length ? f.vehicleType : undefined,
      vehicleDescription: f.vehicleDescription || undefined,
      vehicleLength: f.vehicleLength ? Number.parseFloat(f.vehicleLength) : undefined,
      vehicleWeight: f.vehicleWeight ? Number.parseFloat(f.vehicleWeight) : undefined,
      vehiclePhotoUrl: t.vehiclePhotoUrl || undefined,
      bodyType: f.bodyType.length ? f.bodyType : undefined,
      bodyDescription: f.bodyDescription || undefined,
      bodyLength: f.bodyLength ? Number.parseFloat(f.bodyLength) : undefined,
      bodyWeight: f.bodyWeight ? Number.parseFloat(f.bodyWeight) : undefined,
      bodyPhotoUrl: t.bodyPhotoUrl || undefined,
      availableStartDate: start,
      availableEndDate: end,
      minimumRate: f.minimumRate ? Number.parseFloat(f.minimumRate) : undefined,
      comments: f.comments || undefined,
      active,
    }
    buildSidePayload(f.from, 'from', payload)
    buildSidePayload(f.to, 'to', payload)

    const res = await apiClient.put(`/trucks/${t.id}`, payload)
    const idx = myTrucks.value.findIndex((x) => x.id === t.id)
    if (idx !== -1) myTrucks.value[idx] = res.data
    reactivateIntent.value = false
    editingTruckId.value = null
    editForm.value = null
  } catch (error) {
    console.error('Error updating truck:', error)
    editError.value =
      error.response?.data?.message ||
      (error.response ? `Viga veoki muutmisel (HTTP ${error.response.status})` : 'Viga veoki muutmisel!')
  } finally {
    isSavingEdit.value = false
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
    // Same month (and year) - drop the repeated ".month" from the start day,
    // e.g. "27.8-30.8" becomes "27-30.8".
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

// Each field gets its own fixed-width column (see .pt-truck-seg variants) and
// truncates with an ellipsis rather than growing/shrinking, so every pipe in
// the Truck column lines up under the row below regardless of content length.
function formatVehicleType(t) {
  return t.vehicleType?.length ? t.vehicleType.join(', ') : '—'
}

function formatVehicleLength(t) {
  return t.vehicleLength ? `${formatThousands(t.vehicleLength)} m` : '—'
}

function formatBodyType(t) {
  return t.bodyType?.length ? t.bodyType.join(', ') : '—'
}

function formatTruckWeight(t) {
  return t.vehicleWeight ? `${formatThousands(t.vehicleWeight)} kg` : '—'
}

function formatRate(t) {
  return t.minimumRate ? `${formatThousands(t.minimumRate.toFixed(2))} €/km` : '-'
}

function isDateExpired(t) {
  const refDate = t.availableEndDate || t.availableStartDate
  if (!refDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(refDate) < today
}

function computeStatus(t) {
  if (t.active === false) return 'INACTIVE'
  if (isDateExpired(t)) return 'EXPIRED'
  return 'ACTIVE'
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
              <div class="pt-photo-actions">
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
              </div>

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
              <div class="pt-photo-preview-box">
                <img
                  v-if="newTruck.vehiclePhotoUrl"
                  :src="newTruck.vehiclePhotoUrl"
                  class="pt-photo-preview"
                  alt="Vehicle photo"
                />
              </div>
            </div>

            <div class="pt-type-box">
              <h3 class="pt-type-heading">Body type</h3>
              <div class="pt-photo-actions">
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
              </div>

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
              <div class="pt-photo-preview-box">
                <img
                  v-if="newTruck.bodyPhotoUrl"
                  :src="newTruck.bodyPhotoUrl"
                  class="pt-photo-preview"
                  alt="Body photo"
                />
              </div>
            </div>
          </div>

          <div class="pt-map-side-row">
            <div class="pt-left-column">
              <div class="freight-filter-row two-col">
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
              </div>

              <div class="freight-filter-row two-col">
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

              <div class="filter-box pt-comments-box">
                <div class="pt-comments-label-row">
                  <label class="filter-label">Comments</label>
                  <span class="pt-char-count">{{ newTruck.comments.length }}/{{ COMMENTS_MAX_LENGTH }}</span>
                </div>
                <textarea
                  v-model="newTruck.comments"
                  placeholder="Additional notes about this truck or route..."
                  rows="5"
                  :maxlength="COMMENTS_MAX_LENGTH"
                  :disabled="isLoading"
                  class="courses-view-input freight-add-textarea"
                ></textarea>
              </div>
            </div>

            <RoutePreviewMap :from="newTruck.from" :to="newTruck.to" @route-result="onRouteResult" />
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
                <th>Trip</th>
                <th>Rate</th>
                <th>Status</th>
                <th class="pt-menu-col"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="t in myTrucks" :key="t.id">
                <tr
                  class="pt-truck-row"
                  :class="{ expanded: expandedTruckId === t.id }"
                  @click="toggleTruckRow(t.id)"
                >
                  <td class="pt-check-col" @click.stop><input type="checkbox" /></td>
                  <td>{{ formatAge(t.updatedAt || t.createdAt) }}</td>
                  <td class="pt-truck-cell">
                    <span class="pt-truck-seg pt-truck-type">{{ formatVehicleType(t) }}</span>
                    <span class="pt-truck-sep">|</span>
                    <span class="pt-truck-seg pt-truck-length">{{ formatVehicleLength(t) }}</span>
                    <span class="pt-truck-sep">|</span>
                    <span class="pt-truck-seg pt-truck-bodytype">{{ formatBodyType(t) }}</span>
                    <span class="pt-truck-sep">|</span>
                    <span class="pt-truck-seg pt-truck-weight">{{ formatTruckWeight(t) }}</span>
                  </td>
                  <td>{{ formatAvailable(t) }}</td>
                  <td>
                    <div class="pt-line"><span class="pt-line-arrow">↓</span>{{ formatOrigin(t) }}</div>
                    <div class="pt-row-sub pt-line"><span class="pt-line-arrow">↓</span>{{ formatDestination(t) }}</div>
                  </td>
                  <td>{{ formatRate(t) }}</td>
                  <td>
                    <button
                      type="button"
                      class="pt-status-badge"
                      :class="computeStatus(t).toLowerCase()"
                      :title="t.active === false ? 'Click to reactivate' : 'Click to deactivate'"
                      @click.stop="toggleTruckStatus(t)"
                    >
                      {{ computeStatus(t) }}
                    </button>
                  </td>
                  <td class="pt-menu-col">
                    <button
                      type="button"
                      class="pt-row-menu-btn"
                      title="Delete"
                      @click.stop="onDeleteTruck(t.id)"
                    >
                      ⋮
                    </button>
                  </td>
                </tr>
                <tr v-if="expandedTruckId === t.id" class="pt-truck-detail-row">
                  <td colspan="8">
                    <template v-if="editingTruckId !== t.id">
                      <div class="pt-truck-detail">
                        <div class="pt-truck-detail-col pt-truck-detail-col-photo">
                          <div class="pt-truck-detail-text">
                            <h4>Vehicle</h4>
                            <p v-if="t.vehicleDescription">{{ t.vehicleDescription }}</p>
                            <p>{{ t.vehicleType?.length ? t.vehicleType.join(', ') : '—' }}</p>
                          </div>
                          <img
                            v-if="t.vehiclePhotoUrl"
                            :src="t.vehiclePhotoUrl"
                            class="pt-detail-photo"
                            alt="Vehicle photo"
                          />
                        </div>
                        <div class="pt-truck-detail-col pt-truck-detail-col-photo">
                          <div class="pt-truck-detail-text">
                            <h4>Body</h4>
                            <p v-if="t.bodyDescription">{{ t.bodyDescription }}</p>
                            <p>{{ t.bodyType?.length ? t.bodyType.join(', ') : '—' }}</p>
                          </div>
                          <img
                            v-if="t.bodyPhotoUrl"
                            :src="t.bodyPhotoUrl"
                            class="pt-detail-photo"
                            alt="Body photo"
                          />
                        </div>
                        <div class="pt-truck-detail-col">
                          <h4>Comments</h4>
                          <p>{{ t.comments || '—' }}</p>
                        </div>
                        <div class="pt-truck-detail-map">
                          <RoutePreviewMap
                            :from="{ mode: t.fromMode, country: t.fromCountry, countries: t.fromCountries, location: t.fromLocation }"
                            :to="{ mode: t.toMode, country: t.toCountry, countries: t.toCountries, location: t.toLocation }"
                          />
                        </div>
                      </div>
                      <div class="pt-truck-detail-actions">
                        <button type="button" class="pt-edit-btn" @click.stop="startEditTruck(t)">Edit</button>
                      </div>
                    </template>

                    <div v-else class="pt-truck-edit-form" @click.stop>
                      <div v-if="reactivateIntent" class="pt-reactivate-hint">
                        These dates have already passed - update them below to reactivate this posting.
                      </div>
                      <div class="pt-edit-row">
                        <div class="filter-box">
                          <label class="filter-label">Vehicle description</label>
                          <input v-model="editForm.vehicleDescription" class="courses-view-input" />
                        </div>
                        <CheckboxDropdown
                          v-model="editForm.vehicleType"
                          :options="vehicleTypes"
                          placeholder="Vehicle type"
                        />
                        <div class="filter-box">
                          <label class="filter-label">Vehicle length (m)</label>
                          <input
                            v-model.number="editForm.vehicleLength"
                            type="number"
                            step="0.1"
                            min="0"
                            class="courses-view-input"
                          />
                        </div>
                        <div class="filter-box">
                          <label class="filter-label">Vehicle weight (kg)</label>
                          <input
                            v-model.number="editForm.vehicleWeight"
                            type="number"
                            step="1"
                            min="0"
                            class="courses-view-input"
                          />
                        </div>
                      </div>
                      <div class="pt-edit-row">
                        <div class="filter-box">
                          <label class="filter-label">Body description</label>
                          <input v-model="editForm.bodyDescription" class="courses-view-input" />
                        </div>
                        <CheckboxDropdown
                          v-model="editForm.bodyType"
                          :options="bodyTypes"
                          placeholder="Body type"
                        />
                        <div class="filter-box">
                          <label class="filter-label">Body length (m)</label>
                          <input
                            v-model.number="editForm.bodyLength"
                            type="number"
                            step="0.1"
                            min="0"
                            class="courses-view-input"
                          />
                        </div>
                        <div class="filter-box">
                          <label class="filter-label">Body weight (kg)</label>
                          <input
                            v-model.number="editForm.bodyWeight"
                            type="number"
                            step="1"
                            min="0"
                            class="courses-view-input"
                          />
                        </div>
                      </div>
                      <div class="pt-edit-row">
                        <CountryLocationField
                          v-model="editForm.from"
                          label="FROM"
                          :allow-multi-country="true"
                          :show-radius="true"
                          location-placeholder="ZIP / City"
                        />
                        <CountryLocationField
                          v-model="editForm.to"
                          label="TO"
                          :allow-multi-country="true"
                          :show-radius="true"
                          location-placeholder="ZIP / City"
                        />
                        <LoadingDatePicker
                          v-model="editForm.availableDate"
                          label="Available date"
                          :class="{ 'pt-date-error': reactivateIntent }"
                        />
                        <div class="filter-box">
                          <label class="filter-label">Minimum rate</label>
                          <input
                            v-model.number="editForm.minimumRate"
                            type="number"
                            step="0.01"
                            min="0"
                            class="courses-view-input"
                          />
                        </div>
                      </div>
                      <div class="filter-box">
                        <label class="filter-label">Comments</label>
                        <textarea
                          v-model="editForm.comments"
                          rows="3"
                          :maxlength="COMMENTS_MAX_LENGTH"
                          class="courses-view-input freight-add-textarea"
                        ></textarea>
                      </div>
                      <div v-if="editError" class="freight-add-error">{{ editError }}</div>
                      <div class="pt-truck-detail-actions">
                        <button
                          type="button"
                          class="freight-add-cancel-btn"
                          :disabled="isSavingEdit"
                          @click="cancelEditTruck"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          class="pt-edit-btn"
                          :disabled="isSavingEdit"
                          @click="saveEditTruck(t)"
                        >
                          {{ isSavingEdit ? 'Saving...' : 'Save' }}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
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

.freight-filter-row.two-col {
  grid-template-columns: repeat(2, 1fr);
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

.pt-comments-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.pt-char-count {
  font-size: 0.68rem;
  color: #aaa;
  white-space: nowrap;
}

/* Everything from From/To down through Comments stacks in a left column; the
   map sits to its right as one tall block, stretched (via grid's default
   align-items: stretch) to start below the vehicle/body type row above it and
   end flush with the bottom of the Comments box - the column's last item. */
.pt-map-side-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

.pt-left-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.pt-comments-box {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.pt-comments-box .freight-add-textarea {
  flex: 1;
  min-height: 0;
}

/* RoutePreviewMap's root stretches to the grid row's height (set by the left
   column, its taller sibling); these :deep() rules make the map's own inner
   states (hint/error/canvas) fill that stretched height instead of keeping
   their own fixed 90px/220px, so the map visually spans the whole column. */
.pt-map-side-row :deep(.route-preview-map) {
  margin-top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pt-map-side-row :deep(.route-preview-canvas),
.pt-map-side-row :deep(.route-preview-hint),
.pt-map-side-row :deep(.route-preview-error) {
  flex: 1;
  height: auto;
  min-height: 160px;
}

@media (max-width: 900px) {
  .pt-map-side-row {
    grid-template-columns: 1fr;
  }
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

/* A 2-column grid (main content | photo) shared by both the heading/button row
   and the fields/photo row, so the photo column's left edge lines up exactly
   under the "Attach/Change photo" button - both rows resolve the same column
   width - and the photo box (row 2) stretches to the fields' full height via
   grid's default align-items: stretch, instead of a fixed small square.
   The photo column is a fixed width rather than "auto": an auto track sizes
   to its content's intrinsic size, and a width:100%/height:100% <img> reports
   its natural (pre-crop) dimensions for that, which blew the column up to the
   photo's own aspect ratio instead of just hugging the button above it. */
.pt-type-box {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  background: #fff;
  display: grid;
  grid-template-columns: 1fr 120px;
  column-gap: 14px;
  row-gap: 12px;
}

.pt-type-heading {
  grid-column: 1;
  align-self: center;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #b55a30;
}

/* Stretches to the full column width (default justify-self) so the button
   below shares the exact same left/right edges as the photo box in row 2. */
.pt-photo-actions {
  grid-column: 2;
  align-self: center;
}

.pt-type-main {
  grid-column: 1;
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

.pt-photo-hidden-input {
  display: none;
}

.pt-photo-btn {
  width: 100%;
  background: transparent;
  border: 1px dashed #d4a76a;
  color: #b55a30;
  padding: 8px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.pt-photo-btn:hover {
  background: #fdf3e4;
}

.pt-photo-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

/* Always occupies its grid cell (even with no photo yet) so pt-type-main never
   expands into this space; overflow hidden means however large or oddly-shaped
   an uploaded photo is, it's cropped to fit rather than resizing the box. */
.pt-photo-preview-box {
  grid-column: 2;
  min-width: 90px;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 1px solid #ddd;
  overflow: hidden;
}

.pt-photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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

/* Every field is its own fixed-width column and truncates with an ellipsis
   rather than growing/shrinking with its content, so all three separators
   land at the same x-position on every row - not just the last one. */
.pt-truck-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 380px;
}

.pt-truck-seg {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.pt-truck-type {
  flex: 0 0 100px;
}

.pt-truck-length {
  flex: 0 0 50px;
}

.pt-truck-bodytype {
  flex: 0 0 100px;
}

.pt-truck-weight {
  flex: 0 0 76px;
}

.pt-truck-sep {
  flex: 0 0 auto;
  color: #ccc;
}

.pt-line {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pt-line-arrow {
  color: #999;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.pt-row-sub {
  font-size: 0.8rem;
  color: #888;
  margin-top: 2px;
}

.pt-menu-col {
  width: 32px;
  text-align: center;
}

/* Doubles as a button - click to toggle active/inactive (see toggleTruckStatus). */
.pt-status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid #ccc;
  color: #666;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
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

.pt-status-badge.inactive {
  border-color: #ddd;
  color: #888;
  background: #f2f2f2;
}

.pt-row-menu-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 1rem;
  padding: 2px 6px;
}

.pt-truck-row {
  cursor: pointer;
}

.pt-truck-row:hover {
  background: #fdf8f0;
}

.pt-truck-row.expanded {
  background: #fdf3e4;
}

.pt-truck-detail-row td {
  white-space: normal;
  background: #fafafa;
}

.pt-truck-detail {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 1.3fr;
  gap: 20px;
  padding: 10px 6px;
}

.pt-truck-detail-col h4 {
  margin: 0 0 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #b55a30;
  letter-spacing: 0.5px;
}

.pt-truck-detail-col p {
  margin: 0 0 6px;
  font-size: 0.85rem;
  color: #333;
}

/* Vehicle/Body columns: text on the left, photo pinned to the right of it
   (not stacked underneath), matching the fixed-size non-stretching photo
   slot used elsewhere in this form. */
.pt-truck-detail-col-photo {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.pt-truck-detail-text {
  flex: 1;
  min-width: 0;
}

.pt-detail-photo {
  flex: 0 0 70px;
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.pt-truck-detail-map {
  min-width: 0;
}

.pt-truck-detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 6px 10px;
}

.pt-edit-btn {
  background: #d4a76a;
  color: #1a1a1a;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.85rem;
}

.pt-edit-btn:hover {
  background: #b88f55;
}

.pt-edit-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.pt-truck-edit-form {
  padding: 10px 6px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pt-reactivate-hint {
  background: #fbeaea;
  border: 1px solid #e0b3b3;
  color: #a33;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.82rem;
}

.pt-date-error :deep(.ldp-box) {
  border-color: #d33;
  background: #fff6f6;
}

.pt-edit-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.pt-edit-row > * {
  flex: 1 1 160px;
  min-width: 0;
}

@media (max-width: 900px) {
  .pt-truck-detail {
    grid-template-columns: 1fr;
  }
}

.pt-row-menu-btn:hover {
  color: #333;
}

@media (max-width: 900px) {
  .pt-type-row {
    grid-template-columns: 1fr;
  }
  .pt-type-controls {
    grid-template-columns: 1fr;
  }
}
</style>
