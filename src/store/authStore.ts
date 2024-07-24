// authStore.ts

import { defineStore } from 'pinia';
import {
  getStorage,
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
import { auth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import { useNotesStore } from './store';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    avatarUrl: '' as string,
  }),
  actions: {
    showToast(message: string) {
      const notesStore = useNotesStore();
      notesStore.showToastMessage(message);
    },
    async login(email: string, password: string) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        this.user = userCredential.user;
        this.avatarUrl = this.user.photoURL || '';
        this.showToast('Signed in successfully');
      } catch (error) {
        this.showToast('Sign in failed. Please check your credentials.');
        throw error;
      }
    },
    async signUp(email: string, password: string) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        this.user = userCredential.user;
        this.avatarUrl = this.user.photoURL || '';
        this.showToast('Account successfully created');
      } catch (error) {
        this.showToast('Sign up failed. Please try again.');
        throw error;
      }
    },
    async logout() {
      try {
        await signOut(auth);
        this.user = null;
        this.avatarUrl = '';
        this.showToast('Signed out successfully');
      } catch (error) {
        this.showToast('Sign out failed. Please try again.');
        throw error;
      }
    },
    async signInWithGoogle() {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        this.user = userCredential.user;
        this.avatarUrl = this.user.photoURL || '';
        this.showToast('Signed in with Google successfully');
      } catch (error) {
        this.showToast('Google sign-in failed. Please try again.');
        throw error;
      }
    },
    async signInWithGitHub() {
      try {
        const provider = new GithubAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        this.user = userCredential.user;
        this.avatarUrl = this.user.photoURL || '';
        this.showToast('Signed in with GitHub successfully');
      } catch (error) {
        this.showToast('GitHub sign-in failed. Please try again.');
        throw error;
      }
    },
    async fetchCurrentUser() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.user = user;
          this.avatarUrl = user.photoURL || '';
        } else {
          this.user = null;
          this.avatarUrl = '';
        }
      });
    },
    async updateAvatar(newAvatarUrl: string) {
      if (this.user) {
        try {
          // Upload image to Firebase Storage
          const storage = getStorage();
          const imageRef = storageRef(storage, `avatars/${this.user.uid}`);
          await uploadString(imageRef, newAvatarUrl, 'data_url');

          // Get the download URL
          const downloadURL = await getDownloadURL(imageRef);

          // Update user profile with the download URL
          await updateProfile(this.user, { photoURL: downloadURL });
          this.avatarUrl = downloadURL;
        } catch (error) {
          console.error('Failed to update avatar:', error);
          throw error;
        }
      }
    },

    async updateName(newName: string) {
      if (this.user) {
        try {
          await updateProfile(this.user, { displayName: newName });
        } catch (error) {
          console.error('Failed to update name:', error);
          throw error;
        }
      }
    },

    async deleteAccount() {
      if (this.user) {
        try {
          await deleteUser(this.user);
          this.user = null;
          this.avatarUrl = '';
        } catch (error) {
          console.error('Failed to delete account:', error);
          throw error;
        }
      }
    },
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
  },
});
