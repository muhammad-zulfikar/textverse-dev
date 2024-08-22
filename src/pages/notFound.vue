<template>
    <div class="px-8 md:px-0 md:max-w-md md:mx-auto mt-24 md:mt-20">
      <div
        class="font-serif custom-card px-10 py-8 md:p-8 relative flex flex-col mx-auto mt-2 md:mt-0"
      >
        <h2 class="text-2xl font-bold mb-4 flex justify-center">
          Page Not Found
        </h2>
        <p class="text-center mb-4 text-gray-700 dark:text-gray-300">
          Sorry, the page you are looking for does not exist.
        </p>
        <button
          @click="goHome"
          class="flex w-full md:w-fit items-center justify-center px-4 py-2 mt-4 mx-auto custom-card"
        >
          Go to Home
        </button>
        <p class="text-center mt-5 text-gray-500 dark:text-gray-400 text-sm">
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
    import { useRouter } from 'vue-router';
  
    const router = useRouter();
  
    const goHome = () => {
      router.push('/');
    };
  </script>