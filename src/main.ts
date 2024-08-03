// main.ts

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initializeStores } from './store/stores';
import { Icon } from '@iconify/vue';
import 'tailwindcss/tailwind.css';
import './style.css';
import './firebase';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.component('Icon', Icon);
initializeStores();
app.mount('#app');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
