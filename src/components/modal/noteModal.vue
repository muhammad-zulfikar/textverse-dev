<!-- noteModal.vue -->

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center font-serif"
  >
    <div
      @click="handleOutsideClick"
      class="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-[2px]"
    ></div>
    <div
      @click.stop
      :class="[
        'p-5 relative flex flex-col',
        {
          'custom-card-no-transition w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3':
            !uiStore.isFullScreen,
          'custom-card-no-transition-rounded w-full h-full rounded-none border-none':
            uiStore.isFullScreen,
        },
      ]"
    >
      <div class="absolute top-0 right-1 flex text-sm p-4 select-none">
        <button
          class="hover:underline hover:bg-transparent dark:hover:bg-transparent outline-none mr-6"
          @click="uiStore.toggleFullScreen"
        >
          {{ uiStore.isFullScreen ? 'Collapse' : 'Expand' }}
        </button>
        <button
          class="hover:underline hover:bg-transparent dark:hover:bg-transparent outline-none"
          @click="closeModal"
        >
          Close
        </button>
      </div>
      <h1 class="text-xl font-bold mb-4 mt-8">
        <input
          v-model="editedNote.title"
          placeholder="Title"
          class="w-full bg-transparent p-1 border-0 border-b-[1px] md:border-b-2 border-black dark:border-white outline-none placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
        />
        <span
          :class="[
            'flex justify-end font-normal text-gray-500 text-sm mt-1',
            { 'text-red-500': editedNote.title.length > 30 },
          ]"
        >
          {{ editedNote.title.length }} / 30
        </span>
      </h1>
      <textarea
        v-model="editedNote.content"
        placeholder="Content"
        class="w-full p-2 bg-transparent resize-none border-[1px] md:border-2 border-black dark:border-white rounded focus:outline-none flex-grow placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
        rows="5"
      ></textarea>
      <div class="flex justify-between">
        <div
          v-if="isEditMode"
          class="flex justify-end mt-1 select-none text-gray-500 text-sm"
        >
          {{ formattedDate }}
        </div>
        <span
          :class="[
            'flex justify-end text-gray-500 text-sm mt-1 select-none',
            { 'text-red-500': editedNote.content.length > 100000 },
          ]"
        >
          {{ editedNote.content.length }} / 100000
        </span>
      </div>
      <div class="flex justify-between mt-6 select-none text-sm">
        <div class="relative inline-block text-left" ref="dropdownRef">
          <button
            @click.stop="toggleDropdown"
            :class="{ 'z-50': isOpen }"
            type="button"
            class="hover:underline outline-none flex items-center relative cursor-pointer"
          >
            <div v-if="selectedFolder === DEFAULT_FOLDERS.ALL_NOTES">
              {{ DEFAULT_FOLDERS.UNCATEGORIZED }}
            </div>
            <div v-else>{{ selectedFolder }}</div>
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
            class="dropdown-menu w-fit custom-card z-50 absolute mt-2 whitespace-nowrap"
          >
            <div class="py-1" role="menu" aria-orientation="vertical">
              <div
                @click.stop="createNewFolder"
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
                  @click.stop="selectFolder(folder)"
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
        <div>
          <button
            :disabled="!isValid || (isEditMode && !hasChanges)"
            @click="saveNote"
            :class="[
              'dark:hover:bg-transparent outline-none text-sm',
              {
                'hover:underline cursor-pointer':
                  isValid && (!isEditMode || hasChanges),
                'text-gray-500': !isValid || (isEditMode && !hasChanges),
              },
            ]"
          >
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted, PropType } from 'vue';
  import { notesStore, folderStore, uiStore } from '@/store/stores';
  import { Note } from '@/store/types';
  import { DEFAULT_FOLDERS } from '@/store/constants';

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

  const emit = defineEmits(['close']);

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
  const isDropdownOpen = ref(false);
  const creatingFolder = ref(false);
  const newFolderName = ref('');
  const dropdownRef = ref<HTMLElement | null>(null);

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

  const availableFolders = computed(() => {
    return [
      ...folderStore.folders.filter(
        (folder) => folder !== DEFAULT_FOLDERS.ALL_NOTES
      ),
    ];
  });

  const formattedDate = computed(() => {
    if (!editedNote.value) return '';
    const date = new Date(
      editedNote.value.last_edited || editedNote.value.time_created
    );
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  });

  const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
  };

  const selectFolder = (folder: string) => {
    selectedFolder.value = folder;
    editedNote.value.folder = folder;
    isDropdownOpen.value = false;
  };

  const createNewFolder = () => {
    creatingFolder.value = true;
    newFolderName.value = '';
  };

  const saveNewFolder = () => {
    if (newFolderName.value.trim().length > 0) {
      folderStore.addFolder(newFolderName.value.trim());
      selectFolder(newFolderName.value.trim());
    }
    creatingFolder.value = false;
    isDropdownOpen.value = false;
  };

  const saveNote = async () => {
    if (!isValid.value) return;

    if (isEditMode.value && hasChanges.value) {
      await notesStore.updateNote(editedNote.value);
    } else if (!isEditMode.value) {
      await notesStore.addNote(editedNote.value);
    }
    closeModal();
  };

  const handleOutsideClick = () => {
    if (!isEditMode.value || (isEditMode.value && !hasChanges.value)) {
      closeModal();
    } else {
      uiStore.showToastMessage('You have unsaved changes!');
    }
  };

  const closeModal = () => {
    emit('close');
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      isDropdownOpen.value = false;
      if (creatingFolder.value) {
        saveNewFolder();
      }
    }
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

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<style scoped>
  .modal-open {
    overflow: hidden;
  }

  .dropdown-menu {
    top: -100%;
    left: 0;
    transform: translateY(-100%);
  }
</style>
