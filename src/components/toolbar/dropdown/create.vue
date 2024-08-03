<!-- create.vue -->

<template>
  <Dropdown
    dropdownId="create"
    contentWidth="6.4rem"
    direction="down"
    position="center"
  >
    <template #label>
      <button
        class="flex items-center px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
      >
        <Icon icon="fluent:add-24-regular" class="size-5 mr-2" />
        Create
      </button>
    </template>
    <div class="w-full text-sm px-1">
      <button
        @click.stop="openNoteForm"
        class="w-full text-left p-2 rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
      >
        <Icon
          icon="material-symbols-light:edit-square-outline-rounded"
          class="size-5 mr-3"
        />
        Note
      </button>
      <button
        @click.stop="openFolderForm"
        class="w-full text-left p-2 rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
      >
        <Icon
          icon="material-symbols-light:folder-outline-rounded"
          class="size-5 mr-3"
        />
        Folder
      </button>
    </div>
  </Dropdown>

  <InputModal
    :is-open="isFolderFormOpen"
    mode="folder"
    :max-length="10"
    @update="handleFolderSubmit"
    @close="closeFolderForm"
  />
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { uiStore, folderStore } from '@/store/stores';
  import Dropdown from '@/components/dropdown.vue';
  import InputModal from '@/components/modal/inputModal.vue';

  const isFolderFormOpen = ref(false);

  const openNoteForm = () => {
    uiStore.openNote(null);
    uiStore.setActiveDropdown(null);
  };

  const openFolderForm = () => {
    isFolderFormOpen.value = true;
    uiStore.setActiveDropdown(null);
  };

  const closeFolderForm = () => {
    isFolderFormOpen.value = false;
  };

  const handleFolderSubmit = (folderName: string) => {
    folderStore.addFolder(folderName);
    closeFolderForm();
  };
</script>
