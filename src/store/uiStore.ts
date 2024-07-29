// stores/uiStore.ts

import { defineStore } from 'pinia';
import { notesStore } from './stores';

export interface NoteLayout {
  id: number;
}

interface UIState {
  theme: 'light' | 'dark' | 'system';
  viewType: 'card' | 'table' | 'email' | 'folder';
  columns: number;
  folderViewType: 'grid' | 'list';
  currentTheme: string;
  isFullScreen: boolean;
  activeDropdown: string | null;
  showToast: boolean;
  toastMessage: string;
  toastTimeoutId: number | null;
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    theme: 'system',
    viewType:
      (localStorage.getItem('viewType') as
        | 'card'
        | 'table'
        | 'email'
        | 'folder') || 'card',
    currentTheme: localStorage.getItem('theme') || 'system',
    columns: parseInt(
      localStorage.getItem('columns') || (window.innerWidth < 640 ? '2' : '4')
    ),
    folderViewType: 'grid',
    isFullScreen: false,
    activeDropdown: null,
    showToast: false,
    toastMessage: '',
    toastTimeoutId: null,
  }),

  actions: {
    setTheme(theme: 'light' | 'dark' | 'system') {
      this.theme = theme;
      localStorage.setItem('theme', theme);
      this.applyTheme();
    },

    setViewType(viewType: 'card' | 'table' | 'email' | 'folder') {
      this.viewType = viewType;
      localStorage.setItem('viewType', viewType);
    },

    setColumns(columns: number) {
      this.columns = columns;
      localStorage.setItem('columns', columns.toString());
    },

    setFolderViewType(viewType: 'grid' | 'list') {
      this.folderViewType = viewType;
    },

    toggleFullScreen() {
      this.isFullScreen = !this.isFullScreen;
    },

    applyTheme() {
      if (
        this.theme === 'dark' ||
        (this.theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },

    loadUISettings() {
      const savedTheme = localStorage.getItem('theme') as
        | UIState['theme']
        | null;
      if (savedTheme) {
        this.theme = savedTheme;
      }

      const savedColumns = localStorage.getItem('columns');
      if (savedColumns) {
        this.columns = parseInt(savedColumns, 10);
      }

      const savedViewType = localStorage.getItem('viewType') as
        | UIState['viewType']
        | null;
      if (savedViewType) {
        this.viewType = savedViewType;
      }

      this.applyTheme();
    },

    setActiveDropdown(dropdown: string | null) {
      this.activeDropdown = dropdown;
    },

    showToastMessage(message: string) {
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

    closeNoteModal() {
      notesStore.selectedNoteId = null;
      notesStore.showNoteModal = false;
    },

    openNote(noteId: number | null) {
      notesStore.selectedNoteId = noteId;
      notesStore.showNoteModal = true;
      document.body.classList.add('modal-open');
    },

    closeNote() {
      notesStore.selectedNoteId = null;
      notesStore.showNoteModal = false;
      document.body.classList.remove('modal-open');
    },
  },
});
