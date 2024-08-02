<template>
  <div>
    <SearchBar @update:modelValue="notesStore.setSearchQuery" />
    <Toolbar />
    <NoteList :notes="notesStore.filteredNotes" />
    <NoteView />
  </div>
</template>

<script lang="ts" setup>
  import { notesStore } from '@/store/stores';
  import SearchBar from '@/components/searchBar/searchBar.vue';
  import Toolbar from '@/components/toolbar/toolbar.vue';
  import NoteList from '@/components/notes/noteList.vue';
  import NoteView from '@/components/notes/noteView.vue';
</script>
