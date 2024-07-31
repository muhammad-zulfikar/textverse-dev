<template>
  <div>
    <LoadingSpinner v-if="authStore.isLoading" />
    <template v-else>
      <Navbar />
      <div>
        <router-view v-slot="{ Component, route }">
          <transition :name="transitionName" mode="out-in">
            <component :is="Component" :key="route.path"></component>
          </transition>
        </router-view>
        <Transition name="toast-slide">
          <Toast v-if="uiStore.showToast" :message="uiStore.toastMessage" />
        </Transition>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { authStore, notesStore, folderStore, uiStore } from './store/stores';
import Navbar from '@/components/navbar/navbar.vue';
import Toast from '@/components/toast/toast.vue';
import LoadingSpinner from '@/components/loadingSpinner.vue';

const router = useRouter();
const routeOrder = ['Home', 'About', 'Settings', 'Sign In'];
const transitionName = ref('slide-right');

watch(
  () => router.currentRoute.value,
  (to, from) => {
    const toIndex = to ? routeOrder.indexOf(to.name as string) : -1;
    const fromIndex = from ? routeOrder.indexOf(from.name as string) : -1;
    transitionName.value = toIndex > fromIndex ? 'slide-left' : 'slide-right';
  },
  { immediate: true }
);

watch(() => authStore.isLoggedIn, (newValue) => {
  if (newValue) {
    console.log('User logged in, updating layout');
  }
});

onMounted(async () => {
  try {
    await authStore.fetchCurrentUser();
    
    if (authStore.isLoggedIn) {
      uiStore.showToastMessage('You are already signed in, navigating to home.')
      router.push('/');
    }
    
    await notesStore.loadNotes();
    await folderStore.loadFolders();
  } catch (error) {
    uiStore.showToastMessage('An error occurred while loading the app. Please try again.');
  }
});
</script>