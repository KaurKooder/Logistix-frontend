<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

onMounted(() => {
  cartStore.fetchCart()
})
</script>

<template>
  <header class="navbar">
    <div class="nav-left">
      <img src="@/assets/logo/vkkeskuslogo.png" alt="Logo" class="logo" />
    </div>

      <nav class="nav-menu">
        <RouterLink to="/">Avaleht</RouterLink>
        <RouterLink to="/about">Meist</RouterLink>
        <RouterLink to="/users">Konto</RouterLink>
        <RouterLink to="/posts">Blogi ja artiklid</RouterLink>
        <RouterLink to="/products">E-pood</RouterLink>
        <RouterLink to="/courses">Koolitused</RouterLink>

        <RouterLink to="/cart" class="cart-link">
          🛒
          <span
            v-if="cartStore.cart?.items?.length"
            class="cart-badge"
          >
            {{ cartStore.cart.items.length }}
          </span>
        </RouterLink>
        <RouterLink to="/orders">Minu tellimused</RouterLink>
      </nav>
  </header>
  <RouterView />
</template>


<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 40px;
  padding: 20px 40px;
  background: #faf8f4;
  border-bottom: 1px solid #eee;
}

.logo {
  height: 60px;
}

.nav-menu {
  display: flex;
  gap: 28px;
  font-size: 20px;
}

.nav-menu a {
  text-decoration: none;
  color: #c69a4b; /* kuldne toon */
  font-weight: 500;
}

.nav-menu a:hover {
  color: #222222;
}

.cart-link {
  position: relative;
}

.cart-badge {
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  padding: 2px 7px;
  font-size: 12px;
  margin-left: 6px;
  vertical-align: top;
}

</style>
