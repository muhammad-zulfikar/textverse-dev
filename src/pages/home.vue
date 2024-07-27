<!-- Home.vue -->

<template>
  <Navbar />
  <SearchBar @update:modelValue="notesStore.setSearchQuery" />
  <Toolbar />
  <NoteList :notes="notesStore.filteredNotes" />
  <NoteModal
    :is-open="notesStore.showNoteModal"
    :note-id="notesStore.selectedNoteId ?? undefined"
    @close="closeNoteModal"
  />
</template>

<script lang="ts" setup>
  import { notesStore, uiStore } from '@/store/stores';
  import Navbar from '@/components/navbar/navbar.vue';
  import SearchBar from '@/components/searchBar/searchBar.vue';
  import Toolbar from '@/components/toolbar/toolbar.vue';
  import NoteList from '@/components/notes/noteList.vue';
  import NoteModal from '@/components/modal/noteModal.vue';

  const closeNoteModal = () => {
    notesStore.selectedNoteId = null;
    notesStore.showNoteModal = false;
    uiStore.closeNote();
  };
</script>
