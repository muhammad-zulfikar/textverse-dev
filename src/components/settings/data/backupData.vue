<template>
  <div
    class="flex flex-col md:flex-row items-start md:items-center md:justify-between mb-1"
  >
    <div class="flex-grow">
      <h4 class="text-lg font-semibold mb-1">Backup your data</h4>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Download a JSON file of your data.
      </p>
    </div>
    <button
      @click="downloadBackup"
      class="w-full md:w-auto text-sm md:text-base py-2 px-4 mt-4 md:mt-0"
      :class="[uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card']"
    >
      Download a backup
    </button>
  </div>
</template>

<script setup lang="ts">
  import { notesStore, uiStore } from '@/store/stores';

  const downloadBackup = () => {
    notesStore.downloadBackup();
    uiStore.showToastMessage('Backup downloaded successfully');
  };
</script>
