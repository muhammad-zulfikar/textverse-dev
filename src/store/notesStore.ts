// notesStore.ts

import { defineStore } from 'pinia';
import { Note } from './types';
import { DEFAULT_FOLDERS } from './constants';
import { authStore, folderStore, uiStore, firebaseStore } from './stores';
import { db } from '@/firebase';
import { ref, remove } from 'firebase/database';
import initialNotes from '@/assets/initialNotes.json';

interface NotesState {
  notes: Note[];
  deletedNotes: Note[];
  selectedNoteId: number | null;
  searchQuery: string;
  editing: boolean;
  showNoteModal: boolean;
  isLoading: boolean;
}

export const useNotesStore = defineStore('notes', {
  state: (): NotesState => ({
    notes: [],
    deletedNotes: [],
    selectedNoteId: null as number | null,
    searchQuery: '',
    editing: false,
    showNoteModal: false,
    isLoading: true,
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
      };

      if (authStore.isLoggedIn) {
        await firebaseStore.saveNoteToFirebase(authStore.user!.uid, note);
      }

      this.notes.unshift(note);
      this.reorderNotes();
      this.saveNotes();
      uiStore.showToastMessage('Note added successfully!');
    },

    async updateNote(updatedNote: Note) {
      const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toISOString();
      };
      const now = formatDate(new Date());
      const index = this.notes.findIndex((n) => n.id === updatedNote.id);
      if (index !== -1) {
        const noteWithTimestamp = {
          ...updatedNote,
          last_edited: now,
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
        uiStore.showToastMessage('Note updated successfully!');
      }
    },

    async deleteNote(noteId: number) {
      const index = this.notes.findIndex((n) => n.id === noteId);
      if (index !== -1) {
        const deletedNote = this.notes.splice(index, 1)[0];
        this.deletedNotes.push(deletedNote);

        if (authStore.isLoggedIn) {
          await firebaseStore.deleteNoteFromFirebase(
            authStore.user!.uid,
            noteId
          );
        }

        this.saveNotes();
        uiStore.showToastMessage('Note deleted successfully!');
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
        uiStore.showToastMessage('Note pinned successfully!');
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
        uiStore.showToastMessage('Note unpinned successfully!');
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
              console.error('Error importing notes:', error);
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
        await remove(notesRef);
      } else {
        localStorage.removeItem('notes');
        this.deletedNotes.push(...this.notes);
      }

      this.notes = [];
      this.saveNotes();
      uiStore.showToastMessage('All notes deleted successfully!');
    },

    async loadNotes() {
      this.isLoading = true;
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
      this.isLoading = false;
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
            uiStore.showToastMessage('Note content copied to clipboard!');
          })
          .catch((err) => {
            console.error('Failed to copy text: ', err);
            uiStore.showToastMessage('Failed to copy note content');
          });
      }
    },

    downloadNote(note: Note) {
      const { title, content, time_created } = note;
      const filename = `${title}.txt`;
      const blob = new Blob(
        [`Title: ${title}\nTime Created: ${time_created}\n\n${content}`],
        { type: 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      uiStore.showToastMessage('Note downloaded successfully!');
    },

    setSearchQuery(query: string) {
      this.searchQuery = query;
    },

    setSelectedNote(noteId: number | null) {
      this.selectedNoteId = noteId;
    },

    setEditing(value: boolean) {
      this.editing = value;
    },
  },
});
