<template>
  <div>
  <div class="custom-card flex h-full min-h-[800px] md:mx-auto md:max-w-5xl mt-10 rounded-lg border border-black dark:border-white overflow-hidden font-serif mx-4">
    <!-- Sidebar -->
    <div v-if="!isMobileView || !selectedNoteId" class="w-full md:w-1/4 overflow-y-auto rounded-l-lg select-none">
      <div
        v-for="(note, index) in notes"
        :key="note.id"
        @click="selectNote(note.id)"
        @contextmenu.prevent="(event) => showContextMenu(event, note)"
        class="p-4 cursor-pointer hover:bg-[#ebdfc0] dark:hover:bg-gray-700"
        :class="{
          'bg-[#ebdfc0] dark:bg-gray-700': isContextMenuOpenForNote(note.id) || selectedNoteId === note.id,
          'border-b border-black dark:border-white': index !== notes.length - 1
        }"
      >
        <h3 class="font-bold truncate">{{ note.title }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 truncate">{{ truncateContent(note.content) }}</p>
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>{{ note.folder }}</span>
          <span v-if="note.pinned">Pinned</span>
          <span>{{ notesStore.localeDate(note.last_edited || note.time_created) }}</span>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div v-if="(!isMobileView || selectedNoteId) && editedNote" class="w-full md:w-3/4 p-6 overflow-y-auto md:border-l border-black dark:border-white rounded-r-lg relative">
      <div v-if="selectedNote" class="h-full flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <div class="flex">
            <button v-if="isMobileView && selectedNoteId" @click="deselectNote" class="hover:underline md:hidden text-sm">Back</button>
          </div>
          <div class="flex justify-end">
            <button @click="openDeleteAlert" class="hover:underline text-red-500 mr-4 text-sm md:text-base">Delete</button>
            <button 
              @click="saveNote"
              :class="[
                'dark:hover:bg-transparent outline-none text-sm md:text-base',
                {
                  'hover:underline cursor-pointer': hasChanges,
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
          <div class="relative inline-block text-left">
            <button @click="toggleDropdown" class="hover:underline outline-none flex items-center text-gray-600 dark:text-gray-300">
              <div v-if="selectedFolder === DEFAULT_FOLDERS.ALL_NOTES">
                {{ DEFAULT_FOLDERS.UNCATEGORIZED }}
              </div>
              <div v-else>{{ selectedFolder }}</div>
              <span class="ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path v-if="isDropdownOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            <div v-if="isDropdownOpen" class="dropdown-menu w-fit custom-card z-50 absolute mt-2">
              <div class="py-1" role="menu" aria-orientation="vertical">
                <template v-for="folder in availableFolders" :key="folder">
                  <div @click="selectFolder(folder)" class="block px-4 py-2 text-sm cursor-pointer" role="menuitem">
                    <span :class="folder === selectedFolder ? 'underline dark:text-white' : ''" class="hover:underline">{{ folder }}</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
          <span class="ml-4 text-gray-600 dark:text-gray-300">Last edited: {{ notesStore.localeDate(selectedNote.last_edited || selectedNote.time_created) }}</span>
        </div>
        <div class="border-b border-gray-600 dark:border-gray-200 my-1"></div>
        <textarea 
          v-model="editedNote.content" 
          class="w-full mt-4 bg-transparent resize-none outline-none flex-grow"
          :style="{ height: textareaHeight }"
        ></textarea>
      </div>
    </div>
  </div>
  <contextMenu
    v-if="editedNote"
    :visible="showMenu"
    :position="menuPosition"
    :note="editedNote"
    :noteId="editedNote.id"
    @hideMenu="hideContextMenu"
    @edit="uiStore.openNote"
    @delete="openDeleteAlert"
    @download="notesStore.downloadNote"
    @pin="notesStore.pinNote"
    @unpin="notesStore.unpinNote"
  />
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
import contextMenu from '@/components/contextMenu/contextMenu.vue';
import alertModal from '@/components/modal/alertModal.vue';
import { Note } from '@/store/types';
import { DEFAULT_FOLDERS } from '@/store/constants';

const props = defineProps<{
  notes: Note[]
}>();

const selectedNoteId = ref<number | null>(null);
const isMobileView = ref(false);
const textareaHeight = ref('auto');
const isAlertOpen = ref(false);
const alertMessage = ref('');
const isDropdownOpen = ref(false);
const selectedFolder = ref('');
const editedNote = ref<Note | null>(null);
const isContextMenuOpenForNote = (noteId: number) => showMenu.value && editedNote.value?.id === noteId;
const showMenu = ref(false);
const menuPosition = ref({ x: 0, y: 0 });

const availableFolders = computed(() => {
    return [
      ...folderStore.folders.filter(
        (folder) => folder !== DEFAULT_FOLDERS.ALL_NOTES
      ),
    ];
});

const selectedNote = computed(() =>
  props.notes.find(note => note.id === selectedNoteId.value)
);

const hasChanges = computed(() => {
  if (!selectedNote.value || !editedNote.value) return false;
  return (
    selectedNote.value.title !== editedNote.value.title ||
    selectedNote.value.content !== editedNote.value.content ||
    selectedNote.value.folder !== editedNote.value.folder
  );
});

watch(selectedNote, (newNote) => {
  if (newNote) {
    editedNote.value = { ...newNote };
    selectedFolder.value = newNote.folder;
  } else {
    editedNote.value = null;
  }
});

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
  const note = props.notes.find(note => note.id === id);
  if (note) {
    editedNote.value = { ...note };
  }
}

function deselectNote() {
  selectedNoteId.value = null;
}

function truncateContent(content: string): string {
  return content.length > 100 ? content.slice(0, 100) + '...' : content;
}

function saveNote() {
  if (editedNote.value && hasChanges.value) {
    notesStore.updateNote(editedNote.value);
  }
}

const showContextMenu = (event: MouseEvent, note: Note) => {
  event.stopPropagation();
  menuPosition.value = { x: event.clientX, y: event.clientY };
  showMenu.value = true;
  editedNote.value = note;
};

const hideContextMenu = () => {
  showMenu.value = false;
};

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
      deselectNote();
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    uiStore.showToastMessage('Failed to delete note. Please try again.');
  }
  closeAlert();
};

const closeAlert = () => {
  isAlertOpen.value = false;
};

function updateTextareaHeight() {
  if (selectedNote.value) {
    const mainContent = document.querySelector('.w-full.md\\:w-3\\/4') as HTMLElement;
    if (mainContent) {
      const otherContentHeight = mainContent.offsetHeight - (document.querySelector('textarea') as HTMLElement).offsetHeight;
      textareaHeight.value = isMobileView.value ? `${mainContent.offsetHeight - otherContentHeight}px` : 'auto';
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

watch(selectedNoteId, updateTextareaHeight);

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize();
  if (isMobileView.value) {
    selectedNoteId.value = null;
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

</script>
