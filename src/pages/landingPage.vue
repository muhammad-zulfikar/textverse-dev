<!-- src/pages/LandingPage.vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold text-center mb-8">Welcome to Our App</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="custom-card p-6">
        <h2 class="text-2xl font-semibold mb-4">Feature 1</h2>
        <p>Description of feature 1 goes here.</p>
      </div>
      <div class="custom-card p-6">
        <h2 class="text-2xl font-semibold mb-4">Feature 2</h2>
        <p>Description of feature 2 goes here.</p>
      </div>
      <div class="custom-card p-6">
        <h2 class="text-2xl font-semibold mb-4">Feature 3</h2>
        <p>Description of feature 3 goes here.</p>
      </div>
      <div class="custom-card p-6 md:col-span-2 lg:col-span-3">
        <h2 class="text-2xl font-semibold mb-4">Get Started</h2>
        <p class="mb-4">Choose how you want to proceed:</p>
        <div class="flex justify-center space-x-4">
          <button @click="goToSignIn" class="custom-card px-4 py-2">
            Sign In / Sign Up
          </button>
          <button @click="continueAsGuest" class="custom-card px-4 py-2">
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';

  const router = useRouter();

  const goToSignIn = () => {
    router.push('/sign-in');
  };

  const continueAsGuest = () => {
    localStorage.setItem('hasVisited', 'true');
    router.push('/');
  };
</script>
