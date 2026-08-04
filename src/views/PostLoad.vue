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
import '@/assets/css/coursesaddcss.css'

const router = useRouter()

function createEmptyFreight() {
  return {
    name: '',
    from: { country: '', location: '' },
    to: { country: '', location: '' },
    loadingDate: { mode: '', start: '', end: '', dates: [] },
    vehicleType: '',
    bodyType: '',
    bodyCharacteristics: [],
    length: '',
    weight: '',
    mayContain: [],
    mayNotContain: [],
    company: '',
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
  console.log('User:', user.value)
  console.log('Is Admin:', isAdmin.value)

  if (!isAdmin.value) {
    console.log('Not admin, redirecting...')
    router.push('/courses')
  }
})

function resetForm() {
  newFreight.value = createEmptyFreight()
}

// The picker supports "Exact dates" (a set of specific days) and "Period" (a
// range). A single freight posting has one loading day/window, so this reduces
// whichever mode was used down to a single startDate/endDate pair.
function resolveLoadingDates() {
  const ld = newFreight.value.loadingDate
  if (ld.mode === 'exact') {
    const day = ld.dates[0] || ''
    return { startDate: day, endDate: day || undefined }
  }
  return { startDate: ld.start || '', endDate: ld.end || ld.start || undefined }
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
    const { startDate, endDate } = resolveLoadingDates()

    const freightData = {
      name: newFreight.value.name || undefined,
      fromCountry: newFreight.value.from.country,
      fromLocation: newFreight.value.from.location || undefined,
      toCountry: newFreight.value.to.country,
      toLocation: newFreight.value.to.location || undefined,
      startDate,
      endDate,
      vehicleType: newFreight.value.vehicleType || undefined,
      bodyType: newFreight.value.bodyType || undefined,
      bodyCharacteristics: newFreight.value.bodyCharacteristics.length
        ? newFreight.value.bodyCharacteristics
        : undefined,
      length: newFreight.value.length ? Number.parseFloat(newFreight.value.length) : undefined,
      weight: newFreight.value.weight ? Number.parseFloat(newFreight.value.weight) : undefined,
      mayContain: newFreight.value.mayContain.length ? newFreight.value.mayContain : undefined,
      mayNotContain: newFreight.value.mayNotContain.length
        ? newFreight.value.mayNotContain
        : undefined,
      company: newFreight.value.company || undefined,
      price: Number.parseFloat(newFreight.value.price),
      description: newFreight.value.description || undefined,
    }

    console.log('Sending freight data:', freightData)
    const response = await apiClient.post('/courses', freightData)
    console.log('Response:', response)

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
  <div class="course-add-outer-container">
    <div class="course-add-paper-block">
      <header class="course-add-header-section">
        <h1 class="course-add-page-title">ADD FREIGHT</h1>
        <button @click="goBack" class="course-add-back-btn">← Back</button>
      </header>

      <div class="course-add-body">
        <p v-if="user" class="course-add-role-info">
          Logged in as: <strong>Administraator</strong> ({{ user.name }})
        </p>

        <div v-if="successMessage" class="course-add-success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="course-add-error">
          {{ errorMessage }}
        </div>

        <div class="course-add-form">
          <div class="course-add-row">
            <CountryLocationField
              v-model="newFreight.from"
              label="From"
              :required="true"
              :allow-empty-country="false"
              location-placeholder="Loading ZIP / City"
            />
            <CountryLocationField
              v-model="newFreight.to"
              label="To"
              :required="true"
              :allow-empty-country="false"
              location-placeholder="Unloading ZIP / City"
            />
          </div>

          <div class="course-add-row">
            <LoadingDatePicker
              v-model="newFreight.loadingDate"
              label="Loading date *"
              :multiple-exact="false"
            />
          </div>

          <div class="course-add-row">
            <CheckboxDropdown
              v-model="newFreight.vehicleType"
              :options="vehicleTypes"
              :multiple="false"
              label="Vehicle type"
              placeholder="Select vehicle type"
            />
            <CheckboxDropdown
              v-model="newFreight.bodyType"
              :options="bodyTypes"
              :multiple="false"
              label="Body type"
              placeholder="Select body type"
            />
          </div>

          <div class="course-add-row">
            <CheckboxDropdown
              v-model="newFreight.bodyCharacteristics"
              :options="bodyCharacteristics"
              label="Body characteristics"
              placeholder="Select equipment/certificates"
            />
          </div>

          <div class="course-add-row">
            <div class="course-add-field">
              <label for="freight-length" class="course-add-label">Length (m)</label>
              <input
                id="freight-length"
                v-model.number="newFreight.length"
                type="number"
                step="0.1"
                placeholder="13.6"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>

            <div class="course-add-field">
              <label for="freight-weight" class="course-add-label">Weight (kg)</label>
              <input
                id="freight-weight"
                v-model.number="newFreight.weight"
                type="number"
                step="1"
                placeholder="5000"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>
          </div>

          <div class="course-add-row">
            <CheckboxDropdown
              v-model="newFreight.mayContain"
              :options="cargoTypes"
              label="May contain"
              placeholder="Goods this freight may be combined with"
            />
            <CheckboxDropdown
              v-model="newFreight.mayNotContain"
              :options="cargoTypes"
              label="May not contain"
              placeholder="Goods this freight may not be combined with"
            />
          </div>

          <div class="course-add-row">
            <div class="course-add-field">
              <label for="freight-company" class="course-add-label">Company</label>
              <input
                id="freight-company"
                v-model="newFreight.company"
                placeholder="Posting company"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>

            <div class="course-add-field">
              <label for="freight-price" class="course-add-label">Price (€) *</label>
              <input
                id="freight-price"
                v-model.number="newFreight.price"
                type="number"
                step="0.01"
                placeholder="0.00"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>
          </div>

          <div class="course-add-field">
            <label for="freight-name" class="course-add-label">Reference (optional)</label>
            <input
              id="freight-name"
              v-model="newFreight.name"
              placeholder="Short reference/title"
              :disabled="isLoading"
              class="course-add-input"
            />
          </div>

          <div class="course-add-field">
            <label for="freight-description" class="course-add-label">Description</label>
            <textarea
              id="freight-description"
              v-model="newFreight.description"
              placeholder="Cargo details, loading/unloading instructions..."
              rows="6"
              :disabled="isLoading"
              class="course-add-textarea"
            ></textarea>
          </div>

          <div class="course-add-actions">
            <button @click="createFreight" class="course-add-submit-btn" :disabled="isLoading">
              {{ isLoading ? 'Saving...' : 'Post freight' }}
            </button>
            <button @click="goBack" class="course-add-cancel-btn" :disabled="isLoading">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
