import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import BlogPosts from "@/views/BlogPosts.vue";
import LoginView from "@/views/LoginView.vue";
import EShopView from "@/views/EShopView.vue";
import CoursesView from "@/views/CoursesView.vue";
import SingleBlogPostView from "@/views/SingleBlogPostView.vue";
import CreatePost from "@/views/CreatePost.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/users',
      name: 'Users',
      component: LoginView,
    },
    {
      path: '/posts',
      name: 'Posts',
      component: BlogPosts
    },
    {
      path: '/posts/create',
      name: 'CreatePost',
      component: CreatePost
    },
    {
      path: '/posts/:id',
      name: 'PostDetail',
      component: SingleBlogPostView,
      props: true
    },
    {
      path: '/products',
      name: 'Products',
      component: EShopView
    },
    {
      path: '/courses',
      name: 'Courses',
      component: CoursesView
    }
  ],
})

export default router
