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
  signInWithRedirect,
  getRedirectResult,
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
    isLoading: true,
  }),
  actions: {
    showToast(message: string) {
      const uiStore = useUIStore();
      uiStore.showToastMessage(message);
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
      await this.syncFolders();
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
      await this.syncFolders();
    },

    async signInWithProvider(providerName: 'Google' | 'GitHub') {
      try {
        const provider =
          providerName === 'Google'
            ? new GoogleAuthProvider()
            : new GithubAuthProvider();

        if (this.isMobile()) {
          await signInWithRedirect(auth, provider);
        } else {
          const userCredential = await signInWithPopup(auth, provider);
          this.user = userCredential.user;
          this.avatarUrl = this.user.photoURL || '';
          this.showToast(`Signed in with ${providerName} successfully`);
        }
      } catch (error: any) {
        this.showToast(`${providerName} sign-in failed: ${error.message}`);
        throw error;
      }
    },

    async handleRedirectResult() {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          this.user = result.user;
          this.avatarUrl = this.user.photoURL || '';
          this.showToast('Signed in successfully');
        }
      } catch (error: any) {
        this.showToast(`Sign-in failed: ${error.message}`);
        throw error;
      }
    },

    async signInWithGoogle() {
      return this.signInWithProvider('Google');
    },

    async signInWithGitHub() {
      return this.signInWithProvider('GitHub');
    },

    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    },

    async fetchCurrentUser() {
      this.isLoading = true; // Set loading to true when starting to fetch
      return new Promise<void>((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            this.user = user;
            this.avatarUrl = user.photoURL || '';
          } else {
            const result = await getRedirectResult(auth);
            if (result && result.user) {
              this.user = result.user;
              this.avatarUrl = result.user.photoURL || '';
              this.showToast('Signed in successfully');
            } else {
              this.user = null;
              this.avatarUrl = '';
            }
          }
          this.isLoading = false; // Set loading to false when done
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
          await uploadString(imageRef, newAvatarUrl, 'data_url');
          const downloadURL = await getDownloadURL(imageRef);
          await updateProfile(this.user, { photoURL: downloadURL });
          this.avatarUrl = downloadURL;
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
