// authStore.ts

import { defineStore } from 'pinia';
import {
  getStorage,
  ref as storageRef,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { auth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithRedirect,
  onAuthStateChanged,
  User,
  updateProfile,
  deleteUser,
  signInWithPopup,
} from 'firebase/auth';
import { useFolderStore } from './folderStore';
import { useUIStore } from './uiStore';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    avatarUrl: '' as string,
    isLoading: false,
    pendingRedirect: false,
  }),
  actions: {
    showToast(message: string) {
      const uiStore = useUIStore();
      uiStore.showToastMessage(message);
    },

    async login(email: string, password: string) {
      this.isLoading = true;
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
      } finally {
        setTimeout(() => {
          this.isLoading = false;
        }, 1000);
      }
      await this.syncFolders();
    },

    async signUp(email: string, password: string) {
      this.isLoading = true;
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
      } finally {
        setTimeout(() => {
          this.isLoading = false;
        }, 1000);
      }
    },

    async logout() {
      this.isLoading = true;
      try {
        await signOut(auth);
        this.user = null;
        this.avatarUrl = '';
        this.showToast('Signed out successfully');
      } catch (error) {
        this.showToast('Sign out failed. Please try again.');
        throw error;
      } finally {
        setTimeout(() => {
          this.isLoading = false;
        }, 1000);
      }
      await this.syncFolders();
    },

    async signInWithGoogle() {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      this.user = userCredential.user;
      this.avatarUrl = this.user.photoURL || '';
    },

    async signInWithGitHub() {
      const provider = new GithubAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      this.user = userCredential.user;
      this.avatarUrl = this.user.photoURL || '';
    },

    async fetchCurrentUser() {
      this.isLoading = true;
      console.log('Fetching current user');
      return new Promise<void>((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            console.log('User is signed in:', user);
            this.user = user;
            this.avatarUrl = user.photoURL || '/avatar.png';
          } else {
            console.log('No user signed in');
            this.user = null;
            this.avatarUrl = '';
          }
          this.isLoading = false;
          resolve();
        });
      });
    },

    async syncFolders() {
      const folderStore = useFolderStore();
      await folderStore.loadFolders();
    },

    async updateAvatar(newAvatarUrl: string) {
      if (this.user) {
        try {
          const storage = getStorage();
          const imageRef = storageRef(storage, `avatars/${this.user.uid}`);

          if (newAvatarUrl === '/avatar.png') {
            // Remove the existing avatar from storage if it exists
            try {
              await deleteObject(imageRef);
            } catch (error) {
              // Ignore error if file doesn't exist
            }
            
            // Set photoURL to null
            await updateProfile(this.user, { photoURL: null });
            this.avatarUrl = '/avatar.png'; // Update the store's avatarUrl
          } else {
            // Upload new avatar
            await uploadString(imageRef, newAvatarUrl, 'data_url');
            const downloadURL = await getDownloadURL(imageRef);
            await updateProfile(this.user, { photoURL: downloadURL });
            this.avatarUrl = downloadURL;
          }
        } catch (error) {
          throw error;
        }
      }
    },

    async updateName(newName: string) {
      if (this.user) {
        try {
          await updateProfile(this.user, { displayName: newName });
        } catch (error) {
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
          throw error;
        }
      }
    },
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
  },
});
