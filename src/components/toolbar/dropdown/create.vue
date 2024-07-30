<!-- create.vue -->

<template>
  <div class="relative inline-block text-left" ref="dropdownRef">
    <button
      @click.stop="toggleDropdown"
      :class="{ 'z-50': dropdownOpen }"
      class="hover:underline dark:hover:bg-transparent outline-none mr-4 flex items-center relative"
    >
      + Create
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
        class="custom-card z-50 origin-top-right absolute mt-2 w-[6.4rem] ml-[-15px]"
      >
        <div class="py-1" role="menu" aria-orientation="vertical">
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
        </div>
      </div>
    </Transition>
  </div>
  <InputModal
    :is-open="isFolderFormOpen"
    mode="folder"
    :max-length="10"
    @update="handleFolderSubmit"
    @close="closeFolderForm"
  />
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import { notesStore, uiStore, folderStore } from '@/store/stores';
  import InputModal from '@/components/modal/inputModal.vue';

  const dropdownOpen = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);
  const isFolderFormOpen = ref(false);

  const toggleDropdown = () => {
    if (dropdownOpen.value) {
      closeDropdown();
    } else {
      uiStore.setActiveDropdown('create');
    }
  };

  const closeDropdown = () => {
    uiStore.setActiveDropdown(null);
  };

  const openNoteForm = () => {
    uiStore.openNote(null);
    closeDropdown();
  };

  const openFolderForm = () => {
    isFolderFormOpen.value = true;
    closeDropdown();
  };

  const closeFolderForm = () => {
    isFolderFormOpen.value = false;
  };

  const handleFolderSubmit = (folderName: string) => {
    folderStore.addFolder(folderName);
    closeFolderForm();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      closeDropdown();
    }
  };

  onMounted(() => document.addEventListener('click', handleClickOutside));
  onUnmounted(() => document.removeEventListener('click', handleClickOutside));

  watch(
    () => notesStore.editing,
    (newValue) => {
      if (newValue) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    }
  );

  watch(
    () => uiStore.activeDropdown,
    (newValue) => {
      dropdownOpen.value = newValue === 'create';
    }
  );
</script>
