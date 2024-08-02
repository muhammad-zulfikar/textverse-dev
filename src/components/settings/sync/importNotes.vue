<template>
  <div
    class="flex flex-col md:flex-row items-start md:items-center md:justify-between"
  >
    <div class="flex-grow">
      <h4 class="text-lg font-semibold mb-1">Import locally stored notes</h4>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Import any local notes that don't already exist in your account.
      </p>
    </div>
    <button
      @click="importNotes"
      class="w-full md:w-auto text-sm md:text-base py-2 px-4 mt-4 md:mt-0"
      :class="[uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card']"
    >
      Import notes
    </button>
  </div>
</template>

<script setup lang="ts">
  import { notesStore, uiStore } from '@/store/stores';

  const importNotes = () => {
    notesStore.importNotes();
  };
</script>
