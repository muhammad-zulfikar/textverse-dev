// firebaseStore.ts

import { ref, set, get, remove, update } from 'firebase/database';
import { db } from '@/firebase';
import { Note } from './types';

export const saveNoteToFirebase = async (
  userId: string,
  note: Note
): Promise<number> => {
  const noteRef = ref(db, `users/${userId}/notes/${note.id}`);
  await set(noteRef, note);
  return note.id;
};

export const updateNoteInFirebase = async (
  userId: string,
  noteId: number,
  note: Partial<Note>
): Promise<void> => {
  const noteRef = ref(db, `users/${userId}/notes/${noteId}`);
  await update(noteRef, note);
};

export const deleteNoteFromFirebase = async (
  userId: string,
  noteId: number
): Promise<void> => {
  const noteRef = ref(db, `users/${userId}/notes/${noteId}`);
  await remove(noteRef);
};

export const getNoteFromFirebase = async (
  userId: string,
  noteId: number
): Promise<Note | null> => {
  const noteRef = ref(db, `users/${userId}/notes/${noteId}`);
  const snapshot = await get(noteRef);
  return snapshot.val() as Note | null;
};

export const getAllNotesFromFirebase = async (
  userId: string
): Promise<Record<number, Note>> => {
  const notesRef = ref(db, `users/${userId}/notes`);
  const snapshot = await get(notesRef);
  return (snapshot.val() as Record<number, Note>) || {};
};

export const saveFolderToFirebase = async (
  userId: string,
  folderName: string
): Promise<void> => {
  const folderRef = ref(db, `users/${userId}/folders/${folderName}`);
  await set(folderRef, true);
};

export const deleteFolderFromFirebase = async (
  userId: string,
  folderName: string
): Promise<void> => {
  const folderRef = ref(db, `users/${userId}/folders/${folderName}`);
  await remove(folderRef);
};

export const getAllFoldersFromFirebase = async (
  userId: string
): Promise<string[]> => {
  const foldersRef = ref(db, `users/${userId}/folders`);
  const snapshot = await get(foldersRef);
  return snapshot.val() ? Object.keys(snapshot.val()) : [];
};

export const updateNoteFolderInFirebase = async (
  userId: string,
  noteId: number,
  newFolder: string
): Promise<void> => {
  const noteRef = ref(db, `users/${userId}/notes/${noteId}`);
  await update(noteRef, { folder: newFolder });
};
