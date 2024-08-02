<!-- create.vue -->

<template>
  <Dropdown
    label="+ Create"
    dropdownId="create"
    contentWidth="6.4rem"
    contentMarginLeft="-14px"
    showArrow="true"
    direction="down"
  >
    <template #label>+ Create</template>
    <a
      @click.stop="openNoteForm"
      class="block px-4 py-2 text-sm cursor-pointer hover:underline"
      role="menuitem"
    >
      Note
    </a>
    <a
      @click.stop="openFolderForm"
      class="block px-4 py-2 text-sm cursor-pointer hover:underline"
      role="menuitem"
    >
      Folder
    </a>
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
