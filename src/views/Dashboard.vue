<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()

const navItems = [
  { label: 'Overview', icon: '◉', path: '/about' },
  { label: 'Freight Market', icon: '⇄', path: '/courses' },
  { label: 'Support', icon: '?', path: '/support' },
  { label: 'News', icon: '✦', path: '/news' },
]

const primaryActions = [
  { label: 'Search loads', icon: '📦', path: '/courses?tab=browse' },
  { label: 'Post a load', icon: '➕', path: '/post-load' },
  { label: 'Search trucks', icon: '🚛', path: '/courses?tab=trucks' },
  { label: 'Post a truck', icon: '🚚', path: '/courses?tab=post-truck' },
]

const secondaryActions = [
  { label: 'Find partners', icon: '🤝', path: '/partners' },
  { label: 'Calculate route', icon: '📍', path: '/route' },
  { label: 'Bookmarks', icon: '🔖', path: '/bookmarked' },
  { label: 'My loads & trucks', icon: '📋', path: '/my-loads' },
  { label: 'Received offers', icon: '★', path: '/offers' },
]
</script>

<template>
  <div class="fd-layout">
    <!-- Sidebar -->
    <aside class="fd-sidebar">
      <p class="fd-sidebar-label">TRANSPORT MANAGEMENT</p>
      <nav class="fd-sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="fd-sidebar-link"
          :class="{ 'fd-sidebar-active': route.path === item.path }"
        >
          <span class="fd-sidebar-icon">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <!-- Content -->
    <div class="fd-content">
      <h1 class="fd-page-title">Dashboard</h1>

      <!-- Primary actions -->
      <div class="fd-primary-grid">
        <RouterLink
          v-for="action in primaryActions"
          :key="action.label"
          :to="action.path"
          class="fd-primary-card"
        >
          <span class="fd-card-icon">{{ action.icon }}</span>
          <span class="fd-card-label">{{ action.label }}</span>
        </RouterLink>
      </div>

      <!-- Secondary actions -->
      <div class="fd-secondary-grid">
        <RouterLink
          v-for="action in secondaryActions"
          :key="action.label"
          :to="action.path"
          class="fd-secondary-card"
        >
          <span class="fd-sec-icon">{{ action.icon }}</span>
          <span class="fd-sec-label">{{ action.label }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.fd-layout {
  display: flex;
  min-height: calc(100vh - 101px);
  background: #fff;
  color: #1a1a1a;
  font-family: 'Inter', sans-serif;
}

/* Sidebar */
.fd-sidebar {
  width: 190px;
  min-width: 190px;
  border-right: 1px solid #ddd;
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
}
.fd-sidebar-label {
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: #aaa;
  margin: 0 0 0.75rem 1.1rem;
  font-weight: 600;
}
.fd-sidebar-nav {
  display: flex;
  flex-direction: column;
}
.fd-sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1.1rem;
  color: #333;
  text-decoration: none;
  font-size: 0.85rem;
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
.fd-sidebar-active {
  border-left-color: #c69a4b;
  color: #c69a4b !important;
  background: #fdf8f0 !important;
  font-weight: 600;
}
.fd-sidebar-icon {
  font-size: 0.85rem;
  width: 18px;
  text-align: center;
}

/* Content */
.fd-content {
  flex: 1;
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.fd-page-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

/* Primary grid — 4 big cards */
.fd-primary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.fd-primary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 2rem 1rem;
  text-decoration: none;
  color: #1a1a1a;
  font-size: 0.9rem;
  font-weight: 500;
  transition:
    background 0.12s,
    border-color 0.12s;
  cursor: pointer;
}
.fd-primary-card:hover {
  background: #fdf8f0;
  border-color: #c69a4b;
  color: #c69a4b;
}
.fd-card-icon {
  font-size: 1.8rem;
  line-height: 1;
}
.fd-card-label {
  text-align: center;
  line-height: 1.3;
}

/* Secondary grid — 5 smaller cards */
.fd-secondary-grid {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.fd-secondary-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 0.65rem 1.1rem;
  text-decoration: none;
  color: #1a1a1a;
  font-size: 0.82rem;
  font-weight: 500;
  transition:
    background 0.12s,
    border-color 0.12s;
  white-space: nowrap;
}
.fd-secondary-card:hover {
  background: #fdf8f0;
  border-color: #c69a4b;
  color: #c69a4b;
}
.fd-sec-icon {
  font-size: 1rem;
}
</style>
