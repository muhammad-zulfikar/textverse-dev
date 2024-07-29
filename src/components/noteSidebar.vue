<template>
  <transition name="slide">
    <div
      ref="sidebarContainer"
      :class="[
        'fixed inset-y-0 right-0',
        sidebarWidthClass,
        'bg-cream dark:bg-gray-800 shadow-lg z-50 overflow-y-auto font-serif',
      ]"
    >
      <div class="p-6">
        <div class="flex justify-end items-center mb-4">
          <div>
            <!-- Expand Button -->
            <button
              @click="toggleExpand"
              class="text-gray-600 dark:text-gray-300 hover:underline mr-4 text-sm md:text-base"
            >
              {{ isExpanded ? 'Collapse' : 'Expand' }}
            </button>
            <button
              @click="$emit('delete', note.id)"
              class="text-red-500 hover:underline mr-4 text-sm md:text-base"
            >
              Delete
            </button>
            <button
              @click="saveNote"
              class="text-sm md:text-base"
              :class="
                notesStore.hasChanged(originalNote, editedNote)
                  ? 'text-blue-500 hover:underline'
                  : 'text-gray-400 cursor-not-allowed'
              "
              :disabled="!notesStore.hasChanged(originalNote, editedNote)"
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
        <div class="flex justify-between items-center text-sm mb-4">
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
          class="w-full mt-4 bg-transparent resize-none outline-none flex-grow text-base"
          :style="{ height: textareaHeight }"
        ></textarea>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { Note } from '@/store/types';
  import { notesStore, folderStore } from '@/store/stores';
  import { DEFAULT_FOLDERS } from '@/store/constants';

  const props = defineProps<{
    note: Note;
  }>();

  const emit = defineEmits(['close', 'update', 'delete']);

  const editedNote = ref({ ...props.note });
  const originalNote = ref({ ...props.note });
  const selectedFolder = ref('');
  const isDropdownOpen = ref(false);
  const textareaHeight = ref('auto');
  const sidebarContainer = ref<HTMLElement | null>(null);
  const isExpanded = ref(false); // New ref for expanded state

  const availableFolders = computed(() => {
    return [
      ...folderStore.folders.filter(
        (folder) => folder !== DEFAULT_FOLDERS.ALL_NOTES
      ),
    ];
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

  function toggleExpand() {
    isExpanded.value = !isExpanded.value;
  }

  watch(
    () => props.note,
    (newNote) => {
      if (newNote) {
        editedNote.value = { ...newNote };
        originalNote.value = { ...newNote };
      }
    },
    { deep: true }
  );

  const saveNote = () => {
    if (notesStore.hasChanged(props.note, editedNote.value)) {
      emit('update', editedNote.value);
      originalNote.value = { ...editedNote.value };
    }
  };

  onMounted(() => {
    if (sidebarContainer.value) {
      textareaHeight.value = `${sidebarContainer.value.clientHeight - 250}px`;
    }
  });

  const sidebarWidthClass = computed(() =>
    isExpanded.value
      ? 'w-full custom-card-no-rounded'
      : 'w-3/4 md:w-2/5 custom-card'
  );
</script>

<style scoped>
  .slide-enter-active,
  .slide-leave-active {
    transition: transform 0.3s ease;
  }
  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(100%);
  }
  .slide-enter-to,
  .slide-leave-from {
    transform: translateX(0%);
  }
</style>
