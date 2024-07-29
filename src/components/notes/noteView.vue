<!-- noteView.vue -->

<template>
  <div class="relative mb-[28px] md:mb-[46px]">
    <template v-if="notesStore.filteredNotes.length > 0">
      <cardView
        v-if="uiStore.viewType === 'card'"
        :notes="filteredNotes"
        class="w-11/12 mx-auto mt-10"
      />
      <tableView
        v-else-if="uiStore.viewType === 'table'"
        :notes="filteredNotes"
        class="w-11/12 mx-auto mt-10"
      />
      <mailView
        v-else-if="uiStore.viewType === 'email'"
        :notes="filteredNotes"
        class="w-11/12 mx-auto mt-10"
      />
      <folderView
        v-else-if="uiStore.viewType === 'folder'"
        class="w-11/12 mx-auto mt-10"
      />
    </template>
    <div v-else class="absolute inset-0 mt-24 flex justify-center items-center">
      <div class="font-serif dark:text-white text-md">Not found</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { authStore, notesStore, folderStore, uiStore } from '@/store/stores';
  import cardView from './view/cardView.vue';
  import tableView from './view/tableView.vue';
  import mailView from './view/mailView.vue';
  import folderView from './view/folderView.vue';
  import { ref, onMounted, watch, computed } from 'vue';

  const isLoading = ref(true);

  const filteredNotes = computed(() =>
    notesStore.filteredNotes(folderStore.currentFolder)
  );

  const loadNotes = async () => {
    isLoading.value = true;
    await notesStore.loadNotes();
    isLoading.value = false;
  };

  onMounted(async () => {
    await loadNotes();
  });

  watch(
    () => authStore.user,
    async () => {
      await loadNotes();
    }
  );
</script>

<style scoped>
  .break-inside-avoid {
    break-inside: avoid;
    page-break-inside: avoid;
  }
</style>
