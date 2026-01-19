import { createRouter, createWebHistory } from 'vue-router'
import BlogPosts from "@/views/BlogPosts.vue";
import LoginView from "@/views/LoginView.vue";
import EShopView from "@/views/EShopView.vue";
import CoursesView from "@/views/CoursesView.vue";
import SingleBlogPostView from "@/views/SingleBlogPostView.vue";
import CreatePost from "@/views/CreatePost.vue";
import CoursesAddView from "@/views/CoursesAddView.vue";
import EShopAddProduct from "@/views/EShopAddProduct.vue";
import CartView from "@/views/CartView.vue";
import OrderView from "@/views/OrderView.vue";
import HomePage from "@/views/HomePage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
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
      path: '/products/create',
      name: 'CreateProduct',
      component: EShopAddProduct
    },
    {
      path: '/courses',
      name: 'Courses',
      component: CoursesView
    },
    {
      path: '/courses/add',
      name: 'CreateCourse',
      component: CoursesAddView
    },
    {
      path: '/cart',
      name: 'Cart',
      component: CartView
    },
    {
      path: '/orders',
      name: 'Orders',
      component: OrderView
    }
  ],
})

export default router
