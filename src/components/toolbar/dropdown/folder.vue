<!-- folder.vue -->

<template>
  <div class="relative inline-block text-left" ref="dropdownRef">
    <button
      @click.stop="toggleDropdown"
      :class="{ 'z-50': dropdownOpen }"
      class="hover:underline outline-none mr-4 flex items-center relative cursor-pointer"
    >
      {{ selectedFolder }} ({{ notesCountByFolder[selectedFolder] || 0 }})
      <span class="ml-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            v-if="dropdownOpen"
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
    <Transition name="zoom">
      <div
        v-if="dropdownOpen"
        class="custom-card z-50 origin-top-right absolute mt-2 w-56 ml-[-56px]"
      >
        <div class="py-1" role="menu" aria-orientation="vertical">
          <template v-for="folder in sortedFolders" :key="folder">
            <div
              @click.stop="selectFolder(folder)"
              class="block px-4 py-2 text-sm flex justify-between items-center"
              role="menuitem"
            >
              <span
                :class="
                  folder === selectedFolder ? 'underline dark:text-white' : ''
                "
                class="hover:underline cursor-pointer"
              >
                {{ folder }} ({{ notesCountByFolder[folder] || 0 }})
              </span>
              <div
                v-if="
                  folder !== DEFAULT_FOLDERS.ALL_NOTES &&
                  folder !== DEFAULT_FOLDERS.UNCATEGORIZED
                "
                class="flex items-center space-x-2"
              >
                <button
                  @click.stop="openRenameModal(folder)"
                  class="text-xs text-blue-500 cursor-pointer hover:underline mr-2"
                >
                  Rename
                </button>
                <button
                  @click.stop="openDeleteAlert(folder)"
                  class="text-xs text-red-500 cursor-pointer hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </div>
  <div
    v-if="isModalOpen"
    class="fixed inset-0 bg-black bg-opacity-50 z-40"
    @click="closeModal"
  ></div>
  <InputModal
    :is-open="isModalOpen"
    mode="folder"
    :current-value="currentFolderName"
    :max-length="10"
    @update="handleModalSubmit"
    @close="closeModal"
  />
  <div
    v-if="isAlertOpen"
    class="fixed inset-0 bg-black bg-opacity-50 z-40"
  ></div>
  <alertModal
    :is-open="isAlertOpen"
    :message="AlertMessage"
    @confirm="handleAlert"
    @cancel="closeAlert"
  />
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { notesStore, folderStore, uiStore } from '@/store/stores';
  import InputModal from '@/components/modal/inputModal.vue';
  import alertModal from '@/components/modal/alertModal.vue';
  import { DEFAULT_FOLDERS } from '@/store/constants';

  const selectedFolder = computed(() => folderStore.currentFolder);
  const dropdownOpen = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);

  const toggleDropdown = () => {
    if (dropdownOpen.value) {
      closeDropdown();
    } else {
      uiStore.setActiveDropdown('folder');
    }
  };

  const closeDropdown = () => {
    uiStore.setActiveDropdown(null);
  };

  const isModalOpen = ref(false);
  const modalMode = ref<'create' | 'rename'>('create');
  const currentFolderName = ref('');
  const notesCountByFolder = computed(() => folderStore.notesCountByFolder());

  const isAlertOpen = ref(false);
  const AlertMessage = ref('');
  const folderToDelete = ref('');

  const selectFolder = (folder: string) => {
    folderStore.setCurrentFolder(folder);
    closeDropdown();
  };

  const openRenameModal = (folder: string) => {
    modalMode.value = 'rename';
    currentFolderName.value = folder;
    isModalOpen.value = true;
    closeDropdown();
  };

  const sortedFolders = computed(() => {
    const userFolders = folderStore.folders.filter(
      (folder: string) =>
        folder !== DEFAULT_FOLDERS.ALL_NOTES &&
        folder !== DEFAULT_FOLDERS.UNCATEGORIZED
    );

    const uncategorizedNotes = notesStore.notes.filter(
      (note) => note.folder === DEFAULT_FOLDERS.UNCATEGORIZED
    );
    const showUncategorized = uncategorizedNotes.length > 0;

    const finalFolders = [DEFAULT_FOLDERS.ALL_NOTES, ...userFolders.sort()];
    if (showUncategorized) {
      finalFolders.push(DEFAULT_FOLDERS.UNCATEGORIZED);
    }

    return finalFolders;
  });

  const closeModal = () => {
    isModalOpen.value = false;
  };

  const handleModalSubmit = (folderName: string) => {
    if (modalMode.value === 'create') {
      folderStore.addFolder(folderName);
      selectFolder(folderName);
    } else {
      folderStore.renameFolder(currentFolderName.value, folderName);
      if (selectedFolder.value === currentFolderName.value) {
        selectFolder(folderName);
      }
    }
  };

  const openDeleteAlert = (folder: string) => {
    folderToDelete.value = folder;
    AlertMessage.value = `Are you sure you want to delete the folder "${folder}"?`;
    isAlertOpen.value = true;
  };

  const closeAlert = () => {
    isAlertOpen.value = false;
  };

  const handleAlert = () => {
    folderStore.deleteFolder(folderToDelete.value);
    closeAlert();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node) &&
      !isAlertOpen.value
    ) {
      closeDropdown();
    }
  };

  onMounted(async () => {
    document.addEventListener('click', handleClickOutside);
    await folderStore.loadFolders();
  });
  onUnmounted(() => document.removeEventListener('click', handleClickOutside));

  watch(isAlertOpen, (newVal) => {
    if (newVal) {
      dropdownOpen.value = false;
    }
  });

  watch(
    () => uiStore.activeDropdown,
    (newValue) => {
      dropdownOpen.value = newValue === 'folder';
    }
  );
</script>
