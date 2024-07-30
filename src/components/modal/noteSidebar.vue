<template>
  <transition name="slide">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 flex items-center justify-center font-serif"
    >
      <div @click="attemptClose" class="absolute inset-0"></div>
      <div
        ref="sidebarContainer"
        :class="[
          'fixed inset-y-0 right-0 overflow-y-auto',
          {
            'custom-card-no-rounded-border w-full': uiStore.isExpanded,
            'custom-card w-3/4 md:w-2/5': !uiStore.isExpanded,
          },
        ]"
      >
        <div class="p-6">
          <div class="flex justify-end items-center mb-4">
            <div>
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
            <div class="relative inline-block text-left">
              <button
                @click="toggleDropdown"
                class="hover:underline outline-none flex items-center text-gray-600 dark:text-gray-300"
              >
                <div v-if="selectedFolder === DEFAULT_FOLDERS.ALL_NOTES">
                  {{ DEFAULT_FOLDERS.UNCATEGORIZED }}
                </div>
                <div v-else>{{ editedNote.folder }}</div>
                <span class="ml-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      v-if="isDropdownOpen"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 15l7-7 7 7"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </button>
              <div
                v-if="isDropdownOpen"
                class="dropdown-menu w-fit custom-card z-50 absolute mt-2"
              >
                <div class="py-1" role="menu" aria-orientation="vertical">
                  <div
                    @click="createNewFolder"
                    class="block px-4 py-2 text-sm cursor-pointer"
                    role="menuitem"
                  >
                    <span v-if="!creatingFolder" class="hover:underline">
                      + Create folder
                    </span>
                    <input
                      v-else
                      v-model="newFolderName"
                      @blur="saveNewFolder"
                      @keyup.enter="saveNewFolder"
                      class="bg-transparent border-b border-black dark:border-white outline-none w-full"
                    />
                  </div>
                  <template v-for="folder in availableFolders" :key="folder">
                    <div
                      @click="selectFolder(folder)"
                      class="block px-4 py-2 text-sm cursor-pointer"
                      role="menuitem"
                    >
                      <span
                        :class="
                          folder === selectedFolder
                            ? 'underline dark:text-white'
                            : ''
                        "
                        class="hover:underline"
                      >
                        {{ folder }}
                      </span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
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
          <textarea
            v-model="editedNote.content"
            placeholder="Content"
            class="w-full mt-4 bg-transparent resize-none outline-none flex-grow text-base placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
            :style="{ height: textareaHeight }"
          ></textarea>
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
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { Note } from '@/store/types';
  import { notesStore, folderStore, uiStore } from '@/store/stores';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import AlertModal from '@/components/modal/alertModal.vue';

  const props = defineProps<{
    noteId: number | null;
  }>();

  const emit = defineEmits(['close', 'update', 'delete']);

  const isEditMode = computed(() => props.noteId !== null);

  const editedNote = ref<Note>({
    id: Date.now(),
    title: '',
    content: '',
    time_created: new Date().toISOString(),
    last_edited: new Date().toISOString(),
    pinned: false,
    folder: DEFAULT_FOLDERS.UNCATEGORIZED,
  });

  const sidebarOpen = ref(true);
  const originalNote = ref<Note | null>(null);
  const selectedFolder = ref(DEFAULT_FOLDERS.UNCATEGORIZED);
  const isDropdownOpen = ref(false);
  const textareaHeight = ref('auto');
  const sidebarContainer = ref<HTMLElement | null>(null);
  const creatingFolder = ref(false);
  const newFolderName = ref('');
  const alertMessage = ref('');

  const availableFolders = computed(() => {
    return [
      ...folderStore.folders.filter(
        (folder) => folder !== DEFAULT_FOLDERS.ALL_NOTES
      ),
    ];
  });

  const isValid = computed(() => {
    return (
      editedNote.value.title.trim().length > 0 &&
      editedNote.value.title.length <= 30 &&
      editedNote.value.content.length <= 100000
    );
  });

  const hasChanges = computed(() => {
    if (!originalNote.value)
      return (
        editedNote.value.title.trim() !== '' ||
        editedNote.value.content.trim() !== ''
      );
    return notesStore.hasChanged(originalNote.value, editedNote.value);
  });

  function attemptClose() {
    if (!hasChanges.value) {
      closeSidebar();
    } else {
      uiStore.showToastMessage('You have unsaved changes.');
    }
  }

  function closeSidebar() {
    sidebarOpen.value = false;
    emit('close');
  }

  function selectFolder(folder: string) {
    selectedFolder.value = folder;
    editedNote.value.folder = folder;
    isDropdownOpen.value = false;
  }

  function toggleDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value;
  }

  function createNewFolder() {
    creatingFolder.value = true;
    newFolderName.value = '';
  }

  function saveNewFolder() {
    if (newFolderName.value.trim().length > 0) {
      folderStore.addFolder(newFolderName.value.trim());
      selectFolder(newFolderName.value.trim());
    }
    creatingFolder.value = false;
  }

  const saveNote = async () => {
    if (!isValid.value) return;

    if (isEditMode.value && hasChanges.value) {
      await notesStore.updateNote(editedNote.value);
    } else if (!isEditMode.value) {
      await notesStore.addNote(editedNote.value);
    }
    emit('close');
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
      emit('close');
    } catch (error) {
      console.error('Error deleting note:', error);
      uiStore.showToastMessage('Failed to delete note. Please try again.');
    }
    closeAlert();
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

  onMounted(() => {
    if (sidebarContainer.value) {
      textareaHeight.value = `${sidebarContainer.value.clientHeight - 248}px`;
    }
    if (sidebarOpen.value) {
      document.body.classList.add('modal-open');
    }
  });

  onUnmounted(() => {
    document.body.classList.remove('modal-open');
  });
</script>

<style scoped>
  .dropdown-menu {
    top: 100%;
    left: 0;
  }
</style>
