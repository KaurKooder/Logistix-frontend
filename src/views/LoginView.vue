<script setup>
import { ref, computed, onMounted } from 'vue' // Lisasin onMounted
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import "@/assets/css/login.css";

const router = useRouter()
const mode = ref('login')
const name = ref('')
const password = ref('')
const message = ref('')
const role = ref('USER')

// Kasutame muutujat, et triggerida reaktiivsust
const tokenTrigger = ref(0)

const isLoggedIn = computed(() => {
  tokenTrigger.value // See rida tagab, et computed reageerib muutusele
  return localStorage.getItem('jwt') !== null
})

const isAdmin = computed(() => {
  tokenTrigger.value
  const token = localStorage.getItem("jwt")
  if (!token) return false

  try {
    const parts = token.split(".")
    const decoded = JSON.parse(atob(parts[1]))

    // DEBUG: See on kriitiline! Vaata brauseri konsooli (F12)
    console.log("Tokeni sisu:", decoded)

    // Spring Security kasutab tavaliselt väljanime 'role' või 'roles'
    // ja väärtus on ROLE_ADMIN
    const userRole = decoded.role || decoded.roles || "";

    if (Array.isArray(userRole)) {
      return userRole.includes('ROLE_ADMIN') || userRole.includes('ADMIN')
    }

    return userRole === 'ROLE_ADMIN' || userRole === 'ADMIN'
  } catch (error) {
    console.error("Viga tokeni dekodeerimisel:", error)
    return false
  }
})

const currentUsername = computed(() => {
  tokenTrigger.value
  const token = localStorage.getItem("jwt");
  if (!token) return null;
  try {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    return decoded.sub || null;
  } catch (e) { return null; }
})

const submit = async () => {
  message.value = ''
  try {
    if (mode.value === 'login') {
      const response = await apiClient.post('/users/login', {
        name: name.value,
        password: password.value
      })

      const token = response.data.token
      if (token) {
        localStorage.setItem('jwt', token)
        tokenTrigger.value++ // Uuendame staatust
        message.value = 'Sisselogimine edukas!'
        setTimeout(() => router.push('/courses'), 1000)
      }
    } else {
      // REGISTREERIMINE
      const isCreatingAdmin = isAdmin.value && role.value === 'ADMIN'
      const endpoint = isCreatingAdmin ? '/users/admin' : '/users'
      const config = isCreatingAdmin
        ? { headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` } }
        : {}

      await apiClient.post(endpoint, {
        name: name.value,
        password: password.value
      }, config)

      message.value = `Kasutaja loodud!`
      name.value = ''; password.value = '';

      if (!isAdmin.value) {
        setTimeout(() => { mode.value = 'login' }, 1500)
      }
    }
  } catch (error) {
    message.value = error.response?.data?.message || 'Viga!'
  }
}

const logout = () => {
  localStorage.removeItem('jwt')
  tokenTrigger.value++ // Uuendame staatust
  message.value = 'Välja logitud'
  // PARANDUS: Suuname õigele aadressile vastavalt sinu routerile
  setTimeout(() => {
    router.push('/users') // Sinu routeris on LoginView path '/users'
    mode.value = 'login'
  }, 500)
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
          <label>Määra roll uuele kasutajale:</label>
          <select v-model="role">
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
