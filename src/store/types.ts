// types.ts

export interface Note {
  id: number;
  title: string;
  content: string;
  time_created: string | Date;
  last_edited: string | Date;
  pinned: boolean;
  folder: string;
}

export interface Folder {
  id: string;
  name: string;
}
