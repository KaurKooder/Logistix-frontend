<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import '@/assets/css/coursesaddcss.css'

const router = useRouter()

// Admin create course
const newCourse = ref({
  name: '',
  category: '',
  description: '',
  price: '',
  date: '',
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

async function createCourse() {
  errorMessage.value = ''
  successMessage.value = ''

  if (
    !newCourse.value.name ||
    !newCourse.value.category ||
    !newCourse.value.description ||
    !newCourse.value.price ||
    !newCourse.value.date
  ) {
    errorMessage.value = 'Palun täida kõik väljad!'
    return
  }

  isLoading.value = true

  try {
    const courseData = {
      name: newCourse.value.name,
      category: newCourse.value.category,
      description: newCourse.value.description,
      price: Number.parseFloat(newCourse.value.price),
      startDate: newCourse.value.date,
      endDate: newCourse.value.date,
    }

    console.log('Sending course data:', courseData)
    const response = await apiClient.post('/courses', courseData)
    console.log('Response:', response)

    successMessage.value = 'Koolitus edukalt lisatud!'

    // Reset form
    newCourse.value = { name: '', category: '', description: '', price: '', date: '' }

    // Redirect back to courses after 2 seconds
    setTimeout(() => {
      router.push('/courses')
    }, 2000)
  } catch (error) {
    console.error('Error creating course:', error)
    errorMessage.value = error.response?.data?.message || 'Viga koolituse loomisel!'
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
        <h1 class="course-add-page-title">ADD ORDER</h1>
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
          <div class="course-add-field">
            <label for="course-name" class="course-add-label">From *</label>
            <input
              id="course-name"
              v-model="newCourse.name"
              placeholder="Enter starting location"
              :disabled="isLoading"
              class="course-add-input"
            />
          </div>

          <div class="course-add-field">
            <label for="course-category" class="course-add-label">To *</label>
            <input
              id="course-category"
              v-model="newCourse.category"
              placeholder="Enter destination"
              :disabled="isLoading"
              class="course-add-input"
            />
          </div>

          <div class="course-add-field">
            <label for="course-description" class="course-add-label">Kirjeldus *</label>
            <textarea
              id="course-description"
              v-model="newCourse.description"
              placeholder="Koolituse põhjalik kirjeldus..."
              rows="6"
              :disabled="isLoading"
              class="course-add-textarea"
            ></textarea>
          </div>

          <div class="course-add-row">
            <div class="course-add-field">
              <label for="course-price" class="course-add-label">Price (€) *</label>
              <input
                id="course-price"
                v-model.number="newCourse.price"
                type="number"
                step="0.01"
                placeholder="0.00"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>

            <div class="course-add-field">
              <label for="course-date" class="course-add-label">Starting time *</label>
              <input
                id="course-date"
                v-model="newCourse.date"
                type="date"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>
          </div>

          <div class="course-add-actions">
            <button @click="createCourse" class="course-add-submit-btn" :disabled="isLoading">
              {{ isLoading ? 'Saving...' : 'Place order' }}
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
