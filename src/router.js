import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import Users from './views/Users.vue';
import BlogPosts from "@/views/BlogPosts.vue";

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/users', name: 'Users', component: Users },
  { path: '/posts', name: 'BlogPosts', component: BlogPosts}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
