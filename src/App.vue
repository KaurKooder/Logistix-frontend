<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import AboutView from "@/views/AboutView.vue";
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
</style>
