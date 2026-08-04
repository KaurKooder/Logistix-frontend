<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import "@/assets/css/login.css";

const router = useRouter()
const mode = ref('login')
const name = ref('')
const password = ref('')
const company = ref('')
const message = ref('')
const role = ref('USER')
const authState = ref(0)

const isLoggedIn = computed(() => {
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
        password: password.value,
        company: company.value || undefined
      })

      message.value = asAdmin ? 'Uus admin loodud!' : 'Kasutaja loodud! Võid sisse logida.'

      if (!isLoggedIn.value) {
        setTimeout(() => { mode.value = 'login' }, 1500)
      }
      name.value = ''; password.value = ''; company.value = ''
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
              <label for="auth-username" class="auth-view-label">Kasutajatunnus</label>
              <input
                id="auth-username"
                v-model="name"
                class="auth-view-input"
                placeholder="Sisesta nimi"
              />
            </div>

            <div class="auth-view-field">
              <label for="auth-password" class="auth-view-label">Parool</label>
              <input
                id="auth-password"
                v-model="password"
                type="password"
                class="auth-view-input"
                placeholder="******"
              />
            </div>

            <div v-if="mode === 'register'" class="auth-view-field">
              <label for="auth-company" class="auth-view-label">Ettevõte (valikuline)</label>
              <input
                id="auth-company"
                v-model="company"
                class="auth-view-input"
                placeholder="Sinu ettevõtte nimi"
              />
            </div>

            <div v-if="isAdmin && mode === 'register'" class="auth-view-field">
              <label for="auth-role" class="auth-view-label">Määra roll uuele kasutajale</label>
              <select id="auth-role" v-model="role" class="auth-view-select">
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
