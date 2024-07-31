<!-- view.vue -->

<template>
  <Dropdown
    dropdownId="view"
    contentWidth="8.8rem"
    contentMarginLeft="-42px"
    direction="down"
  >
    <template #label>View</template>
    <div class="flex px-4 py-2 justify-between">
      <a
        @click.stop="setViewType('card')"
        :class="{ underline: uiStore.viewType === 'card' }"
        class="block text-sm cursor-pointer hover:underline flex justify-between items-center"
        role="menuitem"
      >
        Card
      </a>
      <span @click.stop="toggleCardView">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 ml-2 cursor-pointer"
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
      </span>
    </div>

    <div
      v-if="columnsExpanded"
      class="flex items-center justify-center mx-4 mb-2"
    >
      <a
        @click.stop="decreaseColumns"
        class="block cursor-pointer"
        role="menuitem"
      >
        <img src="@/assets/icons/minus.svg" class="h-4 w-4 dark:invert" />
      </a>
      <span class="mx-2 text-sm whitespace-nowrap">
        {{ uiStore.columns }} Columns
      </span>
      <a
        @click.stop="increaseColumns"
        class="block cursor-pointer"
        role="menuitem"
      >
        <img src="@/assets/icons/plus.svg" class="h-4 w-4 dark:invert" />
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

    <div class="flex px-4 py-2 justify-between">
      <a
        @click.stop="setViewType('folder')"
        :class="{ underline: uiStore.viewType === 'folder' }"
        class="block text-sm cursor-pointer hover:underline flex justify-between items-center"
        role="menuitem"
      >
        Folder
      </a>
      <span @click.stop="toggleFolderView">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 cursor-pointer"
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
      </span>
    </div>
    <div
      v-if="folderViewExpanded"
      class="flex items-center justify-center mx-4"
    >
    <a
        @click.stop="setFolderViewType('grid')"
        :class="{ underline: uiStore.folderViewType === 'grid' }"
        class="block px-4 mb-2 text-sm cursor-pointer hover:underline"
        role="menuitem"
      >
        Grid
      </a>
      <a
        @click.stop="setFolderViewType('list')"
        :class="{ underline: uiStore.folderViewType === 'list' }"
        class="block px-4 mb-2 text-sm cursor-pointer hover:underline"
        role="menuitem"
      >
        List
      </a>
    </div>
  </Dropdown>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { uiStore } from '@/store/stores';
import Dropdown from '@/components/dropdown.vue';

const isMobile = ref(window.innerWidth < 640);
const columnsExpanded = ref(false);
const folderViewExpanded = ref(false);

const setViewType = (viewType: 'card' | 'table' | 'mail' | 'folder') => {
  uiStore.setViewType(viewType);
  uiStore.setActiveDropdown(null);
};

const toggleCardView = () => {
  columnsExpanded.value = !columnsExpanded.value;
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
  folderViewExpanded.value = !folderViewExpanded.value;
};

const setFolderViewType = (viewType: 'grid' | 'list') => {
  uiStore.setFolderViewType(viewType);
  uiStore.setActiveDropdown(null);
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
  window.addEventListener('resize', handleResize);
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

watch(
  () => uiStore.viewType,
  (newValue) => {
    if (newValue !== 'card') {
      columnsExpanded.value = false;
    }
    if (newValue !== 'folder') {
      folderViewExpanded.value = false;
    }
  }
);
</script>

<style scoped>
svg:active {
  transform: scale(0.8);
  transition-duration: 200ms;
}
</style>