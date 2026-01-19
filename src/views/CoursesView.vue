<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import "@/assets/css/courses.css";

const router = useRouter();

// Courses list
const courses = ref([]);
const totalPages = ref(1);

// Filter + pagination state
const filter = ref({
  name: "",
  category: "",
  startDate: "",
  endDate: "",
  page: 0,
  size: 5,
  sortBy: "name",
  sortDir: "asc",
});

// Decode JWT token to get user info
function getUserFromToken() {
  const token = localStorage.getItem("jwt");
  if (!token) {
    return null;
  }

  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null; // invalid token format
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));

    return {
      name: decoded.sub || null,
      userId: decoded.userId || null,
      role: decoded.roles?.[0] || null
    };
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
}


const user = computed(() => getUserFromToken());
const isLoggedIn = computed(() => user.value !== null);
const isAdmin = computed(() => user.value?.role === 'ROLE_ADMIN');
const userId = computed(() => user.value?.userId);

// Load courses with filter + pagination
async function loadCoursesFiltered() {
  try {
    // Teeme kopia filtrist, aga eemaldame sealt sortBy ja sortDir
    // ning asendame need Springile sobiva 'sort' parameetriga
    const { sortBy, sortDir, ...restOfFilters } = filter.value;

    const params = {
      ...restOfFilters,
      // Spring Pageable ootab parameetrit 'sort' kujul "väljaNimi,suund"
      sort: `${sortBy},${sortDir}`
    };

    if (isLoggedIn.value) params.userId = userId.value;

    console.log("Päringu parameetrid Springile:", params);

    const res = await apiClient.get('/courses/search', { params });
    courses.value = res.data.content;
    totalPages.value = res.data.totalPages;
  } catch (error) {
    console.error("Error loading courses:", error);
  }
}

// Register / unregister
async function register(courseId) {
  try {
    await apiClient.post(`/courses/${courseId}/register?userId=${userId.value}`);
    loadCoursesFiltered();
  } catch (error) { console.error(error); }
}

async function unregister(courseId) {
  try {
    await apiClient.post(`/courses/${courseId}/unregister`);
    loadCoursesFiltered();
  } catch (error) { console.error(error); }
}

// Pagination
function nextPage() {
  if (filter.value.page < totalPages.value - 1) {
    filter.value.page++;
    loadCoursesFiltered();
  }
}
function prevPage() {
  if (filter.value.page > 0) {
    filter.value.page--;
    loadCoursesFiltered();
  }
}

// Navigate to add course page
function goToAddCourse() {
  router.push('/courses/add');
}



// Initial load
onMounted(loadCoursesFiltered);
</script>

<template>
  <div class="courses-view-outer-container">
    <div class="courses-view-paper-block">

      <header class="courses-view-header-section">
        <h1 class="courses-view-page-title">KOOLITUSED</h1>
        <button v-if="isAdmin" @click="goToAddCourse" class="courses-view-add-btn">
          + Lisa uus koolitus
        </button>
      </header>

      <div class="courses-view-body">

        <div class="courses-view-status-bar">
          <p v-if="isLoggedIn" class="courses-view-role-info">
            Sisse logitud kui: <strong>{{ isAdmin ? "Administraator" : "Kasutaja" }}</strong> ({{ user.name }})
          </p>
          <p v-else class="courses-view-role-info">
            <strong>Külalisvaade</strong> — logi sisse, et registreeruda koolitustele.
          </p>
        </div>

        <section class="courses-view-filter-area">
          <h3 class="courses-view-subtitle">OTSI KOOLITUSI</h3>
          <div class="courses-view-filter-grid">
            <input v-model="filter.name" placeholder="Nimi" class="courses-view-input" />
            <input v-model="filter.category" placeholder="Kategooria" class="courses-view-input" />
            <div class="courses-view-date-group">
              <input v-model="filter.startDate" type="date" title="Alguskuupäev" class="courses-view-input" />
              <input v-model="filter.endDate" type="date" title="Lõppkuupäev" class="courses-view-input" />
            </div>
            <div class="courses-view-sort-group">
              <select v-model="filter.sortBy" class="courses-view-select">
                <option value="name">Nimi</option>
                <option value="startDate">Kuupäev</option>
              </select>
              <select v-model="filter.sortDir" class="courses-view-select">
                <option value="asc">Kasvavalt</option>
                <option value="desc">Kahanevalt</option>
              </select>
            </div>
            <button @click="loadCoursesFiltered" class="courses-view-search-btn">Otsi</button>
          </div>
        </section>

        <div class="courses-view-pagination">
          <button @click="prevPage" :disabled="filter.page === 0" class="courses-view-page-btn">Eelmine</button>
          <span class="courses-view-page-text">Leht {{ filter.page + 1 }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="filter.page >= totalPages - 1" class="courses-view-page-btn">Järgmine</button>
        </div>

        <div class="courses-view-list">
          <div v-for="c in courses" :key="c.id" class="courses-view-card">
            <div class="courses-view-card-header">
              <h3 class="courses-view-card-title">{{ c.name }}</h3>
              <span class="courses-view-price-tag">{{ c.price }} €</span>
            </div>

            <div class="courses-view-card-details">
              <p><strong>Kategooria:</strong> {{ c.category }}</p>
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
/* Taust ja konteiner */
.courses-view-outer-container {
  background-color: #F5E9D0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  font-family: Arial, sans-serif;
}

.courses-view-paper-block {
  background-color: #ffffff;
  max-width: 1100px;
  width: 100%;
  padding: 60px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  color: #4a4a4a;
}

/* Päis ja joon */
.courses-view-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 30px;
  padding-bottom: 10px;
}

.courses-view-page-title {
  font-weight: 300;
  font-size: 2.2rem;
  color: #d4a76a;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.courses-view-add-btn {
  background-color: #d4a76a;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

/* Status bar */
.courses-view-status-bar {
  margin-bottom: 25px;
  font-size: 0.9rem;
  color: #666;
}

/* Filtrid */
.courses-view-filter-area {
  background-color: #fdfcf9;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 40px;
  border: 1px solid #f0f0f0;
}

.courses-view-subtitle {
  color: #b55a30;
  font-size: 1rem;
  margin-bottom: 15px;
  letter-spacing: 1px;
}

.courses-view-filter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.courses-view-input, .courses-view-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
}

.courses-view-date-group, .courses-view-sort-group {
  display: flex;
  gap: 10px;
}

.courses-view-search-btn {
  background-color: #b55a30;
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

/* Pagination */
.courses-view-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.courses-view-page-btn {
  background-color: transparent;
  border: 1px solid #d4a76a;
  color: #d4a76a;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.courses-view-page-btn:disabled {
  border-color: #eee;
  color: #ccc;
  cursor: not-allowed;
}

/* Koolituste kaardid */
.courses-view-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 30px;
}

.courses-view-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.courses-view-card:hover {
  border-color: #d4a76a;
  transform: translateY(-3px);
}

.courses-view-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.courses-view-card-title {
  color: #d4a76a;
  margin: 0;
  font-size: 1.3rem;
}

.courses-view-price-tag {
  font-weight: bold;
  color: #b55a30;
  font-size: 1.2rem;
}

.courses-view-description {
  margin-top: 15px;
  font-size: 0.95rem;
  color: #666;
}

.courses-view-card-actions {
  margin-top: auto;
  padding-top: 20px;
}

.courses-view-reg-btn {
  background-color: #d4a76a;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  width: 100%;
  cursor: pointer;
  font-weight: bold;
}

.courses-view-unreg-btn {
  background-color: transparent;
  color: #b55a30;
  border: 1px solid #b55a30;
  padding: 10px 20px;
  border-radius: 4px;
  width: 100%;
  cursor: pointer;
}

.courses-view-guest-hint {
  font-size: 0.85rem;
  color: #999;
  text-align: center;
}

/* Mobiilivaade */
@media (max-width: 800px) {
  .courses-view-paper-block { padding: 30px 15px; }
  .courses-view-list { grid-template-columns: 1fr; }
  .courses-view-header-section { flex-direction: column; align-items: flex-start; gap: 15px; }
}
</style>
