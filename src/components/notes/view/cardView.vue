<template>
  <div class="w-11/12 mx-auto mt-10 flex justify-center">
    <transition-group
      name="list"
      tag="ul"
      :class="[
        'relative min-w-[300px]',
        {
          'columns-1 md:max-w-xl': uiStore.columns === 1,
          'columns-2 md:gap-7 md:max-w-4xl': uiStore.columns === 2,
          'columns-3 sm:columns-2 md:columns-3 gap-8': uiStore.columns === 3,
          'columns-4 sm:columns-2 md:columns-3 lg:columns-4 gap-5':
            uiStore.columns === 4,
          'columns-5 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3':
            uiStore.columns === 5,
        },
      ]"
    >
      <li
        v-for="note in props.notes"
        :key="note.id"
        class="break-inside-avoid h-min mb-6 md:mb-8 p-2 flex flex-col overflow-x-auto cursor-pointer relative group select-none"
        :class="{
          'z-50': showMenu && selectedNote?.id === note.id,
          shadow: note.pinned,
          'custom-card-blur': uiStore.blurEnabled,
          'custom-card': !uiStore.blurEnabled,
        }"
        @contextmenu.prevent="(event) => showContextMenu(event, note)"
        @click="() => uiStore.openNote(note.id)"
      >
        <div class="flex justify-between items-start">
          <h1
            class="font-bold text-sl font-serif cursor-pointer dark:text-white"
          >
            {{ note.title }}
          </h1>
        </div>
        <div>
          <div
            class="font-serif text-sm mt-2 dark:text-white truncate-text"
            v-html="truncatedContent(note.content)"
          ></div>
          <div
            class="flex justify-between items-center pt-3 mt-auto font-serif text-gray-700 dark:text-gray-400 text-xs"
          >
            <span
              v-if="note.pinned"
              @click.stop="notesStore.unpinNote(note.id)"
              class="justify-start px-2 py-1 hover:bg-[#d9c698] dark:hover:bg-gray-700 rounded-md custom-card"
            >
              <PhPushPin :size="16" class="text-[10px] md:text-xs" />
            </span>
            <div
              v-if="note.folder !== DEFAULT_FOLDERS.UNCATEGORIZED"
              class="ml-auto text-left text-[10px] md:text-xs"
            >
              <p
                class="flex items-center px-2 py-1 cursor-pointer truncate custom-card hover:text-black dark:hover:text-white hover:bg-[#d9c698] dark:hover:bg-gray-700"
                @click.stop="folderStore.setCurrentFolder(note.folder)"
              >
                <PhFolder :size="16" class="mr-2" />
                {{ note.folder }}
              </p>
            </div>
          </div>
        </div>
      </li>
    </transition-group>
    <Transition name="zoom">
      <ContextMenu
        v-if="selectedNote"
        :visible="showMenu"
        :position="menuPosition"
        :note="selectedNote"
        :noteId="selectedNote.id"
        @hideMenu="hideContextMenu"
        @edit="uiStore.openNote"
        @delete="openDeleteAlert"
        @pin="notesStore.pinNote"
        @unpin="notesStore.unpinNote"
      />
    </Transition>

    <AlertModal
      :is-open="isAlertOpen"
      :message="alertMessage"
      @confirm="confirmDelete"
      @cancel="closeAlert"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { PhPushPin, PhFolder } from '@phosphor-icons/vue';
  import { notesStore, folderStore, uiStore } from '@/store/stores';
  import { Note } from '@/store/types';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import ContextMenu from '@/components/contextMenu/contextMenu.vue';
  import AlertModal from '@/components/modal/alertModal.vue';
  import { marked } from 'marked';

  const props = defineProps<{
    notes: Note[];
  }>();

  const showMenu = ref(false);
  const menuPosition = ref({ x: 0, y: 0 });
  const selectedNote = ref<Note | null>(null);
  const isAlertOpen = ref(false);
  const alertMessage = ref('');

  const truncatedContent = (content: string) => {
    const div = document.createElement('div');
    div.innerHTML = content;
    const textContent = div.textContent || div.innerText || '';
    const lines = textContent.split('\n');
    let truncatedText =
      lines.length > 10 ? lines.slice(0, 10).join('\n') + '...' : content;

    if (/\*|\_|\`|\#/.test(truncatedText)) {
      truncatedText = marked(truncatedText);
    }

    return truncatedText;
  };

  const showContextMenu = (event: MouseEvent, note: Note) => {
    event.stopPropagation();
    uiStore.setActiveDropdown(showMenu.value ? 'create' : null);
    menuPosition.value = { x: event.clientX, y: event.clientY };
    showMenu.value = true;
    selectedNote.value = note;
  };

  const hideContextMenu = () => {
    showMenu.value = false;
  };

  const openDeleteAlert = (noteId: number) => {
    hideContextMenu();
    const noteToDelete = props.notes.find((note) => note.id === noteId);
    if (noteToDelete) {
      alertMessage.value = `Are you sure you want to delete the note "${noteToDelete.title}"?`;
      isAlertOpen.value = true;
    }
  };

  const closeAlert = () => {
    isAlertOpen.value = false;
  };

  const confirmDelete = async () => {
    try {
      if (selectedNote.value) {
        await notesStore.deleteNote(selectedNote.value.id);
      }
    } catch (error) {
      uiStore.showToastMessage('Failed to delete note. Please try again.');
    }
    closeAlert();
  };
</script>

<style scoped>
  .truncate-text {
    display: -webkit-box;
    line-clamp: 10;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: pre-wrap;
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

  li:active {
    transform: scale(0.98);
  }
</style>
