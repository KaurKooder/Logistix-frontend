<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api'
import "@/assets/css/eshop.css";

const products = ref([]);
const productIdToFetch = ref('');
const selectedProduct = ref(null);
const newProductName = ref('');
const newProductDescription = ref('');
const newProductPrice = ref('');
const newProductCategory = ref('');

const fetchProducts = async () => {
  const response = await apiClient.get('/products')
  products.value = response.data;
};

const fetchProductById = async () => {
  try {
    const response = await apiClient.get(`/products/${productIdToFetch.value}`)
    selectedProduct.value = response.data;
  } catch (error) {
    selectedProduct.value = null;
    console.error('Product not found:', error);
  }
};

const addProduct = async () => {
  if (!newProductName.value || !newProductPrice.value) return;
  try {
    const response = await apiClient.post('/products', {
      category: newProductCategory.value,
      name: newProductName.value,
      description: newProductDescription.value,
      price: Number.parseFloat(newProductPrice.value),
    });
    products.value.push(response.data);
    newProductCategory.value ='';
    newProductName.value = '';
    newProductDescription.value = '';
    newProductPrice.value = '';
  } catch (error) {
    console.error('Error adding product:', error);
  }
};

const deleteProduct = async (id) => {
  try {
    await apiClient.delete(`/products/${id}`);
    products.value = products.value.filter(p => p.id !== id);
  } catch (error) {
    console.error('Error deleting product:', error);
  }
};

onMounted(fetchProducts);
</script>

<template>
  <div class="container">
    <div class="title">
      <b>E-pood</b>
    </div>

    <div class="form">
      <h3>Lisa uus toode</h3>
      <input v-model="newProductName" placeholder="Nimi" class="form-input" />
      <input v-model="newProductDescription" placeholder="Kirjeldus" class="form-input" />
      <input v-model="newProductCategory" placeholder="Kategooria" class="form-input" />
      <input v-model="newProductPrice" type="number" placeholder="Hind (€)" class="form-input" />
      <div>
        <button @click="addProduct" class="form-button">Lisa toode</button>
      </div>
    </div>

    <div class="list">
      <h3>Olemasolevad tooted</h3>
      <ul class="list-items">
        <li v-for="product in products" :key="product.id" class="product-item">
          <div class="product-header">
            <b>{{ product.name }}</b>
            <button class="delete-btn" @click="deleteProduct(product.id)">Kustuta</button>
          </div>
          <p>{{ product.description }}</p>
          <p><i>Kategooria:</i> {{ product.category }}</p>
          <p><i>Hind:</i> €{{ product.price }}</p>
        </li>
      </ul>
    </div>

    <div class="find">
      <h3>Otsi toode ID järgi</h3>
      <input v-model.number="productIdToFetch" type="number" placeholder="Toote ID" class="form-input" />
      <div>
        <button @click="fetchProductById" class="find-button">Otsi</button>
      </div>

      <div v-if="selectedProduct" class="result">
        <p><b>{{ selectedProduct.name }}</b></p>
        <p>{{ selectedProduct.description }}</p>
        <p>Kategooria: {{ selectedProduct.category }}</p>
        <p>Hind: €{{ selectedProduct.price }}</p>
      </div>
      <p v-else-if="productIdToFetch">Toodet ei leitud.</p>
    </div>
  </div>
</template>
