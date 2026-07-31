<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import apiClient from '@/services/api'
import '@/assets/css/coursesviewcss.css'

const router = useRouter()
const route = useRoute()

// Turvaline tokeni lugemine
function getUserFromToken() {
  const token = localStorage.getItem('jwt')
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const payload = JSON.parse(atob(parts[1]))

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('jwt')
      return null
    }

    return {
      name: payload.sub || null,
      userId: payload.userId || null,
      role: payload.roles?.[0] || null,
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

// --- MITME AKNA / TABI HALDUS & TRANSPORDI FILTRID ---
const tabs = ref([
  {
    id: 'tab-1',
    title: 'Otsing 1',
    courses: [],
    totalPages: 1,
    filter: {
      fromCountry: '',
      fromRadius: '',
      toCountry: '',
      toRadius: '',
      startDate: '',
      endDate: '',
      vehicleType: '',
      bodyType: '',
      minLength: '',
      maxLength: '',
      minWeight: '',
      maxWeight: '',
      mayContain: '',
      mayNotContain: '',
      company: '',
      page: 0,
      size: 5,
      sortBy: 'startDate',
      sortDir: 'asc',
    },
  },
])

const activeTabId = ref(tabs.value[0].id)

const activeTab = computed(() => {
  return tabs.value.find((t) => t.id === activeTabId.value) || tabs.value[0]
})

function addNewTab() {
  const newId = 'tab-' + Date.now()
  tabs.value.push({
    id: newId,
    title: `Otsing ${tabs.value.length + 1}`,
    courses: [],
    totalPages: 1,
    filter: {
      fromCountry: '',
      fromRadius: '',
      toCountry: '',
      toRadius: '',
      startDate: '',
      endDate: '',
      vehicleType: '',
      bodyType: '',
      minLength: '',
      maxLength: '',
      minWeight: '',
      maxWeight: '',
      mayContain: '',
      mayNotContain: '',
      company: '',
      page: 0,
      size: 5,
      sortBy: 'startDate',
      sortDir: 'asc',
    },
  })
  activeTabId.value = newId
  updateUrl()
}

function closeTab(id, event) {
  event.stopPropagation()
  if (tabs.value.length === 1) return

  const index = tabs.value.findIndex((t) => t.id === id)
  tabs.value.splice(index, 1)

  if (activeTabId.value === id) {
    activeTabId.value = tabs.value[Math.max(0, index - 1)].id
  }
  updateUrl()
}

function updateUrl() {
  router.replace({
    path: route.path,
    query: { ...route.query, tabId: activeTabId.value },
  })
}

async function loadCoursesForTab(tab) {
  try {
    const { sortBy, sortDir, ...restOfFilters } = tab.filter
    const params = {
      ...restOfFilters,
      sort: `${sortBy},${sortDir}`,
    }

    if (isLoggedIn.value && userId.value) {
      params.userId = userId.value
    }

    const res = await apiClient.get('/courses/search', { params })
    tab.courses = res.data.content || []
    tab.totalPages = res.data.totalPages || 1
  } catch (error) {
    console.error('Error loading freight:', error)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jwt')
    }
  }
}

function searchActiveTab() {
  activeTab.value.filter.page = 0
  loadCoursesForTab(activeTab.value)
}

function nextPage() {
  if (activeTab.value.filter.page < activeTab.value.totalPages - 1) {
    activeTab.value.filter.page++
    loadCoursesForTab(activeTab.value)
  }
}
function prevPage() {
  if (activeTab.value.filter.page > 0) {
    activeTab.value.filter.page--
    loadCoursesForTab(activeTab.value)
  }
}

async function register(courseId) {
  if (!isLoggedIn.value) {
    alert('Palun logi sisse!')
    return
  }
  try {
    await apiClient.post(`/courses/${courseId}/register?userId=${userId.value}`)
    loadCoursesForTab(activeTab.value)
  } catch (error) {
    console.error(error)
  }
}

async function unregister(courseId) {
  try {
    await apiClient.post(`/courses/${courseId}/unregister`)
    loadCoursesForTab(activeTab.value)
  } catch (error) {
    console.error(error)
  }
}

function goToAddCourse() {
  router.push('/courses/add')
}

watch(
  () => route.query.tabId,
  (newId) => {
    if (newId && tabs.value.some((t) => t.id === newId)) {
      activeTabId.value = newId
    }
  },
)

onMounted(() => {
  if (route.query.tabId && tabs.value.some((t) => t.id === route.query.tabId)) {
    activeTabId.value = route.query.tabId
  }
  loadCoursesForTab(activeTab.value)
})
</script>

<template>
  <div class="courses-view-outer-container">
    <div class="courses-view-paper-block">
      <!-- Mitme akna / tabide riba -->
      <div class="multi-tab-header">
        <div class="tabs-container">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="search-tab"
            :class="{ active: tab.id === activeTabId }"
            @click="activeTabId = tab.id,
            updateUrl()
            "
          >
            <span class="tab-title">{{ tab.title }}</span>
            <button
              v-if="tabs.length > 1"
              @click.stop="(e) => closeTab(tab.id, e)"
              class="tab-close-btn"
            >
              ✕
            </button>
          </div>
        </div>
        <button @click="addNewTab" class="tab-add-btn" title="Ava uus otsinguaken">+</button>
      </div>

      <header class="courses-view-header-section">
        <h1 class="courses-view-page-title">FREIGHT - {{ activeTab.title }}</h1>
        <button v-if="isAdmin" @click="goToAddCourse" class="courses-view-add-btn">
          + Add freight
        </button>
      </header>

      <div class="courses-view-body">
        <div class="courses-view-status-bar">
          <p v-if="isLoggedIn && user" class="courses-view-role-info">
            Logged in as: <strong>{{ isAdmin ? 'Administraator' : 'Kasutaja' }}</strong> ({{
              user.name
            }})
          </p>
          <p v-else class="courses-view-role-info">
            <strong>Külalisvaade</strong> — logi sisse, et registreeruda.
          </p>
        </div>

        <!-- Filtrid -->
        <section class="freight-filter-section">
          <div class="freight-filter-row">
            <div class="filter-box">
              <label class="filter-label">FROM</label>
              <div class="filter-inline-group">
                <input
                  v-model="activeTab.filter.fromCountry"
                  placeholder="Country"
                  class="courses-view-input"
                />
                <input
                  v-model="activeTab.filter.fromRadius"
                  placeholder="Radius"
                  class="courses-view-input small-input"
                />
              </div>
            </div>

            <div class="filter-box">
              <label class="filter-label">TO</label>
              <div class="filter-inline-group">
                <input
                  v-model="activeTab.filter.toCountry"
                  placeholder="Country"
                  class="courses-view-input"
                />
                <input
                  v-model="activeTab.filter.toRadius"
                  placeholder="Radius"
                  class="courses-view-input small-input"
                />
              </div>
            </div>

            <div class="filter-box">
              <label class="filter-label">Loading date</label>
              <div class="filter-inline-group">
                <input
                  v-model="activeTab.filter.startDate"
                  type="date"
                  class="courses-view-input"
                />
                <input v-model="activeTab.filter.endDate" type="date" class="courses-view-input" />
              </div>
            </div>

            <div class="filter-box">
              <label class="filter-label">Vehicle & Body type</label>
              <div class="filter-inline-group">
                <input
                  v-model="activeTab.filter.vehicleType"
                  placeholder="Vehicle"
                  class="courses-view-input"
                />
                <input
                  v-model="activeTab.filter.bodyType"
                  placeholder="Body"
                  class="courses-view-input"
                />
              </div>
            </div>
          </div>

          <div class="freight-filter-row secondary-row">
            <div class="filter-box">
              <label class="filter-label">Length (m)</label>
              <div class="filter-range-group">
                <input
                  v-model="activeTab.filter.minLength"
                  placeholder="Min"
                  class="courses-view-input"
                />
                <span>-</span>
                <input
                  v-model="activeTab.filter.maxLength"
                  placeholder="Max"
                  class="courses-view-input"
                />
              </div>
            </div>

            <div class="filter-box">
              <label class="filter-label">Weight (kg)</label>
              <div class="filter-range-group">
                <input
                  v-model="activeTab.filter.minWeight"
                  placeholder="Min"
                  class="courses-view-input"
                />
                <span>-</span>
                <input
                  v-model="activeTab.filter.maxWeight"
                  placeholder="Max"
                  class="courses-view-input"
                />
              </div>
            </div>

            <div class="filter-box">
              <label class="filter-label">May contain</label>
              <input
                v-model="activeTab.filter.mayContain"
                placeholder="May contain"
                class="courses-view-input"
              />
            </div>

            <div class="filter-box">
              <label class="filter-label">May not contain</label>
              <input
                v-model="activeTab.filter.mayNotContain"
                placeholder="May not contain"
                class="courses-view-input"
              />
            </div>

            <div class="filter-box">
              <label class="filter-label">Company</label>
              <input
                v-model="activeTab.filter.company"
                placeholder="Company"
                class="courses-view-input"
              />
            </div>

            <button @click="searchActiveTab" class="courses-view-search-btn find-action-btn">
              Find
            </button>
          </div>
        </section>

        <div class="courses-view-pagination">
          <button
            @click="prevPage"
            :disabled="activeTab.filter.page === 0"
            class="courses-view-page-btn"
          >
            Last
          </button>
          <span class="courses-view-page-text">
            Page {{ activeTab.filter.page + 1 }} / {{ activeTab.totalPages }}
          </span>
          <button
            @click="nextPage"
            :disabled="activeTab.filter.page >= activeTab.totalPages - 1"
            class="courses-view-page-btn"
          >
            Next
          </button>
        </div>

        <div class="courses-view-list">
          <div v-for="c in activeTab.courses" :key="c.id" class="courses-view-card">
            <div class="courses-view-card-header">
              <h3 class="courses-view-card-title">{{ c.name }}</h3>
              <span class="courses-view-price-tag">{{ c.price }} €</span>
            </div>

            <div class="courses-view-card-details">
              <p>
                <strong>Marsruut:</strong> {{ c.fromCountry || '?' }} ➔ {{ c.toCountry || '?' }}
              </p>
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

<style scoped>
.multi-tab-header {
  display: flex;
  align-items: center;
  background: #f4f4f4;
  border-bottom: 1px solid #ddd;
  padding: 6px 10px;
  gap: 8px;
  overflow-x: auto;
}
.tabs-container {
  display: flex;
  gap: 6px;
  flex: 1;
}
.search-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #e0e0e0;
  border: 1px solid #ccc;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  font-size: 0.85rem;
  cursor: pointer;
  color: #333;
}
.search-tab.active {
  background: #fff;
  border-color: #222;
  font-weight: 600;
  border-bottom: 2px solid #fff;
}
.tab-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: #666;
  padding: 2px 4px;
  border-radius: 50%;
}
.tab-close-btn:hover {
  background: #ddd;
  color: #000;
}
.tab-add-btn {
  background: #27ae60;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tab-add-btn:hover {
  background: #219653;
}

.freight-filter-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fdfdfd;
  border: 1px solid #e0e0e0;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  box-sizing: border-box;
  width: 100%;
}

.freight-filter-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.secondary-row {
  grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr auto;
  align-items: end;
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

.filter-inline-group,
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

.small-input {
  max-width: 75px;
}

.find-action-btn {
  height: 38px;
  padding: 0 16px;
  white-space: nowrap;
}
</style>
