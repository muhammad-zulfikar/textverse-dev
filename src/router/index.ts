import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import home from '@/pages/home.vue';
import about from '@/pages/about.vue';
import settings from '@/pages/settings.vue';
import trash from '@/pages/trash.vue';
import signIn from '@/pages/signIn.vue';
import publicNoteView from '@/components/notes/publicNoteView.vue';

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
    path: '/trash',
    name: 'Trash',
    component: trash,
  },
  {
    path: '/sign-in',
    name: 'Sign In',
    component: signIn,
  },
  {
    path: '/:publicId',
    name: 'Public',
    component: publicNoteView,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
