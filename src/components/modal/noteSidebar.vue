<template>
  <ModalBackdrop v-model="props.isOpen" />
  <transition name="slide">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-40 flex items-center justify-center font-serif"
    >
      <div @click="handleOutsideClick" class="absolute inset-0"></div>
      <div
        ref="sidebarContainer"
        :class="[
          'fixed inset-y-0 right-0 overflow-y-auto flex flex-col px-4',
          {
            'custom-card-no-rounded-border w-full':
              uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur-no-rounded-border w-full':
              uiStore.isExpanded && uiStore.blurEnabled,
            'custom-card w-3/4 md:w-2/5':
              !uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur w-3/4 md:w-2/5':
              !uiStore.isExpanded && uiStore.blurEnabled,
          },
        ]"
      >
        <div class="flex flex-col h-full">
          <div class="flex w-full py-4 select-none">
            <NoteToolbar
              :noteId="props.noteId"
              :title="editedNote.title"
              :isEditMode="isEditMode"
              :isValid="isValid"
              :hasChanges="hasChanges"
              :folder="editedNote.folder"
              :lastEditedDate="
                editedNote.last_edited || editedNote.time_created
              "
              :content="editedNote.content"
              @saveNote="saveNote"
              @openDeleteAlert="openDeleteAlert"
              @updateFolder="updateNoteFolder"
              @updateTitle="updateNoteTitle"
            />
          </div>
          <div
            class="bg-black dark:bg-gray-400 h-px transition-all duration-300"
          ></div>
          <div class="flex-grow overflow-hidden mt-2 mb-4">
            <textarea
              v-if="!uiStore.showPreview"
              v-model="editedNote.content"
              placeholder="Content"
              class="w-full h-full bg-transparent resize-none outline-none text-base placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
            ></textarea>
            <div
              v-else
              class="prose dark:prose-dark markdown-body prism-highlight w-full h-full"
              v-html="notesStore.toggleMarkdownPreview(editedNote)"
            ></div>
          </div>
        </div>
      </div>

      <AlertModal
        :is-open="isAlertOpen"
        :message="alertMessage"
        @confirm="confirmDelete"
        @cancel="closeAlert"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
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
  const sidebarContainer = ref<HTMLElement | null>(null);
  const isAlertOpen = ref(false);
  const alertMessage = ref('');

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

  const isValid = computed(() => {
    return (
      editedNote.value.title.trim().length > 0 &&
      editedNote.value.title.length <= 30 &&
      editedNote.value.content.length <= 100000
    );
  });

  const hasChanges = computed(() => {
    if (!isEditMode.value) {
      return (
        editedNote.value.title.trim() !== '' ||
        editedNote.value.content.trim() !== ''
      );
    }
    if (!originalNote.value || !editedNote.value) return false;
    return notesStore.hasChanged(originalNote.value, editedNote.value);
  });

  const saveNote = async () => {
    if (!isValid.value) {
      uiStore.showToastMessage(getInvalidNoteMessage());
      return;
    }

    try {
      if (isEditMode.value && hasChanges.value) {
        await notesStore.updateNote(editedNote.value);
      } else if (!isEditMode.value) {
        await notesStore.addNote(editedNote.value);
      }
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

  const updateNoteTitle = (newTitle: string) => {
    editedNote.value.title = newTitle;
  };

  const updateNoteFolder = (newFolder: string) => {
    editedNote.value.folder = newFolder;
  };

  const openDeleteAlert = () => {
    alertMessage.value = `Are you sure you want to delete the note "${editedNote.value.title}"?`;
    isAlertOpen.value = true;
  };

  const closeAlert = () => {
    isAlertOpen.value = false;
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

  function handleOutsideClick() {
    if (!hasChanges.value) {
      uiStore.closeNote();
    } else {
      uiStore.showToastMessage('You have unsaved changes.');
    }
  }

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
</script>
