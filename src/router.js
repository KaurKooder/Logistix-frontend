import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import LoginView from './views/LoginView.vue';
import BlogPosts from "@/views/BlogPosts.vue";

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/users', name: 'Users', component: LoginView },
  { path: '/posts', name: 'BlogPosts', component: BlogPosts}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
