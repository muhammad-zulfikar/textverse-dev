<template>
  <div
    class="flex flex-col md:flex-row items-start md:items-center md:justify-between"
  >
    <div class="flex-grow">
      <h4 class="text-lg font-semibold mb-1">
        Sync notes:
        <span :class="authStore.isLoggedIn ? 'text-green-500' : 'text-red-500'">
          {{ authStore.isLoggedIn ? 'On' : 'Off' }}
        </span>
      </h4>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        <span v-if="!authStore.isLoggedIn">Sign in to turn on notes sync</span>
        <span v-else>
          Signed in as
          <span class="underline">{{ username }}</span>
          . Your notes are being synced across devices.
        </span>
      </p>
    </div>
    <button
      v-if="authStore.isLoggedIn"
      @click="confirmSignout"
      class="w-full md:w-auto flex justify-center text-sm md:text-base py-2 px-4 mt-4 md:mt-0"
      :class="[uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card']"
    >
      Sign out
    </button>
    <router-link
      v-else
      to="/sign-in"
      class="w-full md:w-auto flex justify-center text-sm md:text-base py-2 px-4 mt-4 md:mt-0"
      :class="[uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card']"
    >
      Sign in
    </router-link>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { authStore, uiStore } from '@/store/stores';

  const router = useRouter();
  const username = computed(() => authStore.user?.displayName || 'User');

  const confirmSignout = async () => {
    try {
      await authStore.logout();
      router.push('/');
    } catch (error) {
      uiStore.showToastMessage('Error logging out, please try again later');
    }
  };
</script>
