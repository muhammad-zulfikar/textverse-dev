<!-- create.vue -->

<template>
  <button
    @click="openModal"
    class="flex hover:underline items-center"
  >
    <svg
      class="w-5 h-5 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      ></path>
    </svg>
    Create
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
          <div class="space-y-3">
            <button
              @click="createNote"
              class="w-full text-left p-3 rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              <svg
                class="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                ></path>
              </svg>
              Note
            </button>
            <button
              @click="openFolderForm"
              class="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              <svg
                class="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                ></path>
              </svg>
              Folder
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

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
  import ModalBackdrop from '@/components/modal/modalBackdrop.vue';
  import InputModal from '@/components/modal/inputModal.vue';

  const isOpen = ref(false);
  const isFolderFormOpen = ref(false);

  const openModal = () => {
    isOpen.value = true;
  };

  const closeModal = () => {
    isOpen.value = false;
  };

  const createNote = () => {
    uiStore.openNote(null);
    closeModal();
  };

  const openFolderForm = () => {
    isFolderFormOpen.value = true;
    closeModal();
  };

  const closeFolderForm = () => {
    isFolderFormOpen.value = false;
  };

  const handleFolderSubmit = (folderName: string) => {
    folderStore.addFolder(folderName);
    closeFolderForm();
  };
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
