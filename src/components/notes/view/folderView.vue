<template>
  <div class="mt-10 max-w-2xl mx-auto font-serif">
    <!-- Folders view -->
    <div
      v-if="currentView === 'folders'"
      :class="uiStore.folderViewType === 'grid' ? 'grid-view' : 'list-view'"
    >
      <div
        v-for="folder in folders"
        :key="folder"
        @click="openFolder(folder)"
        class="custom-card p-4 rounded-lg cursor-pointer"
        :class="
          uiStore.folderViewType === 'grid'
            ? 'flex flex-col items-center'
            : 'flex items-center mb-2'
        "
      >
        <div
          :class="
            uiStore.folderViewType === 'grid'
              ? 'w-8 h-8 md:w-14 md:h-14'
              : 'w-8 h-8 mr-4'
          "
        >
          <img
            :src="folderHasNotes(folder) ? folderIcon : emptyFolderIcon"
            alt="Folder Icon"
          />
        </div>
        <span
          :class="
            uiStore.folderViewType === 'grid'
              ? 'mt-2 text-sm font-medium text-center break-words w-full'
              : 'text-sm font-medium'
          "
        >
          {{ folder }}
        </span>
      </div>
    </div>
    <!-- Notes view -->
    <div
      v-else-if="currentView === 'notes'"
      :class="uiStore.folderViewType === 'grid' ? 'grid-view' : 'list-view'"
    >
      <div class="mb-4 flex items-center col-span-full">
        <button
          @click="goBackToFolders"
          class="flex items-center hover:underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <h2 class="text-xl font-semibold ml-4">{{ currentFolder }}</h2>
      </div>
      <div
        v-if="folderNotes.length === 0"
        class="col-span-full flex items-center justify-center h-full mt-24"
      >
        <p class="text-gray-500">No notes yet</p>
      </div>
      <div
        v-else
        v-for="note in folderNotes"
        :key="note.id"
        @click="uiStore.openNote(note.id)"
        class="custom-card p-4 rounded-lg cursor-pointer"
        :class="
          uiStore.folderViewType === 'grid'
            ? 'flex flex-col items-center'
            : 'flex items-center mb-2'
        "
      >
        <div
          :class="
            uiStore.folderViewType === 'grid'
              ? 'w-8 h-8 md:w-14 md:h-14 mb-2'
              : 'w-8 h-8 mr-4'
          "
        >
          <img src="@/assets/icons/file.svg" alt="File Icon" />
        </div>
        <h3
          :class="
            uiStore.folderViewType === 'grid'
              ? 'text-sm font-medium text-center break-words w-full'
              : 'text-sm font-medium flex-grow'
          "
        >
          {{ note.title }}
        </h3>
        <span
          :class="
            uiStore.folderViewType === 'grid'
              ? 'text-xs mt-2'
              : 'text-xs ml-auto'
          "
        >
          {{ notesStore.localeDate(note.last_edited || note.time_created) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { notesStore, folderStore, uiStore } from '@/store/stores';
  import folderIcon from '@/assets/icons/folder.svg';
  import emptyFolderIcon from '@/assets/icons/folder-empty.svg';

  const currentView = ref('folders');
  const currentFolder = ref('');

  const folders = computed(() => folderStore.folders);
  const folderNotes = computed(() =>
    notesStore.filteredNotes(currentFolder.value)
  );

  const openFolder = (folder: string) => {
    currentFolder.value = folder;
    currentView.value = 'notes';
  };

  const goBackToFolders = () => {
    currentView.value = 'folders';
    currentFolder.value = '';
  };

  const folderHasNotes = (folder: string) => {
    return notesStore.filteredNotes(folder).length > 0;
  };
</script>

<style scoped>
  .grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .list-view {
    display: flex;
    flex-direction: column;
  }
</style>
