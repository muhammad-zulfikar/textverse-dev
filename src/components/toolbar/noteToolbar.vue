<template>
    <div class="flex justify-between items-center w-full text-sm">
      <NoteOptionDropdown 
        :noteId="noteId"
        :title="title"
        :isShared="isNoteShared"
        :folder="folder"
        :lastEditedDate="lastEditedDate"
        :content="content"
        :isEditMode="isEditMode"
        :isValid="isValid"
        :hasChanges="hasChanges"
        @toggleShare="toggleShare"
        @copyShareLink="copyShareLink"
        @copyNote="copyNote"
        @toggleMarkdownPreview="toggleMarkdownPreview"
        @updateFolder="updateFolder"
        @saveNote="saveNote"
        @openDeleteAlert="openDeleteAlert"
        @updateTitle="updateTitle"
      />
      <button class="ml-4 px-2 py-1 custom-card flex items-center hover:bg-[#d9c698] dark:hover:bg-gray-700"
        @click="closeNote">
        <PhX :size="20" class="size-5" />
      </button>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { PhX } from '@phosphor-icons/vue';
  import NoteOptionDropdown from '@/components/dropdown/noteOptionDropdown.vue';
  import { notesStore, uiStore, authStore } from '@/store/stores';
  
  const props = defineProps<{
    noteId: number | null;
    title: string;
    isEditMode: boolean;
    isValid: boolean;
    hasChanges: boolean;
    folder: string;
    lastEditedDate: string;
    content: string;
  }>();
  
  const emit = defineEmits<{
  (e: 'saveNote'): void;
  (e: 'openDeleteAlert'): void;
  (e: 'updateFolder', folder: string): void;
  (e: 'updateTitle', title: string): void;
}>();

const updateTitle = (newTitle: string) => emit('updateTitle', newTitle);
  
  const isNoteShared = computed(() => {
    return props.noteId !== null && notesStore.sharedNotes.has(props.noteId);
  });
  
  const toggleShare = () => {
    if (props.noteId !== null) {
      notesStore.toggleShare(props.noteId);
    }
  };
  
  const copyShareLink = () => {
    if (props.noteId !== null) {
      notesStore.copyShareLink(props.noteId);
    }
  };
  
  const copyNote = () => {
    if (props.noteId !== null) {
      notesStore.copyNote(props.noteId);
    }
  };
  
  const toggleMarkdownPreview = () => {
    uiStore.showPreview = !uiStore.showPreview;
  };
  
  const closeNote = () => uiStore.closeNote();
  
  const saveNote = () => emit('saveNote');
  const openDeleteAlert = () => emit('openDeleteAlert');
  const updateFolder = (folder: string) => emit('updateFolder', folder);
  </script>