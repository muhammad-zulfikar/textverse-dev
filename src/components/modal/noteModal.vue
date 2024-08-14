<!--noteModal.vue-->

<template>
  <ModalBackdrop v-model="props.isOpen" />
  <transition name="zoom">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-40 flex items-center justify-center font-serif"
    >
      <div @click="handleOutsideClick" class="absolute inset-0"></div>
      <div
        ref="modalContainer"
        :class="[
          'px-4 relative flex flex-col',
          {
            'custom-card-no-rounded-border w-full h-full':
              uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur-no-rounded-border w-full h-full':
              uiStore.isExpanded && uiStore.blurEnabled,
            'custom-card w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5':
              !uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5':
              !uiStore.isExpanded && uiStore.blurEnabled,
          },
        ]"
      >
        <div class="flex w-full py-4 select-none">
          <NoteToolbar
            :note="editedNote"
            :noteId="props.noteId"
            :title="editedNote.title"
            :isEditMode="isEditMode"
            :isValid="true"
            :hasChanges="hasChanges"
            :folder="editedNote.folder"
            :lastEditedDate="editedNote.last_edited || editedNote.time_created"
            :content="editedNote.content"
            :isPinned="editedNote.pinned"
            @openDeleteAlert="openDeleteAlert"
            @updateFolder="updateNoteFolder"
            @updateTitle="updateNoteTitle"
          />
        </div>
        <div
          class="bg-black dark:bg-gray-400 h-px transition-all duration-300"
        ></div>
        <textarea
          v-if="!uiStore.showPreview"
          v-model="editedNote.content"
          placeholder="Content"
          class="w-full bg-transparent pt-4 pb-4 resize-none focus:outline-none flex-grow placeholder-black dark:placeholder-white placeholder-opacity-50 dark:placeholder-opacity-30"
          :style="contentStyle"
          @input="updateNoteContent"
        ></textarea>
        <div
          v-else
          class="pt-4 prose dark:prose-dark markdown-body prism-highlight w-full bg-transparent resize-none overflow-auto flex-grow"
          :style="contentStyle"
          v-html="notesStore.toggleMarkdownPreview(editedNote)"
        ></div>
      </div>
    </div>
  </transition>
  <AlertModal
    :is-open="uiStore.isAlertOpen"
    :message="uiStore.alertMessage"
    @confirm="confirmDelete"
    @cancel="closeAlert"
  />
</template>

<script setup lang="ts">
  import { onValue, ref as dbRef, Unsubscribe } from 'firebase/database';
  import { db } from '@/firebase';
  import { ref, computed, watch, onUnmounted, Ref } from 'vue';
  import { Note } from '@/store/types';
  import { notesStore, folderStore, uiStore, authStore } from '@/store/stores';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import { nanoid } from 'nanoid';
  import ModalBackdrop from '@/components/modal/modalBackdrop.vue';
  import AlertModal from '@/components/modal/alertModal.vue';
  import NoteToolbar from '@/components/toolbar/noteToolbar.vue';

  const props = defineProps<{
    noteId: string | null;
    isOpen: boolean;
  }>();

  const isEditMode = ref(false);
  const editedNote = ref<Note>(createEmptyNote());
  const originalNote = ref<Note | null>(null);

  function createEmptyNote(): Note {
    return {
      id: nanoid(),
      title: 'Untitled',
      content: '',
      time_created: new Date().toISOString(),
      last_edited: new Date().toISOString(),
      pinned: false,
      folder:
        folderStore.currentFolder !== DEFAULT_FOLDERS.ALL_NOTES
          ? folderStore.currentFolder
          : DEFAULT_FOLDERS.UNCATEGORIZED,
    };
  }

  const openDeleteAlert = () => {
    uiStore.alertMessage = `Are you sure you want to delete the note "${editedNote.value.title}"?`;
    uiStore.isAlertOpen = true;
  };

  const closeAlert = () => {
    uiStore.isAlertOpen = false;
  };

  const confirmDelete = async () => {
    try {
      if (editedNote.value.id) {
        await notesStore.deleteNote(editedNote.value.id);
        uiStore.closeNote();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      uiStore.showToastMessage('Failed to delete note. Please try again.');
    }
    closeAlert();
  };

  const hasChanges = computed(() => {
    if (!originalNote.value) return false;
    return notesStore.hasChanged(originalNote.value, editedNote.value);
  });

  const contentStyle = computed(() => ({
    height: uiStore.isExpanded ? '100vh' : '350px',
    marginBottom: uiStore.isExpanded ? '10px' : '0',
    overflowY: 'auto' as const,
  }));

  const updateNoteTitle = (newTitle: string) => {
    editedNote.value.title = newTitle;
    saveNote();
  };

  const updateNoteContent = () => {
    saveNote();
  };

  const updateNoteFolder = (newFolder: string) => {
    editedNote.value.folder = newFolder;
    saveNote();
  };

  const saveNote = async () => {
    try {
      if (isEditMode.value) {
        await notesStore.updateNote(editedNote.value);
      } else {
        const newNote = await notesStore.addNote(editedNote.value);
        editedNote.value.id = newNote.id;
        isEditMode.value = true;
      }
      originalNote.value = { ...editedNote.value };
    } catch (error) {
      console.error('Error saving note:', error);
      uiStore.showToastMessage('Failed to save note. Please try again.');
    }
  };

  const handleOutsideClick = () => {
    if (hasChanges.value) {
      saveNote();
    }
    uiStore.showPreview = false;
    uiStore.closeNote();
  };

  const noteListener: Ref<Unsubscribe | null> = ref(null);

  const setupNoteListener = (noteId: string) => {
    if (authStore.isLoggedIn && noteId && authStore.user) {
      const noteRef = dbRef(db, `users/${authStore.user.uid}/notes/${noteId}`);
      noteListener.value = onValue(noteRef, (snapshot) => {
        const updatedNote = snapshot.val();
        if (updatedNote && updatedNote.id === editedNote.value.id) {
          editedNote.value = { ...updatedNote };
          originalNote.value = { ...updatedNote };
        }
      });
    }
  };

  watch(
    () => props.noteId,
    async (newNoteId) => {
      if (noteListener.value) {
        noteListener.value();
        noteListener.value = null;
      }

      if (newNoteId !== null) {
        const note = notesStore.notes.find((n) => n.id === newNoteId);
        if (note) {
          editedNote.value = { ...note };
          originalNote.value = { ...note };
          setupNoteListener(newNoteId);
          isEditMode.value = true;
        }
      } else {
        editedNote.value = createEmptyNote();
        originalNote.value = null;
        isEditMode.value = false;
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (noteListener.value) {
      noteListener.value();
    }
  });
</script>
