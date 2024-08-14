<template>
  <Dropdown
    ref="dropdownRef"
    dropdownId="noteOptionsDropdown"
    contentWidth="9rem"
    position="left"
    direction="down"
  >
    <template #label>
      <div
        class="flex items-center px-2 py-1 cursor-pointer custom-card hover:bg-[#d9c698] dark:hover:bg-gray-600"
      >
        <PhFile :size="20" class="size-5" />
        <h1 class="truncate ml-2">{{ title }}</h1>
      </div>
    </template>

    <div
      @click="renameNote"
      class="block px-1 text-sm cursor-pointer"
      role="menuitem"
    >
      <span
        class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
      >
        <PhPencilSimple :size="20" class="size-5 mr-2" />
        Rename
      </span>
    </div>

    <div
      @click.stop="openSubmenu('option')"
      class="block px-1 text-sm cursor-pointer relative"
      role="menuitem"
    >
      <span
        class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
      >
        <PhDotsThreeCircle :size="20" class="size-5 mr-2" />
        Option
        <PhCaretRight :size="14" class="absolute right-2" />
      </span>
      <div
        v-if="
          activeSubmenu === 'option' ||
          activeSubmenu === 'folder' ||
          activeSubmenu === 'info'
        "
        class="absolute left-full top-0 custom-card p-1 min-w-28 whitespace-nowrap"
      >
        <div
          @click="copyNote"
          class="block text-sm cursor-pointer"
          role="menuitem"
        >
          <span
            class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
          >
            <PhClipboardText :size="20" class="mr-2" />
            Copy
          </span>
        </div>
        <div
          @click="duplicateNote"
          class="block text-sm cursor-pointer"
          role="menuitem"
        >
          <span
            class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
          >
            <PhCopy :size="20" class="mr-2" />
            Duplicate
          </span>
        </div>
        <div
          @click="toggleShare"
          :class="['block text-sm cursor-pointer', { relative: isShared }]"
          role="menuitem"
        >
          <span
            class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
          >
            <PhGlobeX v-if="isShared" :size="20" class="size-5 mr-2" />
            <PhGlobe v-else :size="20" class="size-5 mr-2" />
            {{ isShared ? 'Unpublic' : 'Make public' }}
          </span>
        </div>
        <div
          v-if="isShared"
          @click="copyShareLink"
          class="block text-sm cursor-pointer"
          role="menuitem"
        >
          <span
            class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
          >
            <PhCopy :size="20" class="size-5" />
            <span class="flex md:ml-2">Copy link</span>
          </span>
        </div>
        <div
          v-if="!isPinned"
          @click="pinNote"
          class="block text-sm cursor-pointer"
          role="menuitem"
        >
          <span
            class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
          >
            <PhPushPin :size="20" class="size-5 mr-2" />
            Pin
          </span>
        </div>
        <div
          v-if="isPinned"
          @click="unpinNote"
          class="block text-sm cursor-pointer"
          role="menuitem"
        >
          <span
            class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
          >
            <PhPushPinSlash :size="20" class="size-5 mr-2" />
            Unpin
          </span>
        </div>
        <div
          @click.stop="openSubmenu('folder')"
          class="block text-sm cursor-pointer relative"
          role="menuitem"
        >
          <span
            class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
          >
            <PhFolder :size="20" class="size-5 mr-2" />
            {{ folderValue }}
            <PhCaretRight :size="14" class="absolute right-2" />
          </span>
          <div
            v-if="activeSubmenu === 'folder'"
            class="absolute left-full top-0 ml-1 custom-card p-1 min-w-28 whitespace-nowrap"
          >
            <div
              v-for="folder in availableFolders"
              :key="folder"
              @click="updateFolder(folder)"
              class="p-2 cursor-pointer rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
            >
              <PhFolder :size="20" class="size-5 mr-2" />
              {{ folder }}
            </div>
          </div>
        </div>
        <div
          @click.stop="openSubmenu('info')"
          class="block text-sm cursor-pointer relative"
          role="menuitem"
        >
          <span
            class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
          >
            <PhInfo :size="20" class="size-5 mr-2" />
            Info
            <PhCaretRight :size="14" class="absolute right-2" />
          </span>
          <div
            v-if="activeSubmenu === 'info'"
            class="absolute left-full top-0 ml-1 custom-card p-1 min-w-28 whitespace-nowrap"
          >
            <div class="p-2 flex items-center">
              <PhCalendarBlank :size="20" class="size-5 mr-2" />
              {{ notesStore.localeDate(props.lastEditedDate) }}
            </div>
            <div class="p-2 flex items-center">
              <PhHash :size="20" class="size-5 mr-2" />
              {{ characterCount }} characters
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      @click="toggleMarkdownPreview"
      class="block px-1 text-sm cursor-pointer"
      role="menuitem"
    >
      <span
        class="p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
      >
        <PhMarkdownLogo
          v-if="!uiStore.showPreview"
          :size="20"
          class="size-5 mr-2"
        />
        <PhNotePencil v-else :size="20" class="size-5 mr-2" />
        {{ uiStore.showPreview ? 'Edit' : 'Preview' }}
      </span>
    </div>

    <div
      @click="toggleExpand"
      class="block px-1 text-sm cursor-pointer"
      role="menuitem"
    >
      <span
        class="p-2 w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center whitespace-nowrap"
      >
        <PhArrowsIn v-if="isExpanded" :size="20" class="size-5 mr-2" />
        <PhArrowsOut v-else :size="20" class="size-5 mr-2" />
        {{ isExpanded ? 'Collapse' : 'Expand' }}
      </span>
    </div>

    <div
      v-if="isEditMode"
      @click="openDeleteAlert"
      class="block px-1 text-sm cursor-pointer text-red-500 hover:text-red-100"
      role="menuitem"
    >
      <span
        class="p-2 w-full text-left rounded-md hover:bg-red-700/50 dark:hover:bg-red-800/60 transition-colors duration-200 flex items-center whitespace-nowrap"
      >
        <PhTrash :size="20" class="size-5 mr-2" />
        Delete
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
  import {
    PhFile,
    PhPencilSimple,
    PhDotsThreeCircle,
    PhClipboardText,
    PhCopy,
    PhGlobe,
    PhGlobeX,
    PhMarkdownLogo,
    PhFolder,
    PhInfo,
    PhCalendarBlank,
    PhHash,
    PhArrowsIn,
    PhArrowsOut,
    PhTrash,
    PhCaretRight,
    PhNotePencil,
    PhPushPin,
    PhPushPinSlash,
  } from '@phosphor-icons/vue';
  import { notesStore, uiStore, folderStore } from '@/store/stores';
  import Dropdown from '@/components/dropdown/dropdown.vue';
  import InputModal from '@/components/modal/inputModal.vue';
  import { DEFAULT_FOLDERS } from '@/store/constants';

  const props = defineProps<{
    noteId: string | null;
    title: string;
    isShared: boolean;
    folder: string;
    lastEditedDate: string | Date;
    content: string;
    isEditMode: boolean;
    isValid: boolean;
    hasChanges: boolean;
    isPinned: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'toggleShare'): void;
    (e: 'copyShareLink'): void;
    (e: 'copyNote'): void;
    (e: 'toggleMarkdownPreview'): void;
    (e: 'updateFolder', folder: string): void;
    (e: 'openDeleteAlert'): void;
    (e: 'updateTitle', title: string): void;
    (e: 'duplicateNote'): void;
    (e: 'pinNote'): void;
    (e: 'unpinNote'): void;
  }>();

  const isRenameModalOpen = ref(false);
  const activeSubmenu = ref<string | null>(null);

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

  const duplicateNote = () => {
    emit('duplicateNote');
  };

  const pinNote = () => {
    emit('pinNote');
  };

  const unpinNote = () => {
    emit('unpinNote');
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

  const characterCount = computed(() => props.content.length);
  const isExpanded = computed(() => uiStore.isExpanded);

  const openDeleteAlert = () => emit('openDeleteAlert');
  const toggleExpand = () => uiStore.toggleExpand();

  const openSubmenu = (submenu: string) => {
    if (activeSubmenu.value === submenu) {
      activeSubmenu.value = null;
    } else {
      activeSubmenu.value = submenu;
    }
  };

  const closeAllSubmenus = () => {
    activeSubmenu.value = null;
  };
</script>
