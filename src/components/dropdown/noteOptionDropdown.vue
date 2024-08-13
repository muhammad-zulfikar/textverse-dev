<!--noteOptionDropdown-->

<template>
  <Dropdown ref="dropdownRef" dropdownId="noteOptionsDropdown" contentWidth="9rem" position="down" direction="left">
    <template #label>
      <div class="flex items-center px-2 py-1 cursor-pointer custom-card hover:bg-[#d9c698] dark:hover:bg-gray-600">
        <PhFile :size="20" class="size-5 mr-2" />
        <h1 class="truncate">{{ title }}</h1>
      </div>
    </template>

    <div @click="renameNote" class="block px-1 text-sm cursor-pointer" role="menuitem">
      <span class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
        <PhPencilSimple :size="20" class="size-5 mr-2" />
        Rename
      </span>
    </div>

    <div @click="toggleMarkdownPreview" class="block px-1 text-sm cursor-pointer" role="menuitem">
      <span
        class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
        <PhMarkdownLogo v-if="!uiStore.showPreview" :size="20" class="size-5 mr-2" />
        <PhPencilSimple v-else :size="20" class="size-5 mr-2" />
        {{ uiStore.showPreview ? 'Edit' : 'Preview' }}
      </span>
    </div>

    <div @click="copyNote" class="block px-1 text-sm cursor-pointer" role="menuitem">
      <span
        class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
        <PhClipboardText :size="20" class="mr-2" />
        Copy
      </span>
    </div>

    <div :class="['block px-1 text-sm cursor-pointer', { 'relative': isShared }]" role="menuitem"
      @click="!isShared && toggleShare()"
      @mouseenter="isShared && openSubmenu('public')"
      @mouseleave="isShared && closeSubmenu('public')">
      <span
        class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
        <PhGlobeX v-if="isShared" :size="20" class="size-5 mr-2" />
        <PhGlobe v-else :size="20" class="size-5 mr-2" />
        {{ isShared ? 'Unpublic' : 'Make public' }}
        <PhCaretRight v-if="isShared" :size="14" class="absolute right-2" />
      </span>
      <div v-if="isShared && activeSubmenu === 'public'"
        class="absolute left-full top-0 ml-1 custom-card p-1 min-w-28 whitespace-nowrap">
        <div @click="toggleShare" class="block text-sm cursor-pointer" role="menuitem">
          <span
            class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
            <PhGlobeX :size="20" class="size-5 mr-2" />
            Unpublic
          </span>
        </div>
        <div @click="copyShareLink" class="block text-sm cursor-pointer" role="menuitem">
          <span
            class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
            <PhCopy :size="20" class="size-5" />
            <span class="flex md:ml-2">
              Copy link
            </span>
          </span>
        </div>
      </div>
    </div>

    <div @mouseenter="openSubmenu('folder')" @mouseleave="closeSubmenu('folder')"
      class="block px-1 text-sm cursor-pointer relative" role="menuitem">
      <span
        class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
        <PhFolder :size="20" class="size-5 mr-2" />
        {{ folderValue }}
        <PhCaretRight :size="14" class="absolute right-2" />
      </span>
      <div v-if="activeSubmenu === 'folder'"
        class="absolute left-full top-0 ml-1 custom-card p-1 min-w-28 whitespace-nowrap">
        <div v-for="folder in availableFolders" :key="folder" @click="updateFolder(folder)"
          class="p-2 cursor-pointer rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
          <PhFolder :size="20" class="size-5 mr-2" />
          {{ folder }}
        </div>
      </div>
    </div>

    <div @mouseenter="openSubmenu('info')" @mouseleave="closeSubmenu('info')"
      class="block px-1 text-sm cursor-pointer relative" role="menuitem">
      <span class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
        <PhInfo :size="20" class="size-5 mr-2" />
        Info
        <PhCaretRight :size="14" class="absolute right-2" />
      </span>
      <div v-if="activeSubmenu === 'info'"
        class="absolute left-full top-0 ml-1 custom-card p-1 min-w-28 whitespace-nowrap">
        <div class="p-2 flex items-center">
          <PhCalendarBlank :size="20" class="size-5 mr-2" />
          {{ formattedDate }}
        </div>
        <div class="p-2 flex items-center">
          <PhHash :size="20" class="size-5 mr-2" />
          {{ characterCount }} characters
        </div>
      </div>
    </div>

    <!-- Save option -->
    <div @click="saveNote" :class="[
      'block px-1 text-sm cursor-pointer',
      {
        'text-blue-500 hover:text-blue-300': isValid && (!isEditMode || hasChanges),
        'text-gray-400 cursor-default': !isValid || (isEditMode && !hasChanges),
      },
    ]" role="menuitem">
      <span class="p-2 w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
        <PhFloppyDisk :size="20" class="size-5 mr-2" />
        Save
      </span>
    </div>

    <!-- Delete option (only if in edit mode) -->
    <div v-if="isEditMode" @click="openDeleteAlert" class="block px-1 text-sm cursor-pointer text-red-500 hover:text-red-100" role="menuitem">
      <span class="p-2 w-full text-left rounded-md hover:bg-red-700/50 dark:hover:bg-red-800/60 transition-colors duration-200 flex items-center whitespace-nowrap">
        <PhTrash :size="20" class="size-5 mr-2" />
        Delete
      </span>
    </div>

    <!-- Expand/Collapse option -->
    <div @click="toggleExpand" class="block px-1 text-sm cursor-pointer" role="menuitem">
      <span class="p-2 w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap">
        <PhArrowsIn v-if="isExpanded" :size="20" class="size-5 mr-2" />
        <PhArrowsOut v-else :size="20" class="size-5 mr-2" />
        {{ isExpanded ? 'Collapse' : 'Expand' }}
      </span>
    </div>
  </Dropdown>

  <InputModal
    :is-open="isRenameModalOpen"
    mode="title"
    :current-value="title"
    :max-length="30"
    @update="handleRename"
    @close="closeRenameModal"
  />
</template>


<script setup lang="ts">
import { ref, computed } from 'vue';
import { PhFile, PhPencilSimple, PhClipboardText, PhCopy, PhGlobe, PhGlobeX, PhMarkdownLogo, PhFolder, PhInfo, PhCalendarBlank, PhHash, PhFloppyDisk, PhTrash, PhArrowsIn, PhArrowsOut, PhCaretRight } from '@phosphor-icons/vue';
import { uiStore, notesStore, folderStore } from '@/store/stores';
import Dropdown from '@/components/dropdown/dropdown.vue';
import InputModal from '@/components/modal/inputModal.vue';
import { DEFAULT_FOLDERS } from '@/store/constants';

const props = defineProps<{
  noteId: number | null;
  title: string;
  isShared: boolean;
  folder: string;
  lastEditedDate: string;
  content: string;
  isEditMode: boolean;
  isValid: boolean;
  hasChanges: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleShare'): void;
  (e: 'copyShareLink'): void;
  (e: 'copyNote'): void;
  (e: 'toggleMarkdownPreview'): void;
  (e: 'updateFolder', folder: string): void;
  (e: 'saveNote'): void;
  (e: 'openDeleteAlert'): void;
  (e: 'updateTitle', title: string): void;
}>();

const isRenameModalOpen = ref(false);

const renameNote = () => {
  isRenameModalOpen.value = true;
};

const closeRenameModal = () => {
  isRenameModalOpen.value = false;
};

const handleRename = (newTitle: string) => {
  emit('updateTitle', newTitle.trim());
  closeRenameModal();
};

const toggleShare = () => {
  emit('toggleShare');
};

const copyShareLink = () => {
  emit('copyShareLink');
};

const copyNote = () => {
  emit('copyNote');
};

const toggleMarkdownPreview = () => {
  emit('toggleMarkdownPreview');
};

const folderValue = computed(() => props.folder);

const updateFolder = (folder: string) => {
  emit('updateFolder', folder);
  closeAllSubmenus();
};

const availableFolders = computed(() => {
  return [
    ...folderStore.folders.filter(
      (folder) => folder !== DEFAULT_FOLDERS.ALL_NOTES
    ),
  ];
});

const formattedDate = computed(() => new Date(props.lastEditedDate).toLocaleDateString());
const characterCount = computed(() => props.content.length);

const isExpanded = computed(() => uiStore.isExpanded);

const saveNote = () => emit('saveNote');
const openDeleteAlert = () => emit('openDeleteAlert');
const toggleExpand = () => uiStore.toggleExpand();

const activeSubmenu = ref<string | null>(null);

const openSubmenu = (submenu: string) => {
  activeSubmenu.value = submenu;
};

const closeSubmenu = (submenu: string) => {
  if (activeSubmenu.value === submenu) {
    activeSubmenu.value = null;
  }
};

const closeAllSubmenus = () => {
  activeSubmenu.value = null;
};
</script>