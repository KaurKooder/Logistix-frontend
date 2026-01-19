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
  <div class="post-view-outer-container">
    <div class="post-view-paper-block">

      <div class="post-view-navigation">
        <button class="post-view-back-btn" @click="goBack">← Tagasi blogisse</button>
      </div>

      <div v-if="post">
        <header class="post-view-header-section">
          <h1 class="post-view-page-title">{{ post.title }}</h1>
        </header>

        <article class="post-view-content-body">
          <p class="post-view-text">{{ post.content }}</p>
        </article>

        <footer class="post-view-footer">
          <button @click="deletePost" class="post-view-delete-btn">Kustuta postitus</button>
        </footer>
      </div>

      <div v-else class="post-view-not-found">
        <p>Postitust ei leitud.</p>
      </div>

    </div>
  </div>
</template>
