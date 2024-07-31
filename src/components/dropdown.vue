<!-- dropdown.vue -->

<template>
  <div class="relative inline-block text-left font-serif" ref="dropdownRef">
    <button
      @click.stop="toggleDropdown"
      :class="{ 'z-50': isOpen }"
      class="hover:underline outline-none flex items-center relative cursor-pointer"
    >
      <slot name="label"></slot>
      <span class="ml-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            v-if="isOpen && direction === 'down'"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 15l7-7 7 7"
          />
          <path
            v-if="!isOpen && direction === 'down'"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
          <path
            v-if="isOpen && direction === 'up'"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
          <path
            v-if="!isOpen && direction === 'up'"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </span>
    </button>
    <Transition name="zoom">
      <div
        v-if="isOpen"
        class="mt-2 custom-card z-50 absolute"
        :class="[
          'mt-2 z-50 absolute',
          uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
          {
            'origin-top-left': direction === 'down',
            'origin-bottom-left': direction === 'up',
          },
        ]"
        :style="{
          width: contentWidth,
          marginLeft: contentMarginLeft,
          ...(direction === 'up'
            ? { bottom: '100%', left: '0' }
            : { top: '100%', left: '0' }),
        }"
      >
        <div class="py-1" role="menu" aria-orientation="vertical">
          <slot></slot>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import { uiStore } from '@/store/stores';

  const props = defineProps<{
    dropdownId: string;
    contentWidth?: string;
    contentMarginLeft?: string;
    direction?: 'up' | 'down';
  }>();

  const isOpen = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);

  const toggleDropdown = () => {
    if (isOpen.value) {
      closeDropdown();
    } else {
      uiStore.setActiveDropdown(props.dropdownId);
    }
  };

  const closeDropdown = () => {
    uiStore.setActiveDropdown(null);
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
    () => uiStore.activeDropdown,
    (newValue) => {
      isOpen.value = newValue === props.dropdownId;
    }
  );
</script>
