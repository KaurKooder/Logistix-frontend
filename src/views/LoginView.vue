<script setup>
import { ref } from 'vue';

const mode = ref('login'); // 'login' või 'register'

const name = ref('');
const password = ref('');
const message = ref('');

const switchMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login';
  message.value = '';
  name.value = '';
  password.value = '';
};

const submit = async () => {
  message.value = '';

  const url =
    mode.value === 'login'
      ? 'http://localhost:8080/users/login'
      : 'http://localhost:8080/users';

  const body = { name: name.value, password: password.value };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      message.value = mode.value === 'login' ? 'Login successful' : 'User registered successfully';
    } else {
      message.value = mode.value === 'login' ? 'Invalid name or password' : 'Registration failed';
    }
  } catch (error) {
    console.error('Error:', error);
    message.value = 'Server error';
  }
};

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

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 250px;
}
input,
button {
  padding: 8px;
  font-size: 1rem;
}
.switch {
  margin-top: 10px;
  background: none;
  border: none;
  color: blue;
  cursor: pointer;
}
</style>
