<template>
  <div class="relative inline-block text-left whitespace-nowrap" ref="dropdownRef">
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
    <div
      v-if="dropdownOpen"
      class="custom-card z-50 origin-top-left absolute left-0 mt-2 w-fit ml-[-25px]"
    >
      <div class="py-1" role="menu" aria-orientation="vertical">
        <a
          @click.stop="toggleCardView"
          :class="{ 'underline': uiStore.viewType === 'card' }"
          class="block px-4 py-2 text-sm cursor-pointer hover:underline flex justify-between items-center"
          role="menuitem"
        >
          Card View
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
        <div v-if="columnsExpanded" class="flex items-center justify-center">
          <a
            @click.stop="decreaseColumns"
            class="block px-1 py-2 text-sm cursor-pointer hover:underline"
            role="menuitem"
          >
            -
          </a>
          <span class="px-1 text-sm whitespace-nowrap">{{ uiStore.columns }} Columns</span>
          <a
            @click.stop="increaseColumns"
            class="block px-1 py-2 text-sm cursor-pointer hover:underline"
            role="menuitem"
          >
            +
          </a>
        </div>
        <div class="border-t border-gray-200 my-1"></div>
        <a
          @click.stop="setViewType('table')"
          :class="{ 'underline': uiStore.viewType === 'table' }"
          class="block px-4 py-2 text-sm cursor-pointer hover:underline"
          role="menuitem"
        >
          Table View
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { uiStore } from '@/store/stores';

const isMobile = ref(window.innerWidth < 640);
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const columnsExpanded = ref(false);

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
};

const setColumns = (columns: number) => {
  uiStore.setColumns(columns);
};

const setViewType = (viewType: 'card' | 'table') => {
  uiStore.setViewType(viewType);
  if (viewType === 'card') {
    columnsExpanded.value = !columnsExpanded.value;
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

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
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
    } else {
      columnsExpanded.value = false;
    }
  }
);
</script>
