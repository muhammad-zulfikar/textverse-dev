<!-- App.vue -->
<template>
  <div>
    <LoadingSpinner v-if="isLoading" />
    <template v-else>
      <router-view />
      <Toast v-if="uiStore.showToast" :message="uiStore.toastMessage" />
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { authStore, notesStore, folderStore, uiStore } from './store/stores';
  import Toast from '@/components/toast/toast.vue';
  import LoadingSpinner from '@/components/loadingSpinner.vue';

  const isLoading = ref(true);

  onMounted(async () => {
    try {
      await authStore.fetchCurrentUser();
      await authStore.handleRedirectResult();
      await notesStore.loadNotes();
      await folderStore.loadFolders();
    } catch (error) {
      console.error('Error during initialization:', error);
      uiStore.showToastMessage(
        'An error occurred while loading the app. Please try again.'
      );
    } finally {
      isLoading.value = false;
    }
  });
</script>
