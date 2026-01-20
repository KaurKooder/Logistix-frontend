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
  <div class="cart-view-outer-container">
    <div class="cart-view-paper-block">

      <header class="cart-view-header-section">
        <h1 class="cart-view-page-title">OSTUKORV</h1>
      </header>

      <div class="cart-view-body">
        <div v-if="!cartStore.cart || cartStore.cart.items.length === 0" class="cart-view-empty">
          <p>Sinu ostukorv on tühi.</p>
          <router-link to="/products" class="cart-view-back-link">Tagasi poodi</router-link>
        </div>

        <div v-else class="cart-view-content">
          <div class="cart-view-items-list">
            <div v-for="item in cartStore.cart.items" :key="item.productId" class="cart-view-item-row">
              <div class="cart-view-item-info">
                <h3 class="cart-view-item-name">{{ item.productName }}</h3>
                <span class="cart-view-item-price">Ühikuhind: €{{ item.price }}</span>
              </div>

              <div class="cart-view-item-controls">
                <div class="cart-view-quantity-wrapper">
                  <label :for="'quantity-' + item.productId" class="cart-view-quantity-label">
                    Kogus:
                  </label>
                  <input
                      :id="'quantity-' + item.productId"
                      type="number"
                      v-model.number="item.quantity"
                      @change="updateQuantity(item.productId, item.quantity)"
                      min="1"
                      class="cart-view-quantity-input"
                  />
                </div>

                <div class="cart-view-row-total">
                  <strong>Summa: €{{ item.totalPrice.toFixed(2) }}</strong>
                </div>

                <button class="cart-view-remove-btn" @click="removeItem(item.productId)">
                  Eemalda
                </button>
              </div>
            </div>
          </div>

          <div class="cart-view-summary-section">
            <div class="cart-view-total-box">
              <span class="cart-view-total-label">Kogusumma:</span>
              <span class="cart-view-total-amount">€{{ cartStore.cart.totalPrice.toFixed(2) }}</span>
            </div>
            <button class="cart-view-checkout-btn" @click="checkout">Maksma</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
