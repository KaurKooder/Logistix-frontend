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
import { bodyCharacteristics } from '@/data/bodyCharacteristics'
import { cargoTypes } from '@/data/cargoTypes'
import { callingCodes } from '@/data/callingCodes'
import { formatPhoneNumber } from '@/utils/phone'
import { formatThousands } from '@/utils/format'
import '@/assets/css/coursesviewcss.css'

const router = useRouter()

const COMMENTS_MAX_LENGTH = 500

function createEmptyFreight() {
  return {
    name: '',
    internalReference: '',
    from: { country: '', location: '' },
    to: { country: '', location: '' },
    loadingDate: { mode: '', start: '', end: '', dates: [] },
    loadingTimeStart: '',
    loadingTimeEnd: '',
    unloadingDate: { mode: '', start: '', end: '', dates: [] },
    unloadingTimeStart: '',
    unloadingTimeEnd: '',
    vehicleType: [],
    bodyType: [],
    bodyCharacteristics: [],
    length: '',
    weight: '',
    mayContain: [],
    contactDialCode: '+372',
    contactPhoneNumber: '',
    contactEmail: '',
    price: '',
    description: '',
  }
}

// Admin create freight posting
const newFreight = ref(createEmptyFreight())

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const routeValid = ref(false)
const routeDistanceKm = ref(null)

function onRouteResult({ valid, distanceKm }) {
  routeValid.value = valid
  routeDistanceKm.value = distanceKm
}

function onPhoneInput(e) {
  newFreight.value.contactPhoneNumber = formatPhoneNumber(e.target.value)
}

const routeHintText = computed(() => {
  if (routeDistanceKm.value == null) {
    return 'Distance & €/km will show here once the map validates the route.'
  }
  const km = formatThousands(Math.round(routeDistanceKm.value))
  const price = Number(newFreight.value.price)
  const perKm = price > 0 ? (price / routeDistanceKm.value).toFixed(2) : null
  return perKm ? `${km} km · ${perKm} €/km` : `${km} km`
})

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
const isAdmin = computed(() => user.value?.role === 'ROLE_ADMIN')

// Check admin status on mount
onMounted(() => {
  if (!isAdmin.value) {
    router.push('/courses')
  }
})

function resetForm() {
  newFreight.value = createEmptyFreight()
}

// Each date picker supports "Exact dates" (a single specific day here, since
// multipleExact is off) and "Period" (a range). A posting stores one loading
// day and one unloading day, so Period mode picks a representative edge of
// the range: the earliest day for loading, the latest (deadline) for unloading.
function resolveDate(datePicker, useEndOfPeriod) {
  if (datePicker.mode === 'exact') {
    return datePicker.dates[0] || ''
  }
  if (datePicker.mode === 'period') {
    return (useEndOfPeriod ? datePicker.end || datePicker.start : datePicker.start) || ''
  }
  return ''
}

function hasLoadingDate() {
  const ld = newFreight.value.loadingDate
  return ld.mode === 'exact' ? ld.dates.length > 0 : !!ld.start
}

async function createFreight() {
  errorMessage.value = ''
  successMessage.value = ''

  if (
    !newFreight.value.from.country ||
    !newFreight.value.to.country ||
    !hasLoadingDate() ||
    !newFreight.value.price
  ) {
    errorMessage.value = 'Palun täida kohustuslikud väljad: From, To, Loading date, Price!'
    return
  }
  if (!routeValid.value) {
    errorMessage.value = 'Marsruuti ei õnnestunud kaardil kinnitada - palun kontrolli From/To asukohti!'
    return
  }

  isLoading.value = true

  try {
    const startDate = resolveDate(newFreight.value.loadingDate, false)
    const endDate = resolveDate(newFreight.value.unloadingDate, true) || undefined

    const freightData = {
      name: newFreight.value.name || undefined,
      internalReference: newFreight.value.internalReference || undefined,
      fromCountry: newFreight.value.from.country,
      fromLocation: newFreight.value.from.location || undefined,
      toCountry: newFreight.value.to.country,
      toLocation: newFreight.value.to.location || undefined,
      startDate,
      endDate,
      loadingTimeStart: newFreight.value.loadingTimeStart || undefined,
      loadingTimeEnd: newFreight.value.loadingTimeEnd || undefined,
      unloadingTimeStart: newFreight.value.unloadingTimeStart || undefined,
      unloadingTimeEnd: newFreight.value.unloadingTimeEnd || undefined,
      vehicleType: newFreight.value.vehicleType.length ? newFreight.value.vehicleType : undefined,
      bodyType: newFreight.value.bodyType.length ? newFreight.value.bodyType : undefined,
      bodyCharacteristics: newFreight.value.bodyCharacteristics.length
        ? newFreight.value.bodyCharacteristics
        : undefined,
      length: newFreight.value.length ? Number.parseFloat(newFreight.value.length) : undefined,
      weight: newFreight.value.weight ? Number.parseFloat(newFreight.value.weight) : undefined,
      mayContain: newFreight.value.mayContain.length ? newFreight.value.mayContain : undefined,
      contactPhone: newFreight.value.contactPhoneNumber
        ? `${newFreight.value.contactDialCode} ${newFreight.value.contactPhoneNumber}`
        : undefined,
      contactEmail: newFreight.value.contactEmail || undefined,
      company: user.value?.company || undefined,
      price: Number.parseFloat(newFreight.value.price),
      description: newFreight.value.description || undefined,
    }

    await apiClient.post('/courses', freightData)

    successMessage.value = 'Vedu edukalt lisatud!'

    resetForm()

    // Redirect back to freight search after 2 seconds
    setTimeout(() => {
      router.push('/courses')
    }, 2000)
  } catch (error) {
    console.error('Error creating freight:', error)
    errorMessage.value = error.response?.data?.message || 'Viga veo lisamisel!'
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push('/courses')
}
</script>

<template>
  <div class="courses-view-outer-container">
    <div class="courses-view-paper-block">
      <header class="freight-add-header-section">
        <h1 class="freight-add-page-title">Post freight</h1>
        <button @click="goBack" class="freight-add-back-btn">← Back</button>
      </header>

      <div class="courses-view-body">
        <div v-if="successMessage" class="freight-add-success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="freight-add-error">
          {{ errorMessage }}
        </div>

        <section class="freight-filter-section">
          <div class="freight-filter-row two-col">
            <CountryLocationField
              v-model="newFreight.from"
              label="FROM"
              :required="true"
              :allow-empty-country="false"
              location-placeholder="Town / post code"
            />
            <CountryLocationField
              v-model="newFreight.to"
              label="TO"
              :required="true"
              :allow-empty-country="false"
              location-placeholder="Town / post code"
            />
          </div>

          <div class="freight-filter-row four-col">
            <LoadingDatePicker
              v-model="newFreight.loadingDate"
              label="Loading date *"
            />
            <div class="filter-box">
              <label class="filter-label">Loading time</label>
              <div class="filter-range-group">
                <div class="filter-range-item">
                  <span class="filter-range-item-label">From</span>
                  <input v-model="newFreight.loadingTimeStart" type="time" class="courses-view-input" />
                </div>
                <span class="filter-range-sep"></span>
                <div class="filter-range-item">
                  <span class="filter-range-item-label">Until</span>
                  <input v-model="newFreight.loadingTimeEnd" type="time" class="courses-view-input" />
                </div>
              </div>
            </div>
            <LoadingDatePicker
              v-model="newFreight.unloadingDate"
              label="Unloading date"
            />
            <div class="filter-box">
              <label class="filter-label">Unloading time</label>
              <div class="filter-range-group">
                <div class="filter-range-item">
                  <span class="filter-range-item-label">From</span>
                  <input v-model="newFreight.unloadingTimeStart" type="time" class="courses-view-input" />
                </div>
                <span class="filter-range-sep"></span>
                <div class="filter-range-item">
                  <span class="filter-range-item-label">Until</span>
                  <input v-model="newFreight.unloadingTimeEnd" type="time" class="courses-view-input" />
                </div>
              </div>
            </div>
          </div>

          <div class="pl-map-side-row">
            <div class="pl-left-column">
              <div class="freight-filter-row four-col">
                <div class="filter-box">
                  <label class="filter-label">Weight</label>
                  <div class="unit-input-group">
                    <input
                      v-model.number="newFreight.weight"
                      type="number"
                      step="1"
                      min="0"
                      inputmode="numeric"
                      placeholder="5000"
                      :disabled="isLoading"
                      class="courses-view-input unit-input"
                    />
                    <span class="unit-suffix">kg</span>
                  </div>
                </div>

                <div class="filter-box">
                  <label class="filter-label">Length</label>
                  <div class="unit-input-group">
                    <input
                      v-model.number="newFreight.length"
                      type="number"
                      step="0.1"
                      min="0"
                      inputmode="numeric"
                      placeholder="13.6"
                      :disabled="isLoading"
                      class="courses-view-input unit-input"
                    />
                    <span class="unit-suffix">m</span>
                  </div>
                </div>

                <div class="filter-box">
                  <label class="filter-label">Price (€) *</label>
                  <input
                    v-model.number="newFreight.price"
                    type="number"
                    step="0.01"
                    min="0"
                    inputmode="numeric"
                    placeholder="0.00"
                    :disabled="isLoading"
                    class="courses-view-input no-spin-input"
                  />
                  <span class="freight-distance-hint">{{ routeHintText }}</span>
                </div>

                <div class="filter-box">
                  <label class="filter-label">Vehicle and body type</label>
                  <div class="vb-group">
                    <CheckboxDropdown
                      v-model="newFreight.vehicleType"
                      :options="vehicleTypes"
                      placeholder="Vehicle"
                    />
                    <CheckboxDropdown
                      v-model="newFreight.bodyType"
                      :options="bodyTypes"
                      placeholder="Body"
                    />
                  </div>
                </div>
              </div>

              <div class="freight-filter-row two-col">
                <CheckboxDropdown
                  v-model="newFreight.mayContain"
                  :options="cargoTypes"
                  label="Goods"
                  placeholder="What this load consists of"
                />
                <CheckboxDropdown
                  v-model="newFreight.bodyCharacteristics"
                  :options="bodyCharacteristics"
                  label="Must contain"
                  placeholder="Required equipment/certificates"
                />
              </div>

              <div class="freight-filter-row three-col">
                <div class="filter-box">
                  <label class="filter-label">Contact tel</label>
                  <div class="tel-input-group">
                    <select
                      v-model="newFreight.contactDialCode"
                      :disabled="isLoading"
                      class="courses-view-input tel-dial-select"
                    >
                      <option v-for="c in callingCodes" :key="c.code" :value="c.dial">
                        {{ c.code }} {{ c.dial }}
                      </option>
                    </select>
                    <input
                      :value="newFreight.contactPhoneNumber"
                      @input="onPhoneInput"
                      placeholder="5555 5555"
                      inputmode="numeric"
                      maxlength="9"
                      :disabled="isLoading"
                      class="courses-view-input tel-number-input"
                    />
                  </div>
                </div>
                <div class="filter-box">
                  <label class="filter-label">Contact email</label>
                  <input
                    v-model="newFreight.contactEmail"
                    type="email"
                    placeholder="you@company.com"
                    :disabled="isLoading"
                    class="courses-view-input"
                  />
                </div>
                <div class="filter-box">
                  <label class="filter-label">Company</label>
                  <div class="company-readonly">{{ user?.company || '—' }}</div>
                </div>
              </div>

              <div class="freight-filter-row two-col">
                <div class="filter-box">
                  <label class="filter-label">Reference ID</label>
                  <input
                    v-model="newFreight.name"
                    placeholder="Short reference/title"
                    :disabled="isLoading"
                    class="courses-view-input"
                  />
                </div>
                <div class="filter-box">
                  <label class="filter-label">Reference ID (Visible only to you)</label>
                  <input
                    v-model="newFreight.internalReference"
                    placeholder="Internal note, e.g. order number"
                    :disabled="isLoading"
                    class="courses-view-input"
                  />
                </div>
              </div>

              <div class="filter-box pl-comments-box">
                <div class="pl-comments-label-row">
                  <label class="filter-label">Comments</label>
                  <span class="pl-char-count">{{ newFreight.description.length }}/{{ COMMENTS_MAX_LENGTH }}</span>
                </div>
                <textarea
                  v-model="newFreight.description"
                  placeholder="Cargo details, loading/unloading instructions..."
                  rows="6"
                  :maxlength="COMMENTS_MAX_LENGTH"
                  :disabled="isLoading"
                  class="courses-view-input freight-add-textarea"
                ></textarea>
              </div>
            </div>

            <RoutePreviewMap :from="newFreight.from" :to="newFreight.to" @route-result="onRouteResult" />
          </div>

          <div class="find-row">
            <button @click="createFreight" class="courses-view-search-btn find-action-btn" :disabled="isLoading">
              {{ isLoading ? 'Saving...' : 'Post freight' }}
            </button>
            <button @click="goBack" class="freight-add-cancel-btn" :disabled="isLoading">
              Cancel
            </button>
          </div>
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

.freight-add-back-btn {
  background-color: transparent;
  border: 1px solid #d4a76a;
  color: #b55a30;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.freight-add-back-btn:hover {
  background: #fdf3e4;
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

.freight-filter-row.three-col {
  grid-template-columns: repeat(3, 1fr);
}

.freight-filter-row.four-col {
  grid-template-columns: repeat(4, 1fr);
}

/* The date-mode box (Exact dates/Period) is naturally a bit shorter than the
   Loading/Unloading time box next to it (which has its own From/Until
   sub-labels adding height) - grid already stretches LoadingDatePicker's
   root to match the row, this cascades that stretch down into its own box
   so the two visually line up instead of the date box floating short. */
.freight-filter-row.four-col :deep(.ldp-root) {
  display: flex;
  height: 100%;
}

.freight-filter-row.four-col :deep(.ldp-top-row) {
  flex: 1;
}

.freight-filter-row.four-col :deep(.ldp-box) {
  flex: 1;
}

/* Everything from Price down through Comments stacks in a left column; the map
   sits to its right as one tall block, stretched (via grid's default
   align-items: stretch) to start at the top of that column and end flush with
   the bottom of the Comments box - the column's last, height-driving item. */
.pl-map-side-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

.pl-left-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* Four fields are too cramped once this row is squeezed into half the section
   width, so pair them 2x2 instead of across a single line. */
.pl-left-column .freight-filter-row.four-col {
  grid-template-columns: repeat(2, 1fr);
}

.pl-comments-box {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.pl-comments-box .freight-add-textarea {
  flex: 1;
  min-height: 0;
}

/* RoutePreviewMap's root stretches to the grid row's height (set by the left
   column, its taller sibling); these :deep() rules make the map's own inner
   states (hint/error/canvas) fill that stretched height instead of keeping
   their own fixed 90px/220px, so the map visually spans the whole column. */
.pl-map-side-row :deep(.route-preview-map) {
  margin-top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pl-map-side-row :deep(.route-preview-canvas),
.pl-map-side-row :deep(.route-preview-hint),
.pl-map-side-row :deep(.route-preview-error) {
  flex: 1;
  height: auto;
  min-height: 160px;
}

@media (max-width: 900px) {
  .pl-map-side-row {
    grid-template-columns: 1fr;
  }
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
  align-items: flex-end;
  width: 100%;
  min-width: 0;
}

.filter-range-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.filter-range-item-label {
  font-size: 0.66rem;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
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

.unit-input::-webkit-outer-spin-button,
.unit-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.unit-input {
  -moz-appearance: textfield;
}

.no-spin-input::-webkit-outer-spin-button,
.no-spin-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.no-spin-input {
  -moz-appearance: textfield;
}

.filter-range-sep {
  width: 6px;
  flex-shrink: 0;
}

/* The native browser rendering of an empty time input's "--:--" segments
   looks rougher than the rest of the form (wrong font, harsh black icon) -
   these bring it in line with the surrounding inputs. */
.filter-range-item input[type='time'] {
  font-family: inherit;
  color: #333;
}

.filter-range-item input[type='time']::-webkit-datetime-edit {
  padding: 0 2px;
}

.filter-range-item input[type='time']::-webkit-calendar-picker-indicator {
  opacity: 0.5;
  cursor: pointer;
  border-radius: 3px;
  padding: 2px;
}

.filter-range-item input[type='time']::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
  background: #f4f4f4;
}

.tel-input-group {
  display: flex;
  gap: 4px;
  width: 100%;
  min-width: 0;
}

.tel-dial-select {
  flex: 0 0 auto;
  width: auto;
  max-width: 110px;
}

.tel-number-input {
  flex: 1;
  min-width: 0;
}

.company-readonly {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #f5f5f3;
  color: #555;
  box-sizing: border-box;
  font-size: 0.9rem;
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

.freight-distance-hint {
  font-size: 0.7rem;
  color: #999;
  font-style: italic;
}

.freight-add-textarea {
  resize: vertical;
  font-family: inherit;
}

.pl-comments-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.pl-char-count {
  font-size: 0.68rem;
  color: #aaa;
  white-space: nowrap;
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

.freight-add-cancel-btn {
  background-color: transparent;
  color: #999;
  border: 1px solid #ddd;
  padding: 0 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.freight-add-cancel-btn:hover {
  background-color: #eee;
}

@media (max-width: 900px) {
  .freight-filter-row.two-col,
  .freight-filter-row.three-col,
  .freight-filter-row.four-col {
    grid-template-columns: 1fr;
  }
}
</style>
