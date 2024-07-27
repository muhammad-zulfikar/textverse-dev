<template>
  <div class="w-full max-w-5xl mx-auto px-4 md:px-0 text-sm md:text-base">
    <div class="flex justify-end mb-4 relative">
      <div class="relative inline-block text-left whitespace-nowrap mr-5" ref="showDropdownRef">
        <button
          @click.stop="toggleShowDropdown"
          :class="{ 'z-50': showDropdownOpen }"
          class="hover:underline dark:hover:bg-transparent outline-none flex items-center relative font-serif"
        >
          Show
          <span class="ml-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                v-if="showDropdownOpen"
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
          v-if="showDropdownOpen"
          class="custom-card z-50 origin-top-left absolute left-0 mt-2 w-fit ml-[-25px] font-serif"
        >
          <div class="py-1" role="menu" aria-orientation="vertical">
            <a
            v-for="column in availableColumns"
            :key="column"
            @click.stop="toggleColumn(column)"
            class="block px-4 py-2 text-sm cursor-pointer hover:underline flex items-center"
            role="menuitem"
          >
            <input
              type="checkbox"
              :checked="visibleColumns.includes(column)"
              class="mr-2"
              @click.stop
            >
            {{ column }}
          </a>
          </div>
        </div>
      </div>
      <button
        @click="toggleSelectMode"
        class="hover:underline font-serif"
      >
        Select
      </button>
      <button
        v-if="selectMode && selectedNotes.length > 0"
        @click="confirmDeleteSelectedNotes"
        class="ml-5 hover:underline font-serif text-red-500"
      >
        Delete
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-[800px] w-full border-separate border-spacing-0 font-serif rounded-lg overflow-hidden">
        <thead>
          <tr class="bg-[#ebdfc0] dark:bg-gray-800">
            <th v-if="selectMode" class="p-3 text-left w-10 border-b-[1px] border-r-[1px] border-black dark:border-white">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
              >
            </th>
            <th v-for="column in visibleColumns" :key="column" class="p-3 text-left border-b-[1px] border-r-[1px] border-black dark:border-white whitespace-nowrap">
              {{ column }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="note in notes" :key="note.id" class="bg-cream dark:bg-gray-750">
            <td v-if="selectMode" class="p-3 w-10 border-b-[1px] border-r-[1px] border-black dark:border-white">
              <input
                type="checkbox"
                :checked="selectedNotes.includes(note.id)"
                @change="toggleNoteSelection(note.id)"
              >
            </td>
            <td v-if="visibleColumns.includes('Title')" class="md:w-[200px] p-3 border-b-[1px] border-r-[1px] border-black dark:border-white">
              <span 
                class="cursor-pointer hover:underline line-clamp-2"
                @click="openNote(note.id)"
              >
                {{ note.title }}
              </span>
            </td>
            <td v-if="visibleColumns.includes('Content')" class="p-3 border-b-[1px] border-r-[1px] border-black dark:border-white">
              <div class="line-clamp-2">{{ note.content }}</div>
            </td>
            <td v-if="visibleColumns.includes('Folder')" class="p-3 border-b-[1px] border-r-[1px] border-black dark:border-white">
              <div class="line-clamp-2">{{ note.folder }}</div>
            </td>
            <td v-if="visibleColumns.includes('Date')" class="p-3 border-b-[1px] border-r-[1px] border-black dark:border-white whitespace-nowrap">
              {{ formatDate(note.last_edited || note.time_created) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AlertModal
      :is-open="showDeleteConfirmation"
      :message="`Are you sure you want to delete ${selectedNotes.length} note(s)?`"
      @cancel="showDeleteConfirmation = false"
      @confirm="deleteSelectedNotes"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Note } from '@/store/types';
import { uiStore, notesStore } from '@/store/stores';
import AlertModal from '../modal/alertModal.vue';

const { notes } = defineProps<{ notes: Note[] }>();

const availableColumns = ['Title', 'Content', 'Folder', 'Date'];
const visibleColumns = ref(availableColumns);
const showDropdownOpen = ref(false);
const selectMode = ref(false);
const selectedNotes = ref<number[]>([]);
const showDeleteConfirmation = ref(false);
const showDropdownRef = ref<HTMLElement | null>(null);

const allSelected = computed(() => selectedNotes.value.length === notes.length);

const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const openNote = (noteId: number) => {
  uiStore.openNote(noteId);
};

const toggleShowDropdown = () => {
  if (showDropdownOpen.value) {
    closeShowDropdown();
  } else {
    uiStore.setActiveDropdown('show');
  }
};

const closeShowDropdown = () => {
  uiStore.setActiveDropdown(null);
};

const toggleColumn = (column: string) => {
  if (visibleColumns.value.includes(column)) {
    visibleColumns.value = visibleColumns.value.filter(c => c !== column);
  } else {
    visibleColumns.value.push(column);
  }
  visibleColumns.value.sort((a, b) => availableColumns.indexOf(a) - availableColumns.indexOf(b));
};

const toggleSelectMode = () => {
  selectMode.value = !selectMode.value;
  if (!selectMode.value) {
    selectedNotes.value = [];
  }
};

const toggleNoteSelection = (noteId: number) => {
  if (selectedNotes.value.includes(noteId)) {
    selectedNotes.value = selectedNotes.value.filter(id => id !== noteId);
  } else {
    selectedNotes.value.push(noteId);
  }
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedNotes.value = [];
  } else {
    selectedNotes.value = notes.map(note => note.id);
  }
};

const confirmDeleteSelectedNotes = () => {
  showDeleteConfirmation.value = true;
};

const deleteSelectedNotes = async () => {
  const notesToDeleteCount = selectedNotes.value.length;
  for (const noteId of selectedNotes.value) {
    await notesStore.deleteNote(noteId);
  }
  selectedNotes.value = [];
  showDeleteConfirmation.value = false;
  uiStore.showToastMessage(`${notesToDeleteCount} note(s) deleted successfully!`);
};

const handleClickOutside = (event: MouseEvent) => {
  if (showDropdownRef.value && !showDropdownRef.value.contains(event.target as Node)) {
    closeShowDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch(
  () => uiStore.activeDropdown,
  (newValue) => {
    showDropdownOpen.value = newValue === 'show';
  }
);
</script>

<style scoped>
.overflow-x-auto {
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  border: 1px solid black;
  min-width: 100%;
}

.dark table {
  border-color: white;
}

table th:first-child,
table td:first-child {
  border-left: 0;
}

table th:last-child,
table td:last-child {
  border-right: 0;
}

table tr:first-child th {
  border-top: 0;
}

table tr:last-child td {
  border-bottom: 0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>