<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api'
import "@/assets/css/blogposts.css";

// State
const posts = ref([]);

const fetchPosts = async () => {
  const response = await apiClient.get("/posts")
  posts.value = response.data
}

// Load posts initially
onMounted(fetchPosts);
</script>

<template>
  <div class="blog-outer-container">
    <div class="blog-paper-block">

      <header class="blog-header-section">
        <h1 class="blog-page-title">BLOGI JA ARTIKLID</h1>
      </header>

      <div class="blog-body-wrapper">
        <div class="blog-action-row">
          <router-link to="/posts/create">
            <button class="blog-primary-btn">Loo uus postitus</button>
          </router-link>
        </div>

        <div class="blog-posts-grid">
          <router-link v-for="post in posts" :key="post.id" :to="`/posts/${post.id}`" class="blog-post-card">
            <div class="blog-card-inner">
              <h3 class="blog-card-title">{{ post.title }}</h3>
              <p class="blog-card-text">{{ post.content }}</p>
            </div>
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>
