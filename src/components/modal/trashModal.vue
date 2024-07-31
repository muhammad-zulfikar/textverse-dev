<template>
    <transition name="zoom">
      <div v-if="props.isOpen" class="fixed inset-0 z-40 flex items-center justify-center">
        <div @click="closeModal" class="absolute inset-0"></div>
        <div @click.stop class="z-50 font-serif custom-card p-5 relative flex flex-col w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-h-[90vh] overflow-y-auto">
          <h1 class="text-xl font-bold mb-4">Trash</h1>
          <p class="text-sm mb-4">Notes in trash will be permanently deleted after 30 days.</p>
          
          <div class="mb-4 flex justify-between items-center">
            <button @click="toggleSelectAll" class="hover:underline text-sm cursor-pointer">
              {{ isAllSelected ? 'Deselect All' : 'Select All' }}
            </button>
            <div>
              <button @click="restoreSelectedNotes" class="hover:underline text-sm mr-4 cursor-pointer" :disabled="!hasSelectedNotes">
                Restore Selected
              </button>
              <button @click="deleteSelectedNotes" class="hover:underline text-sm text-red-500 cursor-pointer" :disabled="!hasSelectedNotes">
                Delete Selected
              </button>
            </div>
          </div>
  
          <div v-if="deletedNotes.length === 0" class="text-center py-4">
            No notes in trash.
          </div>
  
          <div v-else class="space-y-4">
            <div v-for="note in deletedNotes" :key="note.id" class="flex items-start p-2 border-b-[1px]">
              <input v-if="showCheckboxes" type="checkbox" :checked="selectedNotes.includes(note.id)" @change="toggleNoteSelection(note.id)" class="mr-4 mt-6 cursor-pointer">
              <div class="flex-grow min-w-0">
                <h3 class="font-bold truncate">{{ note.title }}</h3>
                <p class="text-sm truncate">{{ note.content }}</p>
                <div class="text-xs text-gray-500">
                  <span>Folder: {{ note.folder }}</span> |
                  <span>Created: {{ formatDate(note.time_created) }}</span> |
                  <span>Deleted: {{ formatDate(note.time_deleted) }}</span>
                </div>
              </div>
              <div class="flex flex-col space-y-2 ml-4 my-2">
                <button @click="restoreNote(note.id)" class="text-sm hover:underline">Restore</button>
                <button @click="deleteNote(note.id)" class="text-sm hover:underline text-red-500">Delete</button>
              </div>
            </div>
          </div>
  
          <div class="flex justify-end mt-6">
            <button @click="closeModal" class="hover:underline text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </transition>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useNotesStore } from '@/store/notesStore';
  import { useUIStore } from '@/store/uiStore';
  
  const props = defineProps<{
    isOpen: boolean;
  }>();
  
  const emit = defineEmits<{
    (e: 'close'): void;
  }>();
  
  const notesStore = useNotesStore();
  const uiStore = useUIStore();
  
  const selectedNotes = ref<number[]>([]);
  const showCheckboxes = ref(false);
  
  const deletedNotes = computed(() => notesStore.deletedNotes);
  
  const isAllSelected = computed(() => selectedNotes.value.length === deletedNotes.value.length);
  
  const hasSelectedNotes = computed(() => selectedNotes.value.length > 0);
  
  const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedNotes.value = [];
  } else {
    selectedNotes.value = deletedNotes.value.map(note => note.id);
  }
  showCheckboxes.value = !showCheckboxes.value;
};
  
  const toggleNoteSelection = (noteId: number) => {
    const index = selectedNotes.value.indexOf(noteId);
    if (index === -1) {
      selectedNotes.value.push(noteId);
    } else {
      selectedNotes.value.splice(index, 1);
    }
  };
  
  const restoreNote = async (noteId: number) => {
    await notesStore.restoreNote(noteId);
    uiStore.showToastMessage('Note restored successfully');
  };
  
  const deleteNote = async (noteId: number) => {
    await notesStore.permanentlyDeleteNote(noteId);
    uiStore.showToastMessage('Note permanently deleted');
  };
  
  const restoreSelectedNotes = async () => {
    for (const noteId of selectedNotes.value) {
      await notesStore.restoreNote(noteId);
    }
    selectedNotes.value = [];
    uiStore.showToastMessage('Selected notes restored successfully');
  };
  
  const deleteSelectedNotes = async () => {
    for (const noteId of selectedNotes.value) {
      await notesStore.permanentlyDeleteNote(noteId);
    }
    selectedNotes.value = [];
    uiStore.showToastMessage('Selected notes permanently deleted');
  };
  
  function formatDate(date?: string | Date): string {
    if (!date) return 'No date available';
    return new Date(date).toLocaleDateString();
  }
  
  const closeModal = () => {
    emit('close');
  };
  </script>
  
  <style scoped>
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  </style>
  