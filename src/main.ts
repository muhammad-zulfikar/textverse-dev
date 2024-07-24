// main.ts

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useAuthStore } from '@/store/authStore';
import { useNotesStore } from '@/store/store';
import App from './App.vue';
import router from './router';
import 'tailwindcss/tailwind.css';
import './style.css';
import './firebase';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount('#app');

const authStore = useAuthStore();
const notesStore = useNotesStore();
authStore.fetchCurrentUser().then(() => {
  notesStore.init();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((error) => {
      console.log('Service Worker registration failed:', error);
    });
}
