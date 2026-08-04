<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import CountryLocationField from '@/components/CountryLocationField.vue'
import CheckboxDropdown from '@/components/CheckboxDropdown.vue'
import LoadingDatePicker from '@/components/LoadingDatePicker.vue'
import { vehicleTypes } from '@/data/vehicleTypes'
import { bodyTypes } from '@/data/bodyTypes'
import { bodyCharacteristics } from '@/data/bodyCharacteristics'
import { cargoTypes } from '@/data/cargoTypes'
import { callingCodes } from '@/data/callingCodes'
import '@/assets/css/coursesviewcss.css'

const router = useRouter()

function createEmptyFreight() {
  return {
    name: '',
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

  isLoading.value = true

  try {
    const startDate = resolveDate(newFreight.value.loadingDate, false)
    const endDate = resolveDate(newFreight.value.unloadingDate, true) || undefined

    const freightData = {
      name: newFreight.value.name || undefined,
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
                <input v-model="newFreight.loadingTimeStart" type="time" class="courses-view-input" />
                <span class="filter-range-sep"></span>
                <input v-model="newFreight.loadingTimeEnd" type="time" class="courses-view-input" />
              </div>
            </div>
            <LoadingDatePicker
              v-model="newFreight.unloadingDate"
              label="Unloading date"
            />
            <div class="filter-box">
              <label class="filter-label">Unloading time</label>
              <div class="filter-range-group">
                <input v-model="newFreight.unloadingTimeStart" type="time" class="courses-view-input" />
                <span class="filter-range-sep"></span>
                <input v-model="newFreight.unloadingTimeEnd" type="time" class="courses-view-input" />
              </div>
            </div>
          </div>

          <div class="freight-filter-row four-col">
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
              <span class="freight-distance-hint">Distance &amp; €/km will show here once the map is added.</span>
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
                  v-model="newFreight.contactPhoneNumber"
                  placeholder="5555 5555"
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
          </div>

          <div class="filter-box">
            <label class="filter-label">Comments</label>
            <textarea
              v-model="newFreight.description"
              placeholder="Cargo details, loading/unloading instructions..."
              rows="6"
              :disabled="isLoading"
              class="courses-view-input freight-add-textarea"
            ></textarea>
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
