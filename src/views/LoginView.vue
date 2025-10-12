<script setup>
import { ref } from 'vue'
import apiClient from '@/services/api'
import "@/assets/css/login.css";

const mode = ref('login') // 'login' või 'register'

const name = ref('')
const password = ref('')
const message = ref('')

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
      message.value = 'Login successful'
      console.log('Login response:', response.data)

    } else {
      // Register
      const response = await apiClient.post('/users', {
        name: name.value,
        password: password.value
      })
      message.value = 'User registered successfully'
      console.log('Register response:', response.data)
    }
  } catch (error) {
    console.error('Error:', error)
    if (error.response) {
      message.value =
        mode.value === 'login'
          ? 'Invalid name or password'
          : 'Registration failed'
    } else {
      message.value = 'Server error'
    }
  }
}
</script>

<template>
  <div class="login-page">
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
</template>
