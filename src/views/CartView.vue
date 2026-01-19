<script setup>
import { onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import "@/assets/css/cartcss.css";
import router from "@/router/index.js";

const cartStore = useCartStore()

const updateQuantity = async (productId, quantity) => {
  if (quantity < 1) return alert('Kogus peab olema vähemalt 1')
  await cartStore.updateQuantity(productId, quantity)
}

const removeItem = async (productId) => {
  if (!confirm('Kas oled kindel, et soovid toote eemaldada?')) return
  await cartStore.removeItem(productId)
}

const checkout = async () => {
  if (!cartStore.cart.items.length) return alert('Ostukorv on tühi!')
  await cartStore.checkout()
  alert('Checkout edukas!')
  router.push('/orders')
}

onMounted(() => {
  cartStore.fetchCart()
})
</script>

<template>
  <div class="cart-page">
    <h1>Ostukorv</h1>

    <div v-if="!cartStore.cart || cartStore.cart.items.length === 0">
      <p>Ostukorv on tühi.</p>
    </div>

    <div v-else class="cart-grid">
      <div v-for="item in cartStore.cart.items" :key="item.productId" class="cart-item-card">
        <h3>{{ item.productName }}</h3>
        <p><i>Hind:</i> €{{ item.price }}</p>
        <p>
          <i>Kogus:</i>
          <input
            type="number"
            v-model.number="item.quantity"
            @change="updateQuantity(item.productId, item.quantity)"
            min="1"
          />
        </p>
        <p><i>Kokku:</i> €{{ item.totalPrice.toFixed(2) }}</p>
        <button class="remove-btn" @click="removeItem(item.productId)">Eemalda</button>
      </div>

      <div class="cart-summary">
        <h3>Koguhind: €{{ cartStore.cart.totalPrice.toFixed(2) }}</h3>
        <button class="checkout-btn" @click="checkout">Maksma</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
