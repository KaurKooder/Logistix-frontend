<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api'
import "@/assets/css/blogposts.css";

// State
const posts = ref([]);
const postIdToFetch = ref('');
const selectedPost = ref(null);

const fetchPosts = async () => {
  const response = await apiClient.get("/posts")
  posts.value = response.data
}

const fetchPostById = async () => {
  try {
    const response = await apiClient.get(`/posts/${postIdToFetch.value}`)
    selectedPost.value = response.data;
  } catch (error) {
    selectedPost.value = null;
    console.error('Post not found:', error);
  }
}

// Load posts initially
onMounted(fetchPosts);
</script>

<template>
  <div class="blog-page">
    <div class="button-align">
      <router-link to="/posts/create">
        <button class="create-btn">Loo uus postitus</button>
      </router-link>
    </div>
    <div class="blog-header">
      <h1>Blogi ja artiklid</h1>

      <!-- Otsing ID järgi -->
      <div class="fetch-post">
        <div class="fetch-alignment">
          <input class="fetch-input"
                 type="number"
                 v-model.number="postIdToFetch"
                 placeholder="Sisesta postituse ID"
          />
          <button class="fetch-button" @click="fetchPostById">Kuva postitus ID järgi</button>
        </div>

        <div v-if="selectedPost" class="single-post">
          <h3>{{ selectedPost.title }}</h3>
          <p>{{ selectedPost.content }}</p>
        </div>

        <div v-else-if="postIdToFetch">
          <p>Postitust ei leitud.</p>
        </div>
      </div>
    </div>

    <!-- Kõik postitused -->
    <div class="blog-grid">
      <router-link v-for="post in posts" :key="post.id" :to="`/posts/${post.id}`" class="blog-card">
        <div class="post-content">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-content-text">{{ post.content }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>
