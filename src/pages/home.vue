<!-- Home.vue -->

<template>
  <div>
    <SearchBar @update:modelValue="notesStore.setSearchQuery" />
    <Toolbar />
    <NoteList :notes="notesStore.filteredNotes" />

    <div
      v-if="uiStore.isNoteCardOpen && uiStore.viewType !== 'table'"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeNote"
    ></div>
    <NoteModal
      v-if="uiStore.viewType !== 'table'"
      :is-open="uiStore.isNoteCardOpen"
      :note-id="notesStore.selectedNoteId ?? undefined"
      @close="closeNote"
    />

    <div
      v-if="uiStore.isNoteSidebarOpen && uiStore.viewType === 'table'"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeNote"
    ></div>
    <Transition name="slide">
      <NoteSidebar
        v-if="uiStore.viewType === 'table' && uiStore.isNoteSidebarOpen"
        :note-id="notesStore.selectedNoteId"
        @close="closeNote"
      />
    </Transition>
  </div>
</template>

<script lang="ts" setup>
  import { notesStore, uiStore } from '@/store/stores';
  import SearchBar from '@/components/searchBar/searchBar.vue';
  import Toolbar from '@/components/toolbar/toolbar.vue';
  import NoteList from '@/components/notes/noteView.vue';
  import NoteModal from '@/components/modal/noteModal.vue';
  import NoteSidebar from '@/components/modal/noteSidebar.vue';

  const closeNote = () => {
    notesStore.selectedNoteId = null;
    uiStore.isNoteCardOpen = false;
    uiStore.isNoteSidebarOpen = false;
    uiStore.closeNote();
  };
</script>
