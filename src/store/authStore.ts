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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
        await signInWithRedirect(auth, provider);
      } catch (error) {
        this.showToast('Google sign-in failed. Please try again.');
        throw error;
      }
    },
    async signInWithGitHub() {
      try {
        const provider = new GithubAuthProvider();
        await signInWithRedirect(auth, provider);
      } catch (error) {
        this.showToast('GitHub sign-in failed. Please try again.');
        throw error;
      }
    },
    async fetchCurrentUser() {
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
      });
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