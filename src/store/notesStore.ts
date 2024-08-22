// notesStore.ts

import { defineStore } from 'pinia';
import { Note, PublicNote } from './types';
import { DEFAULT_FOLDERS } from './constants';
import { authStore, folderStore, uiStore, firebaseStore } from './stores';
import { getAllNotesFromFirebase } from './firebaseStore';
import { db } from '@/firebase';
import { get, onValue, ref, remove, set } from 'firebase/database';
import initialNotes from '@/assets/initialNotes.json';
import DOMPurify from 'dompurify';
import { nanoid } from 'nanoid';

interface NotesState {
  notes: Note[];
  deletedNotes: Note[];
  selectedNotes: string[];
  selectedNoteId: string | null;
  searchQuery: string;
  publicNotes: Map<string, string>;
  notesListener: (() => void) | null;
}

export const useNotesStore = defineStore('notes', {
  state: (): NotesState => ({
    notes: [],
    deletedNotes: [],
    selectedNotes: [],
    selectedNoteId: null as string | null,
    searchQuery: '',
    publicNotes: new Map(),
    notesListener: null,
  }),

  getters: {
    selectedNote: (state) =>
      state.notes.find((note) => note.id === state.selectedNoteId),

    filteredNotes:
      (state) =>
      (folderId: string): Note[] => {
        const query = state.searchQuery.toLowerCase();
        return state.notes.filter(
          (note) =>
            (folderId === DEFAULT_FOLDERS.ALL_NOTES ||
              note.folder === folderId) &&
            (note.title.toLowerCase().includes(query) ||
              note.content.toLowerCase().includes(query))
        );
      },
  },

  actions: {
    async addNote(
      newNote: Omit<Note, 'id' | 'time_created' | 'last_edited' | 'pinned'>
    ) {
      const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toISOString();
      };
      const sanitizedContent = DOMPurify.sanitize(newNote.content);
      const now = formatDate(new Date());
      const note: Note = {
        ...newNote,
        id: nanoid(),
        time_created: now,
        last_edited: now,
        pinned: false,
        folder:
          folderStore.currentFolder === DEFAULT_FOLDERS.ALL_NOTES
            ? DEFAULT_FOLDERS.UNCATEGORIZED
            : folderStore.currentFolder,
        content: sanitizedContent,
      };

      if (authStore.isLoggedIn) {
        await firebaseStore.saveNoteToFirebase(authStore.user!.uid, note);
      } else {
        this.notes.unshift(note);
      }

      this.reorderNotes();
      this.saveNotes();
      uiStore.showToastMessage(`${note.title} added`);
      return note;
    },

    async updateNote(updatedNote: Note) {
      const sanitizedContent = DOMPurify.sanitize(updatedNote.content);
      const index = this.notes.findIndex((n) => n.id === updatedNote.id);
      if (index !== -1) {
        const noteWithTimestamp = {
          ...updatedNote,
          content: sanitizedContent,
          last_edited: new Date().toISOString(),
        };

        if (authStore.isLoggedIn) {
          await firebaseStore.updateNoteInFirebase(
            authStore.user!.uid,
            updatedNote.id,
            noteWithTimestamp
          );
        } else {
          this.notes[index] = noteWithTimestamp;
        }

        this.reorderNotes();
        this.saveNotes();
      }
    },

    async duplicateNote(originalNote: Note) {
      const newNote: Note = {
        ...originalNote,
        id: nanoid(),
        title: `${originalNote.title} (Copy)`,
        time_created: new Date().toISOString(),
        last_edited: new Date().toISOString(),
        pinned: false,
      };

      if (authStore.isLoggedIn) {
        await firebaseStore.saveNoteToFirebase(authStore.user!.uid, newNote);
      } else {
        this.notes.unshift(newNote);
      }

      this.reorderNotes();
      this.saveNotes();
      uiStore.showToastMessage(`${newNote.title} created`);
      return newNote;
    },

    async deleteNote(noteId: string) {
      const index = this.notes.findIndex((n) => n.id === noteId);
      if (index !== -1) {
        const deletedNote = this.notes.splice(index, 1)[0];
        deletedNote.time_deleted = new Date().toISOString();
        this.deletedNotes.push(deletedNote);

        if (authStore.isLoggedIn) {
          await firebaseStore.moveNoteToTrash(authStore.user!.uid, deletedNote);
        } else {
          this.saveNotes();
          this.saveDeletedNotes();
        }

        uiStore.showToastMessage(`${deletedNote.title} moved to trash`);
      }
    },

    async restoreNote(noteId: string) {
      const index = this.deletedNotes.findIndex((n) => n.id === noteId);
      if (index !== -1) {
        const { time_deleted, ...restoredNote } = this.deletedNotes[index];
        this.deletedNotes.splice(index, 1);
        this.notes.unshift(restoredNote);

        if (authStore.isLoggedIn) {
          await firebaseStore.restoreNoteFromTrash(
            authStore.user!.uid,
            restoredNote
          );
        } else {
          this.saveNotes();
          this.saveDeletedNotes();
        }

        uiStore.showToastMessage(`${restoredNote.title} restored`);
      }
    },

    async permanentlyDeleteNote(noteId: string) {
      const index = this.deletedNotes.findIndex((n) => n.id === noteId);
      if (index !== -1) {
        this.deletedNotes.splice(index, 1);

        if (authStore.isLoggedIn) {
          await firebaseStore.permanentlyDeleteNoteFromTrash(
            authStore.user!.uid,
            noteId
          );
        } else {
          this.saveDeletedNotes();
        }

        uiStore.showToastMessage('Note permanently deleted');
      }
    },

    saveDeletedNotes() {
      if (!authStore.isLoggedIn) {
        localStorage.setItem('deletedNotes', JSON.stringify(this.deletedNotes));
      }
    },

    async loadDeletedNotes() {
      if (authStore.isLoggedIn) {
        const deletedNotes = await firebaseStore.getDeletedNotesFromFirebase(
          authStore.user!.uid
        );
        this.deletedNotes = Object.values(deletedNotes);
      } else {
        const savedDeletedNotes = localStorage.getItem('deletedNotes');
        if (savedDeletedNotes) {
          this.deletedNotes = JSON.parse(savedDeletedNotes);
        }
      }
    },

    async fetchPublicNotes() {
      const publicNotesRef = ref(db, `publicNotes`);
      const snapshot = await get(publicNotesRef);
      if (snapshot.exists()) {
        const publicNotes = snapshot.val() as Record<string, PublicNote>;
        Object.values(publicNotes).forEach((publicNote) => {
          this.publicNotes.set(publicNote.id, publicNote.publicId);
        });
      }
    },

    async pinNote(noteId: string) {
      const note = this.notes.find((n) => n.id === noteId);
      if (note) {
        note.pinned = true;

        if (authStore.isLoggedIn) {
          await firebaseStore.updateNoteInFirebase(
            authStore.user!.uid,
            noteId,
            { pinned: true }
          );
        }

        this.reorderNotes();
        this.saveNotes();
        uiStore.showToastMessage(`${note.title} pinned`);
      }
    },

    async unpinNote(noteId: string) {
      const note = this.notes.find((n) => n.id === noteId);
      if (note) {
        note.pinned = false;

        if (authStore.isLoggedIn) {
          await firebaseStore.updateNoteInFirebase(
            authStore.user!.uid,
            noteId,
            { pinned: false }
          );
        }

        this.reorderNotes();
        this.saveNotes();
        uiStore.showToastMessage(`${note.title} unpinned`);
      }
    },

    async moveNote(noteId: string, targetFolder: string) {
      const note = this.notes.find((n) => n.id === noteId);
      if (note) {
        note.folder = targetFolder;
        this.saveNotes();

        if (authStore.isLoggedIn) {
          await firebaseStore.updateNoteInFirebase(
            authStore.user!.uid,
            noteId,
            { folder: targetFolder }
          );
        }
        uiStore.showToastMessage(`${note.title} moved to ${targetFolder}`);
      }
    },

    saveNotes() {
      if (!authStore.isLoggedIn) {
        localStorage.setItem('notes', JSON.stringify(this.notes));
      }
    },

    copyNote(noteId: string) {
      const note = this.notes.find((n) => n.id === noteId);
      if (note) {
        const cleanContent = DOMPurify.sanitize(note.content, {
          RETURN_DOM: true,
        });
        const textContent = cleanContent.textContent || '';

        navigator.clipboard
          .writeText(textContent)
          .then(() => {
            uiStore.showToastMessage(`${note.title} copied to clipboard`);
          })
          .catch(() => {
            uiStore.showToastMessage('Failed to copy note content');
          });
      }
    },

    async publicNote(noteId: string) {
      if (this.publicNotes.has(noteId)) {
        await this.unpublicNote(noteId);
        return;
      }

      const note = this.notes.find((n) => n.id === noteId);
      if (!note) {
        uiStore.showToastMessage('Note not found.');
        return;
      }

      const publicId = nanoid();
      const publicNote: PublicNote = {
        id: note.id,
        uid: authStore.user!.uid,
        publicId,
      };

      const publicRef = ref(db, `publicNotes/${publicId}`);
      await set(publicRef, publicNote);

      this.publicNotes.set(noteId, publicId);

      const publicLink = `${window.location.origin}/${publicId}`;
      uiStore.showToastMessage(`Note is now public! Link: ${publicLink}`);
      navigator.clipboard
        .writeText(publicLink)
        .then(() => {
          uiStore.showToastMessage(
            `Note is now public! Link copied to clipboard.`
          );
        })
        .catch(() => {
          uiStore.showToastMessage('Failed to copy link to clipboard.');
        });
    },

    async unpublicNote(noteId: string) {
      try {
        const publicId = this.publicNotes.get(noteId);
        if (publicId) {
          const publicRef = ref(db, `publicNotes/${publicId}`);
          await remove(publicRef);
          this.publicNotes.delete(noteId);
          uiStore.showToastMessage('Note unpublic.');
        } else {
          uiStore.showToastMessage('Note was not public.');
        }
      } catch (error) {
        uiStore.showToastMessage('Failed to unpublic note.');
        console.error('Unpublic note error:', error);
      }
    },

    async togglePublic(noteId: string) {
      if (this.publicNotes.has(noteId)) {
        await this.unpublicNote(noteId);
      } else {
        await this.publicNote(noteId);
      }
    },

    getPublicId(noteId: string): string | undefined {
      return this.publicNotes.get(noteId);
    },

    copyPublicLink(noteId: string) {
      const publicId = this.getPublicId(noteId);
      if (!publicId) return;
      const publicLink = `${window.location.origin}/public/${publicId}`;
      navigator.clipboard
        .writeText(publicLink)
        .then(() => {
          uiStore.showToastMessage('Public link copied to clipboard');
        })
        .catch(() => {
          uiStore.showToastMessage('Failed to copy public link');
        });
    },

    generateValidFirebaseKey(): string {
      return nanoid();
    },

    async importNotes() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          if (file.type !== 'application/json') {
            uiStore.showToastMessage('Please select a JSON file.');
            return;
          }

          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const result = e.target?.result as string;
              const notesObject: Record<string, Note> = JSON.parse(result);

              const importedNotes: Note[] = Object.values(notesObject);

              if (
                !Array.isArray(importedNotes) ||
                !importedNotes.every(
                  (note) =>
                    note.id &&
                    note.title &&
                    note.content &&
                    note.time_created &&
                    note.last_edited &&
                    typeof note.pinned === 'boolean' &&
                    note.folder
                )
              ) {
                throw new Error('Invalid notes format.');
              }

              const importedFolders = new Set<string>(
                importedNotes
                  .map((note: Note) => note.folder)
                  .filter(
                    (folder): folder is string => typeof folder === 'string'
                  )
              );

              for (const folder of importedFolders) {
                if (
                  folder !== DEFAULT_FOLDERS.ALL_NOTES &&
                  folder !== DEFAULT_FOLDERS.UNCATEGORIZED
                ) {
                  await folderStore.addFolder(folder);
                }
              }

              if (authStore.isLoggedIn) {
                for (const note of importedNotes) {
                  const validId = this.generateValidFirebaseKey();
                  const validNote = { ...note, id: validId };
                  await firebaseStore.saveNoteToFirebase(
                    authStore.user!.uid,
                    validNote
                  );
                }
              } else {
                this.notes = [...this.notes, ...importedNotes];
                this.saveNotes();
              }

              await this.loadNotes();
              uiStore.showToastMessage(
                'Notes and folders imported successfully!'
              );
            } catch (error) {
              console.error('Import error:', error);
              uiStore.showToastMessage(
                'Failed to import notes. Please check the file format and try again.'
              );
            }
          };

          reader.onerror = (error) => {
            console.error('FileReader error:', error);
            uiStore.showToastMessage('Failed to read file. Please try again.');
          };

          reader.readAsText(file);
        }
      };

      input.click();
    },

    async downloadBackup() {
      let notesToBackup;

      if (authStore.isLoggedIn) {
        notesToBackup = await firebaseStore.getAllNotesFromFirebase(
          authStore.user!.uid
        );
      } else {
        notesToBackup = this.notes;
      }

      const blob = new Blob([JSON.stringify(notesToBackup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'textVerse_backup.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      uiStore.showToastMessage('Backup downloaded successfully!');
    },

    async deleteAllNotes() {
      if (authStore.isLoggedIn) {
        const notesRef = ref(db, `users/${authStore.user!.uid}/notes`);
        const folderRef = ref(db, `users/${authStore.user!.uid}/folders`);
        await remove(notesRef);
        await remove(folderRef);
      } else {
        localStorage.removeItem('notes');
        localStorage.removeItem('folders');
        this.deletedNotes.push(...this.notes);
      }

      this.notes = [];
      this.saveNotes();

      folderStore.folders = [
        DEFAULT_FOLDERS.ALL_NOTES,
        DEFAULT_FOLDERS.UNCATEGORIZED,
      ];
      folderStore.currentFolder = DEFAULT_FOLDERS.ALL_NOTES;
      folderStore.saveFolders();

      uiStore.showToastMessage('All notes and folders deleted successfully!');
    },

    async loadNotes() {
      if (authStore.isLoggedIn) {
        const userId = authStore.user!.uid;
        const notesRef = ref(db, `users/${userId}/notes`);

        this.notesListener = onValue(notesRef, (snapshot) => {
          const notesData = snapshot.val();
          if (notesData) {
            const notes = Object.values(notesData as Record<string, Note>);
            this.notes = notes;
          } else {
            this.notes = [];
          }
          this.reorderNotes();
        });
      } else {
        const savedNotes = localStorage.getItem('notes');
        if (savedNotes) {
          this.notes = JSON.parse(savedNotes);
        } else {
          const importedNotes = initialNotes.map((note) => ({
            ...note,
            id: nanoid(),
            time_created: note.time_created,
            last_edited: note.time_created,
            pinned: false,
            folder: note.folder || DEFAULT_FOLDERS.UNCATEGORIZED,
          }));

          const importedFolders = new Set<string>(
            importedNotes
              .map((note) => note.folder)
              .filter(
                (folder): folder is string =>
                  typeof folder === 'string' &&
                  folder !== DEFAULT_FOLDERS.ALL_NOTES &&
                  folder !== DEFAULT_FOLDERS.UNCATEGORIZED
              )
          );

          for (const folder of importedFolders) {
            if (!folderStore.folders.includes(folder)) {
              folderStore.folders.push(folder);
              if (authStore.isLoggedIn) {
                await firebaseStore.saveFolderToFirebase(
                  authStore.user!.uid,
                  folder
                );
              } else {
                folderStore.saveFolders();
              }
            }
          }

          this.notes = importedNotes;
          this.saveNotes();
        }
      }
      this.reorderNotes();
    },

    async unloadNotes() {
      if (this.notesListener) {
        this.notesListener();
        this.notesListener = null;
      }
    },

    async syncNotesFromFirebase(userId: string) {
      try {
        const startTime = Date.now();

        const [firebaseNotes] = await Promise.all([
          getAllNotesFromFirebase(userId),
          new Promise((resolve) => setTimeout(resolve, 800)),
        ]);

        const notesArray = Object.values(firebaseNotes);

        this.notes = notesArray;

        this.reorderNotes();
        this.saveNotes();

        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 800) {
          await new Promise((resolve) =>
            setTimeout(resolve, 800 - elapsedTime)
          );
        }

        uiStore.showToastMessage('Notes synced successfully');
      } catch (error) {
        console.error('Error syncing notes:', error);
        uiStore.showToastMessage('Failed to sync notes');
        throw error;
      }
    },

    reorderNotes() {
      this.notes.sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }
        const dateA = new Date(a.last_edited || a.time_created).getTime();
        const dateB = new Date(b.last_edited || b.time_created).getTime();
        return dateB - dateA;
      });
    },

    hasChanged(originalNote: Note, editedNote: Partial<Note>): boolean {
      const sanitizeAndNormalizeContent = (content: string) => {
        const sanitized = DOMPurify.sanitize(content);
        const div = document.createElement('div');
        div.innerHTML = sanitized;
        return div.innerHTML;
      };

      return (
        originalNote.title !== editedNote.title ||
        sanitizeAndNormalizeContent(originalNote.content) !==
          sanitizeAndNormalizeContent(editedNote.content || '') ||
        originalNote.folder !== editedNote.folder
      );
    },

    localeDate(dateString: string | Date): string {
      const date =
        typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    },

    addSelectedNote(noteId: string) {
      if (!this.selectedNotes.includes(noteId)) {
        this.selectedNotes.push(noteId);
      }
    },

    removeSelectedNote(noteId: string) {
      const index = this.selectedNotes.indexOf(noteId);
      if (index !== -1) {
        this.selectedNotes.splice(index, 1);
      }
    },

    clearSelectedNotes() {
      this.selectedNotes = [];
    },

    selectAllNotes() {
      this.selectedNotes = this.notes.map((note) => note.id);
    },

    async pinSelectedNotes() {
      for (const noteId of this.selectedNotes) {
        await this.pinNote(noteId);
      }
    },

    async unpinSelectedNotes() {
      for (const noteId of this.selectedNotes) {
        await this.unpinNote(noteId);
      }
    },

    async togglePinSelectedNotes() {
      const allPinned = this.selectedNotes.every((noteId) => {
        const note = this.notes.find((n) => n.id === noteId);
        return note && note.pinned;
      });

      if (allPinned) {
        await this.unpinSelectedNotes();
      } else {
        await this.pinSelectedNotes();
      }
    },

    async deleteSelectedNotes(isTrashRoute: boolean) {
      if (isTrashRoute) {
        for (const noteId of this.selectedNotes) {
          await this.permanentlyDeleteNote(noteId);
        }
        uiStore.showToastMessage('Selected notes permanently deleted');
      } else {
        for (const noteId of this.selectedNotes) {
          await this.deleteNote(noteId);
        }
        uiStore.showToastMessage('Selected notes moved to trash');
      }
      this.clearSelectedNotes();
    },

    async emptyTrash() {
      if (authStore.isLoggedIn) {
        await firebaseStore.emptyTrashInFirebase(authStore.user!.uid);
      }
      this.deletedNotes = [];
      this.saveDeletedNotes();
      uiStore.showToastMessage('Trash emptied successfully');
    },

    setSearchQuery(query: string) {
      this.searchQuery = query;
    },

    setSelectedNote(noteId: string | null) {
      this.selectedNoteId = noteId;
    },
  },
});
