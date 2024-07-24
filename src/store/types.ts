// types.ts

export interface Note {
  id: number;
  title: string;
  content: string;
  time_created: string;
  last_edited: string | null;
  pinned: boolean;
  folder: string;
}

export interface State {
  loadNotes(): unknown;
  notes: Note[];
  deletedNotes: Note[];
  selectedNote: Note | null;
  searchQuery: string;
  editing: boolean;
  showToast: boolean;
  toastMessage: string;
  toastTimeoutId: number | null;
  showNoteModal: boolean;
  copyNote: (noteId: number) => void;
  isFullScreen: boolean;
  currentFolder: string;
  folders: string[];
  uncategorizedFolder: string;
  activeDropdown: string | null;
  columns: number;
  currentTheme: string;

  addNote: (
    newNote: Omit<
      Note,
      'id' | 'time_created' | 'last_edited' | 'pinned' | 'folder'
    >
  ) => void;
  saveNote: (updatedNote: Note) => void;
  pinNote: (index: number) => void;
  unpinNote: (index: number) => void;
  reorderNotes: () => void;
  saveNotes: () => void;
  removeNote: (index: number) => void;
  removeNoteInModal: () => void;
  undoDelete: () => void;
  deleteAllNotes: () => void;
  openNote: (index: number) => void;
  closeNote: () => void;
  closeNoteModal: () => void;
  setEditing: (value: boolean) => void;
  setSearchQuery: (query: string) => void;
  showToastMessage: (message: string) => void;
  toggleFullScreen: () => void;
  downloadNote: (note: Note) => void;
  linkify: (text: string) => string;
  setCurrentFolder: (folder: string) => void;
  setActiveDropdown: (dropdown: string | null) => void;
  createFolder: (folderName: string) => void;
  renameFolder: (oldName: string, newName: string) => void;
  saveFolders: () => void;
  loadFolders: () => void;
  notesCountByFolder: () => Record<string, number>;
  moveNote: (noteId: number, targetFolder: string) => void;
  deleteFolder: (folderName: string) => void;
  setColumns: (columns: number) => void;
  setTheme: (theme: string) => void;
  initTheme: () => void;
  init: () => void;
}
