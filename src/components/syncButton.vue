<!-- syncButton.vue -->
<template>
  <button
    @click="syncNotes"
    class="flex items-center px-2 py-1.5 custom-card hover:bg-[#ebdfc0] dark:hover:bg-gray-700"
    :disabled="isSyncing || !authStore.isLoggedIn"
  >
    <component
      :is="currentIcon"
      :size="20"
      :class="{ 'animate-spin': isSpinning }"
    />
  </button>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import {
    PhCloudCheck,
    PhSpinnerGap,
    PhCloudSlash,
  } from '@phosphor-icons/vue';
  import { notesStore, authStore } from '@/store/stores';

  const isSyncing = ref(false);
  const isSpinning = ref(false);
  const syncStatus = ref('idle');

  const currentIcon = computed(() => {
    if (!authStore.isLoggedIn) return PhCloudSlash;
    if (isSpinning.value) return PhSpinnerGap;
    if (syncStatus.value === 'error') return PhCloudSlash;
    return PhCloudCheck;
  });

  const syncNotes = async () => {
    if (isSyncing.value || !authStore.isLoggedIn) return;

    isSyncing.value = true;
    isSpinning.value = true;
    syncStatus.value = 'syncing';

    try {
      await Promise.all([
        notesStore.syncNotesFromFirebase(authStore.user!.uid),
        new Promise((resolve) => setTimeout(resolve, 100)),
      ]);
      syncStatus.value = 'idle';
    } catch (error) {
      console.error('Error syncing notes:', error);
      syncStatus.value = 'error';
    } finally {
      setTimeout(() => {
        isSyncing.value = false;
        isSpinning.value = false;
      }, 100);
    }
  };
</script>
