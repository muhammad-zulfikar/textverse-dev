<template>
  <Navbar />
  <div
    class="font-serif custom-card max-w-xs sm:max-w-sm md:max-w-md px-12 py-8 md:p-8 relative flex flex-col mx-auto mt-20 md:mt-14"
  >
    <div class="absolute top-0 right-1 flex text-sm p-4 select-none">
      <button
        class="hover:underline hover:bg-transparent dark:hover:bg-transparent outline-none"
        @click="closeForm"
      >
        Back
      </button>
    </div>
    <h2 class="text-2xl font-bold mb-4 mt-4 flex justify-center">
      {{ isSignUp ? 'Sign up' : 'Sign in' }}
    </h2>
    <form
      @submit.prevent="isSignUp ? handleSignUp() : handleLogin()"
      class="space-y-4"
    >
      <div>
        <label for="email" class="block">Email</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          class="w-full bg-transparent p-1 border-0 border-b-[1px] md:border-b-2 border-black dark:border-white outline-none"
        />
      </div>
      <div>
        <label for="password" class="block mb-1">Password</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          class="w-full bg-transparent p-1 border-0 border-b-[1px] md:border-b-2 border-black dark:border-white outline-none"
        />
      </div>
      <div v-if="isSignUp">
        <label for="confirmPassword" class="block mb-1">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          required
          class="w-full bg-transparent p-1 border-0 border-b-[1px] md:border-b-2 border-black dark:border-white outline-none"
        />
      </div>
      <button type="submit" class="flex w-fit px-4 py-2 mx-auto custom-card">
        {{ isSignUp ? 'Sign up' : 'Sign in' }}
      </button>
    </form>
    <p v-if="!isSignUp" class="text-center my-4">or</p>
    <div v-if="!isSignUp">
      <button
        @click="signInWithGoogle"
        class="custom-card text-gray-700 dark:text-white py-2 px-4 rounded flex items-center justify-center mb-4 mx-auto"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google logo"
          class="w-5 h-5 mr-2"
        />
        Sign in with Google
      </button>
      <button
        @click="signInWithGitHub"
        class="custom-card text-gray-700 dark:text-white py-2 px-4 rounded flex items-center justify-center mx-auto"
      >
        <img
          src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
          alt="GitHub logo"
          class="w-5 h-5 mr-2"
        />
        Sign in with GitHub
      </button>
    </div>
    <p v-if="error" class="text-red-500 mt-4 text-center">{{ error }}</p>
    <p class="text-center mt-5 text-gray-500 dark:text-gray-400 text-sm">
      {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
      <button class="hover:underline font-bold text-xs" @click="toggleForm">
        {{ isSignUp ? 'Sign in' : 'Sign up' }}
      </button>
    </p>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import Navbar from '@/components/navbar/navbar.vue';
  import { useAuthStore } from '@/store/authStore';
  import { useNotesStore } from '@/store/store';

  const authStore = useAuthStore();
  const store = useNotesStore();
  const router = useRouter();

  const email = ref('');
  const password = ref('');
  const confirmPassword = ref('');
  const isSignUp = ref(false);
  const error = ref('');

  const handleLogin = async () => {
    try {
      await authStore.login(email.value, password.value);
      router.push('/');
    } catch (err) {
      store.showToastMessage('Invalid email or password');
    }
  };

  const handleSignUp = async () => {
    if (password.value !== confirmPassword.value) {
      store.showToastMessage('Password do not match');
      return;
    }
    try {
      await authStore.signUp(email.value, password.value);
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        store.showToastMessage(err.message);
      } else {
        store.showToastMessage('Invalid email or password');
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      await authStore.signInWithGoogle();
      router.push('/');
    } catch (err) {
      store.showToastMessage('Google sign-in failed');
    }
  };

  const signInWithGitHub = async () => {
    try {
      await authStore.signInWithGitHub();
      router.push('/');
    } catch (err) {
      store.showToastMessage('GitHub sign-in failed');
    }
  };

  const toggleForm = () => {
    isSignUp.value = !isSignUp.value;
    error.value = '';
  };

  const closeForm = () => {
    router.push('/');
  };
</script>
