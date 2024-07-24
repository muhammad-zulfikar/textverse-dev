<!-- Toolbar.vue -->

<template>
  <div
    class="flex justify-center w-11/12 mx-auto font-serif text-sm md:text-base transition-all duration-300"
  >
    <div class="flex items-center select-none">
      <Create @openFolderForm="openFolderForm" />
      <span class="mr-4 md:mr-8 md:ml-4 cursor-default">|</span>
      <Folder />
      <span class="mr-4 md:mr-8 md:ml-4 cursor-default">|</span>
      <ViewDropdown />
    </div>
  </div>
  <FolderForm
    :is-open="isFolderFormOpen"
    mode="create"
    @close="closeFolderForm"
    @submit="handleFolderSubmit"
  />
  <NoteForm v-if="store.editing" />
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { useNotesStore } from '@/store/store';
  import FolderForm from '@/components/modal/folderForm.vue';
  import NoteForm from '@/components/notes/noteForm.vue';
  import Folder from './dropdown/folder.vue';
  import Create from './dropdown/create.vue';
  import ViewDropdown from './dropdown/view.vue';

  const store = useNotesStore();
  const isFolderFormOpen = ref(false);

  const closeFolderForm = () => {
    isFolderFormOpen.value = false;
  };

  const handleFolderSubmit = (folderName: string) => {
    store.createFolder(folderName);
    closeFolderForm();
  };

  const openFolderForm = () => {
    isFolderFormOpen.value = true;
  };
</script>
