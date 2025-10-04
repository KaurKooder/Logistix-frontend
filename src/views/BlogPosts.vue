<script setup>
import { ref, onMounted } from 'vue';

// State
const posts = ref([]);
const postIdToFetch = ref('');
const selectedPost = ref(null);
const newPostTitle = ref('');
const newPostContent = ref('');

// Fetch all posts
const fetchPosts = async () => {
  try {
    const response = await fetch('http://localhost:8080/posts');
    posts.value = await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
};

// Fetch single post by ID
const fetchPostById = async () => {
  if (!postIdToFetch.value) return;

  try {
    const response = await fetch(`http://localhost:8080/posts/${postIdToFetch.value}`);
    if (response.ok) {
      selectedPost.value = await response.json();
    } else {
      selectedPost.value = null;
      console.warn('Post not found');
    }
  } catch (error) {
    console.error('Error fetching post:', error);
  }
};

// Add a new post
const addPost = async () => {
  if (!newPostTitle.value || !newPostContent.value) return;

  try {
    const response = await fetch('http://localhost:8080/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newPostTitle.value,
        content: newPostContent.value
      })
    });

    if (response.ok) {
      const createdPost = await response.json();
      posts.value.push(createdPost);
      newPostTitle.value = '';
      newPostContent.value = '';
    }
  } catch (error) {
    console.error('Error adding post:', error);
  }
};

// Delete a post
const deletePost = async (id) => {
  try {
    const response = await fetch(`http://localhost:8080/posts/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 204) {
      posts.value = posts.value.filter(p => p.id !== id);
      if (selectedPost.value?.id === id) selectedPost.value = null;
    }
  } catch (error) {
    console.error('Error deleting post:', error);
  }
};

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
