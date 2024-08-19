<template>
  <ModalBackdrop v-model="props.isOpen" />
  <transition name="slide">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-40 flex items-center justify-center font-serif"
    >
      <div @click="handleOutsideClick" class="absolute inset-0"></div>
      <div
        ref="sidebarContainer"
        :class="[
          'fixed inset-y-0 right-0 overflow-y-auto flex flex-col px-4',
          {
            'custom-card-no-rounded-border w-full':
              uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur-no-rounded-border w-full':
              uiStore.isExpanded && uiStore.blurEnabled,
            'custom-card w-3/4 md:w-2/5':
              !uiStore.isExpanded && !uiStore.blurEnabled,
            'custom-card-blur w-3/4 md:w-2/5':
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
          class="w-full bg-transparent pt-4 pb-4 flex-grow overflow-y-auto flex flex-col"
        >
          <div ref="quillEditorRef" class="w-full flex-grow"></div>
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
  const sidebarContainer = ref<HTMLElement | null>(null);
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

  const saveNote = async () => {
    if (isEditMode.value && !hasChanges.value) return;

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

  function initializeQuillEditor() {
    if (quillEditorRef.value) {
      quillEditor.value = new Quill(quillEditorRef.value, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ align: [] }, { indent: '-1' }, { indent: '+1' }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            ['clean'],
          ],
        },
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

  const updateQuillEditorHeight = () => {
    if (quillEditorRef.value && sidebarContainer.value) {
      const containerRect = sidebarContainer.value.getBoundingClientRect();
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
          if (sidebarContainer.value) {
            resizeObserver.observe(sidebarContainer.value);
          }
        });
      } else {
        if (sidebarContainer.value) {
          resizeObserver.unobserve(sidebarContainer.value);
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
    },
    { immediate: true }
  );

  onMounted(() => {
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    window.addEventListener('resize', updateQuillEditorHeight);

    nextTick(() => {
      if (props.isOpen) {
        initializeQuillEditor();
        updateQuillEditorHeight();
        if (sidebarContainer.value) {
          resizeObserver.observe(sidebarContainer.value);
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
