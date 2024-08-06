// stores/uiStore.ts

import { defineStore } from 'pinia';
import { notesStore } from './stores';
import { useAuthStore } from './authStore';
import { ref, set, get } from 'firebase/database';
import { db } from '@/firebase';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  viewType: 'card' | 'table' | 'mail' | 'folder';
  columns: number;
  folderViewType: 'grid' | 'list';
  currentTheme: string;
  blurEnabled: boolean;
  isExpanded: boolean;
  activeDropdown: string | null;
  showToast: boolean;
  toastMessage: string;
  toastTimeoutId: number | null;
  isAlertOpen: boolean;
  isNoteCardOpen: boolean;
  isNoteSidebarOpen: boolean;
  isEditing: boolean;
  isCreatingNote: boolean;
  showPreview: boolean;
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    theme: 'system',
    viewType:
      (localStorage.getItem('viewType') as
        | 'card'
        | 'table'
        | 'mail'
        | 'folder') || 'card',
    currentTheme: localStorage.getItem('theme') || 'system',
    columns: parseInt(
      localStorage.getItem('columns') || (window.innerWidth < 640 ? '2' : '4')
    ),
    folderViewType: 'grid',
    blurEnabled: JSON.parse(localStorage.getItem('blurEnabled') || 'false'),
    isExpanded: false,
    activeDropdown: null,
    showToast: false,
    toastMessage: '',
    toastTimeoutId: null,
    isAlertOpen: false,
    isNoteCardOpen: false,
    isNoteSidebarOpen: false,
    isEditing: false,
    isCreatingNote: false,
    showPreview: false,
  }),

  actions: {
    async saveSettings() {
      const authStore = useAuthStore();
      if (authStore.isLoggedIn) {
        const settings = {
          theme: this.theme,
          viewType: this.viewType,
          blurEnabled: this.blurEnabled,
        };

        try {
          await set(ref(db, `users/${authStore.user!.uid}/settings`), settings);
        } catch (error) {
          console.error('Error saving settings to Firebase:', error);
        }
      }

      localStorage.setItem('theme', this.theme);
      localStorage.setItem('viewType', this.viewType);
      localStorage.setItem('blurEnabled', this.blurEnabled.toString());
      localStorage.setItem('columns', this.columns.toString());
    },

    async loadSettings() {
      const authStore = useAuthStore();
      if (authStore.isLoggedIn) {
        try {
          const snapshot = await get(
            ref(db, `users/${authStore.user!.uid}/settings`)
          );
          if (snapshot.exists()) {
            const data = snapshot.val();
            this.theme = data.theme;
            this.viewType = data.viewType;
            this.blurEnabled = data.blurEnabled;

            this.saveSettings();
          } else {
            this.loadUISettings();
          }
        } catch (error) {
          console.error('Error loading settings from Firebase:', error);
          this.loadUISettings();
        }
      } else {
        this.loadUISettings();
      }

      const savedColumns = localStorage.getItem('columns');
      if (savedColumns) {
        this.columns = parseInt(savedColumns, 10);
      } else {
        this.columns = window.innerWidth < 640 ? 2 : 4;
      }

      this.applyTheme();
    },

    setTheme(theme: 'light' | 'dark' | 'system') {
      this.theme = theme;
      this.currentTheme = theme;
      this.saveSettings();
      this.applyTheme();
    },

    setViewType(viewType: 'card' | 'table' | 'mail' | 'folder') {
      this.viewType = viewType;
      this.saveSettings();
    },

    setColumns(columns: number) {
      this.columns = columns;
      localStorage.setItem('columns', columns.toString());
    },

    setFolderViewType(viewType: 'grid' | 'list') {
      this.folderViewType = viewType;
    },

    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },

    applyTheme() {
      const isDark =
        this.theme === 'dark' ||
        (this.theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
        document
          .getElementById('theme-color')
          ?.setAttribute('content', '#4b5563');
        document
          .getElementById('favicon')
          ?.setAttribute('href', '/dark/favicon.ico');
      } else {
        document.documentElement.classList.remove('dark');
        document
          .getElementById('theme-color')
          ?.setAttribute('content', '#f7f4e4');
        document
          .getElementById('favicon')
          ?.setAttribute('href', '/light/favicon.ico');
      }
    },

    setBlurEnabled(enabled: boolean) {
      this.blurEnabled = enabled;
      const message = enabled ? 'Blur effect enabled' : 'Blur effect disabled';
      this.showToastMessage(message);
      this.saveSettings();
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
      } else {
        this.columns = window.innerWidth < 640 ? 2 : 4;
      }

      const savedViewType = localStorage.getItem('viewType') as
        | UIState['viewType']
        | null;
      if (savedViewType) {
        this.viewType = savedViewType;
      }

      const savedBlurEnabled = localStorage.getItem('blurEnabled');
      if (savedBlurEnabled) {
        this.blurEnabled = savedBlurEnabled === 'true';
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

    openNote(noteId: number | null) {
      notesStore.selectedNoteId = noteId;
      switch (this.viewType) {
        case 'card':
        case 'folder':
          this.isNoteCardOpen = true;
          document.body.classList.add('modal-open');
          break;
        case 'table':
          this.isNoteSidebarOpen = true;
          document.body.classList.add('modal-open');
          break;
        case 'mail':
          if (noteId === null) {
            this.isCreatingNote = true;
            notesStore.selectedNoteId = null;
          }
          break;
      }
    },

    closeNote() {
      notesStore.selectedNoteId = null;
      this.showPreview = false;
      switch (this.viewType) {
        case 'card':
        case 'folder':
          this.isNoteCardOpen = false;
          document.body.classList.remove('modal-open');
          break;
        case 'table':
          this.isNoteSidebarOpen = false;
          document.body.classList.remove('modal-open');
          break;
        case 'mail':
          this.isCreatingNote = false;
          break;
      }
    },
  },
});
