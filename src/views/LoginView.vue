<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import "@/assets/css/login.css";

const router = useRouter()
const mode = ref('login')
const name = ref('')
const password = ref('')
const message = ref('')
const role = ref('USER')

/**
 * See muutuja sunnib Vue-d uuesti kontrollima localStorage-it.
 * Kasutame seda kõigis computed plokkides triggerina.
 */
const authState = ref(0)

const isLoggedIn = computed(() => {
  // Sonarile sobib funktsiooni kutse, Vuele sobib lugemine (trigger)
  console.debug("Auth state trigger:", authState.value);
  return localStorage.getItem('jwt') !== null;
});

const isAdmin = computed(() => {
  // Kasutame ühtset nime 'authState', et vältida ReferenceErrorit
  console.debug("Reactivity trigger for admin check:", authState.value);

  const token = localStorage.getItem("jwt");
  if (!token) return false;

  try {
    const parts = token.split(".");
    // JWT peab koosnema 3 osast
    if (parts.length < 3) return false;

    const decoded = JSON.parse(atob(parts[1]));

    // Kontrollime rolle turvaliselt
    return Array.isArray(decoded.roles) && decoded.roles.includes('ROLE_ADMIN');
  } catch (error) {
    console.error("JWT decoding failed:", error);
    return false;
  }
});

const currentUsername = computed(() => {
  console.debug("Auth state trigger:", authState.value);

  const token = localStorage.getItem("jwt");
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const decoded = JSON.parse(atob(parts[1]));
    return decoded.sub || null;
  } catch (e) {
    console.error("Token parsing error:", e);
    return null;
  }
});

const switchMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  message.value = ''
}

const submit = async () => {
  message.value = ''
  try {
    if (mode.value === 'login') {
      const response = await apiClient.post('/users/login', {
        name: name.value,
        password: password.value
      })
      localStorage.setItem('jwt', response.data.token)

      // TRIGGER: See rida uuendab automaatselt isLoggedIn, isAdmin ja currentUsername
      authState.value++

      message.value = 'Sisse logitud!'
      setTimeout(() => router.push('/courses'), 1000)
    } else {
      // REGISTREERIMINE
      const asAdmin = isLoggedIn.value && isAdmin.value && role.value === 'ADMIN'
      const endpoint = asAdmin ? '/users/admin' : '/users'

      // Kasutame api.js interceptorit, aga siin saame ka lisada kui vaja
      await apiClient.post(endpoint, {
        name: name.value,
        password: password.value
      })

      message.value = asAdmin ? 'Uus admin loodud!' : 'Kasutaja loodud! Võid sisse logida.'

      if (!isLoggedIn.value) {
        setTimeout(() => { mode.value = 'login' }, 1500)
      }
      name.value = ''; password.value = ''
    }
  } catch (error) {
    message.value = error.response?.data?.message || 'Viga!'
  }
}

const logout = () => {
  localStorage.removeItem('jwt')
  authState.value++ // TRIGGER: logime välja ja uuendame vaadet
  mode.value = 'login'
  router.push('/users')
}
</script>

<template>
  <div class="login-page">

    <div v-if="isLoggedIn" class="logged-in-section">
      <h2>Tere, <strong>{{ currentUsername }}</strong>!</h2>
      <div class="button-group">
        <button @click="logout" class="logout-btn">Logi välja</button>
        <button @click="router.push('/courses')" class="courses-btn">Koolituste lehele</button>
      </div>

      <div v-if="isAdmin" class="admin-controls">
        <hr />
        <button @click="mode = (mode === 'register' ? 'login' : 'register')" class="admin-toggle-btn">
          {{ mode === 'register' ? 'Sulge loomise vorm' : 'Loo uus kasutaja / Admin' }}
        </button>
      </div>
    </div>

    <div v-if="!isLoggedIn || (isAdmin && mode === 'register')" class="form-container">
      <h1>{{ mode === 'login' ? 'Logi sisse' : 'Loo uus konto' }}</h1>

      <div class="form">
        <div class="input-group">
          <input v-model="name" placeholder="Kasutajatunnus" />
        </div>
        <div class="input-group">
          <input v-model="password" type="password" placeholder="Parool" />
        </div>

        <div v-if="isAdmin && mode === 'register'" class="role-selector">
          <label for="role-select">Määra roll uuele kasutajale:</label>
          <select id="role-select" v-model="role">
            <option value="USER">Tavakasutaja (USER)</option>
            <option value="ADMIN">Adminstraator (ADMIN)</option>
          </select>
        </div>

        <button @click="submit" class="submit-btn">
          {{ mode === 'login' ? 'Sisenen' : 'Salvesta kasutaja' }}
        </button>
      </div>

      <p class="status-message">{{ message }}</p>

      <button v-if="!isLoggedIn" class="switch" @click="switchMode">
        {{ mode === 'login' ? "Puudub konto? Registreeru siin" : "Konto olemas? Logi sisse" }}
      </button>
    </div>

  </div>
</template>

<style scoped>
/* Lisa siia mõned täiendavad stiilid paremaks navigeerimiseks */
.logged-in-section {
  background: #f4f4f4;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}
.button-group, .admin-controls {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: center;
}
.role-selector {
  margin: 15px 0;
  text-align: left;
}
.role-selector select {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
}
.status-message {
  margin-top: 15px;
  color: #d32f2f;
  font-weight: bold;
}
</style>
