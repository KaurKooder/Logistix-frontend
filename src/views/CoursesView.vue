<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/services/api';
import "@/assets/css/courses.css";

// Courses list
const courses = ref([]);
const totalPages = ref(1);

// Admin create course
const newCourse = ref({
  name: "",
  category: "",
  description: "",
  price: "",
  date: "",  // ✅ Single date for the course
});

// Filter + pagination state
const filter = ref({
  name: "",
  category: "",
  startDate: "",  // ✅ Search FROM this date
  endDate: "",    // ✅ Search TO this date
  page: 0,
  size: 5,
  sortBy: "name",
  sortDir: "asc",
});

// Decode JWT token to get user info
function getUserFromToken() {
  const token = localStorage.getItem('jwt');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return {
      name: decoded.sub,
      userId: decoded.userId,
      role: decoded.roles?.[0],
      ...decoded
    };
  } catch (e) { return null; }
}

const user = computed(() => getUserFromToken());
const isLoggedIn = computed(() => user.value !== null);
const isAdmin = computed(() => user.value?.role === 'ROLE_ADMIN');
const userId = computed(() => user.value?.userId);

// Load courses with filter + pagination
async function loadCoursesFiltered() {
  try {
    const params = { ...filter.value };
    if (isLoggedIn.value) params.userId = userId.value;
    const res = await apiClient.get('/courses/search', { params });
    courses.value = res.data.content;
    totalPages.value = res.data.totalPages;
  } catch (error) {
    console.error("Error loading courses:", error);
  }
}

// Admin functions
async function createCourse() {
  if (!newCourse.value.name) return alert("Lisa vähemalt nimi!");
  try {
    // ✅ Map single date to both startDate and endDate for backend
    const courseData = {
      name: newCourse.value.name,
      category: newCourse.value.category,
      description: newCourse.value.description,
      price: newCourse.value.price,
      startDate: newCourse.value.date,  // Same date for both
      endDate: newCourse.value.date,    // Same date for both
    };

    await apiClient.post('/courses', courseData);
    newCourse.value = { name: "", category: "", description: "", price: "", date: "" };
    loadCoursesFiltered();
  } catch (error) {
    console.error("Error creating course:", error);
  }
}

async function deleteCourse(courseId) {
  if (!confirm("Kas oled kindel, et soovid selle kursuse kustutada?")) return;
  try {
    await apiClient.delete(`/courses/${courseId}`);
    loadCoursesFiltered();
  } catch (error) {
    console.error("Error deleting course:", error);
    alert("Viga kursuse kustutamisel!");
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

// Initial load
onMounted(loadCoursesFiltered);
</script>


<template>
  <div class="courses">
    <div class="header">
      <h1>Koolitused</h1>
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

    <!-- ADMINI OSA - only for admins -->
    <div v-if="isAdmin" class="admin-section">
      <h2>Lisa uus koolitus</h2>
      <div class="form">
        <input v-model="newCourse.name" placeholder="Nimi" />
        <input v-model="newCourse.category" placeholder="Kategooria" />
        <input v-model="newCourse.description" placeholder="Kirjeldus" />
        <input v-model.number="newCourse.price" placeholder="Hind (€)" />
        <input v-model="newCourse.date" type="date" placeholder="Kuupäev" />
        <button @click="createCourse">Lisa</button>
      </div>
    </div>

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

        <!-- Delete button - only for admins -->
        <button v-if="isAdmin" @click="deleteCourse(c.id)" class="delete-btn">
          Kustuta
        </button>

        <!-- Message for guests -->
        <p v-if="!isLoggedIn" class="guest-message">
          <em>Logi sisse, et registreeruda</em>
        </p>
      </div>
    </div>
  </div>
</template>
