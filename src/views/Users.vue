<script setup>
import { ref, onMounted } from 'vue';

// State
const users = ref([]);
const userIdToFetch = ref('');
const selectedUser = ref(null);
const newUserName = ref('');

// Fetch all users
const fetchUsers = async () => {
  try {
    const response = await fetch('http://localhost:8080/users');
    users.value = await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

// Fetch single user by ID
const fetchUserById = async () => {
  if (!userIdToFetch.value) return;

  try {
    const response = await fetch(`http://localhost:8080/users/${userIdToFetch.value}`);
    if (response.ok) {
      selectedUser.value = await response.json();
    } else {
      selectedUser.value = null;
      console.warn('User not found');
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  }
};

// Add a new user
const addUser = async () => {
  if (!newUserName.value) return;

  try {
    const response = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newUserName.value })
    });

    if (response.ok) {
      const createdUser = await response.json();
      users.value.push(createdUser);
      newUserName.value = '';
    }
  } catch (error) {
    console.error('Error adding user:', error);
  }
};

// Delete a user by ID
const deleteUser = async (id) => {
  try {
    const response = await fetch(`http://localhost:8080/users/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 204) {
      users.value = users.value.filter(u => u.id !== id);
      if (selectedUser.value?.id === id) selectedUser.value = null;
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};

// Load users initially
onMounted(fetchUsers);
</script>

<template>
  <div>
    <h1>Users</h1>

    <!-- Add user -->
    <div>
      <input v-model="newUserName" placeholder="New user name" />
      <button @click="addUser">Add User</button>
    </div>

    <!-- Fetch single user -->
    <div>
      <input type="number" v-model.number="userIdToFetch" placeholder="User ID" />
      <button @click="fetchUserById">Get User by ID</button>

      <div v-if="selectedUser">
        <p>Selected User:</p>
        <p>ID: {{ selectedUser.id }}</p>
        <p>Name: {{ selectedUser.name }}</p>
      </div>
      <div v-else-if="userIdToFetch">
        <p>User not found.</p>
      </div>
    </div>
  </div>
</template>
