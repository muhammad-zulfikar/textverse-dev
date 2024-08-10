<template>
  <Dropdown
    ref="dropdownRef"
    dropdownId="folderDropdown"
    contentWidth="fit-content"
    showArrow="true"
    :direction="direction"
  >
    <template #label>
      <div
        class="flex px-2 py-1 cursor-pointer custom-card hover:bg-[#d9c698] dark:hover:bg-gray-600 items-center"
      >
        <PhFolderMinus
          v-if="modelValue === DEFAULT_FOLDERS.UNCATEGORIZED"
          :size="20"
          class="size-5 mr-2"
        />
        <PhFolder v-else :size="20" class="size-5 mr-2" />
        <div v-if="props.modelValue === DEFAULT_FOLDERS.ALL_NOTES">
          {{ DEFAULT_FOLDERS.UNCATEGORIZED }}
        </div>
        <div v-else>{{ modelValue }}</div>
      </div>
    </template>

    <template v-for="folder in availableFolders" :key="folder">
      <div
        @click.stop="selectFolder(folder)"
        class="block px-1 text-sm cursor-pointer"
        role="menuitem"
      >
        <span
          :class="folder === modelValue ? 'bg-[#ebdfc0] dark:bg-gray-700' : ''"
          class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
        >
          <PhFolderMinus
            v-if="folder === DEFAULT_FOLDERS.UNCATEGORIZED"
            :size="20"
            class="size-5 mr-2"
          />
          <PhFolder v-else :size="20" class="size-5 mr-2" />
          {{ folder }}
        </span>
      </div>
    </template>
  </Dropdown>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue';
  import { PhFolder, PhFolderMinus } from '@phosphor-icons/vue';
  import { folderStore, uiStore } from '@/store/stores';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import Dropdown from '@/components/dropdown/dropdown.vue';
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

  const dropdownRef = ref<HTMLElement | null>(null);

  onMounted(() => {
    if (dropdownRef.value) {
      onClickOutside(dropdownRef.value, () => {
        uiStore.setActiveDropdown(null);
      });
    }
  });
</script>
