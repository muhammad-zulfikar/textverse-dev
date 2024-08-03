<template>
  <Dropdown
    dropdownId="folder"
    contentWidth="12rem"
    direction="down"
    position="center"
  >
    <template #label>
      <button
        class="flex items-center px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
      >
        <img
          v-if="!isAllNotesFolder"
          src="@/assets/icons/revert.svg"
          class="h-4 w-4 mr-[5px] dark:invert cursor-pointer"
          @click.stop="revertToAllNotes"
        />
        <Icon
          icon="material-symbols-light:folder-outline-rounded"
          class="size-5 mr-2"
        />
        {{ selectedFolder }} ({{ notesCountByFolder[selectedFolder] || 0 }})
      </button>
    </template>
    <div class="px-1">
      <div
        v-for="folder in sortedFolders"
        :key="folder"
        class="w-full rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <div class="flex items-center justify-between">
          <button
            @click.stop="selectFolder(folder)"
            class="text-sm w-full text-left p-2 rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
          >
            <Icon
              icon="material-symbols-light:folder-outline-rounded"
              class="size-5 mr-2"
            />
            {{ folder }} ({{ notesCountByFolder[folder] || 0 }})
          </button>
          <button
            v-if="
              folder !== DEFAULT_FOLDERS.ALL_NOTES &&
              folder !== DEFAULT_FOLDERS.UNCATEGORIZED
            "
            @click.stop="toggleOptions(folder)"
            class="mr-2 rounded-full hover:bg-[#d9c698] dark:hover:bg-gray-600 transition-transform duration-200"
            :class="{ 'rotate-180': expandedFolder === folder }"
          >
            <Icon
              icon="material-symbols-light:keyboard-arrow-down-rounded"
              class="size-5"
            />
          </button>
        </div>
        <Transition name="expand">
          <div
            v-if="expandedFolder === folder"
            class="flex justify-between space-x-1 px-2"
          >
            <button
              @click.stop="openRenameModal(folder)"
              class="text-xs flex items-center px-2 py-1 custom-card mb-2"
            >
              <Icon icon="fluent:rename-16-regular" class="size-4 mr-1" />
              Rename
            </button>
            <button
              @click.stop="openDeleteAlert(folder)"
              class="text-xs flex items-center px-2 py-1 text-red-500 custom-card mb-2"
            >
              <Icon
                icon="material-symbols-light:delete-outline"
                class="size-4 mr-1"
              />
              Delete
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </Dropdown>

  <InputModal
    :is-open="isModalOpen"
    mode="folder"
    :current-value="currentFolderName"
    :max-length="10"
    @update="handleModalSubmit"
    @close="closeModal"
  />

  <alertModal
    :is-open="uiStore.isAlertOpen"
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

  const expandedFolder = ref('');

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

  const toggleOptions = (folder: string) => {
    expandedFolder.value = expandedFolder.value === folder ? '' : folder;
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
