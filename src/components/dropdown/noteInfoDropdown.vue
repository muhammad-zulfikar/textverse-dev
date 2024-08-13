<template>
    <Dropdown
      ref="dropdownRef"
      dropdownId="noteInfoDropdown"
      contentWidth="fit-content"
      showArrow="true"
    >
      <template #label>
        <div
          class="flex px-2 py-1 cursor-pointer custom-card hover:bg-[#d9c698] dark:hover:bg-gray-600 items-center"
        >
          <PhInfo :size="20" class="size-5" />
          <!-- <span v-if="uiStore.isExpanded" class="hidden md:flex md:ml-2">Info</span> -->
        </div>
      </template>
  
      <div class="block px-1 text-sm" role="menuitem">
        <span class="p-2 w-full text-left rounded-md transition-colors duration-200 flex items-center whitespace-nowrap">
          <PhCalendarBlank :size="20" class="size-5 mr-2" />
          {{ formattedDate }}
        </span>
      </div>
  
      <div class="block px-1 text-sm" role="menuitem">
        <span class="p-2 w-full text-left rounded-md transition-colors duration-200 flex items-center whitespace-nowrap">
          <PhHash :size="20" class="size-5 mr-2" />
          {{ characterCount }} characters
        </span>
      </div>
    </Dropdown>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import { PhInfo, PhCalendarBlank, PhHash } from '@phosphor-icons/vue';
  import { uiStore } from '@/store/stores';
  import Dropdown from '@/components/dropdown/dropdown.vue';
  
  const props = defineProps<{
    date: string;
    content: string;
  }>();
  
  const formattedDate = computed(() => {
    return new Date(props.date).toLocaleDateString();
  });
  
  const characterCount = computed(() => {
    return props.content.length;
  });
  </script>