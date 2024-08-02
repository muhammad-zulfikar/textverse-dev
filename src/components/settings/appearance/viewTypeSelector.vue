<template>
  <div class="flex items-center justify-between relative">
    <div class="mr-6">
      <label for="viewType" class="text-lg font-semibold mb-1">View Type</label>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Choose how your notes are displayed.
      </p>
    </div>
    <Dropdown
      label="ViewType"
      dropdownId="viewtype"
      contentWidth="6.4rem"
      content-margin-left="-1rem"
      showArrow="false"
      direction="down"
    >
      <template #label>
        <button
          @click="isOpen = !isOpen"
          :class="[
            'mt-2 md:mt-0 text-sm md:text-base px-4 py-2 flex items-center relative',
            uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
          ]"
        >
          {{ viewTypeText }}
          <span class="ml-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                v-if="isOpen"
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
      </template>
      <a
        v-for="type in viewTypes"
        :key="type"
        @click.stop="setViewType(type as 'card' | 'table' | 'mail' | 'folder')"
        class="block px-4 py-2 text-sm cursor-pointer hover:underline"
        role="menuitem"
      >
        {{ type.charAt(0).toUpperCase() + type.slice(1) }}
      </a>
    </Dropdown>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { uiStore } from '@/store/stores';
  import Dropdown from '@/components/dropdown.vue';

  const isOpen = ref(false);
  const viewTypes = ['card', 'table', 'mail', 'folder'];
  const viewTypeText = computed(
    () => uiStore.viewType.charAt(0).toUpperCase() + uiStore.viewType.slice(1)
  );

  const setViewType = (viewType: 'card' | 'table' | 'mail' | 'folder') => {
    uiStore.setViewType(viewType);
    uiStore.showToastMessage('View type updated');
  };
</script>
