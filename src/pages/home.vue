<!-- Home.vue -->

<template>
  <Navbar />
  <SearchBar @update:modelValue="store.setSearchQuery" />
  <Toolbar />
  <NoteList :notes="store.filteredNotes" />
  <NoteView v-if="store.selectedNote" />
</template>

<script lang="ts" setup>
  import { useNotesStore } from '@/store/store';
  import Navbar from '@/components/navbar/navbar.vue';
  import SearchBar from '@/components/searchBar/searchBar.vue';
  import Toolbar from '@/components/toolbar/toolbar.vue';
  import NoteList from '@/components/notes/noteList.vue';
  import NoteView from '@/components/notes/noteView.vue';

  const store = useNotesStore();
</script>
