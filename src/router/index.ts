import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import home from '@/pages/home.vue';
import about from '@/pages/about.vue';
import settings from '@/pages/settings.vue';
import signIn from '@/pages/signIn.vue';
import { authStore } from '@/store/stores';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: home,
  },
  {
    path: '/about',
    name: 'About',
    component: about,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: settings,
  },
  {
    path: '/sign-in',
    name: 'Sign In',
    component: signIn,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth && !authStore.isLoggedIn) {
    next('/sign-in');
  } else if (to.path === '/sign-in' && authStore.isLoggedIn) {
    next('/');
  } else {
    next();
  }
});

export default router;
