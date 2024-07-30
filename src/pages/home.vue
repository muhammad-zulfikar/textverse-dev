<!-- Home.vue -->

<template>
  <div>
    <SearchBar @update:modelValue="notesStore.setSearchQuery" />
    <Toolbar />
    <NoteList :notes="notesStore.filteredNotes" />

    <div
      v-if="notesStore.showNoteModal && uiStore.viewType !== 'table'"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeNoteModal"
    ></div>
    <NoteModal
      v-if="uiStore.viewType !== 'table'"
      :is-open="notesStore.showNoteModal"
      :note-id="notesStore.selectedNoteId ?? undefined"
      @close="closeNoteModal"
    />

    <div
      v-if="notesStore.showNoteSidebar && uiStore.viewType === 'table'"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeSidebar"
    ></div>
    <Transition name="slide">
      <NoteSidebar
        v-if="uiStore.viewType === 'table' && notesStore.showNoteSidebar"
        :note-id="notesStore.selectedNoteId"
        @close="closeSidebar"
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
  import NoteSidebar from '@/components/noteSidebar.vue';

  const closeNoteModal = () => {
    notesStore.selectedNoteId = null;
    notesStore.showNoteModal = false;
    uiStore.closeNote();
  };

  const closeSidebar = () => {
    uiStore.closeNote();
  };
</script>
