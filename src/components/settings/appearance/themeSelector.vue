<template>
  <div class="flex items-center justify-between relative md:mb-2">
    <div class="mr-6">
      <label for="theme" class="text-lg font-semibold mb-1">Theme</label>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Choose how textVerse looks to you.
      </p>
    </div>
    <Dropdown
      label="Theme"
      dropdownId="theme"
      contentWidth="6.4rem"
      content-margin-left="-0.75rem"
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
          {{ currentThemeText }}
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
        v-for="theme in themes"
        :key="theme"
        @click.stop="setTheme(theme as 'light' | 'dark' | 'system')"
        class="block px-4 py-2 text-sm md:text-base cursor-pointer hover:underline"
        role="menuitem"
      >
        {{ theme.charAt(0).toUpperCase() + theme.slice(1) }}
      </a>
    </Dropdown>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { uiStore } from '@/store/stores';
  import Dropdown from '@/components/dropdown.vue';

  const isOpen = ref(false);
  const themes = ['system', 'dark', 'light'];
  const currentThemeText = computed(
    () =>
      uiStore.currentTheme.charAt(0).toUpperCase() +
      uiStore.currentTheme.slice(1)
  );

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    uiStore.setTheme(theme);
  };
</script>
