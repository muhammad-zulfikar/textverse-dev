<template>
  <div>
    <div
      class="custom-card flex h-full min-h-[800px] md:mx-auto md:max-w-5xl mt-10 rounded-lg border border-black dark:border-white overflow-hidden font-serif mx-1"
    >
      <!-- Sidebar -->
      <div
        v-if="!isMobileView || (!selectedNoteId && !uiStore.isCreatingNote)"
        class="w-full md:w-1/4 overflow-y-auto rounded-l-lg select-none"
      >
        <div
          v-for="(note, index) in notesToDisplay"
          :key="note.id"
          @click="selectNote(note.id)"
          class="list p-4 cursor-pointer hover:bg-[#ebdfc0] dark:hover:bg-gray-700"
          :class="{
            'bg-[#ebdfc0] dark:bg-gray-700':
              isContextMenuOpenForNote(note.id) || selectedNoteId === note.id,
            'border-b border-black dark:border-white':
              index !== notesToDisplay.length - 1,
          }"
        >
          <h3 class="font-bold truncate">{{ note.title || 'Untitled' }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 truncate">
            {{ truncateContent(note.content) }}
          </p>
          <div
            class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2"
          >
            <span
              class="hover:underline"
              @click.stop="folderStore.setCurrentFolder(note.folder)"
            >
              {{ note.folder }}
            </span>
            <span v-if="note.pinned">Pinned</span>
            <span>
              {{ notesStore.localeDate(note.last_edited || note.time_created) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Note Content Area -->
      <div
        v-if="
          (!isMobileView && (selectedNoteId || uiStore.isCreatingNote)) ||
          (isMobileView && (selectedNoteId || uiStore.isCreatingNote))
        "
        class="w-full md:w-3/4 p-6 overflow-y-auto md:border-l border-black dark:border-white rounded-r-lg relative"
      >
        <div v-if="editedNote" class="h-full flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <div class="flex">
              <button
                v-if="isMobileView"
                @click="cancelNote"
                class="hover:underline md:hidden text-sm"
              >
                Back
              </button>
            </div>
            <div class="flex justify-end">
              <button
                v-if="!uiStore.isCreatingNote"
                @click="openDeleteAlert"
                class="hover:underline text-red-500 mr-4 text-sm md:text-base"
              >
                Delete
              </button>
              <button
                v-if="uiStore.isCreatingNote"
                @click="cancelNote"
                class="hover:underline mr-4 text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                @click="saveNote"
                :class="[
                  'dark:hover:bg-transparent outline-none text-sm md:text-base',
                  {
                    'text-blue-500 hover:underline cursor-pointer': hasChanges,
                    'text-gray-500 cursor-not-allowed': !hasChanges,
                  },
                ]"
                :disabled="!hasChanges"
              >
                Save
              </button>
            </div>
          </div>
          <div class="mb-2 text-sm">
            <input
              v-model="editedNote.title"
              placeholder="Title"
              class="text-2xl md:text-3xl font-bold w-full bg-transparent mb-1 outline-none placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
            />
          </div>
          <div class="flex justify-between items-center text-sm mb-4">
            <FolderDropdown v-model="editedNote.folder" direction="down" />
            <span class="ml-4 text-gray-600 dark:text-gray-300">
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
            class="w-full mt-4 bg-transparent resize-none outline-none flex-grow"
            :style="{ height: textareaHeight }"
          ></textarea>
        </div>
      </div>
    </div>
    <div v-if="isAlertOpen" class="fixed inset-0 bg-black bg-opacity-50"></div>
    <alertModal
      :is-open="isAlertOpen"
      :message="alertMessage"
      @confirm="confirmDelete"
      @cancel="closeAlert"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { notesStore, uiStore, folderStore } from '@/store/stores';
  import alertModal from '@/components/modal/alertModal.vue';
  import { Note } from '@/store/types';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import FolderDropdown from '@/components/folderDropdown.vue';

  const props = defineProps<{
    notes: Note[];
  }>();

  const selectedNoteId = ref<number | null>(null);
  const isMobileView = ref(false);
  const textareaHeight = ref('auto');
  const isAlertOpen = ref(false);
  const alertMessage = ref('');
  const isDropdownOpen = ref(false);
  const selectedFolder = ref('');
  const editedNote = ref<Note | null>(null);
  const isContextMenuOpenForNote = (noteId: number) =>
    editedNote.value?.id === noteId;

  const availableFolders = computed(() => {
    return [
      ...folderStore.folders.filter(
        (folder) => folder !== DEFAULT_FOLDERS.ALL_NOTES
      ),
    ];
  });

  const selectedNote = computed(() =>
    props.notes.find((note) => note.id === selectedNoteId.value)
  );

  const hasChanges = computed(() => {
    if (!selectedNote.value && !uiStore.isCreatingNote) return false;
    if (uiStore.isCreatingNote) {
      return (
        editedNote.value!.title.trim() !== '' ||
        editedNote.value!.content.trim() !== ''
      );
    }
    return notesStore.hasChanged(selectedNote.value!, editedNote.value!);
  });

  const notesToDisplay = computed(() => {
    if (uiStore.isCreatingNote && editedNote.value) {
      return [editedNote.value, ...props.notes];
    }
    return props.notes;
  });

  watch(selectedNote, (newNote) => {
    if (newNote) {
      editedNote.value = { ...newNote };
      selectedFolder.value = newNote.folder;
    } else if (uiStore.isCreatingNote) {
      createNewNote();
    } else {
      editedNote.value = null;
    }
  });

  watch(
    () => uiStore.isCreatingNote,
    (isCreating) => {
      if (isCreating) {
        createNewNote();
      }
    }
  );

  function createNewNote() {
    const newNote: Note = {
      id: Date.now(),
      title: '',
      content: '',
      folder: DEFAULT_FOLDERS.UNCATEGORIZED,
      time_created: new Date().toISOString(),
      last_edited: new Date().toISOString(),
      pinned: false,
    };
    editedNote.value = newNote;
    selectedFolder.value = DEFAULT_FOLDERS.UNCATEGORIZED;
    selectedNoteId.value = null;
  }

  function selectFolder(folder: string) {
    selectedFolder.value = folder;
    if (editedNote.value) {
      editedNote.value.folder = folder;
    }
    isDropdownOpen.value = false;
  }

  function toggleDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value;
  }

  function selectNote(id: number) {
    selectedNoteId.value = id;
    uiStore.isCreatingNote = false;
    const note = props.notes.find((note) => note.id === id);
    if (note) {
      editedNote.value = { ...note };
    }
  }

  function deselectNote() {
    selectedNoteId.value = null;
  }

  function cancelNote() {
    if (uiStore.isCreatingNote) {
      uiStore.isCreatingNote = false;
    }
    selectedNoteId.value = null;
    editedNote.value = null;
    if (!isMobileView.value) {
      selectNewestNote();
    }
  }

  function truncateContent(content: string): string {
    return content.length > 100 ? content.slice(0, 100) + '...' : content;
  }

  async function saveNote() {
    if (editedNote.value && hasChanges.value) {
      if (uiStore.isCreatingNote) {
        try {
          const newNoteId = await notesStore.addNote(editedNote.value);
          uiStore.isCreatingNote = false;
          if (!isMobileView.value && typeof newNoteId === 'number') {
            selectNote(newNoteId);
          }
        } catch (error) {
          uiStore.showToastMessage('Failed to add new note. Please try again.');
        }
      } else {
        try {
          await notesStore.updateNote(editedNote.value);
        } catch (error) {
          uiStore.showToastMessage('Failed to update note. Please try again.');
        }
      }
      cancelNote();
    }
  }

  const openDeleteAlert = () => {
    if (selectedNote.value) {
      alertMessage.value = `Are you sure you want to delete the note "${selectedNote.value.title}"?`;
      isAlertOpen.value = true;
    }
  };

  const confirmDelete = async () => {
    try {
      if (selectedNote.value) {
        await notesStore.deleteNote(selectedNote.value.id);
        cancelNote();
        deselectNote();
      }
    } catch (error) {
      uiStore.showToastMessage('Failed to delete note. Please try again.');
    }
    closeAlert();
  };

  const closeAlert = () => {
    isAlertOpen.value = false;
  };

  function updateTextareaHeight() {
    if (selectedNote.value || uiStore.isCreatingNote) {
      const mainContent = document.querySelector(
        '.w-full.md\\:w-3\\/4'
      ) as HTMLElement;
      if (mainContent) {
        const otherContentHeight =
          mainContent.offsetHeight -
          (document.querySelector('textarea') as HTMLElement).offsetHeight;
        textareaHeight.value = isMobileView.value
          ? `${mainContent.offsetHeight - otherContentHeight}px`
          : 'auto';
      }
    }
  }

  function handleResize() {
    isMobileView.value = window.innerWidth < 768;
    if (!isMobileView.value && props.notes.length) {
      if (!selectedNoteId.value) {
        selectedNoteId.value = props.notes[0].id;
      }
    }
    updateTextareaHeight();
  }

  function selectNewestNote(): number | null {
    if (props.notes.length === 0) return null;

    const newestNote = props.notes.reduce((newest, current) => {
      const newestDate = new Date(newest.last_edited || newest.time_created);
      const currentDate = new Date(current.last_edited || current.time_created);
      return currentDate > newestDate ? current : newest;
    }, props.notes[0]);

    if (newestNote) {
      selectNote(newestNote.id);
      return newestNote.id;
    }

    return null;
  }

  watch(selectedNoteId, updateTextareaHeight);

  onMounted(() => {
    window.addEventListener('resize', handleResize);
    handleResize();

    if (!isMobileView.value) {
      const newestNoteId = selectNewestNote();
      if (newestNoteId !== null) {
        selectedNoteId.value = newestNoteId;
        editedNote.value =
          props.notes.find((note) => note.id === newestNoteId) || null;
      }
    }
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });
</script>

<style scoped>
  .list:active {
    transform: scale(0.98);
    transition-duration: 200ms;
  }
</style>
