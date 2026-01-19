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
  <div class="course-add-outer-container">
    <div class="course-add-paper-block">

      <header class="course-add-header-section">
        <h1 class="course-add-page-title">LISA UUS KOOLITUS</h1>
        <button @click="goBack" class="course-add-back-btn">← Tagasi</button>
      </header>

      <div class="course-add-body">
        <p v-if="user" class="course-add-role-info">
          Sisse logitud kui: <strong>Administraator</strong> ({{ user.name }})
        </p>

        <div v-if="successMessage" class="course-add-success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="course-add-error">
          {{ errorMessage }}
        </div>

        <div class="course-add-form">
          <div class="course-add-field">
            <label class="course-add-label">Koolituse nimi *</label>
            <input
              v-model="newCourse.name"
              placeholder="Sisesta koolituse nimi"
              :disabled="isLoading"
              class="course-add-input"
            />
          </div>

          <div class="course-add-field">
            <label class="course-add-label">Kategooria *</label>
            <input
              v-model="newCourse.category"
              placeholder="Kategooria (nt. Nõustamine)"
              :disabled="isLoading"
              class="course-add-input"
            />
          </div>

          <div class="course-add-field">
            <label class="course-add-label">Kirjeldus *</label>
            <textarea
              v-model="newCourse.description"
              placeholder="Koolituse põhjalik kirjeldus..."
              rows="6"
              :disabled="isLoading"
              class="course-add-textarea"
            ></textarea>
          </div>

          <div class="course-add-row">
            <div class="course-add-field">
              <label class="course-add-label">Hind (€) *</label>
              <input
                v-model.number="newCourse.price"
                type="number"
                step="0.01"
                placeholder="0.00"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>

            <div class="course-add-field">
              <label class="course-add-label">Toimumisaeg *</label>
              <input
                v-model="newCourse.date"
                type="date"
                :disabled="isLoading"
                class="course-add-input"
              />
            </div>
          </div>

          <div class="course-add-actions">
            <button
              @click="createCourse"
              class="course-add-submit-btn"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Salvestamine...' : 'Salvesta koolitus' }}
            </button>
            <button
              @click="goBack"
              class="course-add-cancel-btn"
              :disabled="isLoading"
            >
              Tühista
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Taust ja konteiner */
.course-add-outer-container {
  background-color: #F5E9D0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  font-family: Arial, sans-serif;
}

.course-add-paper-block {
  background-color: #ffffff;
  max-width: 850px;
  width: 100%;
  padding: 60px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  color: #4a4a4a;
}

/* Päis ja joon */
.course-add-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 30px;
  padding-bottom: 10px;
}

.course-add-page-title {
  font-weight: 300;
  font-size: 2.2rem;
  color: #d4a76a;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.course-add-back-btn {
  background-color: #d4a76a;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

/* Info ja teated */
.course-add-role-info {
  margin-bottom: 25px;
  font-size: 0.9rem;
  color: #666;
}

.course-add-success {
  background-color: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #c3e6cb;
}

.course-add-error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

/* Vormi stiilid */
.course-add-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.course-add-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.course-add-label {
  font-weight: bold;
  color: #b55a30; /* Punakas-pruun toon */
  font-size: 0.9rem;
  text-transform: uppercase;
}

.course-add-input,
.course-add-textarea {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fdfcf9;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.course-add-input:focus,
.course-add-textarea:focus {
  border-color: #d4a76a;
}

.course-add-row {
  display: flex;
  gap: 20px;
}

/* Nupud */
.course-add-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.course-add-submit-btn {
  flex: 2;
  background-color: #d4a76a;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.course-add-submit-btn:hover:not(:disabled) {
  background-color: #b88f55;
}

.course-add-submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.course-add-cancel-btn {
  flex: 1;
  background-color: transparent;
  color: #999;
  border: 1px solid #ddd;
  padding: 14px;
  border-radius: 4px;
  cursor: pointer;
}

.course-add-cancel-btn:hover {
  background-color: #eee;
}

/* Mobiilivaade */
@media (max-width: 600px) {
  .course-add-paper-block { padding: 30px 20px; }
  .course-add-row { flex-direction: column; }
  .course-add-actions { flex-direction: column; }
  .course-add-page-title { font-size: 1.6rem; }
}
</style>
