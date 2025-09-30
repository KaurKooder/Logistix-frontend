<script setup>
import { ref, onMounted } from 'vue';

const users = ref([]);

// Fetch data when the view is mounted
const fetchUsers = async () => {
  try {
    const response = await fetch('http://localhost:8080/users'); // replace with your endpoint
    users.value = await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

onMounted(fetchUsers);
</script>

<template>
  <div>
    <h1>Users</h1>
    <ul>
      <li v-for="user in users" :key="user.id">{{ user.name }}</li>
    </ul>
  </div>
</template>
