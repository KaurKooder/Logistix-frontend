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
  <div class="create-view-outer-container">
    <div class="create-view-paper-block">

      <header class="create-view-header-section">
        <h1 class="create-view-page-title">LOO UUS POSTITUS</h1>
      </header>

      <div class="create-view-form">
        <div class="create-view-field">
          <label class="create-view-label">Pealkiri</label>
          <input
            v-model="newPostTitle"
            class="create-view-input"
            placeholder="Sisesta postituse pealkiri..."
          />
        </div>

        <div class="create-view-field">
          <label class="create-view-label">Sisu</label>
          <textarea
            v-model="newPostContent"
            class="create-view-textarea"
            placeholder="Kirjuta siia postituse sisu..."
          ></textarea>
        </div>

        <div class="create-view-actions">
          <button class="create-view-cancel-btn" @click="$router.push('/posts')">Tühista</button>
          <button class="create-view-submit-btn" @click="addPost">Loo postitus</button>
        </div>
      </div>

    </div>
  </div>
</template>
