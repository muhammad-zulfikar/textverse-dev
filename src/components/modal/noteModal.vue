<!-- noteModal.vue -->

<template>
  <transition name="zoom">
    <div
      v-if="uiStore.isNoteCardOpen"
      class="fixed inset-0 z-50 flex items-center justify-center font-serif"
    >
      <div @click="handleOutsideClick" class="absolute inset-0"></div>
      <div
        @click.stop
        :class="[
          'p-5 relative flex flex-col',
          {
            'custom-card-no-rounded-border w-full h-full':
              uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur-no-rounded-border w-full h-full':
              uiStore.isExpanded && uiStore.blurEnabled,
            'custom-card w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3':
              !uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3':
              !uiStore.isExpanded && uiStore.blurEnabled,
          },
        ]"
      >
        <div class="absolute top-0 right-1 flex text-sm p-4 select-none">
          <button
            class="hover:underline hover:bg-transparent dark:hover:bg-transparent outline-none mr-6"
            @click="uiStore.toggleExpand"
          >
            {{ uiStore.isExpanded ? 'Collapse' : 'Expand' }}
          </button>
          <button
            class="hover:underline hover:bg-transparent dark:hover:bg-transparent outline-none"
            @click="closeModal"
          >
            Close
          </button>
        </div>
        <h1 class="text-xl font-bold mt-8 mb-4">
          <input
            v-model="editedNote.title"
            placeholder="Title"
            class="w-full bg-transparent p-1 border-0 border-b-[1px] md:border-b-2 border-black dark:border-white outline-none placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
          />
        </h1>
        <textarea
          v-model="editedNote.content"
          placeholder="Content"
          class="w-full p-2 mb-2 bg-transparent resize-none border-[1px] md:border-2 border-black dark:border-white rounded focus:outline-none flex-grow placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
          rows="7"
        ></textarea>
        <div class="flex justify-end">
          <div class="flex justify-end mt-1 select-none text-gray-500 text-sm">
            {{ formattedDate }}
          </div>
        </div>
        <div class="flex justify-between mt-6 select-none text-sm">
          <FolderDropdown v-model="editedNote.folder" direction="up" />
          <div>
            <button
              @click="saveNote"
              :class="[
                'dark:hover:bg-transparent outline-none text-sm',
                {
                  'text-blue-500 hover:underline cursor-pointer':
                    isValid && (!isEditMode || hasChanges),
                  'text-gray-500 cursor-pointer':
                    !isValid || (isEditMode && !hasChanges),
                },
              ]"
            >
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { ref, computed, watch, PropType } from 'vue';
  import { notesStore, folderStore, uiStore } from '@/store/stores';
  import { Note } from '@/store/types';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import FolderDropdown from '@/components/folderDropdown.vue';

  const props = defineProps({
    isOpen: {
      type: Boolean,
      required: true,
    },
    noteId: {
      type: Number as PropType<number | null | undefined>,
      default: null,
    },
  });

  const editedNote = ref<Note>({
    id: Date.now(),
    title: '',
    content: '',
    time_created: new Date().toISOString(),
    last_edited: new Date().toISOString(),
    pinned: false,
    folder: DEFAULT_FOLDERS.UNCATEGORIZED,
  });

  const originalNote = ref<Note | null>(null);
  const isEditMode = computed(() => props.noteId !== null);
  const selectedFolder = ref(DEFAULT_FOLDERS.UNCATEGORIZED);

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

  const formattedDate = computed(() => {
    if (!editedNote.value) return '';
    const date = new Date(
      editedNote.value.last_edited || editedNote.value.time_created
    );
    return notesStore.localeDate(date);
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
    closeModal();
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

  const handleOutsideClick = () => {
    if (!isEditMode.value && isValid.value) {
      uiStore.showToastMessage('You have unsaved changes!');
    } else if (!isEditMode.value || (isEditMode.value && !hasChanges.value)) {
      closeModal();
    } else {
      uiStore.showToastMessage('You have unsaved changes!');
    }
  };

  const closeModal = () => {
    uiStore.isNoteCardOpen = false;
  };

  watch(
    () => props.isOpen,
    (newValue) => {
      if (newValue) {
        document.body.classList.add('modal-open');
        if (isEditMode.value) {
          const note = notesStore.notes.find((n) => n.id === props.noteId);
          if (note) {
            editedNote.value = { ...note };
            originalNote.value = { ...note };
            selectedFolder.value = note.folder;
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
          selectedFolder.value =
            folderStore.currentFolder !== DEFAULT_FOLDERS.ALL_NOTES
              ? folderStore.currentFolder
              : DEFAULT_FOLDERS.UNCATEGORIZED;
        }
      } else {
        document.body.classList.remove('modal-open');
      }
    }
  );
</script>
