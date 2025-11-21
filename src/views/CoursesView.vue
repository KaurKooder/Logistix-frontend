<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/services/api';
import "@/assets/css/courses.css";

const courses = ref([]);
const newCourse = ref({
  name: "",
  category: "",
  description: "",
  price: "",
  date: "",
});

// Decode JWT token to get user role
function getUserFromToken() {
  const token = localStorage.getItem('jwt'); // Changed to 'jwt'

  console.log("Token from storage:", token); // DEBUG

  if (!token) return null;

  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));

    console.log("Decoded token:", decoded); // DEBUG

    // Your JWT structure has: subject (username), roles (array), userId
    return {
      name: decoded.sub,
      userId: decoded.userId,
      role: decoded.roles?.[0], // roles is an array like ["ROLE_ADMIN"] or ["ROLE_USER"]
      ...decoded
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

// Get user info from token
const user = computed(() => getUserFromToken());
const isLoggedIn = computed(() => {
  const loggedIn = user.value !== null;
  console.log("Is logged in:", loggedIn, "User:", user.value); // DEBUG
  return loggedIn;
});
const isAdmin = computed(() => {
  const admin = user.value?.role === 'ROLE_ADMIN';
  console.log("Is admin:", admin, "Role:", user.value?.role); // DEBUG
  return admin;
});
const userId = computed(() => user.value?.userId);

async function loadCourses() {
  try {
    const url = isLoggedIn.value
      ? `/courses?userId=${userId.value}`
      : '/courses';
    console.log("Loading courses from:", url); // DEBUG
    const res = await apiClient.get(url);
    courses.value = res.data;
  } catch (error) {
    console.error("Error loading courses:", error);
  }
}

async function createCourse() {
  if (!newCourse.value.name) return alert("Lisa vähemalt nimi!");
  try {
    await apiClient.post('/courses', newCourse.value);
    newCourse.value = { name: "", category: "", description: "", price: "", date: "" };
    await loadCourses();
  } catch (error) {
    console.error("Error creating course:", error);
  }
}

async function deleteCourse(courseId) {
  if (!confirm("Kas oled kindel, et soovid selle kursuse kustutada?")) return;

  try {
    await apiClient.delete(`/courses/${courseId}`);
    await loadCourses();
  } catch (error) {
    console.error("Error deleting course:", error);
    alert("Viga kursuse kustutamisel!");
  }
}

async function register(courseId) {
  try {
    await apiClient.post(`/courses/${courseId}/register?userId=${userId.value}`);
    await loadCourses();
  } catch (error) {
    console.error("Error registering:", error);
  }
}

async function unregister(courseId) {
  try {
    await apiClient.post(`/courses/${courseId}/unregister`);
    await loadCourses();
  } catch (error) {
    console.error("Error unregistering:", error);
  }
}

onMounted(loadCourses);
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
        <input v-model="newCourse.date" type="date" />
        <button @click="createCourse">Lisa</button>
      </div>
    </div>

    <!-- KOOLITUSTE NIMEKIRI -->
    <div class="course-list">
      <div v-for="c in courses" :key="c.id" class="course-card">
        <h3>{{ c.name }}</h3>
        <p><strong>Kategooria:</strong> {{ c.category }}</p>
        <p><strong>Kuupäev:</strong> {{ c.date }}</p>
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
