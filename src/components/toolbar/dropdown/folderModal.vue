<!-- folder.vue -->
<template>
  <button
    @click="openModal"
    class="flex hover:underline items-center"
  >
    <div v-if="selectedFolder === DEFAULT_FOLDERS.ALL_NOTES">
      <img class="w-5 h-5 mr-2 dark:invert" src="@/assets/icons/home.svg" />
    </div>
    <div v-else>
      <svg
        class="w-5 h-5 mr-2"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    {{ selectedFolder }} ({{ notesCountByFolder[selectedFolder] || 0 }})
  </button>

  <ModalBackdrop v-model="isOpen" />
  <Teleport to="body">
    <Transition name="zoom">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 flex items-center justify-center text-sm"
      >
        <div @click="closeModal" class="absolute inset-0"></div>
        <div
          @click.stop
          class="z-50 font-serif p-2 relative flex flex-col w-56 md:w-96 max-w-md"
          :class="[uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card']"
        >
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="folder in sortedFolders"
              :key="folder"
              class="w-full rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div class="flex items-center justify-between">
                <button
                  @click="selectFolder(folder)"
                  class="w-full text-left p-3 rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
                  :class="folder === selectedFolder ? 'font-bold' : ''"
                >
                  <div v-if="folder === DEFAULT_FOLDERS.ALL_NOTES">
                    <img
                      class="w-5 h-5 mr-2 dark:invert"
                      src="@/assets/icons/home.svg"
                    />
                  </div>
                  <div v-else>
                    <svg
                      class="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  {{ folder }} ({{ notesCountByFolder[folder] || 0 }})
                </button>
                <button
                  v-if="
                    folder !== DEFAULT_FOLDERS.ALL_NOTES &&
                    folder !== DEFAULT_FOLDERS.UNCATEGORIZED
                  "
                  @click="toggleOptions(folder)"
                  class="p-1 mr-3 rounded-full hover:bg-[#d9c698] dark:hover:bg-gray-600 transition-transform duration-200"
                  :class="{ 'rotate-180': expandedFolder === folder }"
                >
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 9L12 16L5 9"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <Transition name="expand">
                <div
                  v-if="expandedFolder === folder"
                  class="flex justify-between space-x-4 px-4"
                >
                  <button
                    @click.stop="openRenameModal(folder)"
                    class="text-sm flex-1 p-2 custom-card hover:underline mb-4 mt-2"
                  >
                    Rename
                  </button>
                  <button
                    @click.stop="openDeleteAlert(folder)"
                    class="text-sm flex-1 p-2 text-red-500 custom-card hover:underline mb-4 mt-2"
                  >
                    Delete
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <InputModal
    :is-open="isRenameModalOpen"
    mode="folder"
    :current-value="currentFolderName"
    :max-length="10"
    @update="handleModalSubmit"
    @close="closeRenameModal"
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
  import ModalBackdrop from '@/components/modal/modalBackdrop.vue';
  import InputModal from '@/components/modal/inputModal.vue';
  import alertModal from '@/components/modal/alertModal.vue';
  import { DEFAULT_FOLDERS } from '@/store/constants';

  const isOpen = ref(false);
  const selectedFolder = computed(() => folderStore.currentFolder);
  const notesCountByFolder = computed(() => folderStore.notesCountByFolder());

  const isRenameModalOpen = ref(false);
  const currentFolderName = ref('');

  const isAlertOpen = ref(false);
  const AlertMessage = ref('');
  const folderToDelete = ref('');

  const expandedFolder = ref('');

  const openModal = () => {
    isOpen.value = true;
  };

  const closeModal = () => {
    isOpen.value = false;
    expandedFolder.value = '';
  };

  const selectFolder = (folder: string) => {
    folderStore.setCurrentFolder(folder);
    closeModal();
  };

  const toggleOptions = (folder: string) => {
    expandedFolder.value = expandedFolder.value === folder ? '' : folder;
  };

  const openRenameModal = (folder: string) => {
    closeModal();
    currentFolderName.value = folder;
    isRenameModalOpen.value = true;
  };

  const closeRenameModal = () => {
    isRenameModalOpen.value = false;
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

  const handleModalSubmit = (folderName: string) => {
    folderStore.renameFolder(currentFolderName.value, folderName);
    if (selectedFolder.value === currentFolderName.value) {
      selectFolder(folderName);
    }
    closeRenameModal();
  };

  const openDeleteAlert = (folder: string) => {
    closeModal();
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
