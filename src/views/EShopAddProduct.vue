<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import "@/assets/css/createproduct.css";

const router = useRouter();
const newProductName = ref('');
const newProductDescription = ref('');
const newProductPrice = ref('');
const newProductCategory = ref('');

const addProduct = async () => {
  if (!newProductName.value || !newProductPrice.value) return;
  try {
    const response = await apiClient.post('/products', {
      category: newProductCategory.value,
      name: newProductName.value,
      description: newProductDescription.value,
      price: Number.parseFloat(newProductPrice.value),
    });
    router.push('/products');
  } catch (error) {
    console.error('Error adding product:', error);
  }
};
</script>

<template>
  <div class="create-product-page">
    <h1>Lisa uus toode</h1>

    <input v-model="newProductName" placeholder="Toote nimi" />
    <input v-model="newProductCategory" placeholder="Kategooria" />
    <textarea v-model="newProductDescription" placeholder="Kirjeldus"></textarea>
    <input type="number" v-model="newProductPrice" placeholder="Hind (€)" />

    <button @click="addProduct">Lisa toode</button>
  </div>
</template>

<style scoped>

</style>
