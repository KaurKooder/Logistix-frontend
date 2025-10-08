<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api'

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
  <h1>Blog Posts</h1>

  <!-- Add post -->
  <div>
    <input v-model="newPostTitle" placeholder="New post title" />
    <textarea v-model="newPostContent" placeholder="New post content"></textarea>
    <button @click="addPost">Add Post</button>
  </div>

  <h2>All posts</h2>
  <ul>
    <li v-for="post in posts" :key="post.id">
      <b>{{ post.title }}</b> - {{ post.content }}
    </li>
  </ul>

  <!-- Fetch single post -->
  <div>
    <input type="number" v-model.number="postIdToFetch" placeholder="Post ID" />
    <button @click="fetchPostById">Get Post by ID</button>

    <div v-if="selectedPost">
      <p><b>Selected Post:</b></p>
      <p>ID: {{ selectedPost.id }}</p>
      <p>Title: {{ selectedPost.title }}</p>
      <p>Content: {{ selectedPost.content }}</p>
    </div>
    <div v-else-if="postIdToFetch">
      <p>Post not found.</p>
    </div>
  </div>

</template>
