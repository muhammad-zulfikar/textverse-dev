<template>
  <div class="relative mb-[28px] md:mb-[46px]">
    <template v-if="notesStore.filteredNotes.length > 0">
      <ul
        v-if="uiStore.viewType === 'card'"
        :class="[
          'w-11/12 mx-auto mt-10',
          {
            'columns-1 md:max-w-xl': uiStore.columns === 1,
            'columns-2 md:gap-7 md:max-w-4xl': uiStore.columns === 2,
            'columns-3 sm:columns-2 md:columns-3 gap-8': uiStore.columns === 3,
            'columns-4 sm:columns-2 md:columns-3 lg:columns-4 gap-5':
              uiStore.columns === 4,
            'columns-5 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3':
              uiStore.columns === 5,
          },
        ]"
      >
        <li
          v-for="note in filteredNotes"
          :key="note.id"
          class="break-inside-avoid"
        >
          <NoteCard :note="note" :index="note.id" />
        </li>
      </ul>
      <NoteTable
        v-else
        :notes="filteredNotes"
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
import NoteCard from './noteCard.vue';
import NoteTable from './noteTable.vue';
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