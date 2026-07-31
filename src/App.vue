<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const cartStore = useCartStore()

onMounted(() => {
  cartStore.fetchCart()
})

// Sektsioonideks jaotatud navigatsioon
const navSections = [
  {
    title: 'PEAMINE',
    items: [
      { label: 'Avaleht', icon: '🏠', path: '/' },
      { label: 'Dashboard', icon: '◉', path: '/about' },
      { label: 'Freight', icon: '⇄', path: '/courses' },
    ],
  },
  {
    title: 'E-POOD JA MÜÜK',
    items: [
      { label: 'E-pood', icon: '🛍️', path: '/products' },
      { label: 'Blogi ja artiklid', icon: '✦', path: '/posts' },
      { label: 'Minu tellimused', icon: '📋', path: '/orders' },
    ],
  },
  {
    title: 'KONTO',
    items: [{ label: 'Konto', icon: '👤', path: '/users' }],
  },
]
</script>

<template>
  <div class="app-layout">
    <!-- Vasak küljeriba (endine navbar) -->
    <aside class="fd-sidebar">
      <!-- Logo sektsioon -->
      <div class="fd-brand">
        <RouterLink to="/" class="logo-link">
          <img src="@/assets/logo/vkkeskuslogo.png" alt="Logo" class="logo" />
        </RouterLink>
      </div>

      <!-- Menüü lingid sektsioonidena -->
      <div v-for="section in navSections" :key="section.title" class="fd-sidebar-group">
        <p class="fd-sidebar-label">{{ section.title }}</p>
        <nav class="fd-sidebar-nav">
          <RouterLink
            v-for="item in section.items"
            :key="item.path"
            :to="item.path"
            class="fd-sidebar-link"
            :class="{ 'fd-sidebar-active': route.path === item.path }"
          >
            <span class="fd-sidebar-icon">{{ item.icon }}</span>
            <span class="fd-sidebar-text">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <!-- Ostukorv küljeriba allosas -->
      <div class="fd-sidebar-group fd-cart-section">
        <RouterLink
          to="/cart"
          class="fd-sidebar-link fd-cart-link"
          :class="{ 'fd-sidebar-active': route.path === '/cart' }"
        >
          <span class="fd-sidebar-icon">🛒</span>
          <span class="fd-sidebar-text">Ostukorv</span>
          <span v-if="cartStore.cart?.items?.length" class="cart-badge">
            {{ cartStore.cart.items.length }}
          </span>
        </RouterLink>
      </div>
    </aside>

    <!-- Põhisisu ala -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.app-layout {
  display: flex;
  min-height: 100vh;
  background: #fff;
  color: #1a1a1a;
  font-family: 'Inter', sans-serif;
}

/* Vasak küljeriba */
.fd-sidebar {
  width: 220px;
  min-width: 220px;
  border-right: 1px solid #ddd;
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: #faf8f4; /* Säilitatud sinu algne heletausta toon */
}

/* Logo */
.fd-brand {
  padding: 0 1.2rem 1rem 1.2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  max-height: 50px;
  width: auto;
  object-fit: contain;
}

/* Grupid ja lingid */
.fd-sidebar-group {
  display: flex;
  flex-direction: column;
}

.fd-sidebar-label {
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: #aaa;
  margin: 0 0 0.5rem 1.2rem;
  font-weight: 600;
}

.fd-sidebar-nav {
  display: flex;
  flex-direction: column;
}

.fd-sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 1.2rem;
  color: #333;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  border-left: 3px solid transparent;
  transition:
    background 0.12s,
    color 0.12s;
}

.fd-sidebar-link:hover {
  background: #f5f5f5;
  color: #000;
}

/* Aktiivne vahekaart kuldse aktsendiga */
.fd-sidebar-active {
  border-left-color: #c69a4b;
  color: #c69a4b !important;
  background: #fdf8f0 !important;
  font-weight: 600;
}

.fd-sidebar-icon {
  font-size: 0.9rem;
  width: 20px;
  text-align: center;
}

.fd-sidebar-text {
  flex: 1;
  white-space: nowrap;
}

/* Ostukorv ja badge */
.fd-cart-section {
  margin-top: auto; /* Lükkab ostukorvi küljeriba allossa */
  border-top: 1px solid #eee;
  padding-top: 0.75rem;
}

.fd-cart-link {
  position: relative;
}

.cart-badge {
  background-color: #e74c3c;
  color: #fff;
  border-radius: 50%;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

/* Sisuala paremal */
.main-content {
  flex: 1;
  background: #fff;
  min-width: 0; /* Hoiab ära Flexboxi kokkujooksmise pikkade elementide puhul */
}
</style>
