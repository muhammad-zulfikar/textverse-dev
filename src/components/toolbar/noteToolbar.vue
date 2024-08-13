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
      :isPinned="isPinned"
      @toggleShare="toggleShare"
      @copyShareLink="copyShareLink"
      @copyNote="copyNote"
      @duplicateNote="duplicateNote"
      @pinNote="pinNote"
      @unpinNote="unpinNote"
      @toggleMarkdownPreview="toggleMarkdownPreview"
      @updateFolder="updateFolder"
      @saveNote="saveNote"
      @openDeleteAlert="openDeleteAlert"
      @updateTitle="updateTitle"
    />
    <button
      class="ml-4 px-2 py-1 custom-card flex items-center hover:bg-[#d9c698] dark:hover:bg-gray-700"
      @click="closeNote"
    >
      <PhX :size="20" class="size-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { PhX } from '@phosphor-icons/vue';
  import NoteOptionDropdown from '@/components/dropdown/noteOptionDropdown.vue';
  import { notesStore, uiStore } from '@/store/stores';

  const props = defineProps<{
    noteId: string | null;
    title: string;
    isEditMode: boolean;
    isValid: boolean;
    hasChanges: boolean;
    folder: string;
    lastEditedDate: string | Date;
    content: string;
    isPinned: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'saveNote'): void;
    (e: 'openDeleteAlert'): void;
    (e: 'updateFolder', folder: string): void;
    (e: 'updateTitle', title: string): void;
  }>();

  const isNoteShared = computed(() => {
    return props.noteId !== null && notesStore.publicNotes.has(props.noteId);
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

  const duplicateNote = () => {
    if (props.noteId !== null) {
      notesStore.duplicatedNote(props.noteId);
    }
  };

  const pinNote = () => {
    if (props.noteId !== null) {
      notesStore.pinNote(props.noteId);
    }
  };

  const unpinNote = () => {
    if (props.noteId !== null) {
      notesStore.unpinNote(props.noteId);
    }
  };

  const toggleMarkdownPreview = () => {
    uiStore.showPreview = !uiStore.showPreview;
  };

  const closeNote = () => uiStore.closeNote();

  const updateTitle = (newTitle: string) => emit('updateTitle', newTitle);
  const saveNote = () => emit('saveNote');
  const openDeleteAlert = () => emit('openDeleteAlert');
  const updateFolder = (folder: string) => emit('updateFolder', folder);
</script>
