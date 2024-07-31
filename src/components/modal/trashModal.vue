<template>
  <transition name="zoom">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-40 flex items-center justify-center"
    >
      <div @click="closeModal" class="absolute inset-0"></div>
      <div
        @click.stop
        class="z-50 font-serif p-5 relative flex flex-col w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-h-[90vh] overflow-y-auto"
        :class="[uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card']"
      >
        <div class="flex justify-between mb-4">
          <h1 class="text-xl font-bold">Trash</h1>
          <button @click="closeModal" class="hover:underline text-sm">
            Close
          </button>
        </div>

        <p class="text-sm mb-6 text-gray-800 dark:text-gray-400">
          Notes in trash will be permanently deleted after 30 days.
        </p>

        <div class="mb-4 flex justify-between items-center">
          <button
            @click="toggleSelectAll"
            class="hover:underline text-sm cursor-pointer"
          >
            {{ isAllSelected ? 'Deselect All' : 'Select All' }}
          </button>
          <div>
            <button
              @click="restoreSelectedNotes"
              class="hover:underline text-sm mr-4 cursor-pointer"
              :disabled="!hasSelectedNotes"
            >
              Restore Selected
            </button>
            <button
              @click="confirmDeleteSelectedNotes"
              class="hover:underline text-sm text-red-500 cursor-pointer"
              :disabled="!hasSelectedNotes"
            >
              Delete Selected
            </button>
          </div>
        </div>

        <div
          v-if="deletedNotes.length === 0"
          class="text-center min-h-[200px] pt-[64px]"
        >
          Trash is empty.
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="note in deletedNotes"
            :key="note.id"
            class="flex items-start"
          >
            <input
              v-if="showCheckboxes"
              type="checkbox"
              :checked="selectedNotes.includes(note.id)"
              @change="toggleNoteSelection(note.id)"
              class="mr-4 mt-9 cursor-pointer"
            />
            <div class="flex-grow min-w-0 custom-card cursor-pointer px-3">
              <div class="note-wrapper">
                <div @click="toggleNoteOptions(note.id)">
                  <h3 class="font-bold truncate mt-3">{{ note.title }}</h3>
                  <p class="text-sm truncate">{{ note.content }}</p>
                  <div class="text-[12px] md:text-xs text-gray-500 mb-4">
                    <span>Folder: {{ note.folder }}</span>
                    |
                    <span>Created: {{ formatDate(note.time_created) }}</span>
                    |
                    <span>Deleted: {{ formatDate(note.time_deleted) }}</span>
                  </div>
                </div>
                <transition name="expand">
                  <div
                    v-if="expandedNoteId === note.id"
                    class="expanded-content flex justify-center space-x-2"
                  >
                    <button
                      @click="restoreNote(note.id)"
                      class="flex-1 p-2 custom-card text-sm hover:underline mb-4"
                    >
                      Restore
                    </button>
                    <button
                      @click="confirmDeleteNote(note.id)"
                      class="flex-1 p-2 custom-card text-sm hover:underline text-red-500 mb-4"
                    >
                      Delete
                    </button>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
  <div
    v-if="showDeleteConfirmation || showDeleteSelectedConfirmation"
    class="fixed inset-0 bg-black bg-opacity-40 z-40"
    :class="{ 'backdrop-blur-[2px]': uiStore.blurEnabled }"
  ></div>
  <AlertModal
    :is-open="showDeleteConfirmation"
    :message="`Are you sure you want to delete this note?`"
    @cancel="showDeleteConfirmation = false"
    @confirm="deleteNote"
  />
  <AlertModal
    :is-open="showDeleteSelectedConfirmation"
    :message="`Are you sure you want to delete ${selectedNotes.length} note(s)?`"
    @cancel="showDeleteSelectedConfirmation = false"
    @confirm="deleteSelectedNotes"
  />
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { notesStore, uiStore } from '@/store/stores';
  import AlertModal from '@/components/modal/alertModal.vue';

  const props = defineProps<{
    isOpen: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  const selectedNotes = ref<number[]>([]);
  const showCheckboxes = ref(false);
  const expandedNoteId = ref<number | null>(null);
  const showDeleteConfirmation = ref(false);
  const showDeleteSelectedConfirmation = ref(false);
  const noteToDelete = ref<number | null>(null);

  const confirmDeleteNote = (noteId: number) => {
    noteToDelete.value = noteId;
    showDeleteConfirmation.value = true;
  };

  const confirmDeleteSelectedNotes = () => {
    showDeleteSelectedConfirmation.value = true;
  };

  const deletedNotes = computed(() => notesStore.deletedNotes);

  const isAllSelected = computed(
    () => selectedNotes.value.length === deletedNotes.value.length
  );

  const hasSelectedNotes = computed(() => selectedNotes.value.length > 0);

  const toggleSelectAll = () => {
    if (isAllSelected.value) {
      selectedNotes.value = [];
    } else {
      selectedNotes.value = deletedNotes.value.map((note) => note.id);
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

  const toggleNoteOptions = (noteId: number) => {
    expandedNoteId.value = expandedNoteId.value === noteId ? null : noteId;
  };

  const restoreNote = async (noteId: number) => {
    await notesStore.restoreNote(noteId);
    uiStore.showToastMessage('Note restored successfully');
  };

  const deleteNote = async () => {
    if (noteToDelete.value !== null) {
      await notesStore.permanentlyDeleteNote(noteToDelete.value);
      uiStore.showToastMessage('Note permanently deleted');
      showDeleteConfirmation.value = false;
      noteToDelete.value = null;
    }
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
    showDeleteConfirmation.value = false;
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

  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.3s ease-out;
    max-height: 100px;
    opacity: 1;
  }

  .expand-enter-from,
  .expand-leave-to {
    max-height: 0;
    opacity: 0;
  }
</style>
