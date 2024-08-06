// main.ts

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initializeStores } from './store/stores';
import 'tailwindcss/tailwind.css';
import './style/style.css';
import './style/markdown-dark.css';
import './style/markdown-light.css';
import './firebase';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
initializeStores();
app.mount('#app');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
