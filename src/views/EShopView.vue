<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/services/api'
import "@/assets/css/eshop.css";
import { useCartStore } from '@/stores/cart';

const cartStore = useCartStore()

const products = ref([]);
const productIdToFetch = ref('');
const selectedProduct = ref(null);

// Reaktiivsuse päästik (trigger), et Vue teaks localStorage muutusest
const authState = ref(0)

// SonarQube-sõbralik admini kontroll
const isAdmin = computed(() => {
  // console.debug täidab Sonari nõude (funktsiooni kutse) ja Vue nõude (lugemine)
  console.debug("Checking admin status for Eshop, state:", authState.value);

  const token = localStorage.getItem("jwt");
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length < 3) return false;

    const decoded = JSON.parse(atob(parts[1]));

    // Kontrollime rolle ja tagastame tõeväärtuse
    return Array.isArray(decoded.roles) && decoded.roles.includes('ROLE_ADMIN');
  } catch (error) {
    console.error("JWT decoding failed in Eshop:", error);
    return false;
  }
});

const fetchProducts = async () => {
  try {
    const response = await apiClient.get('/products')
    products.value = response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

const fetchProductById = async () => {
  if (!productIdToFetch.value) return;
  try {
    const response = await apiClient.get(`/products/${productIdToFetch.value}`)
    selectedProduct.value = response.data;
  } catch (error) {
    selectedProduct.value = null;
    console.error('Product not found:', error);
  }
}

const deleteProduct = async (id) => {
  if (!confirm('Kas oled kindel, et soovid toote kustutada?')) return;

  try {
    await apiClient.delete(`/products/${id}`);
    products.value = products.value.filter(p => p.id !== id);
    // Kui kustutatud toode oli parajasti otsingus lahti, tühjendame selle ka
    if (selectedProduct.value && selectedProduct.value.id === id) {
      selectedProduct.value = null;
    }
  } catch (error) {
    console.error('Error deleting product:', error);
  }
}

const addToCart = async (productId) => {
  try {
    await cartStore.addToCart(productId, 1)
    alert('Toode lisatud ostukorvi!')
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('Ostukorvi lisamine ebaõnnestus. Kas oled sisse logitud?');
  }
}

onMounted(() => {
  fetchProducts()
  cartStore.fetchCart()
  // Igaks juhuks uuendame authState-i, et isAdmin uuesti arvutataks
  authState.value++
})
</script>

<template>
  <div class="shop-page">

    <div v-if="isAdmin" class="button-align">
      <router-link to="/products/create">
        <button class="create-product-btn">Lisa uus toode</button>
      </router-link>
    </div>

    <div class="shop-header">
      <h1>E-pood</h1>

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

        <div v-else-if="productIdToFetch && !selectedProduct">
          <p>Toodet ei leitud.</p>
        </div>
      </div>
    </div>

    <div class="shop-grid">
      <div v-for="product in products" :key="product.id" class="shop-card">
        <div class="product-header">
          <h3>{{ product.name }}</h3>

          <button
            v-if="isAdmin"
            class="delete-product-btn"
            @click="deleteProduct(product.id)"
          >
            Kustuta
          </button>
        </div>
        <p>{{ product.description }}</p>
        <p><i>Hind:</i> €{{ product.price }}</p>
        <button class="add-to-cart-btn" @click="addToCart(product.id)">Lisa ostukorvi</button>
      </div>
    </div>

  </div>
</template>
