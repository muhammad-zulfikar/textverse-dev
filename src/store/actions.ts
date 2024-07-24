// actions.ts

import { State, Note } from './types';
import { useAuthStore } from './authStore';
import initialNotes from '@/assets/initialNotes.json';
import {
  saveNoteToFirebase,
  updateNoteInFirebase,
  deleteNoteFromFirebase,
  getAllNotesFromFirebase,
} from './firebaseStore';
import { db } from '@/firebase';
import { ref, remove } from 'firebase/database';

export const actions = {
  async addNote(
    this: State,
    newNote: Omit<
      Note,
      'id' | 'time_created' | 'last_edited' | 'pinned' | 'folder'
    >
  ) {
    const authStore = useAuthStore();
    const now = new Date();
    const formattedDate = now.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const note: Note = {
      id: Date.now(),
      ...newNote,
      time_created: formattedDate,
      last_edited: formattedDate,
      pinned: false,
      folder:
        this.currentFolder === 'All Notes'
          ? this.uncategorizedFolder
          : this.currentFolder,
    };

    if (authStore.isLoggedIn) {
      await saveNoteToFirebase(authStore.user!.uid, note);
    }

    this.notes.unshift(note);
    this.reorderNotes();
    this.saveNotes();
    this.showToastMessage('Note added successfully!');
  },

  async saveNote(this: State, updatedNote: Note) {
    const authStore = useAuthStore();
    const index = this.notes.findIndex((n) => n.id === updatedNote.id);
    if (index !== -1) {
      const now = new Date();
      const formattedDate = now.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // Update the existing note
      const updatedNoteWithTimestamp: Note = {
        ...this.notes[index],
        ...updatedNote,
        last_edited: formattedDate,
      };

      if (authStore.isLoggedIn) {
        try {
          await updateNoteInFirebase(
            authStore.user!.uid,
            updatedNote.id,
            updatedNoteWithTimestamp
          );
        } catch (error) {
          console.error('Error updating note in Firebase:', error);
          this.showToastMessage('Failed to update note. Please try again.');
          return;
        }
      }

      // Update the note in the local state
      this.notes[index] = updatedNoteWithTimestamp;

      this.reorderNotes();
      this.saveNotes();
      this.showToastMessage('Note updated successfully!');
      this.closeNote();
    } else {
      console.error('Note not found for update:', updatedNote.id);
      this.showToastMessage('Failed to update note. Note not found.');
    }
  },

  async pinNote(this: State, noteId: number) {
    const authStore = useAuthStore();
    const index = this.notes.findIndex((note) => note.id === noteId);
    if (index !== -1) {
      this.notes[index].pinned = true;

      if (authStore.isLoggedIn) {
        try {
          await updateNoteInFirebase(authStore.user!.uid, noteId, {
            pinned: true,
          });
        } catch (error) {
          console.error(
            'Error updating note pinned status in Firebase:',
            error
          );
          // Revert the local change if Firebase update fails
          this.notes[index].pinned = false;
          this.showToastMessage('Failed to pin note. Please try again.');
          return;
        }
      }

      this.reorderNotes();
      this.saveNotes();
      this.showToastMessage('Note pinned');
    }
  },

  async unpinNote(this: State, noteId: number) {
    const authStore = useAuthStore();
    const index = this.notes.findIndex((note) => note.id === noteId);
    if (index !== -1) {
      const unpinnedNote = this.notes[index];
      unpinnedNote.pinned = false;

      if (authStore.isLoggedIn) {
        try {
          await updateNoteInFirebase(authStore.user!.uid, noteId, {
            pinned: false,
          });
        } catch (error) {
          console.error(
            'Error updating note pinned status in Firebase:',
            error
          );
          // Revert the local change if Firebase update fails
          unpinnedNote.pinned = true;
          this.showToastMessage('Failed to unpin note. Please try again.');
          return;
        }
      }

      this.notes.splice(index, 1);

      const insertIndex = this.notes.findIndex((note) => {
        const noteDate = new Date(note.last_edited || note.time_created);
        const unpinnedDate = new Date(
          unpinnedNote.last_edited || unpinnedNote.time_created
        );
        return !note.pinned && noteDate <= unpinnedDate;
      });

      if (insertIndex === -1) {
        this.notes.push(unpinnedNote);
      } else {
        this.notes.splice(insertIndex, 0, unpinnedNote);
      }

      this.saveNotes();
      this.showToastMessage('Note unpinned');
    }
  },

  reorderNotes(this: State) {
    this.notes.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      const dateA = new Date(a.last_edited || a.time_created);
      const dateB = new Date(b.last_edited || b.time_created);
      return dateB.getTime() - dateA.getTime();
    });
  },

  saveNotes(this: State) {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      localStorage.setItem('notes', JSON.stringify(this.notes));
    }
  },

  async removeNote(this: State, noteId: number) {
    const authStore = useAuthStore();
    const index = this.notes.findIndex((note) => note.id === noteId);
    if (index !== -1) {
      // Remove the note from the local state
      const deletedNote = this.notes.splice(index, 1)[0];
      this.deletedNotes.push(deletedNote);

      if (authStore.isLoggedIn) {
        try {
          await deleteNoteFromFirebase(authStore.user!.uid, noteId);
        } catch (error) {
          console.error('Error deleting note from Firebase:', error);
          // Revert the local deletion if Firebase delete fails
          this.notes.splice(index, 0, deletedNote);
          this.deletedNotes.pop();
          this.showToastMessage('Failed to delete note. Please try again.');
          return;
        }
      }

      this.closeNote();
      this.saveNotes();
      this.showToastMessage('Note deleted successfully!');
    }
  },

  async loadNotes(this: State) {
    const authStore = useAuthStore();
    if (authStore.isLoggedIn) {
      const firebaseNotes = await getAllNotesFromFirebase(authStore.user!.uid);
      this.notes = Object.values(firebaseNotes);
    } else {
      const localNotes = localStorage.getItem('notes');
      if (localNotes) {
        this.notes = JSON.parse(localNotes);
      } else {
        // Use initialNotes only if there are no saved notes in localStorage
        this.notes = JSON.parse(JSON.stringify(initialNotes)).map(
          (note: Partial<Note>, index: number) => ({
            ...note,
            id: Date.now() + index,
            pinned: Boolean(note.pinned),
            folder: note.folder || 'Uncategorized',
            last_edited: note.last_edited || note.time_created || null,
            time_created:
              note.time_created ||
              new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }),
          })
        );
        this.saveNotes(); // Save initialNotes to localStorage
      }
    }
    this.reorderNotes();
  },

  async removeNoteInModal(this: State) {
    const authStore = useAuthStore();
    if (this.selectedNote) {
      const index = this.notes.findIndex(
        (note) => note.id === this.selectedNote?.id
      );
      if (index !== -1) {
        const deletedNote = this.notes.splice(index, 1)[0];
        this.deletedNotes.push(deletedNote);

        if (authStore.isLoggedIn) {
          try {
            await deleteNoteFromFirebase(authStore.user!.uid, deletedNote.id);
          } catch (error) {
            console.error('Error deleting note from Firebase:', error);
            // Revert the local deletion if Firebase delete fails
            this.notes.splice(index, 0, deletedNote);
            this.deletedNotes.pop();
            this.showToastMessage('Failed to delete note. Please try again.');
            return;
          }
        }

        this.showToastMessage('Note deleted successfully!');
        this.closeNoteModal();
        this.saveNotes();
      }
    }
  },

  undoDelete(this: State) {
    if (this.deletedNotes.length > 0) {
      const lastDeletedNote = this.deletedNotes.pop();
      if (lastDeletedNote) {
        this.notes.push(lastDeletedNote);
        this.saveNotes();
        this.showToastMessage('Note restored successfully!');
      }
    }
  },

  async deleteAllNotes(this: State) {
    const authStore = useAuthStore();

    if (authStore.isLoggedIn) {
      // Delete all notes from Firebase
      const notesRef = ref(db, `users/${authStore.user!.uid}/notes`);
      await remove(notesRef);
    } else {
      // Clear notes from localStorage
      localStorage.removeItem('notes');
      this.deletedNotes.push(...this.notes);
    }

    this.notes = [];
    this.saveNotes();
    this.showToastMessage('All notes deleted successfully!');
  },

  copyNote(this: State, noteId: number) {
    const note = this.notes.find((n) => n.id === noteId);
    if (note) {
      navigator.clipboard
        .writeText(note.content)
        .then(() => {
          this.showToastMessage('Note content copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
          this.showToastMessage('Failed to copy note content');
        });
    }
  },

  openNote(this: State, noteId: number) {
    const note = this.notes.find((n) => n.id === noteId);
    if (note) {
      this.selectedNote = { ...note };
      document.body.classList.add('modal-open');
    }
  },

  closeNote(this: State) {
    this.selectedNote = null;
    document.body.classList.remove('modal-open');
  },

  closeNoteModal(this: State) {
    this.selectedNote = null;
    this.showNoteModal = false;
  },

  setEditing(this: State, value: boolean) {
    this.editing = value;
  },

  setSearchQuery(this: State, query: string) {
    this.searchQuery = query;
  },

  showToastMessage(this: State, message: string) {
    this.showToast = true;
    this.toastMessage = message;
    if (this.toastTimeoutId !== null) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = window.setTimeout(() => {
      this.showToast = false;
      this.toastMessage = '';
      this.toastTimeoutId = null;
    }, 3000);
  },

  toggleFullScreen(this: State) {
    this.isFullScreen = !this.isFullScreen;
  },

  downloadNote(this: State, note: Note) {
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
    this.showToastMessage('Note downloaded successfully!');
  },

  linkify(this: State, text: string) {
    const escapeHTML = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    const escapedText = escapeHTML(text);
    const urlRegex =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;

    return escapedText.replace(
      urlRegex,
      (url) =>
        `<a href="${url}" target="_blank" class="hover:underline">${url}</a>`
    );
  },

  setCurrentFolder(this: State, folder: string) {
    this.currentFolder = folder;
  },

  setActiveDropdown(this: State, dropdown: string | null) {
    this.activeDropdown = dropdown;
  },

  createFolder(this: State, folderName: string) {
    if (!this.folders.includes(folderName)) {
      this.folders.push(folderName);
      this.saveFolders();
      this.showToastMessage('Folder created successfully!');
    } else {
      this.showToastMessage('Folder already exists!');
    }
  },

  renameFolder(this: State, oldName: string, newName: string) {
    if (
      oldName !== 'All Notes' &&
      oldName !== this.uncategorizedFolder &&
      !this.folders.includes(newName)
    ) {
      const index = this.folders.indexOf(oldName);
      if (index !== -1) {
        this.folders[index] = newName;
        this.notes = this.notes.map((note) =>
          note.folder === oldName ? { ...note, folder: newName } : note
        );
        this.saveFolders();
        this.saveNotes();
        this.showToastMessage('Folder renamed successfully!');
      }
    } else {
      this.showToastMessage('Cannot rename this folder!');
    }
  },

  saveFolders(this: State) {
    localStorage.setItem('folders', JSON.stringify(this.folders));
  },

  loadFolders(this: State) {
    const savedFolders = localStorage.getItem('folders');
    if (savedFolders) {
      this.folders = JSON.parse(savedFolders);
      if (!this.folders.includes(this.uncategorizedFolder)) {
        this.folders.push(this.uncategorizedFolder);
      }
    }
  },

  notesCountByFolder(this: State): Record<string, number> {
    const counts: Record<string, number> = {};
    this.folders.forEach((folder) => {
      counts[folder] =
        folder === 'All Notes'
          ? this.notes.length
          : this.notes.filter((note) => note.folder === folder).length;
    });
    return counts;
  },

  moveNote(this: State, noteId: number, targetFolder: string) {
    const noteIndex = this.notes.findIndex((note) => note.id === noteId);
    if (noteIndex !== -1) {
      this.notes[noteIndex].folder = targetFolder;
      this.saveNotes();
      this.showToastMessage('Note moved successfully!');
    }
  },

  deleteFolder(this: State, folderName: string) {
    if (folderName !== 'All Notes' && folderName !== this.uncategorizedFolder) {
      const index = this.folders.indexOf(folderName);
      if (index !== -1) {
        this.folders.splice(index, 1);
        this.notes = this.notes.map((note) =>
          note.folder === folderName
            ? { ...note, folder: this.uncategorizedFolder }
            : note
        );
        this.saveFolders();
        this.saveNotes();
        if (this.currentFolder === folderName) {
          this.setCurrentFolder('All Notes');
        }
        this.showToastMessage('Folder deleted successfully!');
      }
    } else {
      this.showToastMessage('Cannot delete this folder!');
    }
  },

  async importNotes(this: State) {
    const authStore = useAuthStore();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const importedNotes = JSON.parse(e.target?.result as string);

            if (authStore.isLoggedIn) {
              // Import notes to Firebase
              for (const note of importedNotes) {
                await saveNoteToFirebase(authStore.user!.uid, note);
              }
            } else {
              // Import notes to localStorage
              this.notes = [...this.notes, ...importedNotes];
              this.saveNotes();
            }

            await this.loadNotes(); // Reload notes after import
            this.showToastMessage('Notes imported successfully!');
          } catch (error) {
            console.error('Error importing notes:', error);
            this.showToastMessage('Failed to import notes. Please try again.');
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  },

  async downloadBackup(this: State) {
    const authStore = useAuthStore();
    let notesToBackup;

    if (authStore.isLoggedIn) {
      notesToBackup = await getAllNotesFromFirebase(authStore.user!.uid);
    } else {
      notesToBackup = this.notes;
    }

    const blob = new Blob([JSON.stringify(notesToBackup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'textverse_notes_backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToastMessage('Backup downloaded successfully!');
  },

  setColumns(this: State, columns: number) {
    this.columns = columns;
    localStorage.setItem('columnCount', columns.toString());
  },

  setTheme(this: State, theme: string) {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  },

  initTheme(this: State) {
    const savedTheme = localStorage.getItem('theme') || 'system';
    this.setTheme(savedTheme);
  },

  async init(this: State) {
    this.loadFolders();
    this.initTheme();
    await this.loadNotes();
  },
};
