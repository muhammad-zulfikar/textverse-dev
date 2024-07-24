<template>
  <div class="relative mb-[28px] md:mb-[46px]">
    <div
      v-if="isLoading"
      class="absolute inset-0 mt-24 flex justify-center items-center"
    >
      <div class="font-serif dark:text-white text-md">Loading notes...</div>
    </div>
    <ul
      v-else-if="store.filteredNotes.length > 0"
      :class="[
        'w-11/12 mx-auto mt-10',
        {
          'columns-1 md:max-w-xl': store.columns === 1,
          'columns-2 md:gap-7 md:max-w-4xl': store.columns === 2,
          'columns-3 sm:columns-2 md:columns-3 gap-8': store.columns === 3,
          'columns-4 sm:columns-2 md:columns-3 lg:columns-4 gap-5':
            store.columns === 4,
          'columns-5 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3':
            store.columns === 5,
        },
      ]"
    >
      <li
        v-for="note in store.filteredNotes"
        :key="note.id"
        class="break-inside-avoid"
      >
        <NoteCard :note="note" :index="note.id" />
      </li>
    </ul>
    <div v-else class="absolute inset-0 mt-24 flex justify-center items-center">
      <div class="font-serif dark:text-white text-md">Not found</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useNotesStore } from '@/store/store';
  import { useAuthStore } from '@/store/authStore';
  import NoteCard from './noteCard.vue';
  import { ref, onMounted, watch } from 'vue';

  const store = useNotesStore();
  const authStore = useAuthStore();
  const isLoading = ref(true);

  const loadNotes = async () => {
    isLoading.value = true;
    await store.loadNotes();
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
