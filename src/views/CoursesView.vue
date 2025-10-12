<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api';
import "@/assets/css/courses.css";

const isAdmin = ref(true); // default role
const userId = ref(1);     // admin=1, user=2

const courses = ref([]);
const newCourse = ref({
  name: "",
  category: "",
  description: "",
  price: "",
  date: "",
});

async function loadCourses() {
  try {
    const res = await apiClient.get(`/courses?userId=${userId.value}`);
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
    await apiClient.delete(`/courses/${courseId}/register?userId=${userId.value}`);
    await loadCourses();
  } catch (error) {
    console.error("Error unregistering:", error);
  }
}

function toggleRole() {
  isAdmin.value = !isAdmin.value;
  userId.value = isAdmin.value ? 1 : 2;
  loadCourses();
}

onMounted(loadCourses);
</script>


<template>
  <div class="courses">
    <div class="header">
      <h1>Koolitused</h1>
      <button @click="toggleRole" class="role-btn">
        {{ isAdmin ? "Lülitu kasutajaks" : "Lülitu adminiks" }}
      </button>
    </div>

    <p class="role-info">
      Praegu sisse logitud kui:
      <strong>{{ isAdmin ? "Administraator" : "Tavaline kasutaja" }}</strong>
    </p>

    <!-- ADMINI OSA -->
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

        <div v-if="!isAdmin">
          <button v-if="!c.registered" @click="register(c.id)">Registreeru</button>
          <button v-else @click="unregister(c.id)" class="cancel-btn">
            Tühista registreerimine
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
