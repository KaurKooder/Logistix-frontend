<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/services/api';
import "@/assets/css/singlepost.css";

const route = useRoute();
const router = useRouter();

const post = ref(null);
const postId = route.params.id;

const fetchPost = async () => {
  try {
    const response = await apiClient.get(`/posts/${postId}`);
    post.value = response.data;
  } catch (error) {
    console.error('Post not found:', error);
    post.value = null;
  }
};

const goBack = () => router.push('/posts');

const deletePost = async () => {
  if (!confirm("Kas oled kindel, et soovid selle postituse kustutada?")) return;
  try {
    await apiClient.delete(`/posts/${postId}`);
    router.push('/posts'); // suuna tagasi postituste listi
  } catch (error) {
    console.error('Error deleting post:', error);
  }
};

onMounted(fetchPost);
</script>

<template>
  <div class="blog-post-detail">
    <button class="goback" @click="goBack">← Back to all posts</button>

    <div v-if="post" class="post-detail-card">
      <h1>{{ post.title }}</h1>
      <p>{{ post.content }}</p>
      <button @click="deletePost" class="delete-btn">Kustuta postitus</button>
    </div>

    <div v-else>
      <p>Post not found.</p>
    </div>
  </div>
</template>
