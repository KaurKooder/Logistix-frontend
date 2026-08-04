<script setup>
const primaryActions = [
  { label: 'Search loads', icon: '📦', path: '/courses?tab=browse' },
  { label: 'Post a load', icon: '➕', path: '/post-load' },
  { label: 'Search trucks', icon: '🚛', path: '/courses?tab=trucks' },
  { label: 'Post a truck', icon: '🚚', path: '/post-truck' },
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
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

/* Content */
.fd-content {
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
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
