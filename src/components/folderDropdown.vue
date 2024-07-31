<template>
  <Dropdown
    ref="dropdownRef"
    dropdownId="folderDropdown"
    contentWidth="fit-content"
    :direction="direction"
  >
    <template #label>
      <div v-if="props.modelValue === DEFAULT_FOLDERS.ALL_NOTES">
        {{ DEFAULT_FOLDERS.UNCATEGORIZED }}
      </div>
      <div v-else>{{ modelValue }}</div>
    </template>

    <template v-for="folder in availableFolders" :key="folder">
      <div
        @click.stop="selectFolder(folder)"
        class="block px-4 py-2 text-sm cursor-pointer"
        role="menuitem"
      >
        <span
          :class="folder === modelValue ? 'underline dark:text-white' : ''"
          class="hover:underline"
        >
          {{ folder }}
        </span>
      </div>
    </template>
  </Dropdown>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue';
  import { folderStore, uiStore } from '@/store/stores';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import Dropdown from '@/components/dropdown.vue';
  import { onClickOutside } from '@vueuse/core';

  const props = defineProps<{
    modelValue: string;
    direction?: 'up' | 'down';
  }>();

  const emit = defineEmits(['update:modelValue']);

  const availableFolders = computed(() => {
    return [
      ...folderStore.folders.filter(
        (folder) => folder !== DEFAULT_FOLDERS.ALL_NOTES
      ),
    ];
  });

  const selectFolder = (folder: string) => {
    emit('update:modelValue', folder);
    uiStore.setActiveDropdown(null);
  };

  // Ref for the dropdown element
  const dropdownRef = ref<HTMLElement | null>(null);

  // Setup onClickOutside to detect clicks outside the dropdown
  onMounted(() => {
    if (dropdownRef.value) {
      onClickOutside(dropdownRef.value, () => {
        uiStore.setActiveDropdown(null);
      });
    }
  });

  onUnmounted(() => {
    // Clean up if needed
  });
</script>
