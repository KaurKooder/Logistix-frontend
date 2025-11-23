<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import "@/assets/css/login.css";

const router = useRouter()
const mode = ref('login') // 'login' või 'register'

const name = ref('')
const password = ref('')
const message = ref('')

// Check if user is logged in
const isLoggedIn = computed(() => {
  return localStorage.getItem('jwt') !== null
})

// Get username from token
const getUsername = () => {
  const token = localStorage.getItem("jwt");
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      console.warn("Invalid JWT format");
      return null;
    }

    const decoded = JSON.parse(atob(parts[1]));
    return decoded.sub || null; // username is in 'sub' field
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};


const currentUsername = computed(() => getUsername())

const switchMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  message.value = ''
  name.value = ''
  password.value = ''
}

const submit = async () => {
  message.value = ''

  try {
    if (mode.value === 'login') {
      // Login
      const response = await apiClient.post('/users/login', {
        name: name.value,
        password: password.value
      })

      const token = response.data.token // JWT token backendist
      if (token) {
        localStorage.setItem('jwt', token) // salvestame tokeni
        message.value = 'Login successful! Redirecting...'
        console.log('JWT token:', token)

        // Redirect to courses page after successful login
        setTimeout(() => {
          router.push('/courses')
        }, 1000)
      } else {
        message.value = 'Invalid name or password'
      }

    } else {
      // Register
      const response = await apiClient.post('/users', {
        name: name.value,
        password: password.value
      })
      message.value = 'User registered successfully! You can now login.'
      console.log('Register response:', response.data)

      // Switch to login mode after successful registration
      setTimeout(() => {
        mode.value = 'login'
        name.value = ''
        password.value = ''
      }, 1500)
    }
  } catch (error) {
    console.error('Error:', error)
    if (error.response) {
      message.value =
        mode.value === 'login'
          ? 'Invalid name or password'
          : 'Registration failed: ' + (error.response.data.message || 'User might already exist')
    } else {
      message.value = 'Server error'
    }
  }
}

const logout = () => {
  localStorage.removeItem('jwt')
  message.value = 'Logged out successfully'
  console.log('User logged out')

  // Redirect to login page or refresh
  setTimeout(() => {
    router.push('/login')
  }, 500)
}

</script>

<template>
  <div class="login-page">
    <!-- Show logout section if user is logged in -->
    <div v-if="isLoggedIn" class="logged-in-section">
      <h2>Oled juba sisse logitud</h2>
      <p>Tere, <strong>{{ currentUsername }}</strong>!</p>
      <button @click="logout" class="logout-btn">Logi välja</button>
      <button @click="router.push('/courses')" class="courses-btn">Mine koolituste lehele</button>
    </div>

    <!-- Show login/register form if not logged in -->
    <div v-else>
      <h1>{{ mode === 'login' ? 'Login' : 'Register' }}</h1>

      <div class="form">
        <input v-model="name" placeholder="Nimi" />
        <input v-model="password" type="password" placeholder="Parool" />
        <button @click="submit">
          {{ mode === 'login' ? 'Login' : 'Register' }}
        </button>
      </div>

      <p>{{ message }}</p>

      <button class="switch" @click="switchMode">
        {{ mode === 'login'
        ? "Don't have an account? Register"
        : 'Already have an account? Login' }}
      </button>
    </div>
  </div>
</template>
