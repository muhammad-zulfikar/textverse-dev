<!-- folder.vue -->

<template>
  <Dropdown
    dropdownId="folder"
    contentWidth="15rem"
    contentMarginLeft="-66px"
    direction="down"
  >
    <template #label>
      <img
        v-if="!isAllNotesFolder"
        src="@/assets/icons/revert.svg"
        class="h-4 w-4 mr-[5px] dark:invert cursor-pointer"
        @click.stop="revertToAllNotes"
      />
      {{ selectedFolder }} ({{ notesCountByFolder[selectedFolder] || 0 }})
    </template>
    <template v-for="folder in sortedFolders" :key="folder">
      <div
        @click.stop="selectFolder(folder)"
        class="block px-4 py-2 text-sm flex justify-between items-center"
        role="menuitem"
      >
        <span
          :class="folder === selectedFolder ? 'underline dark:text-white' : ''"
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
  </Dropdown>

  <div
    v-if="isModalOpen || isAlertOpen"
    class="fixed inset-0 bg-black bg-opacity-40 z-40"
    :class="{ 'backdrop-blur-[2px]': uiStore.blurEnabled }"
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
  <alertModal
    :is-open="isAlertOpen"
    :message="AlertMessage"
    @confirm="handleAlert"
    @cancel="closeAlert"
  />
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { notesStore, folderStore, uiStore } from '@/store/stores';
  import Dropdown from '@/components/dropdown.vue';
  import InputModal from '@/components/modal/inputModal.vue';
  import alertModal from '@/components/modal/alertModal.vue';
  import { DEFAULT_FOLDERS } from '@/store/constants';

  const selectedFolder = computed(() => folderStore.currentFolder);
  const notesCountByFolder = computed(() => folderStore.notesCountByFolder());

  const isModalOpen = ref(false);
  const modalMode = ref<'create' | 'rename'>('create');
  const currentFolderName = ref('');

  const isAlertOpen = ref(false);
  const AlertMessage = ref('');
  const folderToDelete = ref('');

  const selectFolder = (folder: string) => {
    folderStore.setCurrentFolder(folder);
    uiStore.setActiveDropdown(null);
  };

  const isAllNotesFolder = computed(
    () => selectedFolder.value === DEFAULT_FOLDERS.ALL_NOTES
  );

  const revertToAllNotes = (event: Event) => {
    event.stopPropagation();
    folderStore.setCurrentFolder(DEFAULT_FOLDERS.ALL_NOTES);
  };

  const openRenameModal = (folder: string) => {
    modalMode.value = 'rename';
    currentFolderName.value = folder;
    isModalOpen.value = true;
    uiStore.setActiveDropdown(null);
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

  onMounted(async () => {
    await folderStore.loadFolders();
  });
</script>
