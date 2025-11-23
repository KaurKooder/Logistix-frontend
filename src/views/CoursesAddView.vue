<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import "@/assets/css/courses.css";

const router = useRouter();

// Admin create course
const newCourse = ref({
  name: "",
  category: "",
  description: "",
  price: "",
  date: "",
});

const errorMessage = ref("");
const successMessage = ref("");
const isLoading = ref(false);

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
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
}

const user = computed(() => getUserFromToken());
const isAdmin = computed(() => user.value?.role === 'ROLE_ADMIN');

// Check admin status on mount
onMounted(() => {
  console.log("User:", user.value);
  console.log("Is Admin:", isAdmin.value);

  if (!isAdmin.value) {
    console.log("Not admin, redirecting...");
    router.push('/courses');
  }
});

async function createCourse() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!newCourse.value.name || !newCourse.value.category || !newCourse.value.description || !newCourse.value.price || !newCourse.value.date) {
    errorMessage.value = "Palun täida kõik väljad!";
    return;
  }

  isLoading.value = true;

  try {
    const courseData = {
      name: newCourse.value.name,
      category: newCourse.value.category,
      description: newCourse.value.description,
      price: Number.parseFloat(newCourse.value.price),
      startDate: newCourse.value.date,
      endDate: newCourse.value.date,
    };

    console.log("Sending course data:", courseData);
    const response = await apiClient.post('/courses', courseData);
    console.log("Response:", response);

    successMessage.value = "Koolitus edukalt lisatud!";

    // Reset form
    newCourse.value = { name: "", category: "", description: "", price: "", date: "" };

    // Redirect back to courses after 2 seconds
    setTimeout(() => {
      router.push('/courses');
    }, 2000);
  } catch (error) {
    console.error("Error creating course:", error);
    errorMessage.value = error.response?.data?.message || "Viga koolituse loomisel!";
  } finally {
    isLoading.value = false;
  }
}

function goBack() {
  router.push('/courses');
}
</script>

<template>
  <div class="courses">
    <div class="header">
      <h1>Lisa uus koolitus</h1>
      <button @click="goBack" class="back-btn">← Tagasi</button>
    </div>

    <p v-if="user" class="role-info">
      Sisse logitud kui: <strong>Administraator</strong> ({{ user.name }})
    </p>

    <!-- Success/Error messages -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- ADMINI OSA - Add course form -->
    <div class="admin-section">
      <div class="form">
        <div class="form-group">
          <label for="name">Nimi *</label>
          <input
            id="name"
            v-model="newCourse.name"
            placeholder="Koolituse nimi"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="category">Kategooria *</label>
          <input
            id="category"
            v-model="newCourse.category"
            placeholder="Kategooria"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="description">Kirjeldus *</label>
          <textarea
            id="description"
            v-model="newCourse.description"
            placeholder="Koolituse kirjeldus"
            rows="4"
            :disabled="isLoading"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="price">Hind (€) *</label>
          <input
            id="price"
            v-model.number="newCourse.price"
            type="number"
            step="0.01"
            placeholder="0.00"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="date">Kuupäev *</label>
          <input
            id="date"
            v-model="newCourse.date"
            type="date"
            :disabled="isLoading"
          />
        </div>

        <div class="form-actions">
          <button
            @click="createCourse"
            class="submit-btn"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Lisamine...' : 'Lisa koolitus' }}
          </button>
          <button
            @click="goBack"
            class="cancel-btn"
            :disabled="isLoading"
          >
            Tühista
          </button>
        </div>
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

.back-btn {
  background-color: #6c757d;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.back-btn:hover {
  background-color: #5a6268;
}

.admin-section {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: bold;
  color: #333;
}

.form-group input,
.form-group textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-group input:disabled,
.form-group textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.submit-btn {
  flex: 1;
  background-color: #4CAF50;
  padding: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.submit-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.cancel-btn {
  flex: 1;
  background-color: #f44336;
  padding: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #da190b;
}

.cancel-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #c3e6cb;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
}

.role-info {
  margin-bottom: 1rem;
  padding: 10px;
  background-color: #e7f3ff;
  border-radius: 4px;
}
</style>
