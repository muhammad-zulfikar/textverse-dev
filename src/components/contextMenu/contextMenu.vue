<!-- ContextMenu.vue -->

<template>
  <div v-if="visible" class="fixed inset-0 z-50 select-none">
    <div class="fixed inset-0" @click="hideMenu"></div>
    <div
      ref="menuRef"
      :style="menuStyle"
      class="z-60"
      :class="[
        uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card-no-transition',
      ]"
    >
      <ul class="font-serif text-sm w-[120px] p-1">
        <li
          v-if="!showFolderOptions"
          @click="editNote"
          class="px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
        >
          Edit
        </li>
        <li
          v-if="!showFolderOptions"
          @click="copyNote"
          class="px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
        >
          Copy
        </li>
        <li
          v-if="!showFolderOptions && props.note.pinned"
          @click="unpinNote"
          class="px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
        >
          Unpin
        </li>
        <li
          v-if="!showFolderOptions && !props.note.pinned"
          @click="pinNote"
          class="px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
        >
          Pin
        </li>
        <li
          v-if="!showFolderOptions"
          class="relative inline-block text-left w-full"
          ref="dropdownRef"
        >
          <button
            @click.stop="toggleFolderOptions"
            class="px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
          >
            Move to
          </button>
        </li>
        <li v-if="showFolderOptions">
          <ul>
            <li
              v-for="(folder, _index) in availableFolders"
              :key="folder"
              @click.stop="moveNote(folder)"
              class="px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
              role="menuitem"
            >
              {{ folder }}
            </li>
            <li
              @click.stop="toggleFolderOptions"
              class="px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              Back
            </li>
          </ul>
        </li>
        <!-- <li
          v-if="!showFolderOptions"
          @click="downloadNote"
          class=" cursor-pointer mt-4"
        >
          Download
        </li> -->
        <li
          v-if="!showFolderOptions"
          @click="deleteNote"
          class="px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center text-red-500"
        >
          Delete
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { notesStore, folderStore, uiStore } from '@/store/stores';
  import { Note } from '@/store/types';

  import { CSSProperties } from 'vue';
  import { DEFAULT_FOLDERS } from '@/store/constants';

  const props = defineProps({
    visible: {
      type: Boolean,
      required: true,
    },
    noteId: {
      type: Number,
      required: true,
    },
    position: {
      type: Object as () => { x: number; y: number },
      required: true,
    },
    note: {
      type: Object as () => Note,
      required: true,
    },
  });

  const emit = defineEmits([
    'hideMenu',
    'edit',
    'delete',
    'download',
    'pin',
    'unpin',
  ]);

  const showFolderOptions = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);
  const menuRef = ref<HTMLElement | null>(null);

  const availableFolders = computed(() =>
    folderStore.folders.filter(
      (folder: string) =>
        folder !== props.note.folder && folder !== DEFAULT_FOLDERS.ALL_NOTES
    )
  );

  const calculateMenuPosition = (x: number, y: number) => {
    if (!menuRef.value) return { x, y };

    const menuRect = menuRef.value.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;
    const padding = 10;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let newX = x;
    let newY = y;

    if (x + menuWidth > windowWidth - padding) {
      newX = x - menuWidth;
    }

    if (y + menuHeight > windowHeight - padding) {
      newY = y - menuHeight;
    }

    newX = Math.max(padding, newX);
    newY = Math.max(padding, newY);

    return { x: newX, y: newY };
  };

  const menuStyle = computed(() => {
    const { x, y } = calculateMenuPosition(props.position.x, props.position.y);
    return {
      left: `${x}px`,
      top: `${y}px`,
      position: 'fixed',
      zIndex: 60,
    } as CSSProperties;
  });

  const moveNote = (targetFolder: string) => {
    notesStore.moveNote(props.note.id, targetFolder);
    showFolderOptions.value = false;
    emit('hideMenu');
  };

  const hideMenu = () => {
    showFolderOptions.value = false;
    emit('hideMenu');
  };

  const toggleFolderOptions = (event?: Event) => {
    if (event) {
      event.stopPropagation();
    }
    showFolderOptions.value = !showFolderOptions.value;
  };

  const editNote = () => {
    emit('edit', props.note.id);
    emit('hideMenu');
  };

  const copyNote = () => {
    notesStore.copyNote(props.note.id);
    emit('hideMenu');
  };

  const deleteNote = () => {
    emit('delete', props.noteId);
    emit('hideMenu');
  };

  const pinNote = () => {
    emit('pin', props.noteId);
    emit('hideMenu');
  };

  const unpinNote = () => {
    emit('unpin', props.noteId);
    emit('hideMenu');
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
      hideMenu();
    }
  };

  const handleScroll = () => {
    hideMenu();
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('scroll', handleScroll);
  });
</script>

<style scoped>
  .z-50 {
    z-index: 50;
  }

  .z-60 {
    z-index: 60;
  }
</style>
