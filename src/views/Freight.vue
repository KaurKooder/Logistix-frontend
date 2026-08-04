<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import apiClient from '@/services/api'
import CountryLocationField from '@/components/CountryLocationField.vue'
import CheckboxDropdown from '@/components/CheckboxDropdown.vue'
import LoadingDatePicker from '@/components/LoadingDatePicker.vue'
import { vehicleTypes } from '@/data/vehicleTypes'
import { bodyTypes } from '@/data/bodyTypes'
import { bodyCharacteristics } from '@/data/bodyCharacteristics'
import { cargoTypes } from '@/data/cargoTypes'
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
function createDefaultFilter() {
  return {
    from: { mode: 'radius', country: '', countries: [], location: '', radius: '' },
    to: { mode: 'radius', country: '', countries: [], location: '', radius: '' },
    loadingDate: { mode: '', start: '', end: '', dates: [] },
    vehicleTypes: [],
    bodyTypes: [],
    bodyCharacteristics: [],
    minLength: '',
    maxLength: '',
    minWeight: '',
    maxWeight: '',
    mayContain: [],
    mayNotContain: [],
    company: '',
    page: 0,
    size: 10,
    sortBy: 'startDate',
    sortDir: 'asc',
  }
}

const tabs = ref([
  {
    id: 'tab-1',
    title: 'Otsing 1',
    courses: [],
    totalPages: 1,
    showAdvanced: false,
    expandedId: null,
    muted: false,
    loadingMore: false,
    filter: createDefaultFilter(),
  },
])

const activeTabId = ref(tabs.value[0].id)

const activeTab = computed(() => {
  return tabs.value.find((t) => t.id === activeTabId.value) || tabs.value[0]
})

// --- Tab title inline rename (double-click to edit) ---
const editingTabId = ref(null)

function startEditTab(tab) {
  editingTabId.value = tab.id
}

function finishEditTab(tab) {
  if (!tab.title || !tab.title.trim()) {
    tab.title = 'Otsing'
  }
  editingTabId.value = null
}

function toggleTabMute(tab) {
  tab.muted = !tab.muted
}

function addNewTab() {
  const newId = 'tab-' + Date.now()
  tabs.value.push({
    id: newId,
    title: `Otsing ${tabs.value.length + 1}`,
    courses: [],
    totalPages: 1,
    showAdvanced: false,
    expandedId: null,
    muted: false,
    loadingMore: false,
    filter: createDefaultFilter(),
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

async function loadCoursesForTab(tab, { append = false } = {}) {
  try {
    const f = tab.filter

    // "Radius" mode searches a single country (+ optional location/radius);
    // "Country selection" mode searches across a whole set of countries at once.
    function countryFilterParams(side, locationKey, radiusKey) {
      if (side.mode === 'countries') {
        return {
          countries: side.countries?.length ? side.countries : undefined,
        }
      }
      return {
        countries: side.country ? [side.country] : undefined,
        [locationKey]: side.location || undefined,
        [radiusKey]: side.radius || undefined,
      }
    }

    const fromParams = countryFilterParams(f.from, 'fromLocation', 'fromRadius')
    const toParams = countryFilterParams(f.to, 'toLocation', 'toRadius')

    const params = {
      fromCountries: fromParams.countries,
      fromLocation: fromParams.fromLocation,
      fromRadius: fromParams.fromRadius,
      toCountries: toParams.countries,
      toLocation: toParams.toLocation,
      toRadius: toParams.toRadius,
      vehicleTypes: f.vehicleTypes.length ? f.vehicleTypes : undefined,
      bodyTypes: f.bodyTypes.length ? f.bodyTypes : undefined,
      bodyCharacteristics: f.bodyCharacteristics.length ? f.bodyCharacteristics : undefined,
      minLength: f.minLength || undefined,
      maxLength: f.maxLength || undefined,
      minWeight: f.minWeight || undefined,
      maxWeight: f.maxWeight || undefined,
      mayContain: f.mayContain.length ? f.mayContain : undefined,
      mayNotContain: f.mayNotContain.length ? f.mayNotContain : undefined,
      company: f.company || undefined,
      page: f.page,
      size: f.size,
      sort: `${f.sortBy},${f.sortDir}`,
    }

    if (f.loadingDate.mode === 'exact' && f.loadingDate.dates.length) {
      params.loadingDates = f.loadingDate.dates
    } else {
      params.startDate = f.loadingDate.start || undefined
      params.endDate = f.loadingDate.end || undefined
    }

    if (isLoggedIn.value && userId.value) {
      params.userId = userId.value
    }

    const res = await apiClient.get('/courses/search', { params })
    const newCourses = res.data.content || []
    tab.courses = append ? [...tab.courses, ...newCourses] : newCourses
    tab.totalPages = res.data.totalPages || 1
  } catch (error) {
    console.error('Error loading freight:', error)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jwt')
    }
  }
}

// Called by the IntersectionObserver when the sentinel at the bottom of the
// results list scrolls into view - loads the next page and appends it.
async function loadMoreForTab(tab) {
  if (!tab || tab.loadingMore) return
  if (tab.filter.page + 1 >= tab.totalPages) return
  tab.loadingMore = true
  tab.filter.page += 1
  await loadCoursesForTab(tab, { append: true })
  tab.loadingMore = false
}

function searchActiveTab() {
  activeTab.value.filter.page = 0
  loadCoursesForTab(activeTab.value)
}

function toggleSort(tab, field) {
  if (tab.filter.sortBy === field) {
    tab.filter.sortDir = tab.filter.sortDir === 'asc' ? 'desc' : 'asc'
  } else {
    tab.filter.sortBy = field
    tab.filter.sortDir = 'asc'
  }
  tab.filter.page = 0
  loadCoursesForTab(tab)
}

function toggleRow(tab, id) {
  tab.expandedId = tab.expandedId === id ? null : id
  // Switching to a different posting (or closing one) always jumps back to Info.
  detailTab.value = 'info'
}

// The posting currently shown in the detail sidebar (null when nothing selected).
const selectedCourse = computed(() => {
  return activeTab.value.courses.find((c) => c.id === activeTab.value.expandedId) || null
})

// Which sub-tab (Info / Map / Calculate) the detail sidebar is showing.
const detailTab = ref('info')

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

// e.g. "EE-Tallinn" - country code and location joined with a hyphen, not a space.
function formatPlace(country, location) {
  if (!country) return '?'
  return location ? `${country}-${location}` : country
}

// How long ago a posting was created, e.g. "45 min", "2h>", "1 day 1h>".
// Rounds UP to the next whole unit (hence the ">") so the label always reads
// as "no older than X", never overstating the posting's age.
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

function formatLength(len) {
  return len != null && len !== '' ? `${len} m` : ''
}

function formatWeight(weight) {
  return weight != null && weight !== '' ? `${weight} kg` : ''
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

// --- Infinite scroll: a sentinel div sits right after the results table.
// When it scrolls into view, load the next page for whichever tab is active. ---
const sentinelEl = ref(null)
let scrollObserver = null

function setupScrollObserver() {
  scrollObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        loadMoreForTab(activeTab.value)
      }
    },
    { rootMargin: '250px' },
  )
  if (sentinelEl.value) scrollObserver.observe(sentinelEl.value)
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
  nextTick(() => setupScrollObserver())
})

onUnmounted(() => {
  scrollObserver?.disconnect()
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
            <input
              v-if="editingTabId === tab.id"
              v-model="tab.title"
              class="tab-title-input"
              @click.stop
              @blur="finishEditTab(tab)"
              @keyup.enter="finishEditTab(tab)"
            />
            <span
              v-else
              class="tab-title"
              @dblclick.stop="startEditTab(tab)"
              >{{ tab.title }}</span
            >
            <button
              type="button"
              class="tab-notif-btn"
              :class="{ muted: tab.muted }"
              :title="tab.muted ? 'Notifications muted' : 'Notifications on'"
              @click.stop="toggleTabMute(tab)"
            >
              {{ tab.muted ? '🔕' : '🔔' }}
            </button>
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

      <div class="courses-view-body">
        <!-- Filtrid -->
        <section class="freight-filter-section">
          <div class="freight-filter-row">
            <CountryLocationField
              v-model="activeTab.filter.from"
              label="FROM"
              show-radius
              allow-multi-country
            />
            <CountryLocationField
              v-model="activeTab.filter.to"
              label="TO"
              show-radius
              allow-multi-country
            />

            <LoadingDatePicker v-model="activeTab.filter.loadingDate" />

            <div class="filter-box">
              <label class="filter-label">Vehicle and body type</label>
              <div class="vb-group">
                <CheckboxDropdown
                  v-model="activeTab.filter.vehicleTypes"
                  :options="vehicleTypes"
                  placeholder="Vehicle"
                />
                <CheckboxDropdown
                  v-model="activeTab.filter.bodyTypes"
                  :options="bodyTypes"
                  placeholder="Body"
                />
              </div>
            </div>
          </div>

          <div class="advanced-toggle-row">
            <button
              type="button"
              class="advanced-toggle-btn"
              @click="activeTab.showAdvanced = !activeTab.showAdvanced"
            >
              Advanced search {{ activeTab.showAdvanced ? '▲' : '▼' }}
            </button>
          </div>

          <template v-if="activeTab.showAdvanced">
            <div class="freight-filter-row secondary-row">
              <div class="filter-box">
                <label class="filter-label">Length</label>
                <div class="filter-range-group">
                  <div class="unit-input-group">
                    <input
                      v-model="activeTab.filter.minLength"
                      type="number"
                      min="0"
                      inputmode="numeric"
                      placeholder="Min"
                      class="courses-view-input unit-input"
                    />
                    <span class="unit-suffix">m</span>
                  </div>
                  <span>-</span>
                  <div class="unit-input-group">
                    <input
                      v-model="activeTab.filter.maxLength"
                      type="number"
                      min="0"
                      inputmode="numeric"
                      placeholder="Max"
                      class="courses-view-input unit-input"
                    />
                    <span class="unit-suffix">m</span>
                  </div>
                </div>
              </div>

              <div class="filter-box">
                <label class="filter-label">Weight</label>
                <div class="filter-range-group">
                  <div class="unit-input-group">
                    <input
                      v-model="activeTab.filter.minWeight"
                      type="number"
                      min="0"
                      inputmode="numeric"
                      placeholder="Min"
                      class="courses-view-input unit-input"
                    />
                    <span class="unit-suffix">kg</span>
                  </div>
                  <span>-</span>
                  <div class="unit-input-group">
                    <input
                      v-model="activeTab.filter.maxWeight"
                      type="number"
                      min="0"
                      inputmode="numeric"
                      placeholder="Max"
                      class="courses-view-input unit-input"
                    />
                    <span class="unit-suffix">kg</span>
                  </div>
                </div>
              </div>

              <CheckboxDropdown
                v-model="activeTab.filter.bodyCharacteristics"
                :options="bodyCharacteristics"
                label="Body characteristics"
                placeholder="Any characteristics"
              />
            </div>

            <div class="freight-filter-row secondary-row">
              <CheckboxDropdown
                v-model="activeTab.filter.mayContain"
                :options="cargoTypes"
                label="May contain"
                placeholder="Any goods"
              />
              <CheckboxDropdown
                v-model="activeTab.filter.mayNotContain"
                :options="cargoTypes"
                label="May not contain"
                placeholder="No restriction"
              />

              <div class="filter-box">
                <label class="filter-label">Company</label>
                <input
                  v-model="activeTab.filter.company"
                  placeholder="Company"
                  class="courses-view-input"
                />
              </div>
            </div>
          </template>

          <div class="find-row">
            <button @click="searchActiveTab" class="courses-view-search-btn find-action-btn">
              Find
            </button>
          </div>
        </section>

        <div class="freight-results-layout">
          <div class="freight-list-col">
            <div class="freight-table-wrap">
              <table class="freight-table">
                <thead>
                  <tr>
                    <th class="freight-col-arrow"></th>
                    <th>Age</th>
                    <th class="sortable" @click="toggleSort(activeTab, 'startDate')">
                      Date
                      <span v-if="activeTab.filter.sortBy === 'startDate'" class="sort-arrow">{{
                        activeTab.filter.sortDir === 'asc' ? '▲' : '▼'
                      }}</span>
                    </th>
                    <th>Trip</th>
                    <th>KM</th>
                    <th class="sortable" @click="toggleSort(activeTab, 'price')">
                      Price
                      <span v-if="activeTab.filter.sortBy === 'price'" class="sort-arrow">{{
                        activeTab.filter.sortDir === 'asc' ? '▲' : '▼'
                      }}</span>
                    </th>
                    <th>Description</th>
                    <th>Company</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="activeTab.courses.length === 0">
                    <tr>
                      <td colspan="8" class="freight-empty-row">No freight postings found.</td>
                    </tr>
                  </template>
                  <tr
                    v-for="c in activeTab.courses"
                    :key="c.id"
                    class="freight-row"
                    :class="{ expanded: activeTab.expandedId === c.id }"
                    @click="toggleRow(activeTab, c.id)"
                  >
                    <td class="freight-col-arrow">{{ activeTab.expandedId === c.id ? '▼' : '▶' }}</td>
                    <td class="freight-row-age">{{ formatAge(c.createdAt) }}</td>
                    <td>
                      <div class="freight-date-block">
                        <span class="freight-date-connector"></span>
                        <div class="freight-date-text">
                          <div>{{ formatDate(c.startDate) || 'Määramata' }}</div>
                          <div v-if="c.endDate && c.endDate !== c.startDate" class="freight-row-sub">
                            {{ formatDate(c.endDate) }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="freight-line"><span class="freight-line-arrow">↓</span>{{ formatPlace(c.fromCountry, c.fromLocation) }}</div>
                      <div class="freight-row-sub freight-line"><span class="freight-line-arrow">↓</span>{{ formatPlace(c.toCountry, c.toLocation) }}</div>
                    </td>
                    <td class="freight-row-km">-</td>
                    <td class="freight-row-price">{{ c.price != null ? c.price + ' €' : '—' }}</td>
                    <td class="freight-row-desc">
                      <div v-if="c.length">{{ formatLength(c.length) }}</div>
                      <div v-if="c.weight">{{ formatWeight(c.weight) }}</div>
                      <div>{{ c.description || c.mayContain?.[0] || '—' }}</div>
                    </td>
                    <td>{{ c.company || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div ref="sentinelEl" class="freight-scroll-sentinel">
              <span v-if="activeTab.loadingMore" class="freight-scroll-status">Loading more...</span>
              <span
                v-else-if="activeTab.courses.length > 0 && activeTab.filter.page + 1 >= activeTab.totalPages"
                class="freight-scroll-status"
              >
                No more freight postings.
              </span>
            </div>
          </div>

          <aside class="freight-detail-sidebar">
            <div v-if="selectedCourse" class="freight-detail-panel">
              <div class="freight-detail-tabs">
                <button
                  type="button"
                  class="freight-detail-tab-btn"
                  :class="{ active: detailTab === 'info' }"
                  @click="detailTab = 'info'"
                >
                  Info
                </button>
                <button
                  type="button"
                  class="freight-detail-tab-btn"
                  :class="{ active: detailTab === 'map' }"
                  @click="detailTab = 'map'"
                >
                  Map
                </button>
                <button
                  type="button"
                  class="freight-detail-tab-btn"
                  :class="{ active: detailTab === 'calculate' }"
                  @click="detailTab = 'calculate'"
                >
                  Calculate
                </button>
              </div>

              <template v-if="detailTab === 'info'">
                <div class="freight-detail-grid">
                  <div class="freight-detail-route">
                    <div class="freight-detail-stop">
                      <span class="freight-detail-marker load"></span>
                      <div>
                        <div class="freight-detail-place">
                          {{ formatPlace(selectedCourse.fromCountry, selectedCourse.fromLocation) }}
                        </div>
                        <div class="freight-detail-date">
                          {{ formatDate(selectedCourse.startDate) || 'Määramata' }}
                        </div>
                      </div>
                    </div>
                    <div class="freight-detail-stop">
                      <span class="freight-detail-marker unload"></span>
                      <div>
                        <div class="freight-detail-place">
                          {{ formatPlace(selectedCourse.toCountry, selectedCourse.toLocation) }}
                        </div>
                        <div class="freight-detail-date">
                          {{ formatDate(selectedCourse.endDate) || 'Määramata' }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="freight-detail-col">
                    <h4>Description</h4>
                    <p v-if="selectedCourse.weight">Load: {{ selectedCourse.weight }} kg</p>
                    <p v-if="selectedCourse.length">Length: {{ selectedCourse.length }} m</p>
                    <p>{{ selectedCourse.description || '—' }}</p>
                    <p v-if="selectedCourse.mayContain?.length">
                      <strong>May contain:</strong> {{ selectedCourse.mayContain.join(', ') }}
                    </p>
                    <p v-if="selectedCourse.mayNotContain?.length">
                      <strong>May not contain:</strong> {{ selectedCourse.mayNotContain.join(', ') }}
                    </p>
                  </div>

                  <div class="freight-detail-col">
                    <h4>Truck type</h4>
                    <p>{{ selectedCourse.vehicleType || '—' }}</p>
                    <h4>Body type</h4>
                    <p>{{ selectedCourse.bodyType || '—' }}</p>
                    <template v-if="selectedCourse.bodyCharacteristics?.length">
                      <h4>Characteristics</h4>
                      <p>{{ selectedCourse.bodyCharacteristics.join(', ') }}</p>
                    </template>
                  </div>
                </div>

                <div class="freight-detail-price-row">
                  <span class="freight-detail-price-label">Price</span>
                  <span class="freight-detail-price">{{
                    selectedCourse.price != null ? selectedCourse.price + ' €' : '—'
                  }}</span>
                </div>

                <div class="freight-detail-footer">
                  <span v-if="selectedCourse.name" class="freight-detail-ref">{{ selectedCourse.name }}</span>
                  <div class="freight-detail-actions">
                    <template v-if="isLoggedIn && !isAdmin">
                      <button
                        v-if="!selectedCourse.registered"
                        @click.stop="register(selectedCourse.id)"
                        class="courses-view-reg-btn"
                      >
                        Registreeru
                      </button>
                      <button
                        v-else
                        @click.stop="unregister(selectedCourse.id)"
                        class="courses-view-unreg-btn"
                      >
                        Tühista registreerimine
                      </button>
                    </template>
                    <span v-if="!isLoggedIn" class="courses-view-guest-hint">
                      <em>Logi sisse registreerumiseks</em>
                    </span>
                  </div>
                </div>
              </template>

              <template v-else-if="detailTab === 'map'">
                <div class="freight-detail-route">
                  <div class="freight-detail-stop">
                    <span class="freight-detail-marker load"></span>
                    <div>
                      <div class="freight-detail-place">
                        {{ formatPlace(selectedCourse.fromCountry, selectedCourse.fromLocation) }}
                      </div>
                      <div class="freight-detail-date">
                        {{ formatDate(selectedCourse.startDate) || 'Määramata' }}
                      </div>
                    </div>
                  </div>
                  <div class="freight-detail-stop">
                    <span class="freight-detail-marker unload"></span>
                    <div>
                      <div class="freight-detail-place">
                        {{ formatPlace(selectedCourse.toCountry, selectedCourse.toLocation) }}
                      </div>
                      <div class="freight-detail-date">
                        {{ formatDate(selectedCourse.endDate) || 'Määramata' }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="freight-map-placeholder">Map view coming soon</div>
              </template>

              <template v-else>
                <div class="freight-calculate-placeholder">
                  Cost calculator coming soon — this will estimate what this route
                  should cost using your own rates.
                </div>
              </template>
            </div>
            <div v-else class="freight-detail-placeholder">
              Vali pakkumine, et näha detaile.
            </div>
          </aside>
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
.tab-title-input {
  font-size: 0.85rem;
  font-family: inherit;
  border: 1px solid #d4a76a;
  border-radius: 3px;
  padding: 1px 4px;
  width: 90px;
  background: #fff;
}

.tab-notif-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 2px 2px;
  opacity: 0.85;
  line-height: 1;
}
.tab-notif-btn.muted {
  opacity: 0.4;
}
.tab-notif-btn:hover {
  opacity: 1;
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
  align-items: start;
}

.secondary-row {
  grid-template-columns: repeat(3, 1fr);
  align-items: end;
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

.advanced-toggle-row {
  display: flex;
  justify-content: center;
}

.advanced-toggle-btn {
  background: transparent;
  border: 1px solid #d4a76a;
  color: #b55a30;
  padding: 6px 18px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
}

.advanced-toggle-btn:hover {
  background: #fdf3e4;
}

.find-row {
  display: flex;
  justify-content: flex-end;
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

.unit-input-group {
  position: relative;
  flex: 1;
  min-width: 0;
}

.unit-input {
  width: 100%;
  padding-right: 28px;
}

/* Hide number input spinners - typing only, no up/down arrows */
.unit-input::-webkit-outer-spin-button,
.unit-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.unit-input {
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

.find-action-btn {
  height: 38px;
  padding: 0 16px;
  white-space: nowrap;
}

.freight-results-layout {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.freight-list-col {
  flex: 1 1 auto;
  min-width: 0;
}

.freight-detail-sidebar {
  flex: 0 0 380px;
  position: sticky;
  top: 20px;
}

.freight-detail-placeholder {
  border: 1px dashed #ddd;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 0.88rem;
}

.freight-table-wrap {
  overflow-x: auto;
}

.freight-scroll-sentinel {
  display: flex;
  justify-content: center;
  padding: 18px 0 6px;
  min-height: 20px;
}

.freight-scroll-status {
  font-size: 0.82rem;
  color: #999;
}

.freight-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.freight-table thead th {
  text-align: left;
  padding: 8px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #b55a30;
  text-transform: uppercase;
  border-bottom: 2px solid #d4a76a;
  white-space: nowrap;
}

.freight-table thead th.sortable {
  cursor: pointer;
  user-select: none;
}

.freight-table thead th.sortable:hover {
  color: #8f4522;
}

.sort-arrow {
  font-size: 0.65rem;
  margin-left: 2px;
}

.freight-col-arrow {
  width: 24px;
  text-align: center;
  color: #999;
}

.freight-row {
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.15s;
}

.freight-row:hover {
  background: #fdf6ea;
}

.freight-row.expanded {
  background: #fdf3e4;
}

.freight-row td {
  padding: 10px;
  vertical-align: top;
  color: #333;
}

.freight-row-sub {
  font-size: 0.8rem;
  color: #888;
  margin-top: 2px;
}

.freight-row-price {
  font-weight: 700;
  color: #b55a30;
  white-space: nowrap;
}

.freight-row-age {
  font-size: 0.8rem;
  color: #888;
  white-space: nowrap;
}

.freight-row-km {
  color: #999;
}

.freight-row-desc {
  max-width: 260px;
}

.freight-row-desc div {
  margin-bottom: 2px;
}

.freight-line {
  display: flex;
  align-items: center;
  gap: 4px;
}

.freight-line-arrow {
  color: #999;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.freight-date-block {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.freight-date-connector {
  width: 2px;
  background: #d4a76a;
  border-radius: 1px;
  flex-shrink: 0;
}

.freight-date-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.freight-empty-row {
  text-align: center;
  padding: 30px 10px;
  color: #999;
}

.freight-detail-panel {
  background: #fdfcf9;
  padding: 20px 24px;
  border-left: 3px solid #d4a76a;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.freight-detail-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 18px;
  border-bottom: 1px solid #e0e0e0;
}

.freight-detail-tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 4px;
  margin-right: 16px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #999;
  cursor: pointer;
}

.freight-detail-tab-btn:hover {
  color: #b55a30;
}

.freight-detail-tab-btn.active {
  color: #b55a30;
  border-bottom-color: #d4a76a;
}

.freight-detail-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #e0e0e0;
}

.freight-detail-price-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #b55a30;
}

.freight-map-placeholder {
  margin-top: 20px;
  height: 220px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 0.85rem;
  background: #fafafa;
}

.freight-calculate-placeholder {
  padding: 30px 10px;
  text-align: center;
  color: #999;
  font-size: 0.88rem;
}

.freight-detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.freight-detail-route {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.freight-detail-stop {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.freight-detail-marker {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-top: 4px;
  flex-shrink: 0;
}

.freight-detail-marker.load {
  background: #2e8b57;
}

.freight-detail-marker.unload {
  background: #4a90d9;
}

.freight-detail-place {
  font-weight: 600;
  color: #333;
}

.freight-detail-date {
  font-size: 0.85rem;
  color: #888;
}

.freight-detail-price {
  font-size: 1.3rem;
  font-weight: 700;
  color: #b55a30;
}

.freight-detail-col h4 {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #b55a30;
  margin: 0 0 4px;
}

.freight-detail-col p {
  margin: 0 0 10px;
  font-size: 0.88rem;
  color: #444;
}

.freight-detail-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #e0e0e0;
}

.freight-detail-ref {
  font-size: 0.8rem;
  color: #999;
}

.freight-detail-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.freight-detail-actions .courses-view-reg-btn,
.freight-detail-actions .courses-view-unreg-btn {
  width: auto;
  padding: 8px 20px;
}

@media (max-width: 900px) {
  .freight-results-layout {
    flex-direction: column;
  }

  .freight-detail-sidebar {
    flex: 1 1 auto;
    width: 100%;
    position: static;
  }
}
</style>
