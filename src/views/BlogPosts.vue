<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api'
import "@/assets/css/blogposts.css";

// State
const posts = ref([]);
const postIdToFetch = ref('');
const selectedPost = ref(null);
const newPostTitle = ref('');
const newPostContent = ref('');

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

const addPost = async () => {
  const response = await apiClient.post('/posts', {
    title: newPostTitle.value,
    content: newPostContent.value
  })
  posts.value.push(response.data)
  newPostTitle.value = ''
  newPostContent.value = ''
}

const deletePost = async (id) => {
  try {
    await apiClient.delete(`/posts/${id}`)
    posts.value = posts.value.filter(p => p.id !== id)
    if (selectedPost.value?.id === id) selectedPost.value = null
  } catch (error) {
    console.error('Error deleting post:', error)
  }
}

// Load posts initially
onMounted(fetchPosts);
</script>

<template>
  <div class="blog-page">
    <div class="blog-header">
      <h1>Blogi ja artiklid</h1>

      <!-- Uue postituse loomine -->
      <div class="new-post">
        <input v-model="newPostTitle" placeholder="Uue postituse pealkiri" />
        <textarea v-model="newPostContent" placeholder="Sisesta postituse sisu..."></textarea>
        <button @click="addPost">Lisa postitus</button>
      </div>

      <!-- Ühe postituse otsimine ID järgi -->
      <div class="fetch-post">
        <input
          type="number"
          v-model.number="postIdToFetch"
          placeholder="Sisesta postituse ID"
        />
        <button @click="fetchPostById">Kuva postitus ID järgi</button>

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
      <div v-for="post in posts" :key="post.id" class="blog-card">
        <div class="post-content">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-content-text">{{ post.content }}</p>
        </div>
      </div>
    </div>
  </div>

</template>
