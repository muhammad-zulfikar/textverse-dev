<template>
  <div
    v-if="note"
    class="fixed inset-0 flex items-center justify-center font-serif"
  >
    <div
      :class="[
        'p-5 relative flex flex-col',
        'custom-card-no-rounded-border w-full h-full',
      ]"
    >
      <div
        class="flex justify-between text-sm mb-4 select-none items-start md:items-center"
      >
        <h1 class="text-3xl font-bold flex-grow">
          {{ note.title }}
          <span class="text-sm font-normal text-gray-500 ml-2">
            {{ notesStore.localeDate(note.last_edited || note.time_created) }}
          </span>
        </h1>
        <div class="flex space-x-2 items-start md:items-center">
          <button
            @click="toggleMarkdownPreview"
            class="flex items-center px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
          >
            <PhMarkdownLogo :size="20" class="size-5 md:mr-2" />
            <span class="hidden md:flex">Preview</span>
          </button>
          <button
            @click="saveNote"
            class="flex items-center px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
          >
            <PhFloppyDisk :size="20" class="size-5 md:mr-2" />
            <span class="hidden md:flex">Save as copy</span>
          </button>
          <button
            @click="closeNote"
            class="flex items-center px-2 py-1 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
          >
            <PhX :size="20" class="size-5 md:mr-2" />
            <span class="hidden md:flex">Close</span>
          </button>
        </div>
      </div>
      <div
        class="bg-black dark:bg-gray-400 h-px transition-all duration-300"
      ></div>
      <div
        v-if="!uiStore.showPreview"
        :class="[
          'w-full pt-4 bg-transparent focus:outline-none flex-grow placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30 whitespace-pre-line overflow-y-auto',
        ]"
      >
        {{ note.content }}
      </div>
      <div
        v-if="uiStore.showPreview"
        class="prose dark:prose-dark markdown-body prism-highlight w-full pt-4 bg-transparent resize-none overflow-auto flex-grow"
        :style="markdownPreviewStyle"
        v-html="note.renderedContent"
      ></div>
    </div>
  </div>
  <div
    v-else
    class="flex items-center justify-center h-screen pb-20 font-serif"
  >
    <p class="text-md custom-card px-4 py-2">
      Note not found or not accessible.
    </p>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick } from 'vue';
  import { CSSProperties } from 'vue';
  import { notesStore, uiStore } from '@/store/stores';
  import { Note } from '@/store/types';
  import { useRoute, useRouter } from 'vue-router';
  import { nanoid } from 'nanoid';
  import { PhMarkdownLogo, PhFloppyDisk, PhX } from '@phosphor-icons/vue';

  const route = useRoute();
  const router = useRouter();
  const note = ref<Note | null>(null);

  onMounted(async () => {
    const publicId = route.params.publicId as string;
    const fetchedNote = await notesStore.getSharedNoteById(publicId);
    if (fetchedNote) {
      note.value = {
        ...fetchedNote,
      };
    }
  });

  const toggleMarkdownPreview = () => {
    uiStore.showPreview = !uiStore.showPreview;
  };

  const saveNote = async () => {
    if (note.value) {
      const newNote: Omit<
        Note,
        'id' | 'time_created' | 'last_edited' | 'pinned'
      > = {
        title: note.value.title,
        content: note.value.content,
        folder: '-',
      };

      try {
        await notesStore.addNote(newNote);
        uiStore.showToastMessage('Note saved as a new copy.');

        await nextTick();

        const addedNote = notesStore.notes.find(
          (n) => n.title === newNote.title && n.content === newNote.content
        );

        if (addedNote) {
          await router.push('/');
          uiStore.openNote(addedNote.id);
        } else {
          console.error('Failed to find the newly added note');
          uiStore.showToastMessage('Error: Failed to open the new note.');
        }
      } catch (error) {
        console.error('Failed to add new note:', error);
        uiStore.showToastMessage('Error: Failed to save the note.');
      }
    }
  };

  const closeNote = () => {
    router.push('/');
  };

  const markdownPreviewStyle = computed<CSSProperties>(() => {
    return {
      height: 'auto',
      overflowY: 'auto',
    };
  });
</script>
