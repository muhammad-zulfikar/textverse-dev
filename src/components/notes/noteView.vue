<template>
  <div>
    <NoteModal
      v-if="uiStore.viewType !== 'table'"
      :note-id="notesStore.selectedNoteId"
      :is-open="uiStore.isNoteCardOpen"
    />
    <NoteSidebar
      v-if="uiStore.viewType === 'table'"
      :note-id="notesStore.selectedNoteId"
      :is-open="uiStore.isNoteSidebarOpen"
    />
  </div>
</template>

<script lang="ts" setup>
  import { notesStore, uiStore } from '@/store/stores';
  import NoteModal from '@/components/modal/noteModal.vue';
  import NoteSidebar from '@/components/modal/noteSidebar.vue';
</script>
