<!-- App.vue -->

<template>
  <div>
    <router-view />
    <Toast v-if="store.showToast" :message="store.toastMessage" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue';
  import { useAuthStore } from '@/store/authStore';
  import { useNotesStore } from './store/store';
  import Toast from '@/components/toast/toast.vue';

  const store = useNotesStore();
  const authStore = useAuthStore();

  onMounted(() => {
    authStore.fetchCurrentUser();
  });
</script>
