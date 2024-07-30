<!-- view.vue -->

<template>
  <div
    class="relative inline-block text-left whitespace-nowrap"
    ref="dropdownRef"
  >
    <button
      @click.stop="toggleDropdown"
      :class="{ 'z-50': dropdownOpen }"
      class="hover:underline dark:hover:bg-transparent outline-none flex items-center relative"
    >
      View
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
        class="custom-card z-50 origin-top-left absolute left-0 mt-2 w-[125px] ml-[-30px]"
      >
        <div class="py-1" role="menu" aria-orientation="vertical">
          <a
            @click.stop="toggleCardView"
            :class="{ underline: uiStore.viewType === 'card' }"
            class="block px-4 py-2 text-sm cursor-pointer hover:underline flex justify-between items-center"
            role="menuitem"
          >
            Card
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="columnsExpanded ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"
              />
            </svg>
          </a>
          <div
            v-if="columnsExpanded"
            class="flex items-center justify-center mx-2"
          >
            <a
              @click.stop="decreaseColumns"
              class="block cursor-pointer"
              role="menuitem"
            >
            <img src="@/assets/icons/minus.svg" class="h-4 w-4">
            </a>
            <span class="mx-2 text-sm whitespace-nowrap">
              {{ uiStore.columns }} Columns
            </span>
            <a
              @click.stop="increaseColumns"
              class="block cursor-pointer"
              role="menuitem"
            >
              <img src="@/assets/icons/plus.svg" class="h-4 w-4">
            </a>
          </div>
          <a
            @click.stop="setViewType('table')"
            :class="{ underline: uiStore.viewType === 'table' }"
            class="block px-4 py-2 text-sm cursor-pointer hover:underline"
            role="menuitem"
          >
            Table
          </a>
          <a
            @click.stop="setViewType('mail')"
            :class="{ underline: uiStore.viewType === 'mail' }"
            class="block px-4 py-2 text-sm cursor-pointer hover:underline"
            role="menuitem"
          >
            Mail
          </a>
          <a
            @click.stop="toggleFolderView"
            :class="{ underline: uiStore.viewType === 'folder' }"
            class="block px-4 py-2 text-sm cursor-pointer hover:underline flex justify-between items-center"
            role="menuitem"
          >
            Folder
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 ml-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="folderViewExpanded ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"
              />
            </svg>
          </a>
          <div v-if="folderViewExpanded" class="">
            <a
              @click.stop="setFolderViewType('grid')"
              :class="{ underline: uiStore.folderViewType === 'grid' }"
              class="block px-4 py-2 text-sm cursor-pointer hover:underline"
              role="menuitem"
            >
              - Grid
            </a>
            <a
              @click.stop="setFolderViewType('list')"
              :class="{ underline: uiStore.folderViewType === 'list' }"
              class="block px-4 py-2 text-sm cursor-pointer hover:underline"
              role="menuitem"
            >
              - List
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import { uiStore } from '@/store/stores';

  const isMobile = ref(window.innerWidth < 640);
  const dropdownOpen = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);
  const columnsExpanded = ref(false);
  const folderViewExpanded = ref(false);

  const toggleDropdown = () => {
    if (dropdownOpen.value) {
      closeDropdown();
    } else {
      uiStore.setActiveDropdown('view');
    }
  };

  const closeDropdown = () => {
    uiStore.setActiveDropdown(null);
    columnsExpanded.value = false;
    folderViewExpanded.value = false;
  };

  const setViewType = (viewType: 'card' | 'table' | 'mail' | 'folder') => {
    uiStore.setViewType(viewType);
    if (viewType === 'card') {
      columnsExpanded.value = true;
      folderViewExpanded.value = false;
    } else if (viewType === 'folder') {
      columnsExpanded.value = false;
      folderViewExpanded.value = true;
    } else {
      closeDropdown();
    }
  };

  const toggleCardView = () => {
    if (columnsExpanded.value) {
      columnsExpanded.value = false;
    } else {
      setViewType('card');
    }
  };

  const increaseColumns = () => {
    if (uiStore.columns < (isMobile.value ? 2 : 5)) {
      uiStore.setColumns(uiStore.columns + 1);
    }
  };

  const decreaseColumns = () => {
    if (uiStore.columns > 1) {
      uiStore.setColumns(uiStore.columns - 1);
    }
  };

  const toggleFolderView = () => {
    if (folderViewExpanded.value) {
      folderViewExpanded.value = false;
    } else {
      setViewType('folder');
    }
  };

  const setFolderViewType = (viewType: 'grid' | 'list') => {
    uiStore.setFolderViewType(viewType);
    closeDropdown();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      closeDropdown();
    }
  };

  const handleResize = () => {
    const newIsMobile = window.innerWidth < 640;
    if (newIsMobile !== isMobile.value) {
      isMobile.value = newIsMobile;
      if (isMobile.value && uiStore.columns > 2) {
        uiStore.setColumns(2);
      } else if (!isMobile.value && uiStore.columns < 3) {
        uiStore.setColumns(4);
      }
    }
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('resize', handleResize);
    handleResize();
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('resize', handleResize);
  });

  watch(
    () => uiStore.activeDropdown,
    (newValue) => {
      dropdownOpen.value = newValue === 'view';
    }
  );

  watch(
    () => uiStore.viewType,
    (newValue) => {
      if (newValue === 'card') {
        columnsExpanded.value = true;
        folderViewExpanded.value = false;
      } else if (newValue === 'folder') {
        columnsExpanded.value = false;
        folderViewExpanded.value = true;
      } else {
        columnsExpanded.value = false;
        folderViewExpanded.value = false;
      }
    }
  );
</script>
