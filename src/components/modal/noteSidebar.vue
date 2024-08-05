<!-- noteSidebar.vue -->

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
          <div class="flex justify-between items-center mb-6 md:mb-8 text-sm">
            <div class="flex space-x-2">
              <button
                @click="uiStore.closeNote"
                class="flex items-center px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
              >
                <PhX :size="20" class="size-5" />
              </button>
              <button
                @click="uiStore.toggleExpand"
                class="flex items-center px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
              >
                <PhArrowsIn
                  :size="20"
                  class="size-5"
                  v-if="uiStore.isExpanded"
                />
                <PhArrowsOut :size="20" class="size-5" v-else />
              </button>
            </div>
            <div class="flex space-x-2">
              <button
                v-if="isEditMode"
                @click="openDeleteAlert"
                class="flex items-center px-2 py-1 custom-card text-red-500 hover:text-red-200 hover:bg-red-700/50 dark:hover:bg-red-800/60"
              >
                <PhTrash :size="20" class="size-5 md:mr-2" />
                <span class="hidden md:flex">Delete</span>
              </button>
              <button
                @click="saveNote"
                class="flex items-center px-2 py-1 custom-card"
                :class="
                  isValid && hasChanges
                    ? 'text-blue-500 hover:text-blue-300 hover:bg-blue-700'
                    : 'text-gray-400 cursor-default'
                "
                :disabled="!isValid || !hasChanges"
              >
                <PhFloppyDisk :size="20" class="size-5 md:mr-2" />
                <span class="hidden md:flex">Save</span>
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
            class="flex justify-between items-center text-xs md:text-sm mb-4 whitespace-nowrap"
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
          <div
            class="bg-black dark:bg-gray-400 h-px transition-all duration-300"
          ></div>
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
        @confirm="confirmDelete"
        @cancel="closeAlert"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import {
    PhFloppyDisk,
    PhTrash,
    PhArrowsOut,
    PhArrowsIn,
    PhX,
  } from '@phosphor-icons/vue';
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
