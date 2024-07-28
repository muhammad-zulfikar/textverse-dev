<!-- cardView.vue -->

<template>
  <ul
    :class="[
      'w-11/12 mx-auto mt-10',
      {
        'columns-1 md:max-w-xl': uiStore.columns === 1,
        'columns-2 md:gap-7 md:max-w-4xl': uiStore.columns === 2,
        'columns-3 sm:columns-2 md:columns-3 gap-8': uiStore.columns === 3,
        'columns-4 sm:columns-2 md:columns-3 lg:columns-4 gap-5': uiStore.columns === 4,
        'columns-5 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3': uiStore.columns === 5,
      },
    ]"
  >
    <li
      v-for="note in props.notes"
      :key="note.id"
      class="custom-card break-inside-avoid h-min mb-6 md:mb-8 p-2 flex flex-col overflow-x-auto cursor-pointer relative group select-none"
      :class="{ 'z-50': showMenu && selectedNote?.id === note.id, shadow: note.pinned }"
      @contextmenu.prevent="(event) => showContextMenu(event, note)"
      @click="() => handleCardClick(note)"
    >
      <div class="flex justify-between items-start">
        <h1 class="font-bold text-sl font-serif cursor-pointer dark:text-white">
          {{ note.title }}
        </h1>
      </div>
      <div>
        <div
          v-if="!showOption"
          class="font-serif text-sm mt-2 dark:text-white truncate-text"
          v-html="truncatedContent(note.content)"
        ></div>
        <div
          v-if="!showOption"
          class="flex items-center justify-between pt-3 mt-auto font-serif text-gray-500 dark:text-gray-400 text-xs"
        >
          <div
            v-if="note.folder !== DEFAULT_FOLDERS.UNCATEGORIZED"
            class="w-1/3 text-left text-[10px] md:text-xs"
          >
            <p
              class="cursor-pointer hover:underline truncate"
              @click.stop="goToFolder(note.folder)"
            >
              {{ note.folder }}
            </p>
          </div>
          <div v-else class="w-1/3">
            <!-- Empty div to maintain layout when there's no folder -->
          </div>

          <div class="w-1/3 text-center text-[10px] md:text-xs">
            <p v-if="note.pinned">Pinned</p>
          </div>

          <div class="w-1/3 text-right text-[10px] md:text-xs">
            {{ formattedDate(note.last_edited || note.time_created) }}
          </div>
        </div>
      </div>
    </li>
  </ul>
  <ContextMenu
    v-if="selectedNote"
    :visible="showMenu"
    :position="menuPosition"
    :note="selectedNote"
    :noteId="selectedNote.id"
    @hideMenu="hideContextMenu"
    @edit="uiStore.openNote"
    @delete="openDeleteAlert"
    @download="notesStore.downloadNote"
    @pin="pinNote"
    @unpin="unpinNote"
  />
  <AlertModal
    :is-open="isAlertOpen"
    :message="alertMessage"
    @confirm="confirmDelete"
    @cancel="closeAlert"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { notesStore, folderStore, uiStore } from '@/store/stores';
import { Note } from '@/store/types';
import { DEFAULT_FOLDERS } from '@/store/constants';
import ContextMenu from '@/components/contextMenu/contextMenu.vue';
import AlertModal from '@/components/modal/alertModal.vue';

const props = defineProps<{
  notes: Note[]
}>();

const showOption = ref(false);
const showMenu = ref(false);
const menuPosition = ref({ x: 0, y: 0 });
const selectedNote = ref<Note | null>(null);

const isAlertOpen = ref(false);
const alertMessage = ref('');

const truncatedContent = (content: string) => {
  const div = document.createElement('div');
  div.innerHTML = content;
  const textContent = div.textContent || div.innerText || '';
  const lines = textContent.split('\n');
  if (lines.length > 10) {
    return lines.slice(0, 10).join('\n') + '...';
  }
  return content;
};

const showContextMenu = (event: MouseEvent, note: Note) => {
  event.stopPropagation();
  uiStore.setActiveDropdown(showMenu.value ? 'create' : null);
  menuPosition.value = { x: event.clientX, y: event.clientY };
  showMenu.value = true;
  selectedNote.value = note;
};

const hideContextMenu = () => {
  showMenu.value = false;
  selectedNote.value = null;
};

const goToFolder = (folder: string) => {
  folderStore.setCurrentFolder(folder);
};

const formattedDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const openDeleteAlert = () => {
  hideContextMenu();
  if (selectedNote.value) {
    alertMessage.value = `Are you sure you want to delete the note "${selectedNote.value.title}"?`;
    isAlertOpen.value = true;
  }
};

const closeAlert = () => {
  isAlertOpen.value = false;
};

const pinNote = async () => {
  if (selectedNote.value) {
    notesStore.pinNote(selectedNote.value.id);
  }
};

const unpinNote = async () => {
  if (selectedNote.value) {
    notesStore.unpinNote(selectedNote.value.id);
  }
};

const confirmDelete = async () => {
  try {
    if (selectedNote.value) {
      notesStore.deleteNote(selectedNote.value.id);
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    uiStore.showToastMessage('Failed to delete note. Please try again.');
  }
  closeAlert();
};

const handleCardClick = (note: Note) => {
  uiStore.openNote(note.id);
};
</script>

<style scoped>
.dark .icon {
  filter: invert(1) brightness(2);
}

.option-icon {
  display: none;
}

.group:hover .option-icon {
  display: block;
}

.underline {
  text-decoration: underline;
}

.shadow {
  box-shadow:
    0 30px 60px -15px rgba(0, 0, 0, 0.3),
    0 12px 16px -8px rgba(0, 0, 0, 0.2);
}

.shadow:hover {
  box-shadow:
    0 30px 60px -15px rgba(0, 0, 0, 0.3),
    0 12px 16px -8px rgba(0, 0, 0, 0.2);
}
</style>