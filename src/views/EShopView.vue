<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api'
import "@/assets/css/eshop.css";
import { useCartStore } from '@/stores/cart';

const cartStore = useCartStore()

const products = ref([]);
const productIdToFetch = ref('');
const selectedProduct = ref(null);

const fetchProducts = async () => {
  const response = await apiClient.get('/products')
  products.value = response.data;
}

const fetchProductById = async () => {
  try {
    const response = await apiClient.get(`/products/${productIdToFetch.value}`)
    selectedProduct.value = response.data;
  } catch (error) {
    selectedProduct.value = null;
    console.error('Product not found:', error);
  }
}

const deleteProduct = async (id) => {
  try {
    await apiClient.delete(`/products/${id}`);
    products.value = products.value.filter(p => p.id !== id);
  } catch (error) {
    console.error('Error deleting product:', error);
  }
}

// Lisa ostukorvi (vaikimisi kogus 1)
const addToCart = async (productId) => {
  await cartStore.addToCart(productId, 1)
  alert('Toode lisatud ostukorvi!')
}

onMounted(() => {
  fetchProducts()
  cartStore.fetchCart()
})
</script>

<template>
  <div class="shop-page">

    <!-- Lisa toode nupp -->
    <div class="button-align">
      <router-link to="/products/create">
        <button class="create-product-btn">Lisa uus toode</button>
      </router-link>
    </div>

    <div class="shop-header">
      <h1>E-pood</h1>

      <!-- Otsing ID järgi -->
      <div class="fetch-product">
        <div class="fetch-alignment">
          <input
            class="fetch-input"
            type="number"
            v-model.number="productIdToFetch"
            placeholder="Sisesta toote ID"
          />
          <button class="fetch-product-btn" @click="fetchProductById">
            Kuva toode ID järgi
          </button>
        </div>

        <div v-if="selectedProduct" class="single-product">
          <h3>{{ selectedProduct.name }}</h3>
          <p>{{ selectedProduct.description }}</p>
          <p><i>Kategooria:</i> {{ selectedProduct.category }}</p>
          <p><i>Hind:</i> €{{ selectedProduct.price }}</p>
          <button class="add-to-cart-btn" @click="addToCart(selectedProduct.id)">Lisa ostukorvi</button>
        </div>

        <div v-else-if="productIdToFetch">
          <p>Toodet ei leitud.</p>
        </div>
      </div>
    </div>

    <!-- Kõik tooted -->
    <div class="shop-grid">
      <div v-for="product in products" :key="product.id" class="shop-card">
        <div class="product-header">
          <h3>{{ product.name }}</h3>
          <button class="delete-product-btn" @click="deleteProduct(product.id)">Kustuta</button>
        </div>
        <p>{{ product.description }}</p>
        <p><i>Hind:</i> €{{ product.price }}</p>
        <button class="add-to-cart-btn" @click="addToCart(product.id)">Lisa ostukorvi</button>
      </div>
    </div>

  </div>
</template>
