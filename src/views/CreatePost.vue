<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import "@/assets/css/createpost.css";

const router = useRouter();
const newPostTitle = ref('');
const newPostContent = ref('');

const addPost = async () => {
  if (!newPostTitle.value || !newPostContent.value) return alert("Palun täida pealkiri ja sisu");
  try {
    await apiClient.post('/posts', {
      title: newPostTitle.value,
      content: newPostContent.value
    });
    router.push('/posts'); // tagasi blogi lehele
  } catch (error) {
    console.error("Postituse loomine ebaõnnestus:", error);
  }
};
</script>

<template>
  <div class="create-post-page">
    <h1>Loo uus postitus</h1>
    <input v-model="newPostTitle" placeholder="Postituse pealkiri" />
    <textarea v-model="newPostContent" placeholder="Postituse sisu..."></textarea>
    <button @click="addPost">Loo postitus</button>
  </div>
</template>
