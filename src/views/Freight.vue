<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import '@/assets/css/coursesviewcss.css'

const router = useRouter()

// Courses list
const courses = ref([])
const totalPages = ref(1)

// Filter + pagination state
const filter = ref({
  name: '',
  category: '',
  startDate: '',
  endDate: '',
  page: 0,
  size: 5,
  sortBy: 'name',
  sortDir: 'asc',
})

// Decode JWT token to get user info
function getUserFromToken() {
  const token = localStorage.getItem('jwt')
  if (!token) {
    return null
  }

  try {
    const parts = token.split('.')
    if (parts.length < 2) {
      return null // invalid token format
    }

    const payload = parts[1]
    const decoded = JSON.parse(atob(payload))

    return {
      name: decoded.sub || null,
      userId: decoded.userId || null,
      role: decoded.roles?.[0] || null,
    }
  } catch (e) {
    console.error('Failed to decode token:', e)
    return null
  }
}

const user = computed(() => getUserFromToken())
const isLoggedIn = computed(() => user.value !== null)
const isAdmin = computed(() => user.value?.role === 'ROLE_ADMIN')
const userId = computed(() => user.value?.userId)

// Load courses with filter + pagination
async function loadCoursesFiltered() {
  try {
    // Teeme kopia filtrist, aga eemaldame sealt sortBy ja sortDir
    // ning asendame need Springile sobiva 'sort' parameetriga
    const { sortBy, sortDir, ...restOfFilters } = filter.value

    const params = {
      ...restOfFilters,
      // Spring Pageable ootab parameetrit 'sort' kujul "väljaNimi,suund"
      sort: `${sortBy},${sortDir}`,
    }

    if (isLoggedIn.value) params.userId = userId.value

    console.log('Päringu parameetrid Springile:', params)

    const res = await apiClient.get('/courses/search', { params })
    courses.value = res.data.content
    totalPages.value = res.data.totalPages
  } catch (error) {
    console.error('Error loading courses:', error)
  }
}

// Register / unregister
async function register(courseId) {
  try {
    await apiClient.post(`/courses/${courseId}/register?userId=${userId.value}`)
    loadCoursesFiltered()
  } catch (error) {
    console.error(error)
  }
}

async function unregister(courseId) {
  try {
    await apiClient.post(`/courses/${courseId}/unregister`)
    loadCoursesFiltered()
  } catch (error) {
    console.error(error)
  }
}

// Pagination
function nextPage() {
  if (filter.value.page < totalPages.value - 1) {
    filter.value.page++
    loadCoursesFiltered()
  }
}
function prevPage() {
  if (filter.value.page > 0) {
    filter.value.page--
    loadCoursesFiltered()
  }
}

// Navigate to add course page
function goToAddCourse() {
  router.push('/courses/add')
}

// Initial load
onMounted(loadCoursesFiltered)
</script>

<template>
  <div class="courses-view-outer-container">
    <div class="courses-view-paper-block">
      <header class="courses-view-header-section">
        <h1 class="courses-view-page-title">FREIGHT</h1>
        <button v-if="isAdmin" @click="goToAddCourse" class="courses-view-add-btn">
          + Add freight
        </button>
      </header>

      <div class="courses-view-body">
        <div class="courses-view-status-bar">
          <p v-if="isLoggedIn" class="courses-view-role-info">
            Logged in as: <strong>{{ isAdmin ? 'Administraator' : 'Kasutaja' }}</strong> ({{
              user.name
            }})
          </p>
          <p v-else class="courses-view-role-info">
            <strong>Külalisvaade</strong> — logi sisse, et registreeruda koolitustele.
          </p>
        </div>

        <section class="courses-view-filter-area">
          <h3 class="courses-view-subtitle">Find freight</h3>
          <div class="courses-view-filter-grid">
            <input v-model="filter.name" placeholder="Name" class="courses-view-input" />
            <input v-model="filter.category" placeholder="Category" class="courses-view-input" />
            <div class="courses-view-date-group">
              <input
                v-model="filter.startDate"
                type="date"
                title="Alguskuupäev"
                class="courses-view-input"
              />
              <input
                v-model="filter.endDate"
                type="date"
                title="Lõppkuupäev"
                class="courses-view-input"
              />
            </div>
            <div class="courses-view-sort-group">
              <select v-model="filter.sortBy" class="courses-view-select">
                <option value="name">Name</option>
                <option value="startDate">Date</option>
              </select>
              <select v-model="filter.sortDir" class="courses-view-select">
                <option value="asc">Ascending</option>
                <option value="desc">Decending</option>
              </select>
            </div>
            <button @click="loadCoursesFiltered" class="courses-view-search-btn">Find</button>
          </div>
        </section>

        <div class="courses-view-pagination">
          <button @click="prevPage" :disabled="filter.page === 0" class="courses-view-page-btn">
            Last
          </button>
          <span class="courses-view-page-text">Page {{ filter.page + 1 }} / {{ totalPages }}</span>
          <button
            @click="nextPage"
            :disabled="filter.page >= totalPages - 1"
            class="courses-view-page-btn"
          >
            Next
          </button>
        </div>

        <div class="courses-view-list">
          <div v-for="c in courses" :key="c.id" class="courses-view-card">
            <div class="courses-view-card-header">
              <h3 class="courses-view-card-title">{{ c.name }}</h3>
              <span class="courses-view-price-tag">{{ c.price }} €</span>
            </div>

            <div class="courses-view-card-details">
              <p><strong>Category:</strong> {{ c.category }}</p>
              <p><strong>Kuupäev:</strong> {{ c.startDate || 'Määramata' }}</p>
              <p class="courses-view-description">{{ c.description }}</p>
            </div>

            <div class="courses-view-card-actions">
              <template v-if="isLoggedIn && !isAdmin">
                <button v-if="!c.registered" @click="register(c.id)" class="courses-view-reg-btn">
                  Registreeru
                </button>
                <button v-else @click="unregister(c.id)" class="courses-view-unreg-btn">
                  Tühista registreerimine
                </button>
              </template>

              <p v-if="!isLoggedIn" class="courses-view-guest-hint">
                <em>Logi sisse registreerumiseks</em>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
