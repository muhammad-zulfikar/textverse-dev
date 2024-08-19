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
            'custom-card w-11/12 md:w-3/4 lg:w-1/2 xl:w-3/5':
              !uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur w-11/12 md:w-3/4 lg:w-1/2 xl:w-3/5':
              !uiStore.isExpanded && uiStore.blurEnabled,
          },
        ]"
      >
        <div class="flex w-full py-4 select-none">
          <NoteToolbar
            :note="editedNote"
            :noteId="props.noteId"
            :title="editedNote.title"
            :isTitleEditing="isTitleEditing"
            :isEditMode="isEditMode"
            :isValid="true"
            :hasChanges="hasChanges"
            :folder="editedNote.folder"
            :lastEditedDate="editedNote.last_edited || editedNote.time_created"
            :content="editedNote.content"
            :isPinned="editedNote.pinned"
            :isSaving="isSaving"
            @openDeleteAlert="openDeleteAlert"
            @updateFolder="updateNoteFolder"
            @updateTitle="updateNoteTitle"
            @startTitleEdit="startTitleEdit"
            @finishTitleEdit="finishTitleEdit"
          />
        </div>
        <div
          class="bg-black dark:bg-gray-400 h-px transition-all duration-300"
        ></div>
        <div
          class="w-full bg-transparent pt-4 pb-1 flex-grow overflow-y-auto flex flex-col"
        >
          <div
            ref="quillEditorRef"
            class="w-full flex-grow"
            :class="{ 'max-h-[500px]': !uiStore.isExpanded }"
          ></div>
        </div>
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
  import { ref, computed, watch, onUnmounted, onMounted, nextTick } from 'vue';
  import { Note } from '@/store/types';
  import { notesStore, folderStore, uiStore, authStore } from '@/store/stores';
  import { DEFAULT_FOLDERS } from '@/store/constants';
  import { nanoid } from 'nanoid';
  import ModalBackdrop from '@/components/modal/modalBackdrop.vue';
  import AlertModal from '@/components/modal/alertModal.vue';
  import NoteToolbar from '@/components/toolbar/noteToolbar.vue';
  import Quill from 'quill';

  const props = defineProps<{
    noteId: string | null;
    isOpen: boolean;
  }>();

  const isMobile = ref(false);
  const isEditMode = ref(false);
  const isSaving = ref(false);
  const editedNote = ref<Note>(createEmptyNote());
  const originalNote = ref<Note | null>(null);
  const modalContainer = ref<HTMLElement | null>(null);
  const quillEditor = ref<Quill | null>(null);
  const quillEditorRef = ref<HTMLElement | null>(null);

  const checkIfMobile = () => {
    isMobile.value = window.innerWidth <= 768;
  };

  const isTitleEditing = ref(false);

  const startTitleEdit = () => {
    isTitleEditing.value = true;
  };

  const finishTitleEdit = (newTitle: string) => {
    isTitleEditing.value = false;
    updateNoteTitle(newTitle);
  };

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

  const saveNote = async () => {
    if (isEditMode.value && !hasChanges.value) return;

    try {
      isSaving.value = true;
      const saveStartTime = Date.now();

      if (isEditMode.value) {
        await notesStore.updateNote(editedNote.value);
      } else {
        const newNote = await notesStore.addNote(editedNote.value);
        editedNote.value.id = newNote.id;
        isEditMode.value = true;
      }
      originalNote.value = { ...editedNote.value };

      const elapsedTime = Date.now() - saveStartTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);

      await new Promise((resolve) => setTimeout(resolve, remainingTime));
    } catch (error) {
      console.error('Error saving note:', error);
      uiStore.showToastMessage('Failed to save note. Please try again.');
    } finally {
      isSaving.value = false;
    }
  };

  const updateNoteTitle = (newTitle: string) => {
    editedNote.value.title = newTitle;
    saveNote();
  };

  const updateNoteContent = () => {
    if (hasChanges.value) {
      saveNote();
    }
  };

  const updateNoteFolder = (newFolder: string) => {
    editedNote.value.folder = newFolder;
    saveNote();
  };

  const handleOutsideClick = () => {
    if (!editedNote.value.content.trim()) {
      uiStore.closeNote();
      uiStore.showToastMessage('Empty note discarded');
      return;
    }
    if (isEditMode.value && !hasChanges.value) {
      uiStore.closeNote();
      return;
    }
    saveNote();
    uiStore.closeNote();
  };

  const noteListener = ref<Unsubscribe | null>(null);

  const setupNoteListener = (noteId: string) => {
    if (authStore.isLoggedIn && noteId && authStore.user) {
      const noteRef = dbRef(db, `users/${authStore.user.uid}/notes/${noteId}`);
      noteListener.value = onValue(noteRef, (snapshot) => {
        const updatedNote = snapshot.val();
        if (updatedNote && updatedNote.id === editedNote.value.id) {
          editedNote.value = { ...updatedNote };
          originalNote.value = { ...updatedNote };

          if (
            quillEditor.value &&
            quillEditor.value.root.innerHTML !== updatedNote.content
          ) {
            const currentSelection = quillEditor.value.getSelection();
            quillEditor.value.root.innerHTML = updatedNote.content;
            if (currentSelection) {
              quillEditor.value.setSelection(currentSelection);
            }
          }
        }
      });
    }
  };

  const showToolbar = computed(() => {
    return !isMobile.value || uiStore.isExpanded;
  });

  function initializeQuillEditor() {
    if (quillEditorRef.value) {
      const modules = {
        toolbar: showToolbar.value
          ? [
              ['bold', 'italic', 'underline', 'strike'],
              ['blockquote', 'code-block'],
              [{ align: [] }, { indent: '-1' }, { indent: '+1' }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link', 'image'],
              [{ header: [1, 2, 3, 4, 5, 6, false] }],
              [{ color: [] }, { background: [] }],
              ['clean'],
            ]
          : false,
      };

      quillEditor.value = new Quill(quillEditorRef.value, {
        theme: 'snow',
        modules: modules,
      });

      quillEditor.value.on('text-change', (_delta, _oldDelta, source) => {
        if (source === 'user' && quillEditor.value) {
          editedNote.value.content = quillEditor.value.root.innerHTML;
          updateNoteContent();
        }
      });

      if (editedNote.value.content) {
        quillEditor.value.root.innerHTML = editedNote.value.content;
      }
    }
  }

  interface QuillToolbarModule {
    container: HTMLElement;
  }

  const toggleToolbarVisibility = () => {
    if (quillEditor.value) {
      const toolbarModule = quillEditor.value.getModule(
        'toolbar'
      ) as QuillToolbarModule;
      if (showToolbar.value) {
        toolbarModule.container.style.display = '';
      } else {
        toolbarModule.container.style.display = 'none';
      }
    }
  };

  const updateQuillEditorHeight = () => {
    if (quillEditorRef.value && modalContainer.value) {
      const containerRect = modalContainer.value.getBoundingClientRect();
      const editorTop = quillEditorRef.value.offsetTop;
      const newHeight = window.innerHeight - containerRect.top - editorTop - 20;
      quillEditorRef.value.style.height = `${newHeight}px`;
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    updateQuillEditorHeight();
  });

  watch(
    () => props.isOpen,
    (isOpen) => {
      if (isOpen) {
        nextTick(() => {
          initializeQuillEditor();
          updateQuillEditorHeight();
          toggleToolbarVisibility();
          if (modalContainer.value) {
            resizeObserver.observe(modalContainer.value);
          }
        });
      } else {
        if (modalContainer.value) {
          resizeObserver.unobserve(modalContainer.value);
        }
      }
    }
  );

  watch(
    [() => props.isOpen, () => props.noteId],
    async ([isOpen, newNoteId]) => {
      if (noteListener.value) {
        noteListener.value();
        noteListener.value = null;
      }

      if (isOpen) {
        await nextTick();

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
      } else {
        if (quillEditor.value) {
          quillEditor.value.off('text-change');
          quillEditor.value = null;
        }

        if (noteListener.value) {
          (noteListener.value as Unsubscribe)();
          noteListener.value = null;
        }

        editedNote.value = createEmptyNote();
        originalNote.value = null;
        isEditMode.value = false;
      }
    },
    { immediate: true }
  );

  watch(
    isMobile,
    (newValue) => {
      uiStore.isExpanded = newValue;
      toggleToolbarVisibility();
    },
    { immediate: true }
  );

  watch(
    () => uiStore.isExpanded,
    () => {
      toggleToolbarVisibility();
    }
  );

  onMounted(() => {
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    window.addEventListener('resize', updateQuillEditorHeight);

    nextTick(() => {
      if (props.isOpen) {
        initializeQuillEditor();
        updateQuillEditorHeight();
        toggleToolbarVisibility();
        if (modalContainer.value) {
          resizeObserver.observe(modalContainer.value);
        }
      }
    });
  });

  onUnmounted(() => {
    if (noteListener.value) {
      noteListener.value();
    }
    window.removeEventListener('resize', checkIfMobile);
    window.removeEventListener('resize', updateQuillEditorHeight);
    resizeObserver.disconnect();
  });
</script>
