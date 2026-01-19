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
  <div class="courses">
    <div class="header">
      <h1>Koolitused</h1>
      <!-- Admin button to add courses -->
      <button v-if="isAdmin" @click="goToAddCourse" class="add-course-btn">
        + Lisa uus koolitus
      </button>
    </div>

    <!-- Show role info only if logged in -->
    <p v-if="isLoggedIn" class="role-info">
      Praegu sisse logitud kui:
      <strong>{{ isAdmin ? "Administraator" : "Tavaline kasutaja" }}</strong>
      ({{ user.name }})
    </p>

    <p v-else class="role-info">
      <strong>Külalisvaade</strong> - Logi sisse, et registreeruda koolitustele
    </p>

    <div class="filter-section">
      <h3>Otsi koolitusi</h3>
      <input v-model="filter.name" placeholder="Nimi" />
      <input v-model="filter.category" placeholder="Kategooria" />
      <input v-model="filter.startDate" type="date" placeholder="Alguskuupäev (alates)" />
      <input v-model="filter.endDate" type="date" placeholder="Lõppkuupäev (kuni)" />
      <select v-model="filter.sortBy">
        <option value="name">Nimi</option>
        <option value="startDate">Kuupäev</option>
      </select>
      <select v-model="filter.sortDir">
        <option value="asc">Kasvavalt</option>
        <option value="desc">Kahanevalt</option>
      </select>
      <button @click="loadCoursesFiltered">Otsi</button>
    </div>

    <div class="pagination">
      <button @click="prevPage" :disabled="filter.page === 0">Eelmine</button>
      <span>Leht {{ filter.page + 1 }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="filter.page >= totalPages - 1">Järgmine</button>
    </div>

    <!-- KOOLITUSTE NIMEKIRI -->
    <div class="course-list">
      <div v-for="c in courses" :key="c.id" class="course-card">
        <h3>{{ c.name }}</h3>
        <p><strong>Kategooria:</strong> {{ c.category }}</p>
        <p><strong>Kuupäev:</strong> {{ c.startDate || 'Määramata' }}</p>
        <p><strong>Hind:</strong> {{ c.price }} €</p>
        <p>{{ c.description }}</p>

        <!-- Register/Unregister buttons - only for logged-in users (not admins) -->
        <template v-if="isLoggedIn && !isAdmin">
          <button v-if="!c.registered" @click="register(c.id)">Registreeru</button>
          <button v-else @click="unregister(c.id)" class="cancel-btn">
            Tühista registreerimine
          </button>
        </template>

        <!-- Message for guests -->
        <p v-if="!isLoggedIn" class="guest-message">
          <em>Logi sisse, et registreeruda</em>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.add-course-btn {
  background-color: #4CAF50;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.add-course-btn:hover {
  background-color: #45a049;
}
</style>
