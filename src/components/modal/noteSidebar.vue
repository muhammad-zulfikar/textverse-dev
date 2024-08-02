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
          'fixed inset-y-0 right-0 overflow-y-auto flex flex-col',
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
        <div class="p-6 flex flex-col h-full">
          <div class="flex justify-end items-center mb-4">
            <div>
              <button
                @click="uiStore.closeNote"
                class="text-gray-600 dark:text-gray-300 hover:underline mr-4 text-sm md:text-md"
              >
                Close
              </button>
              <button
                @click="uiStore.toggleExpand"
                class="text-gray-600 dark:text-gray-300 hover:underline mr-4 text-sm md:text-md"
              >
                {{ uiStore.isExpanded ? 'Collapse' : 'Expand' }}
              </button>
              <button
                v-if="isEditMode"
                @click="openDeleteAlert"
                class="text-red-500 hover:underline mr-4 text-sm md:text-md"
              >
                Delete
              </button>
              <button
                @click="saveNote"
                class="text-sm md:text-md"
                :class="
                  isValid && hasChanges
                    ? 'text-blue-500 hover:underline'
                    : 'text-gray-400 cursor-not-allowed'
                "
                :disabled="!isValid || !hasChanges"
              >
                Save
              </button>
            </div>
          </div>
          <div class="mb-2">
            <input
              v-model="editedNote.title"
              placeholder="Title"
              class="text-2xl md:text-3xl font-bold w-full bg-transparent mb-1 outline-none placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
            />
          </div>
          <div
            class="flex justify-between items-center text-sm mb-4 whitespace-nowrap"
          >
            <FolderDropdown v-model="editedNote.folder" direction="down" />
            <span
              v-if="isEditMode"
              class="ml-4 text-gray-600 dark:text-gray-300"
            >
              Last edited:
              {{
                notesStore.localeDate(
                  editedNote.last_edited || editedNote.time_created
                )
              }}
            </span>
          </div>
          <div class="border-b border-gray-600 dark:border-gray-200 my-1"></div>
          <div class="flex-grow overflow-hidden mt-4">
            <textarea
              v-model="editedNote.content"
              placeholder="Content"
              class="w-full h-full bg-transparent resize-none outline-none text-base placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
            ></textarea>
          </div>
        </div>
      </div>

      <AlertModal
        :is-open="uiStore.isAlertOpen"
        :message="alertMessage"
        class="fixed inset-0 z-50 flex items-center justify-center"
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
  import ModalBackdrop from '@/components/modal/modalBackdrop.vue';
  import AlertModal from '@/components/modal/alertModal.vue';
  import FolderDropdown from '@/components/folderDropdown.vue';

  const props = defineProps<{
    noteId: number | null;
    isOpen: boolean;
  }>();

  const isEditMode = computed(() => props.noteId !== null);
  const originalNote = ref<Note | null>(null);
  const sidebarContainer = ref<HTMLElement | null>(null);
  const alertMessage = ref('');

  const editedNote = ref<Note>({
    id: Date.now(),
    title: '',
    content: '',
    time_created: new Date().toISOString(),
    last_edited: new Date().toISOString(),
    pinned: false,
    folder: DEFAULT_FOLDERS.UNCATEGORIZED,
  });

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

  const saveNote = async () => {
    if (!isValid.value) {
      showInvalidNoteToast();
      return;
    }

    if (isEditMode.value && hasChanges.value) {
      await notesStore.updateNote(editedNote.value);
    } else if (!isEditMode.value) {
      await notesStore.addNote(editedNote.value);
    }
    uiStore.closeNote();
  };

  const showInvalidNoteToast = () => {
    if (editedNote.value.title.trim().length === 0) {
      uiStore.showToastMessage('Title is required');
    } else if (editedNote.value.title.length > 30) {
      uiStore.showToastMessage('Title exceeds 30 characters');
    } else if (editedNote.value.content.length > 100000) {
      uiStore.showToastMessage('Content exceeds 100,000 characters');
    }
  };

  const openDeleteAlert = () => {
    alertMessage.value = `Are you sure you want to delete the note "${editedNote.value.title}"?`;
    uiStore.isAlertOpen = true;
  };

  const closeAlert = () => {
    uiStore.isAlertOpen = false;
  };

  const confirmDelete = async () => {
    try {
      await notesStore.deleteNote(editedNote.value.id);
      uiStore.closeNote();
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
        editedNote.value = {
          id: Date.now(),
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
        originalNote.value = null;
      }
    },
    { immediate: true }
  );
</script>
