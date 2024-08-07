// notesStore.ts

import { defineStore } from 'pinia';
import { Note } from './types';
import { DEFAULT_FOLDERS } from './constants';
import { authStore, folderStore, uiStore, firebaseStore } from './stores';
import { db } from '@/firebase';
import { get, ref, remove, set } from 'firebase/database';
import initialNotes from '@/assets/initialNotes.json';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { nanoid } from 'nanoid';

interface NotesState {
  notes: Note[];
  deletedNotes: Note[];
  selectedNoteId: number | null;
  searchQuery: string;
  sharedNotes: Set<number>;
}

interface ShareNote {
  id: number;
  uid: string;
  shareId: string;
}

export const useNotesStore = defineStore('notes', {
  state: (): NotesState => ({
    notes: [],
    deletedNotes: [],
    selectedNoteId: null as number | null,
    searchQuery: '',
    sharedNotes: new Set(),
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
    async shareNote(noteId: number) {
      if (this.sharedNotes.has(noteId)) {
        await this.unshareNote(noteId);
        return;
      }

      const note = this.notes.find((n) => n.id === noteId);
      if (!note) {
        uiStore.showToastMessage('Note not found.');
        return;
      }

      const shareId = nanoid();
      const shareNote: ShareNote = {
        id: note.id,
        uid: authStore.user!.uid,
        shareId,
      };

      const shareRef = ref(db, `sharedNotes/${shareId}`);
      await set(shareRef, shareNote);

      this.sharedNotes.add(noteId);

      const shareLink = `${window.location.origin}/shared/${shareId}`;
      uiStore.showToastMessage(`Note shared! Link: ${shareLink}`);
      navigator.clipboard
        .writeText(shareLink)
        .then(() => {
          uiStore.showToastMessage(`Note shared! Link copied to clipboard.`);
        })
        .catch(() => {
          uiStore.showToastMessage('Failed to copy link to clipboard.');
        });
    },

    async unshareNote(noteId: number) {
      try {
        // Query to find the shareId for the given noteId
        const snapshot = await get(ref(db, 'sharedNotes'));
        if (snapshot.exists()) {
          const sharedNotes: { [key: string]: ShareNote } = snapshot.val(); // Assert type here
          const shareEntry = Object.values(sharedNotes).find(
            (entry) => entry.id === noteId
          ) as ShareNote | undefined; // Assert type here

          if (shareEntry) {
            const shareId = shareEntry.shareId;
            const shareRef = ref(db, `sharedNotes/${shareId}`);
            await remove(shareRef);
            this.sharedNotes.delete(noteId);
            uiStore.showToastMessage('Note unshared.');
          } else {
            uiStore.showToastMessage('Note was not shared.');
          }
        } else {
          uiStore.showToastMessage('No shared notes found.');
        }
      } catch (error) {
        uiStore.showToastMessage('Failed to unshare note.');
        console.error('Unshare error:', error);
      }
    },

    async getSharedNoteById(shareId: string): Promise<Note | null> {
      const shareRef = ref(db, `sharedNotes/${shareId}`);
      const snapshot = await get(shareRef);
      const shareNote = snapshot.val() as ShareNote | null;

      if (shareNote) {
        const noteRef = ref(db, `users/${shareNote.uid}/notes/${shareNote.id}`);
        const noteSnapshot = await get(noteRef);
        return noteSnapshot.val() as Note | null;
      }

      return null;
    },

    async addNote(
      newNote: Omit<Note, 'id' | 'time_created' | 'last_edited' | 'pinned'>
    ) {
      const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toISOString();
      };
      const renderedContent = marked.parse(newNote.content) as string;
      const sanitizedContent = DOMPurify.sanitize(renderedContent);
      const now = formatDate(new Date());
      const note: Note = {
        ...newNote,
        id: Date.now(),
        time_created: now,
        last_edited: now,
        pinned: false,
        folder:
          folderStore.currentFolder === DEFAULT_FOLDERS.ALL_NOTES
            ? DEFAULT_FOLDERS.UNCATEGORIZED
            : folderStore.currentFolder,
        renderedContent: sanitizedContent,
      };

      if (authStore.isLoggedIn) {
        await firebaseStore.saveNoteToFirebase(authStore.user!.uid, note);
      }

      this.notes.unshift(note);
      this.reorderNotes();
      this.saveNotes();
      uiStore.showToastMessage(`${note.title} added`);
    },

    async updateNote(updatedNote: Note) {
      const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toISOString();
      };
      const renderedContent = marked.parse(updatedNote.content) as string;
      const sanitizedContent = DOMPurify.sanitize(renderedContent);
      const now = formatDate(new Date());
      const index = this.notes.findIndex((n) => n.id === updatedNote.id);
      if (index !== -1) {
        const noteWithTimestamp = {
          ...updatedNote,
          last_edited: now,
          renderedContent: sanitizedContent,
        };

        if (authStore.isLoggedIn) {
          await firebaseStore.updateNoteInFirebase(
            authStore.user!.uid,
            updatedNote.id,
            noteWithTimestamp
          );
        }

        this.notes[index] = noteWithTimestamp;
        this.reorderNotes();
        this.saveNotes();
        uiStore.closeNote();
        uiStore.showToastMessage(`${updatedNote.title} updated`);
      }
    },

    async deleteNote(noteId: number) {
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

    async restoreNote(noteId: number) {
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

    async permanentlyDeleteNote(noteId: number) {
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

    async fetchSharedNotes() {
      const sharedNotesRef = ref(db, `sharedNotes`);
      const snapshot = await get(sharedNotesRef);
      if (snapshot.exists()) {
        const sharedNotes = snapshot.val() as Record<string, ShareNote>;
        Object.values(sharedNotes).forEach((shareNote) => {
          this.sharedNotes.add(shareNote.id);
        });
      }
    },

    async pinNote(noteId: number) {
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

    async unpinNote(noteId: number) {
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

    async moveNote(noteId: number, targetFolder: string) {
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

    generateValidFirebaseKey(): number {
      return Date.now() + Math.floor(Math.random() * 1000);
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
              const importedNotes = JSON.parse(
                e.target?.result as string
              ) as Note[];

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
              uiStore.showToastMessage(
                'Failed to import notes. Please try again.'
              );
            }
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
        const firebaseNotes = await firebaseStore.getAllNotesFromFirebase(
          authStore.user!.uid
        );
        this.notes = Object.values(firebaseNotes);
      } else {
        const savedNotes = localStorage.getItem('notes');
        if (savedNotes) {
          this.notes = JSON.parse(savedNotes);
        } else {
          const importedNotes = initialNotes.map((note) => ({
            ...note,
            id: Date.now() + Math.random(),
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

    saveNotes() {
      if (!authStore.isLoggedIn) {
        localStorage.setItem('notes', JSON.stringify(this.notes));
      }
    },

    copyNote(noteId: number) {
      const note = this.notes.find((n) => n.id === noteId);
      if (note) {
        navigator.clipboard
          .writeText(note.content)
          .then(() => {
            uiStore.showToastMessage(`${note.title} copied to clipboard`);
          })
          .catch(() => {
            uiStore.showToastMessage('Failed to copy note content');
          });
      }
    },

    hasChanged(originalNote: Note, editedNote: Partial<Note>): boolean {
      return (
        originalNote.title !== editedNote.title ||
        originalNote.content !== editedNote.content ||
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

    setSearchQuery(query: string) {
      this.searchQuery = query;
    },

    setSelectedNote(noteId: number | null) {
      this.selectedNoteId = noteId;
    },
  },
});
