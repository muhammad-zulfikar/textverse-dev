<template>
  <div class="app-container">
    <LoadingSpinner v-if="authStore.isLoading" />
    <template v-else>
      <div class="scrollable-container">
        <Navbar />
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

  onMounted(async () => {
    try {
      await authStore.fetchCurrentUser();
      await uiStore.loadSettings();
      await uiStore.applyTheme();
      await notesStore.loadNotes();
      await folderStore.loadFolders();
      await notesStore.loadDeletedNotes();
      await notesStore.fetchSharedNotes();
    } catch (error) {
      uiStore.showToastMessage(
        'An error occurred while loading the app. Please try again.'
      );
    }
  });
</script>

<style>
  html,
  body,
  #app {
    height: 100%;
    margin: 0;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .scrollable-container {
    flex: 1;
    overflow-y: auto;
  }
</style>
