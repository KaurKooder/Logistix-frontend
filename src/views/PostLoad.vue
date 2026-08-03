<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import '@/assets/css/coursesaddcss.css'

const router = useRouter()

// Admin create freight posting
const newFreight = ref({
  name: '',
  fromCountry: '',
  toCountry: '',
  startDate: '',
  endDate: '',
  vehicleType: '',
  bodyType: '',
  length: '',
  weight: '',
  mayContain: '',
  mayNotContain: '',
  company: '',
  price: '',
  description: '',
})

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
  newFreight.value = {
    name: '',
    fromCountry: '',
    toCountry: '',
    startDate: '',
    endDate: '',
    vehicleType: '',
    bodyType: '',
    length: '',
    weight: '',
    mayContain: '',
    mayNotContain: '',
    company: '',
    price: '',
    description: '',
  }
}

async function createFreight() {
  errorMessage.value = ''
  successMessage.value = ''

  if (
    !newFreight.value.fromCountry ||
    !newFreight.value.toCountry ||
    !newFreight.value.startDate ||
    !newFreight.value.price
  ) {
    errorMessage.value = 'Palun täida kohustuslikud väljad: From, To, Loading date, Price!'
    return
  }

  isLoading.value = true

  try {
    const freightData = {
      name: newFreight.value.name || undefined,
      fromCountry: newFreight.value.fromCountry,
      toCountry: newFreight.value.toCountry,
      startDate: newFreight.value.startDate,
      endDate: newFreight.value.endDate || undefined,
      vehicleType: newFreight.value.vehicleType || undefined,
      bodyType: newFreight.value.bodyType || undefined,
      length: newFreight.value.length ? Number.parseFloat(newFreight.value.length) : undefined,
      weight: newFreight.value.weight ? Number.parseFloat(newFreight.value.weight) : undefined,
      mayContain: newFreight.value.mayContain || undefined,
      mayNotContain: newFreight.value.mayNotContain || undefined,
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
            <div class="course-add-field">
              <label for="freight-from" class="course-add-label">From *</label>
              <input
                id="freight-from"
                v-model="newFreight.fromCountry"
                placeholder="Loading country"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>

            <div class="course-add-field">
              <label for="freight-to" class="course-add-label">To *</label>
              <input
                id="freight-to"
                v-model="newFreight.toCountry"
                placeholder="Unloading country"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>
          </div>

          <div class="course-add-row">
            <div class="course-add-field">
              <label for="freight-start" class="course-add-label">Loading date *</label>
              <input
                id="freight-start"
                v-model="newFreight.startDate"
                type="date"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>

            <div class="course-add-field">
              <label for="freight-end" class="course-add-label">Delivery date</label>
              <input
                id="freight-end"
                v-model="newFreight.endDate"
                type="date"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>
          </div>

          <div class="course-add-row">
            <div class="course-add-field">
              <label for="freight-vehicle" class="course-add-label">Vehicle type</label>
              <input
                id="freight-vehicle"
                v-model="newFreight.vehicleType"
                placeholder="e.g. Tautliner"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>

            <div class="course-add-field">
              <label for="freight-body" class="course-add-label">Body type</label>
              <input
                id="freight-body"
                v-model="newFreight.bodyType"
                placeholder="e.g. Curtainsider"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>
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

          <div class="course-add-field">
            <label for="freight-may-contain" class="course-add-label">May contain</label>
            <input
              id="freight-may-contain"
              v-model="newFreight.mayContain"
              placeholder="Goods this freight may be combined with"
              :disabled="isLoading"
              class="course-add-input"
            />
          </div>

          <div class="course-add-field">
            <label for="freight-may-not-contain" class="course-add-label">May not contain</label>
            <input
              id="freight-may-not-contain"
              v-model="newFreight.mayNotContain"
              placeholder="Goods this freight may not be combined with"
              :disabled="isLoading"
              class="course-add-input"
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
