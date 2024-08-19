<!--noteToolbar-->

<template>
  <div class="flex justify-between items-center w-full text-sm">
    <div class="flex">
      <NoteOptionDropdown
        :noteId="noteId"
        :title="title"
        :isTitleEditing="isTitleEditing"
        :isPublic="isNotePublic"
        :folder="folder"
        :lastEditedDate="lastEditedDate"
        :content="content"
        :isEditMode="isEditMode"
        :isValid="isValid"
        :hasChanges="hasChanges"
        :isPinned="isPinned"
        @togglePublic="togglePublic"
        @copyPublicLink="copyPublicLink"
        @copyNote="copyNote"
        @duplicateNote="duplicateNote"
        @pinNote="pinNote"
        @unpinNote="unpinNote"
        @updateFolder="updateFolder"
        @openDeleteAlert="openDeleteAlert"
        @updateTitle="updateTitle"
        @finishTitleEdit="finishTitleEdit"
      />
      <div
        class="ml-2 md:ml-4 px-2 py-1 custom-card flex items-center hover:bg-[#d9c698] dark:hover:bg-gray-700 cursor-pointer"
        @click="startTitleEdit"
      >
        <PhPencilSimple v-if="!isTitleEditing" :size="20" class="size-5" />
        <PhCheckCircle v-else :size="20" class="size-5" />
      </div>
    </div>
    <div class="flex">
      <button
        v-if="isPinned"
        class="ml-2 md:ml-4 px-2 py-1 custom-card flex items-center hover:bg-[#d9c698] dark:hover:bg-gray-700 cursor-pointer"
        @mouseenter="hoverPin = true"
        @mouseleave="hoverPin = false"
        @click="unpinNote"
      >
        <PhPushPin v-if="!hoverPin" :size="20" class="size-5" />
        <PhPushPinSlash v-else :size="20" class="size-5" />
      </button>
      <button
        v-if="isNotePublic"
        class="ml-2 md:ml-4 px-2 py-1 custom-card flex items-center hover:bg-[#d9c698] dark:hover:bg-gray-700 cursor-pointer"
        @mouseenter="hoverGlobe = true"
        @mouseleave="hoverGlobe = false"
        @click="togglePublic"
      >
        <PhGlobe v-if="!hoverGlobe" :size="20" class="size-5" />
        <PhGlobeX v-else :size="20" class="size-5" />
      </button>
      <div
        class="hidden md:flex items-center custom-card px-2 py-1 ml-2 md:ml-4"
      >
        <PhSpinnerGap v-if="isSaving" :size="20" class="mr-2 animate-spin" />
        <PhCloudCheck v-else :size="20" class="mr-2" />
        {{ notesStore.localeDate(note.last_edited || note.time_created) }}
      </div>
      <button
        class="ml-4 px-2 py-1 custom-card flex items-center hover:bg-[#d9c698] dark:hover:bg-gray-700"
        @click="closeNote"
      >
        <PhX :size="20" class="size-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import {
    PhPencilSimple,
    PhCheckCircle,
    PhPushPin,
    PhPushPinSlash,
    PhGlobe,
    PhGlobeX,
    PhX,
    PhSpinnerGap,
    PhCloudCheck,
  } from '@phosphor-icons/vue';
  import NoteOptionDropdown from '@/components/dropdown/noteOptionDropdown.vue';
  import { notesStore, uiStore } from '@/store/stores';
  import { Note } from '@/store/types';

  const props = defineProps<{
    note: Note;
    noteId: string | null;
    title: string;
    isTitleEditing: boolean;
    isEditMode: boolean;
    isValid: boolean;
    hasChanges: boolean;
    folder: string;
    lastEditedDate: string | Date;
    content: string;
    isPinned: boolean;
    isSaving: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'openDeleteAlert'): void;
    (e: 'updateFolder', folder: string): void;
    (e: 'updateTitle', title: string): void;
    (e: 'startTitleEdit'): void;
    (e: 'finishTitleEdit', newTitle: string): void;
  }>();

  const startTitleEdit = () => {
    emit('startTitleEdit');
  };

  const finishTitleEdit = (newTitle: string) => {
    emit('finishTitleEdit', newTitle);
  };

  const isNotePublic = computed(() => {
    return props.noteId !== null && notesStore.publicNotes.has(props.noteId);
  });

  const togglePublic = () => {
    if (props.noteId !== null) {
      notesStore.togglePublic(props.noteId);
    }
  };

  const copyPublicLink = () => {
    if (props.noteId !== null) {
      notesStore.copyPublicLink(props.noteId);
    }
  };

  const copyNote = () => {
    if (props.noteId !== null) {
      notesStore.copyNote(props.noteId);
    }
  };

  const duplicateNote = () => {
    if (props.noteId !== null) {
      notesStore.duplicateNote(props.note);
    }
  };

  const pinNote = () => {
    if (props.noteId !== null) {
      notesStore.pinNote(props.noteId);
    }
  };

  const unpinNote = () => {
    if (props.noteId !== null) {
      notesStore.unpinNote(props.noteId);
    }
  };

  const closeNote = () => uiStore.closeNote();

  const updateTitle = (newTitle: string) => emit('updateTitle', newTitle);
  const openDeleteAlert = () => emit('openDeleteAlert');
  const updateFolder = (folder: string) => emit('updateFolder', folder);

  const hoverPin = ref(false);
  const hoverGlobe = ref(false);
</script>
