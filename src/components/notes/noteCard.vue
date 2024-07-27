<template>
  <li
    ref="cardRef"
    class="custom-card break-inside-avoid h-min mb-6 md:mb-8 p-2 flex flex-col overflow-x-auto cursor-pointer relative group select-none"
    @contextmenu.prevent="showContextMenu($event)"
    :class="{ 'z-50': showMenu, shadow: note.pinned }"
    @click="handleCardClick"
  >
    <div class="flex justify-between items-start">
      <h1
        ref="titleRef"
        class="font-bold text-sl font-serif cursor-pointer dark:text-white"
      >
        {{ note.title }}
      </h1>
    </div>
    <div>
      <div
        v-if="!showOption"
        ref="contentRef"
        class="font-serif text-sm mt-2 dark:text-white truncate-text"
        v-html="truncatedContent"
      ></div>
      <div
        v-if="!showOption"
        class="flex items-center justify-between pt-3 mt-auto font-serif text-gray-500 dark:text-gray-400 text-xs"
      >
        <div
          v-if="note.folder !== DEFAULT_FOLDERS.UNCATEGORIZED"
          ref="folderRef"
          class="w-1/3 text-left text-[10px] md:text-xs"
        >
          <p
            class="cursor-pointer hover:underline truncate"
            @click.stop="goToFolder(note.folder)"
          >
            {{ note.folder }}
          </p>
        </div>
        <div v-else class="w-1/3">
          <!-- Empty div to maintain layout when there's no folder -->
        </div>

        <div class="w-1/3 text-center text-[10px] md:text-xs">
          <p v-if="note.pinned">Pinned</p>
        </div>

        <div ref="dateRef" class="w-1/3 text-right text-[10px] md:text-xs">
          {{ formattedDate }}
        </div>
      </div>
    </div>
  </li>
  <ContextMenu
    :visible="showMenu"
    :position="menuPosition"
    :note="note"
    :noteId="note.id"
    @hideMenu="hideContextMenu"
    @edit="uiStore.openNote"
    @delete="openDeleteAlert"
    @download="notesStore.downloadNote(note)"
    @pin="pinNote"
    @unpin="unpinNote"
  />
  <AlertModal
    :is-open="isAlertOpen"
    :message="alertMessage"
    @confirm="confirmDelete"
    @cancel="closeAlert"
  />
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { notesStore, folderStore, uiStore } from '@/store/stores';
  import { Note } from '@/store/types';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import ContextMenu from '@/components/contextMenu/contextMenu.vue';
  import AlertModal from '@/components/modal/alertModal.vue';

  const props = defineProps({
    note: {
      type: Object as () => Note,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  });

  const showOption = ref(false);
  const showMenu = ref(false);
  const menuPosition = ref({ x: 0, y: 0 });

  const isAlertOpen = ref(false);
  const alertMessage = ref('');

  const truncatedContent = computed(() => {
    const div = document.createElement('div');
    div.innerHTML = props.note.content;
    const textContent = div.textContent || div.innerText || '';
    const lines = textContent.split('\n');
    if (lines.length > 10) {
      return lines.slice(0, 10).join('\n') + '...';
    }
    return props.note.content;
  });

  const showContextMenu = (event: MouseEvent) => {
    event.stopPropagation();
    uiStore.setActiveDropdown(showMenu.value ? 'create' : null);
    menuPosition.value = { x: event.clientX, y: event.clientY };
    showMenu.value = true;
  };

  const hideContextMenu = () => {
    showMenu.value = false;
  };

  const goToFolder = (folder: string) => {
    folderStore.setCurrentFolder(folder);
  };

  const formattedDate = computed(() => {
    const date = new Date(props.note.last_edited || props.note.time_created);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  });

  const openDeleteAlert = () => {
    hideContextMenu();
    alertMessage.value = `Are you sure you want to delete the note "${props.note.title}"?`;
    isAlertOpen.value = true;
  };

  const closeAlert = () => {
    isAlertOpen.value = false;
  };

  const pinNote = async () => {
    notesStore.pinNote(props.note.id);
  };

  const unpinNote = async () => {
    notesStore.unpinNote(props.note.id);
  };

  const confirmDelete = async () => {
    try {
      notesStore.deleteNote(props.note.id);
    } catch (error) {
      console.error('Error deleting note:', error);
      uiStore.showToastMessage('Failed to delete note. Please try again.');
    }
    closeAlert();
  };

  const handleCardClick = (_event: MouseEvent) => {
    uiStore.openNote(props.note.id);
  };
</script>

<style scoped>
  .dark .icon {
    filter: invert(1) brightness(2);
  }

  .option-icon {
    display: none;
  }

  .group:hover .option-icon {
    display: block;
  }

  .underline {
    text-decoration: underline;
  }

  .shadow {
    box-shadow:
      0 30px 60px -15px rgba(0, 0, 0, 0.3),
      0 12px 16px -8px rgba(0, 0, 0, 0.2);
  }

  .shadow:hover {
    box-shadow:
      0 30px 60px -15px rgba(0, 0, 0, 0.3),
      0 12px 16px -8px rgba(0, 0, 0, 0.2);
  }
</style>
