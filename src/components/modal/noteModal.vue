<!--noteModal-->

<template>
  <ModalBackdrop v-model="props.isOpen" />
  <transition name="zoom">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-40 flex items-center justify-center font-serif"
    >
      <div @click="handleOutsideClick" class="absolute inset-0"></div>
      <div
        ref="modalContainer"
        :class="[
          'px-4 relative flex flex-col',
          {
            'custom-card-no-rounded-border w-full h-full':
              uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur-no-rounded-border w-full h-full':
              uiStore.isExpanded && uiStore.blurEnabled,
            'custom-card w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5':
              !uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5':
              !uiStore.isExpanded && uiStore.blurEnabled,
          },
        ]"
      >
        <div class="flex w-full py-4 select-none">
          <NoteToolbar
            :noteId="props.noteId"
            :title="editedNote.title"
            :isEditMode="isEditMode"
            :isValid="isValid"
            :hasChanges="hasChanges"
            :folder="editedNote.folder"
            :lastEditedDate="editedNote.last_edited || editedNote.time_created"
            :content="editedNote.content"
            :isPinned="editedNote.pinned"
            @saveNote="saveNote"
            @openDeleteAlert="openDeleteAlert"
            @updateFolder="updateNoteFolder"
            @updateTitle="updateNoteTitle"
          />
        </div>
        <div
          class="bg-black dark:bg-gray-400 h-px transition-all duration-300"
        ></div>
        <textarea
          v-if="!uiStore.showPreview"
          v-model="editedNote.content"
          placeholder="Content"
          class="w-full bg-transparent pt-4 resize-none focus:outline-none flex-grow placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
          :style="contentStyle"
        ></textarea>
        <div
          v-else
          class="pt-4 prose dark:prose-dark markdown-body prism-highlight w-full bg-transparent resize-none overflow-auto flex-grow"
          :style="contentStyle"
          v-html="notesStore.toggleMarkdownPreview(editedNote)"
        ></div>
      </div>
    </div>
  </transition>
  <AlertModal
    :is-open="uiStore.isAlertOpen"
    :message="uiStore.alertMessage"
    @confirm="confirmDelete"
    @cancel="closeAlert"
  />
</template>

<script setup lang="ts">
  import { ref, computed, watch, onBeforeUnmount } from 'vue';
  import { Note } from '@/store/types';
  import { notesStore, folderStore, uiStore } from '@/store/stores';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import { nanoid } from 'nanoid';
  import ModalBackdrop from '@/components/modal/modalBackdrop.vue';
  import AlertModal from '@/components/modal/alertModal.vue';
  import NoteToolbar from '@/components/toolbar/noteToolbar.vue';

  const props = defineProps<{
    noteId: string | null;
    isOpen: boolean;
  }>();

  const isEditMode = computed(() => props.noteId !== null);
  const originalNote = ref<Note | null>(null);
  const editedNote = ref<Note>(createEmptyNote());

  function createEmptyNote(): Note {
    return {
      id: nanoid(),
      title: '',
      content: '',
      time_created: new Date().toISOString(),
      last_edited: new Date().toISOString(),
      pinned: false,
      folder:
        folderStore.currentFolder !== DEFAULT_FOLDERS.ALL_NOTES
          ? folderStore.currentFolder
          : DEFAULT_FOLDERS.UNCATEGORIZED,
    };
  }

  const openDeleteAlert = () => {
    uiStore.alertMessage = `Are you sure you want to delete the note "${editedNote.value.title}"?`;
    uiStore.isAlertOpen = true;
  };

  const closeAlert = () => {
    uiStore.isAlertOpen = false;
  };

  const confirmDelete = async () => {
    try {
      if (editedNote.value.id) {
        await notesStore.deleteNote(editedNote.value.id);
        uiStore.closeNote();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      uiStore.showToastMessage('Failed to delete note. Please try again.');
    }
    closeAlert();
  };

  const isValid = computed(() => {
    return (
      editedNote.value.title.trim().length > 0 &&
      editedNote.value.title.length <= 30 &&
      editedNote.value.content.length <= 100000
    );
  });

  const hasChanges = computed(() => {
    if (!originalNote.value || !editedNote.value) return false;
    return notesStore.hasChanged(originalNote.value, editedNote.value);
  });

  const contentStyle = computed(() => ({
    height: uiStore.isExpanded ? '100vh' : '350px',
    marginBottom: uiStore.isExpanded ? '10px' : '0',
    overflowY: 'auto' as const,
  }));

  const updateNoteTitle = (newTitle: string) => {
    editedNote.value.title = newTitle;
  };

  const updateNoteFolder = (newFolder: string) => {
    editedNote.value.folder = newFolder;
  };

  const saveNote = async () => {
    if (!isValid.value) {
      uiStore.showToastMessage(getInvalidNoteMessage());
      return;
    }

    if (isEditMode.value && !hasChanges.value) {
      uiStore.showToastMessage('No changes yet');
      return;
    }

    try {
      if (isEditMode.value) {
        await notesStore.updateNote(editedNote.value);
      } else {
        await notesStore.addNote(editedNote.value);
      }
      clearNoteModal();
      uiStore.closeNote();
    } catch (error) {
      console.error('Error saving note:', error);
      uiStore.showToastMessage('Failed to save note. Please try again.');
    }
  };

  function getInvalidNoteMessage(): string {
    if (editedNote.value.title.trim().length === 0) return 'Title is required';
    if (editedNote.value.title.length > 30)
      return 'Title exceeds 30 characters';
    if (editedNote.value.content.length > 100000)
      return 'Content exceeds 100,000 characters';
    return 'Invalid note';
  }

  const clearNoteModal = () => {
    editedNote.value = createEmptyNote();
    originalNote.value = null;
  };

  const handleOutsideClick = () => {
    if (!hasChanges.value) {
      uiStore.showPreview = false;
      clearNoteModal();
      uiStore.closeNote();
    } else {
      uiStore.showToastMessage('You have unsaved changes.');
    }
  };

  watch(
    () => props.noteId,
    async (newNoteId) => {
      if (newNoteId !== null) {
        const note = notesStore.notes.find((n) => n.id === newNoteId);
        if (note) {
          editedNote.value = { ...note };
          originalNote.value = { ...note };
        }
      } else {
        editedNote.value = createEmptyNote();
        originalNote.value = null;
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(clearNoteModal);
</script>
