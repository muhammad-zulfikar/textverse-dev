// stores/uiStore.ts

import { defineStore } from 'pinia';
import { authStore, notesStore } from './stores';
import { useAuthStore } from './authStore';
import { ref, set, onValue, off } from 'firebase/database';
import { db } from '@/firebase';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  viewType: 'card' | 'table' | 'mail' | 'folder';
  noteOpenPreference: 'modal' | 'sidebar';
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
  alertMessage: string;
  isNoteCardOpen: boolean;
  isNoteSidebarOpen: boolean;
  isEditing: boolean;
  isCreatingNote: boolean;
  settingsListener: (() => void) | null;
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
    noteOpenPreference:
      (localStorage.getItem('noteOpenPreference') as 'modal' | 'sidebar') ||
      'modal',
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
    alertMessage: '',
    isNoteCardOpen: false,
    isNoteSidebarOpen: false,
    isEditing: false,
    isCreatingNote: false,
    settingsListener: null as null | (() => void),
  }),

  actions: {
    async saveSettings() {
      const authStore = useAuthStore();
      if (authStore.isLoggedIn) {
        const settings = {
          theme: this.theme,
          viewType: this.viewType,
          noteOpenPreference: this.noteOpenPreference,
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
      localStorage.setItem('noteOpenPreference', this.noteOpenPreference);
      localStorage.setItem('blurEnabled', this.blurEnabled.toString());
      localStorage.setItem('columns', this.columns.toString());
    },

    async loadSettings() {
      const savedTheme = localStorage.getItem('theme') as
        | UIState['theme']
        | null;

      if (savedTheme) {
        this.theme = savedTheme;
        this.applyTheme();
      }

      const authStore = useAuthStore();
      if (authStore.isLoggedIn) {
        const settingsRef = ref(db, `users/${authStore.user!.uid}/settings`);
        this.settingsListener = onValue(settingsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            this.theme = data.theme;
            this.applyTheme();
          } else {
            this.loadUISettings();
          }
        });
      } else {
        this.loadUISettings();
      }
    },

    clearSettingsListener() {
      if (this.settingsListener) {
        off(ref(db, `users/${authStore.user!.uid}/settings`));
        this.settingsListener = null;
      }
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

    setNoteOpenPreference(preference: 'modal' | 'sidebar') {
      this.noteOpenPreference = preference;
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
          .querySelector('meta[name="theme-color"]')
          ?.setAttribute('content', '#4b5563');
        document
          .querySelector('link[rel="icon"]')
          ?.setAttribute('href', '/dark/favicon.ico');
      } else {
        document.documentElement.classList.remove('dark');
        document
          .querySelector('meta[name="theme-color"]')
          ?.setAttribute('content', '#f7f4e4');
        document
          .querySelector('link[rel="icon"]')
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

      const savedNoteOpenPreference = localStorage.getItem(
        'noteOpenPreference'
      ) as 'modal' | 'sidebar' | null;
      if (savedNoteOpenPreference) {
        this.noteOpenPreference = savedNoteOpenPreference;
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

    openNote(noteId: string | null) {
      notesStore.selectedNoteId = noteId;
      if (this.noteOpenPreference === 'modal') {
        this.isNoteCardOpen = true;
        document.body.classList.add('modal-open');
      } else {
        this.isNoteSidebarOpen = true;
        document.body.classList.add('modal-open');
      }
    },

    closeNote() {
      notesStore.selectedNoteId = null;
      if (this.noteOpenPreference === 'modal') {
        this.isNoteCardOpen = false;
      } else {
        this.isNoteSidebarOpen = false;
      }
      document.body.classList.remove('modal-open');
    },

    clearLocalSettings() {
      localStorage.removeItem('theme');
      localStorage.removeItem('viewType');
      localStorage.removeItem('noteOpenPreference');
      localStorage.removeItem('columns');
      localStorage.removeItem('blurEnabled');
      this.loadSettings();
    },
  },
});
