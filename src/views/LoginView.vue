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
  <div class="auth-view-outer-container">
    <div class="auth-view-paper-block">

      <header class="auth-view-header-section">
        <h1 class="auth-view-page-title">
          {{ isLoggedIn ? 'KASUTAJA INFO' : (mode === 'login' ? 'LOGI SISSE' : 'LOO KONTO') }}
        </h1>
      </header>

      <div class="auth-view-body">

        <div v-if="isLoggedIn" class="auth-view-logged-in">
          <h2 class="auth-view-welcome">Tere tulemast, <strong>{{ currentUsername }}</strong>!</h2>

          <div class="auth-view-button-group">
            <button @click="router.push('/courses')" class="auth-view-nav-btn">Koolituste lehele</button>
            <button @click="logout" class="auth-view-logout-btn">Logi välja</button>
          </div>

          <div v-if="isAdmin" class="auth-view-admin-area">
            <div class="auth-view-divider"></div>
            <button @click="mode = (mode === 'register' ? 'login' : 'register')" class="auth-view-admin-toggle">
              {{ mode === 'register' ? 'Sulge vorm' : 'Loo uus Kasutaja / Admin' }}
            </button>
          </div>
        </div>

        <div v-if="!isLoggedIn || (isAdmin && mode === 'register')" class="auth-view-form-container">

          <div class="auth-view-form">
            <div class="auth-view-field">
              <label class="auth-view-label">Kasutajatunnus</label>
              <input v-model="name" class="auth-view-input" placeholder="Sisesta nimi" />
            </div>

            <div class="auth-view-field">
              <label class="auth-view-label">Parool</label>
              <input v-model="password" type="password" class="auth-view-input" placeholder="******" />
            </div>

            <div v-if="isAdmin && mode === 'register'" class="auth-view-field">
              <label class="auth-view-label">Määra roll uuele kasutajale</label>
              <select v-model="role" class="auth-view-select">
                <option value="USER">Tavakasutaja (USER)</option>
                <option value="ADMIN">Administraator (ADMIN)</option>
              </select>
            </div>

            <button @click="submit" class="auth-view-submit-btn">
              {{ mode === 'login' ? 'SISENE' : 'SALVESTA KASUTAJA' }}
            </button>
          </div>

          <p v-if="message" class="auth-view-status-message">{{ message }}</p>

          <button v-if="!isLoggedIn" class="auth-view-switch-link" @click="switchMode">
            {{ mode === 'login' ? "Puudub konto? Registreeru siin" : "Konto olemas? Logi sisse" }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Taust ja üldine raamistik */
.auth-view-outer-container {
  background-color: #F5E9D0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  font-family: Arial, sans-serif;
}

.auth-view-paper-block {
  background-color: #ffffff;
  max-width: 600px;
  width: 100%;
  padding: 60px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  color: #4a4a4a;
}

/* Päis ja joon */
.auth-view-header-section {
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 40px;
  padding-bottom: 10px;
  text-align: center;
}

.auth-view-page-title {
  font-weight: 300;
  font-size: 2rem;
  color: #d4a76a;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* Üldine nuppude seadistus animatsioonideks */
button {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  outline: none;
}

button:active {
  transform: translateY(2px);
}

/* Sisselogitud vaade */
.auth-view-welcome {
  text-align: center;
  margin-bottom: 30px;
  font-weight: 300;
}

.auth-view-button-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.auth-view-nav-btn {
  background-color: #d4a76a;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.auth-view-nav-btn:hover {
  background-color: #b88f55;
  box-shadow: 0 4px 8px rgba(184, 143, 85, 0.3);
}

.auth-view-logout-btn {
  background-color: transparent;
  color: #b55a30;
  border: 2px solid #b55a30; /* Tegin piirjoone veidi tugevamaks */
  padding: 11px; /* Kompenseerin piirjoont */
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.auth-view-logout-btn:hover {
  background-color: #b55a30;
  color: white;
}

/* Vormi elemendid */
.auth-view-field {
  margin-bottom: 20px;
}

.auth-view-label {
  display: block;
  font-weight: bold;
  color: #b55a30;
  margin-bottom: 8px;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.auth-view-input, .auth-view-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fdfcf9;
  font-size: 1rem;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.3s ease;
}

.auth-view-input:focus {
  border-color: #d4a76a;
}

.auth-view-submit-btn {
  width: 100%;
  background-color: #d4a76a;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  letter-spacing: 1px;
}

.auth-view-submit-btn:hover {
  background-color: #b88f55;
  box-shadow: 0 5px 12px rgba(184, 143, 85, 0.4);
  transform: translateY(-2px);
}

.auth-view-submit-btn:active {
  transform: translateY(1px);
}

.auth-view-status-message {
  text-align: center;
  margin-top: 20px;
  color: #b55a30;
  font-weight: bold;
}

.auth-view-switch-link {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: #999;
  margin-top: 25px;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.3s ease;
}

.auth-view-switch-link:hover {
  color: #d4a76a;
}

/* Admini ala */
.auth-view-divider {
  height: 1px;
  background-color: #eee;
  margin: 30px 0;
}

.auth-view-admin-toggle {
  width: 100%;
  background-color: #4a4a4a;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.auth-view-admin-toggle:hover {
  background-color: #333;
  letter-spacing: 0.5px;
}

/* Mobiilivaade */
@media (max-width: 600px) {
  .auth-view-paper-block {
    padding: 30px 20px;
  }
}
</style>
