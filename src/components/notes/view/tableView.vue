<!-- tableView.vue -->

<template>
  <div class="w-full max-w-5xl mx-auto px-4 md:px-0 text-sm md:text-base">
    <div class="flex justify-end mb-4 relative font-serif md:pr-4 xl:pr-0">
      <button
        v-if="selectMode && selectedNotes.length > 0"
        @click="togglePinSelectedNotes"
        class="flex items-center mr-2 px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
      >
        <component
          :is="allSelectedPinned ? PhPushPinSlash : PhPushPin"
          :size="20"
          class="size-5 mr-2"
        />
        {{ allSelectedPinned ? 'Unpin' : 'Pin' }}
      </button>

      <button
        v-if="selectMode && selectedNotes.length > 0"
        @click="confirmDeleteSelectedNotes"
        class="flex items-center mr-2 px-2 py-1 custom-card text-red-500 hover:text-red-100 hover:bg-red-700/50 dark:hover:bg-red-800/60"
      >
        <PhTrash :size="20" class="size-5 mr-2" />
        Delete
      </button>
      <Dropdown dropdownId="showDropdown" contentWidth="w-fit" direction="down">
        <template #label>
          <div
            class="flex items-center mr-2 px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
          >
            <PhEye :size="20" class="size-5 mr-2" />
            Show
          </div>
        </template>
        <div class="px-[3px]">
          <a
            v-for="column in filteredColumns"
            :key="column"
            @click.stop="toggleColumn(column)"
            class="text-sm px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            role="menuitem"
          >
            <input
              type="checkbox"
              :checked="visibleColumns.includes(column)"
              class="mr-2 cursor-pointer"
              @click.stop="toggleColumn(column)"
            />
            {{ column }}
          </a>
        </div>
      </Dropdown>
      <button
        @click="toggleSelectMode"
        class="flex items-center px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
      >
        <PhCheckCircle :size="20" class="size-5 mr-2" />
        Select
      </button>
    </div>
    <div class="overflow-x-auto md:px-4 xl:px-0">
      <table
        class="min-w-[800px] w-full border-separate border-spacing-0 font-serif rounded-lg overflow-hidden"
      >
        <thead>
          <tr class="bg-[#ebdfc0] dark:bg-gray-800">
            <th
              v-if="selectMode"
              class="p-3 text-left w-10 border-b-[1px] border-r-[1px] border-black dark:border-white"
            >
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th
              v-for="column in visibleColumns"
              :key="column"
              :class="{ 'hidden md:table-cell': column === 'Content' }"
              class="p-3 text-left border-b-[1px] border-r-[1px] border-black dark:border-white whitespace-nowrap"
            >
              <div class="flex items-center">
                <span>{{ column }}</span>
                <component
                  :is="getColumnIcon(column)"
                  :size="20"
                  class="ml-2 md:ml-3"
                />
              </div>
            </th>
          </tr>
        </thead>
        <transition-group name="list" tag="tbody">
          <tr
            v-for="note in notes"
            :key="note.id"
            class="bg-cream dark:bg-gray-750"
          >
            <td
              v-if="selectMode"
              class="p-3 w-10 border-b-[1px] border-r-[1px] border-black dark:border-white"
            >
              <input
                type="checkbox"
                :checked="selectedNotes.includes(note.id)"
                @change="toggleNoteSelection(note.id)"
                class="cursor-pointer"
              />
            </td>
            <td
              v-if="visibleColumns.includes('Title')"
              class="w-[250px] p-3 border-b-[1px] border-r-[1px] border-black dark:border-white relative group"
            >
              <div class="flex items-center">
                <input
                  :value="note.title"
                  @input="updateNoteTitle(note, $event)"
                  @blur="saveNoteIfChanged(note)"
                  class="w-full bg-transparent outline-none"
                  :class="{ underline: note.pinned }"
                />
                <div @click="uiStore.openNote(note.id)">
                  <span
                    class="bg-[#ebdfc0] dark:bg-gray-800 hover:bg-[#d9c698] dark:hover:bg-gray-700 active:bg-cream dark:active:bg-gray-700 rounded-lg border-[1px] border-black dark:border-white shadow-md hover:shadow-xl transition-all duration-300 text-sm ml-2 px-2 py-1 absolute right-2 top-1/2 transform -translate-y-1/2 group-hover:inline-block md:group-hover:inline-block md:hidden cursor-pointer"
                  >
                    <PhSidebarSimple :size="20" />
                  </span>
                </div>
              </div>
            </td>
            <td
              v-if="visibleColumns.includes('Content') && !isMobile"
              class="p-3 border-b-[1px] border-r-[1px] border-black dark:border-white"
            >
              <input
                :value="note.content"
                @input="updateNoteContent(note, $event)"
                @blur="saveNoteIfChanged(note)"
                class="w-full bg-transparent outline-none"
              />
            </td>
            <td
              v-if="visibleColumns.includes('Folder')"
              @click="folderStore.setCurrentFolder(note.folder)"
              class="p-3 border-b-[1px] border-r-[1px] border-black dark:border-white cursor-pointer hover:underline"
            >
              <div class="flex items-center space-x-2 truncate">
                <component
                  :is="
                    note.folder.toLowerCase() === 'no folder'
                      ? PhFolderMinus
                      : PhFolder
                  "
                  :size="20"
                />
                <span class="truncate">{{ note.folder }}</span>
              </div>
            </td>
            <td
              v-if="visibleColumns.includes('Date')"
              class="p-3 border-b-[1px] border-r-[1px] border-black dark:border-white whitespace-nowrap"
            >
              {{ notesStore.localeDate(note.last_edited || note.time_created) }}
            </td>
          </tr>
        </transition-group>
      </table>
    </div>

    <AlertModal
      :is-open="isAlertOpen"
      :message="`Are you sure you want to delete ${selectedNotes.length} note(s)?`"
      @cancel="isAlertOpen = false"
      @confirm="deleteSelectedNotes"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import {
    PhEye,
    PhCheckCircle,
    PhTrash,
    PhPushPin,
    PhPushPinSlash,
    PhSidebarSimple,
    PhFolder,
    PhFolderMinus,
    PhTextT,
    PhArticle,
    PhCalendar,
  } from '@phosphor-icons/vue';
  import { Note } from '@/store/types';
  import { uiStore, notesStore, folderStore } from '@/store/stores';
  import AlertModal from '@/components/modal/alertModal.vue';
  import Dropdown from '@/components/dropdown/dropdown.vue';

  const props = defineProps<{
    notes: Note[];
  }>();

  const updatedNotes = ref<{
    [key: string]: Partial<Note>;
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

  const getColumnIcon = (column: string) => {
    switch (column) {
      case 'Title':
        return PhTextT;
      case 'Content':
        return PhArticle;
      case 'Folder':
        return PhFolder;
      case 'Date':
        return PhCalendar;
      default:
        return null;
    }
  };

  const availableColumns = ['Title', 'Content', 'Folder', 'Date'];
  const visibleColumns = ref(availableColumns);
  const selectMode = ref(false);
  const selectedNotes = ref<string[]>([]);
  const isMobile = ref(window.innerWidth < 768);

  const filteredColumns = computed(() => {
    return isMobile.value
      ? availableColumns.filter((col) => col !== 'Content')
      : availableColumns;
  });

  const allSelected = computed(() => {
    return (
      props.notes.length > 0 &&
      selectedNotes.value.length === props.notes.length
    );
  });

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

  const toggleNoteSelection = (noteId: string) => {
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
      selectedNotes.value = props.notes.map((note) => note.id);
    }
  };

  const allSelectedPinned = computed(() => {
    return (
      selectedNotes.value.length > 0 &&
      selectedNotes.value.every(
        (noteId) => props.notes.find((note) => note.id === noteId)?.pinned
      )
    );
  });

  const togglePinSelectedNotes = async () => {
    const notesToToggleCount = selectedNotes.value.length;
    const action = allSelectedPinned.value ? 'unpin' : 'pin';

    for (const noteId of selectedNotes.value) {
      if (action === 'pin') {
        await notesStore.pinNote(noteId);
      } else {
        await notesStore.unpinNote(noteId);
      }
    }

    selectedNotes.value = [];
    uiStore.showToastMessage(
      `${notesToToggleCount} note(s) ${action}ned successfully!`
    );
  };

  const isAlertOpen = ref(false);

  const confirmDeleteSelectedNotes = () => {
    isAlertOpen.value = true;
  };

  const deleteSelectedNotes = async () => {
    const notesToDeleteCount = selectedNotes.value.length;
    for (const noteId of selectedNotes.value) {
      await notesStore.deleteNote(noteId);
    }
    selectedNotes.value = [];
    isAlertOpen.value = false;
    uiStore.showToastMessage(
      `${notesToDeleteCount} note(s) deleted successfully!`
    );
  };

  watch(
    () => props.notes,
    () => {
      selectedNotes.value = [];
    },
    { deep: true }
  );

  onMounted(() => {
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  const handleResize = () => {
    isMobile.value = window.innerWidth < 768;
  };
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

  @media (max-width: 767px) {
    .hidden-mobile {
      display: none;
    }

    .group:hover button {
      display: inline-block;
    }
  }
</style>
