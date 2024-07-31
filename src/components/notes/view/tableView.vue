<!-- tableView.vue -->

<template>
  <div class="w-full max-w-5xl mx-auto px-4 md:px-0 text-sm md:text-base">
    <div class="flex justify-end mb-4 relative">
      <div class="relative inline-block text-left whitespace-nowrap mr-5" ref="showDropdownRef">
        <button @click.stop="toggleShowDropdown" :class="{ 'z-50': showDropdownOpen }"
          class="hover:underline dark:hover:bg-transparent outline-none flex items-center relative font-serif">
          Show
          <span class="ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path v-if="showDropdownOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M5 15l7-7 7 7" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>
        <div v-if="showDropdownOpen"
          class="custom-card z-50 origin-top-left absolute left-0 mt-2 w-fit ml-[-25px] font-serif">
          <div class="py-1" role="menu" aria-orientation="vertical">
            <a v-for="column in filteredColumns" :key="column" @click.stop="toggleColumn(column)"
              class="block px-4 py-2 text-sm cursor-pointer hover:underline flex items-center" role="menuitem">
              <input type="checkbox" :checked="visibleColumns.includes(column)" class="mr-2 cursor-pointer"
                @click.stop="toggleColumn(column)" />
              {{ column }}
            </a>
          </div>
        </div>
      </div>
      <button @click="toggleSelectMode" class="hover:underline font-serif">
        Select
      </button>
      <button v-if="selectMode && selectedNotes.length > 0" @click="confirmDeleteSelectedNotes"
        class="ml-5 hover:underline font-serif text-red-500">
        Delete
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-[800px] w-full border-separate border-spacing-0 font-serif rounded-lg overflow-hidden">
        <thead>
          <tr class="bg-[#ebdfc0] dark:bg-gray-800">
            <th v-if="selectMode"
              class="p-3 text-left w-10 border-b-[1px] border-r-[1px] border-black dark:border-white">
              <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
            </th>
            <th v-for="column in visibleColumns" :key="column" :class="{ 'hidden md:table-cell': column === 'Content' }"
              class="p-3 text-left border-b-[1px] border-r-[1px] border-black dark:border-white whitespace-nowrap">
              {{ column }}
            </th>
          </tr>
        </thead>
        <transition-group name="list" tag="tbody">
          <tr v-for="note in notes" :key="note.id" class="bg-cream dark:bg-gray-750">
            <td v-if="selectMode" class="p-3 w-10 border-b-[1px] border-r-[1px] border-black dark:border-white">
              <input type="checkbox" :checked="selectedNotes.includes(note.id)"
                @change="toggleNoteSelection(note.id)" />
            </td>
            <td v-if="visibleColumns.includes('Title')"
              class="w-[250px] p-3 border-b-[1px] border-r-[1px] border-black dark:border-white relative group">
              <div class="flex items-center">
                <input :value="note.title" @input="updateNoteTitle(note, $event)" @blur="saveNoteIfChanged(note)"
                  class="w-full bg-transparent outline-none" />
                <div @click="openSidebar(note.id)">
                  <button
                    class="bg-[#ebdfc0] dark:bg-gray-800 rounded-lg border-[1px] border-black dark:border-white shadow-md hover:shadow-xl transition-all duration-300 text-sm ml-2 px-2 py-1 absolute right-2 top-1/2 transform -translate-y-1/2 group-hover:inline-block md:group-hover:inline-block md:hidden">
                    <img src="@/assets/icons/sidebar.svg" class="h-6 w-6 dark:invert" />
                  </button>
                </div>
              </div>
            </td>
            <td v-if="visibleColumns.includes('Content') && !isMobile"
              class="p-3 border-b-[1px] border-r-[1px] border-black dark:border-white">
              <input :value="note.content" @input="updateNoteContent(note, $event)" @blur="saveNoteIfChanged(note)"
                class="w-full bg-transparent outline-none" />
            </td>
            <td v-if="visibleColumns.includes('Folder')" @click="folderStore.setCurrentFolder(note.folder)"
              class="p-3 border-b-[1px] border-r-[1px] border-black dark:border-white cursor-pointer hover:underline">
              <div class="line-clamp-1">{{ note.folder }}</div>
            </td>
            <td v-if="visibleColumns.includes('Date')"
              class="p-3 border-b-[1px] border-r-[1px] border-black dark:border-white whitespace-nowrap">
              {{ notesStore.localeDate(note.last_edited || note.time_created) }}
            </td>
          </tr>
        </transition-group>
      </table>
    </div>
    <div v-if="showDeleteConfirmation" class="fixed inset-0 bg-black bg-opacity-50"></div>
    <AlertModal :is-open="showDeleteConfirmation"
      :message="`Are you sure you want to delete ${selectedNotes.length} note(s)?`"
      @cancel="showDeleteConfirmation = false" @confirm="deleteSelectedNotes" />
    <div v-if="sidebarOpen" class="fixed inset-0 bg-black bg-opacity-50 z-40" @click="closeSidebar"></div>
    <transition name="slide">
      <NoteSidebar v-if="sidebarOpen" :note-id="selectedNoteId" @close="closeSidebar" />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Note } from '@/store/types';
import { uiStore, notesStore, folderStore } from '@/store/stores';
import AlertModal from '@/components/modal/alertModal.vue';
import NoteSidebar from '@/components/modal/noteSidebar.vue';

const { notes } = defineProps<{
  notes: Note[];
}>();

const sidebarOpen = ref(false);
const selectedNoteId = ref<number | null>(null);

const openSidebar = (noteId: number | null) => {
  selectedNoteId.value = noteId;
  sidebarOpen.value = true;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
  selectedNoteId.value = null;
};

const updatedNotes = ref<{
  [key: number]: Partial<Note>;
}>({});

const updateNoteTitle = (note: Note, event: Event) => {
  const newTitle = (event.target as HTMLInputElement).value;
  if (!updatedNotes.value[note.id]) {
    updatedNotes.value[note.id] = { ...note };
  }
  updatedNotes.value[note.id].title = newTitle;
};

const updateNoteContent = (note: Note, event: Event) => {
  const newContent = (event.target as HTMLInputElement).value;
  if (!updatedNotes.value[note.id]) {
    updatedNotes.value[note.id] = { ...note };
  }
  updatedNotes.value[note.id].content = newContent;
};

const saveNoteIfChanged = (note: Note) => {
  if (updatedNotes.value[note.id]) {
    const updatedNote = { ...note, ...updatedNotes.value[note.id] };
    if (notesStore.hasChanged(note, updatedNote)) {
      notesStore.updateNote(updatedNote);
    }
    delete updatedNotes.value[note.id];
  }
};

const availableColumns = ['Title', 'Content', 'Folder', 'Date'];
const visibleColumns = ref(availableColumns);
const showDropdownOpen = ref(false);
const selectMode = ref(false);
const selectedNotes = ref<number[]>([]);
const showDeleteConfirmation = ref(false);
const showDropdownRef = ref<HTMLElement | null>(null);
const isMobile = ref(window.innerWidth < 768);

const filteredColumns = computed(() => {
  return isMobile.value
    ? availableColumns.filter((col) => col !== 'Content')
    : availableColumns;
});
const allSelected = computed(
  () => selectedNotes.value.length === notes.length
);

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
    visibleColumns.value = visibleColumns.value.filter((c) => c !== column);
  } else {
    visibleColumns.value.push(column);
  }
  visibleColumns.value.sort(
    (a, b) => availableColumns.indexOf(a) - availableColumns.indexOf(b)
  );
};

const toggleSelectMode = () => {
  selectMode.value = !selectMode.value;
  if (!selectMode.value) {
    selectedNotes.value = [];
  }
};

const toggleNoteSelection = (noteId: number) => {
  if (selectedNotes.value.includes(noteId)) {
    selectedNotes.value = selectedNotes.value.filter((id) => id !== noteId);
  } else {
    selectedNotes.value.push(noteId);
  }
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedNotes.value = [];
  } else {
    selectedNotes.value = notes.map((note) => note.id);
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
  uiStore.showToastMessage(
    `${notesToDeleteCount} note(s) deleted successfully!`
  );
};

const handleClickOutside = (event: MouseEvent) => {
  if (
    showDropdownRef.value &&
    !showDropdownRef.value.contains(event.target as Node)
  ) {
    closeShowDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', updateIsMobile);
  updateIsMobile();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', updateIsMobile);
});

const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

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

.line-clamp-1 {
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.list-leave-active {
  position: absolute;
}

@media (max-width: 767px) {
  .hidden-mobile {
    display: none;
  }

  .group:hover button {
    display: inline-block;
  }
}
</style>
