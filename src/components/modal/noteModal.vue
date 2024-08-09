<template>
  <ModalBackdrop v-model="props.isOpen" />
  <transition name="zoom">
    <div
      v-if="props.isOpen"
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
        <div
          class="absolute top-0 right-1 flex justify-between text-sm p-4 select-none w-full"
        >
          <!-- Left Section: Share Input, Copy Link, Public/Unpublic, and Markdown Preview -->
          <div class="flex items-center space-x-4">
            <div v-if="isNoteShared(noteId)" class="flex items-center ml-2">
              <input
                v-if="uiStore.isExpanded"
                :value="getTruncatedShareLink(noteId)"
                readonly
                class="mr-2 px-2 py-1 custom-card"
              />
              <button
                @click="copyShareLink(noteId)"
                class="px-2 py-1 custom-card flex items-center hover:bg-[#d9c698] dark:hover:bg-gray-700"
              >
                <PhCopy :size="20" class="size-5" />
                <span v-if="uiStore.isExpanded" class="hidden md:flex md:ml-2">
                  Copy link
                </span>
              </button>
            </div>
            <button
              v-if="authStore.isLoggedIn && noteId"
              class="ml-2 px-2 py-1 custom-card flex items-center hover:bg-[#d9c698] dark:hover:bg-gray-700"
              @click="toggleShare(editedNote.id)"
            >
              <PhGlobeX
                v-if="isNoteShared(editedNote.id)"
                :size="20"
                class="size-5"
              />
              <PhGlobe v-else :size="20" class="size-5" />
              <span v-if="uiStore.isExpanded" class="hidden md:flex md:ml-2">
                {{ isNoteShared(editedNote.id) ? 'Unpublic' : 'Make public' }}
              </span>
            </button>
            <button
              @click="toggleMarkdownPreview"
              class="flex items-center ml-2 px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
            >
              <PhMarkdownLogo :size="20" class="size-5" />
              <span v-if="uiStore.isExpanded" class="hidden md:flex md:ml-2">
                Preview
              </span>
            </button>
          </div>

          <!-- Right Section: Expand and Close -->
          <div class="flex items-center space-x-4">
            <button
              class="px-2 py-1 custom-card flex items-center hover:bg-[#d9c698] dark:hover:bg-gray-700"
              @click="uiStore.toggleExpand"
            >
              <PhArrowsIn :size="20" class="size-5" v-if="uiStore.isExpanded" />
              <PhArrowsOut :size="20" class="size-5" v-else />
            </button>
            <button
              class="px-2 py-1 custom-card flex items-center hover:bg-[#d9c698] dark:hover:bg-gray-700"
              @click="uiStore.closeNote"
            >
              <PhX :size="20" class="size-5" />
            </button>
          </div>
        </div>
        <h1 class="text-xl font-bold mt-10 mb-4">
          <input
            v-model="editedNote.title"
            placeholder="Title"
            class="w-full bg-transparent p-1 border-0 border-b-[1px] md:border-b-2 border-black dark:border-white outline-none placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
          />
        </h1>
        <textarea
          v-if="!uiStore.showPreview"
          v-model="editedNote.content"
          placeholder="Content"
          class="w-full p-2 mb-2 bg-transparent resize-none border-[1px] md:border-2 border-black dark:border-white rounded focus:outline-none flex-grow placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
          rows="7"
        ></textarea>
        <div
          v-if="uiStore.showPreview"
          class="prose dark:prose-dark markdown-body prism-highlight w-full p-2 mb-2 bg-transparent resize-none overflow-auto flex-grow"
          :class="{
            'border-[1px] md:border-2 border-black dark:border-white rounded':
              !uiStore.isExpanded,
          }"
          :style="markdownPreviewStyle"
          v-html="editedNote.renderedContent"
        ></div>
        <div class="flex justify-end">
          <div class="flex justify-end mt-1 select-none text-gray-500 text-sm">
            {{
              notesStore.localeDate(
                editedNote.last_edited || editedNote.time_created
              )
            }}
          </div>
        </div>
        <div class="flex justify-between mt-6 select-none text-sm">
          <FolderDropdown v-model="editedNote.folder" direction="up" />
          <div>
            <button
              @click="saveNote"
              :class="[
                'flex px-2 py-1 custom-card',
                {
                  'text-blue-500 hover:text-blue-300 hover:bg-blue-700':
                    isValid && (!isEditMode || hasChanges),
                  'text-gray-400 cursor-default':
                    !isValid || (isEditMode && !hasChanges),
                },
              ]"
            >
              <PhFloppyDisk :size="20" class="size-5 mr-2" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onBeforeUnmount } from 'vue';
  import {
    PhFloppyDisk,
    PhArrowsOut,
    PhArrowsIn,
    PhX,
    PhMarkdownLogo,
    PhCopy,
    PhGlobe,
    PhGlobeX,
  } from '@phosphor-icons/vue';
  import { Note } from '@/store/types';
  import { notesStore, folderStore, uiStore, authStore } from '@/store/stores';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import ModalBackdrop from '@/components/modal/modalBackdrop.vue';
  import FolderDropdown from '@/components/folderDropdown.vue';

  const props = defineProps<{
    noteId: number | null;
    isOpen: boolean;
  }>();

  const isNoteShared = (noteId: number | null) => {
    if (noteId === null) return false;
    return notesStore.sharedNotes.has(noteId);
  };

  const toggleMarkdownPreview = () => {
    uiStore.showPreview = !uiStore.showPreview;
    if (uiStore.showPreview) {
      notesStore.toggleMarkdownPreview(editedNote.value);
    }
  };

  const toggleShare = (noteId: number | null) => {
    if (noteId === null) return;
    notesStore.toggleShare(noteId);
  };

  const copyShareLink = (noteId: number | null) => {
    if (noteId === null) return;
    notesStore.copyShareLink(noteId);
  };

  const getTruncatedShareLink = (noteId: number | null) => {
    if (noteId === null) return '';
    return notesStore.getTruncatedShareLink(noteId);
  };

  const isEditMode = computed(() => props.noteId !== null);
  const originalNote = ref<Note | null>(null);

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

  const showInvalidNoteToast = () => {
    if (editedNote.value.title.trim().length === 0) {
      uiStore.showToastMessage('Title is required');
    } else if (editedNote.value.title.length > 30) {
      uiStore.showToastMessage('Title exceeds 30 characters');
    } else if (editedNote.value.content.length > 100000) {
      uiStore.showToastMessage('Content exceeds 100,000 characters');
    }
  };

  const showNoChangesNoteToast = () => {
    uiStore.showToastMessage('No changes yet');
  };

  const markdownPreviewStyle = computed((): Record<string, string> => {
    if (uiStore.isExpanded) {
      const availableHeight = window.innerHeight - 200;
      return {
        maxHeight: `${availableHeight}px`,
      };
    } else {
      return {
        height: '200px',
        overflowY: 'auto',
      };
    }
  });

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

  const saveNote = async () => {
    if (!isValid.value) {
      showInvalidNoteToast();
      return;
    }

    if (isEditMode.value && !hasChanges.value) {
      showNoChangesNoteToast();
      return;
    }

    if (isEditMode.value && hasChanges.value) {
      await notesStore.updateNote(editedNote.value);
      clearNoteModal();
      uiStore.closeNote();
    } else if (!isEditMode.value) {
      await notesStore.addNote(editedNote.value);
      clearNoteModal();
      uiStore.closeNote();
    }
  };

  const clearNoteModal = () => {
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

  onBeforeUnmount(() => {
    clearNoteModal();
  });
</script>
