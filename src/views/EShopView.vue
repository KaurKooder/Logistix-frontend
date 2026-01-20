<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/services/api'
import "@/assets/css/eshop.css";
import { useCartStore } from '@/stores/cart';

const cartStore = useCartStore()

const products = ref([]);
const selectedProduct = ref(null);

// Reaktiivsuse päästik (trigger), et Vue teaks localStorage muutusest
const authState = ref(0)

const isAdmin = computed(() => {
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
  <div class="shop-view-outer-container">
    <div class="shop-view-paper-block">

      <header class="shop-view-header-section">
        <h1 class="shop-view-page-title">E-POOD</h1>
        <div v-if="isAdmin" class="shop-view-admin-actions">
          <router-link to="/products/create">
            <button class="shop-view-create-btn">Lisa uus toode</button>
          </router-link>
        </div>
      </header>

      <div class="shop-view-body">
        <div class="shop-view-grid">
          <div v-for="product in products" :key="product.id" class="shop-view-card">

            <div class="shop-view-card-header">
              <h3 class="shop-view-card-title">{{ product.name }}</h3>
              <span class="shop-view-price-tag">{{ product.price }} €</span>
            </div>

            <div class="shop-view-card-content">
              <p class="shop-view-description">{{ product.description }}</p>
              <p class="shop-view-category"><i>Kategooria:</i> {{ product.category }}</p>
            </div>

            <div class="shop-view-card-actions">
              <button class="shop-view-add-to-cart-btn" @click="addToCart(product.id)">
                Lisa ostukorvi
              </button>

              <button
                v-if="isAdmin"
                class="shop-view-delete-btn"
                @click="deleteProduct(product.id)"
              >
                Kustuta
              </button>
            </div>
          </div>
        </div>

        <div v-if="products.length === 0" class="shop-view-empty">
          <p>Hetkel tooteid pole.</p>
        </div>
      </div>

    </div>
  </div>
</template>
