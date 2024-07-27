// stores/folderStore.ts

import { defineStore } from 'pinia';
import { DEFAULT_FOLDERS } from './constants';
import { authStore, notesStore, uiStore, firebaseStore } from './stores';

interface FolderState {
  folders: string[];
  currentFolder: string;
}

export const useFolderStore = defineStore('folders', {
  state: (): FolderState => ({
    folders: [DEFAULT_FOLDERS.ALL_NOTES, DEFAULT_FOLDERS.UNCATEGORIZED],
    currentFolder: DEFAULT_FOLDERS.ALL_NOTES,
  }),

  actions: {
    async addFolder(folderName: string) {
      if (!this.folders.includes(folderName)) {
        this.folders.push(folderName);
        if (authStore.isLoggedIn) {
          await firebaseStore.saveFolderToFirebase(
            authStore.user!.uid,
            folderName
          );
        } else {
          this.saveFolders();
        }
      }
      uiStore.showToastMessage(`Folder ${folderName} succesfully created`);
      this.setCurrentFolder(folderName);
    },

    async renameFolder(oldName: string, newName: string) {
      const index = this.folders.indexOf(oldName);
      if (index !== -1) {
        this.folders[index] = newName;

        if (authStore.isLoggedIn) {
          await firebaseStore.deleteFolderFromFirebase(
            authStore.user!.uid,
            oldName
          );
          await firebaseStore.saveFolderToFirebase(
            authStore.user!.uid,
            newName
          );
          const notes = await firebaseStore.getAllNotesFromFirebase(
            authStore.user!.uid
          );
          for (const note of Object.values(notes)) {
            if (note.folder === oldName) {
              await firebaseStore.updateNoteInFirebase(
                authStore.user!.uid,
                note.id,
                { folder: newName }
              );
            }
          }
        } else {
          this.saveFolders();
        }
      }
      uiStore.showToastMessage(`Folder renamed to ${newName}`);
    },

    async deleteFolder(folderName: string) {
      this.folders = this.folders.filter((f) => f !== folderName);

      if (authStore.isLoggedIn) {
        await firebaseStore.deleteFolderFromFirebase(
          authStore.user!.uid,
          folderName
        );
        const notes = await firebaseStore.getAllNotesFromFirebase(
          authStore.user!.uid
        );
        for (const note of Object.values(notes)) {
          if (note.folder === folderName) {
            await firebaseStore.updateNoteInFirebase(
              authStore.user!.uid,
              note.id,
              { folder: DEFAULT_FOLDERS.UNCATEGORIZED }
            );
          }
        }
      } else {
        this.saveFolders();
      }

      if (this.currentFolder === folderName) {
        this.currentFolder = DEFAULT_FOLDERS.ALL_NOTES;
      }
      uiStore.showToastMessage(`Folder ${folderName} succesfully deleted`);
    },

    setCurrentFolder(folderName: string) {
      this.currentFolder = folderName;
    },

    async loadFolders() {
      let loadedFolders: string[] = [];

      if (authStore.isLoggedIn) {
        loadedFolders = await firebaseStore.getAllFoldersFromFirebase(
          authStore.user!.uid
        );
      } else {
        const savedFolders = localStorage.getItem('folders');
        if (savedFolders) {
          loadedFolders = JSON.parse(savedFolders);
        }
      }

      this.folders = Array.from(new Set([...this.folders, ...loadedFolders]));
    },

    saveFolders() {
      if (!authStore.isLoggedIn) {
        localStorage.setItem('folders', JSON.stringify(this.folders));
      }
    },

    notesCountByFolder(): Record<string, number> {
      const counts: Record<string, number> = {};
      this.folders.forEach((folder) => {
        counts[folder] =
          folder === DEFAULT_FOLDERS.ALL_NOTES
            ? notesStore.notes.length
            : notesStore.notes.filter((note) => note.folder === folder).length;
      });
      return counts;
    },
  },
});
