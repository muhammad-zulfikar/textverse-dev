<!--sharedNoteView-->

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
      <div class="flex justify-between text-sm mb-4 select-none">
        <h1 class="text-3xl font-bold">
          {{ note.title }}
          <span class="text-sm font-normal text-gray-500 ml-2">
            {{ notesStore.localeDate(note.last_edited || note.time_created) }}
          </span>
        </h1>
        <div class="flex space-x-2">
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
            <span class="hidden md:flex">Save</span>
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
        v-if="!uiStore.showPreview"
        :class="[
          'w-full p-2 bg-transparent border-[1px] md:border-2 border-black dark:border-white rounded focus:outline-none flex-grow placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30 whitespace-pre-line overflow-y-auto',
        ]"
      >
        {{ note.content }}
      </div>
      <div
        v-if="uiStore.showPreview"
        class="prose dark:prose-dark markdown-body prism-highlight w-full p-2 bg-transparent resize-none overflow-auto flex-grow"
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
  import { ref, computed, onMounted } from 'vue';
  import { notesStore, uiStore } from '@/store/stores';
  import { Note } from '@/store/types';
  import { useRoute, useRouter } from 'vue-router';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import Prism from 'prismjs';
  import { PhMarkdownLogo, PhFloppyDisk, PhX } from '@phosphor-icons/vue';

  const route = useRoute();
  const router = useRouter();
  const note = ref<Note | null>(null);

  onMounted(async () => {
    const shareId = route.params.shareId as string;
    const fetchedNote = await notesStore.getSharedNoteById(shareId);
    if (fetchedNote) {
      note.value = {
        ...fetchedNote,
        renderedContent: DOMPurify.sanitize(marked(fetchedNote.content)),
      };
    }
  });

  const toggleMarkdownPreview = () => {
    uiStore.showPreview = !uiStore.showPreview;
    if (uiStore.showPreview && note.value) {
      marked.setOptions({
        highlight: function (code, lang) {
          if (lang) {
            if (!Prism.languages[lang]) {
              return Prism.util.encode(code);
            }
            return Prism.highlight(code, Prism.languages[lang], lang);
          }
          return Prism.util.encode(code);
        },
        langPrefix: 'language-',
      });
      const renderedContent = marked(note.value.content);
      note.value.renderedContent = DOMPurify.sanitize(renderedContent);

      setTimeout(() => {
        Prism.highlightAll();
      }, 0);
    }
  };

  const saveNote = () => {
    if (note.value) {
      const newNote: Note = {
        ...note.value,
        id: generateUniqueId(),
        time_created: new Date().toISOString(),
        last_edited: new Date().toISOString(),
      };

      notesStore.addNote(newNote);

      uiStore.showToastMessage('Note saved as a new copy.');
    }
  };

  const generateUniqueId = () => {
    return '_' + Math.random().toString(36).substr(2, 9);
  };

  const closeNote = () => {
    router.push('/');
  };

  const markdownPreviewStyle = computed(() => {
    return {
      height: 'auto',
      overflowY: 'auto',
    };
  });
</script>
