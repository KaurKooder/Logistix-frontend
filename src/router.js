import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import Users from './views/Users.vue';

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/users', name: 'Users', component: Users },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
