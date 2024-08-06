// main.ts

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initializeStores } from './store/stores';
import Prism from 'prismjs';
import 'tailwindcss/tailwind.css';
import './style/style.css';
import './style/markdown-dark.css';
import './style/markdown-light.css';
import './firebase';
import 'prismjs/plugins/autoloader/prism-autoloader';
import './style/prismjs-light.css';
import './style/prismjs-dark.css';

(Prism as any).plugins.autoloader.languages_path = 'https://unpkg.com/prismjs@1.29.0/components/';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
initializeStores();
app.mount('#app');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
