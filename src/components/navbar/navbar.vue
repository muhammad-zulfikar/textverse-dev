<!-- navbar.vue -->

<template>
  <div>
    <div
      class="flex justify-between items-center p-4 h-[52px] bg-transparent shadow-lg hover:shadow-xl transition-all duration-300 font-serif text-sm md:text-base select-none"
    >
      <div class="relative">
        <button @click="toggleNav" class="hover:underline nav-dropdown-trigger">
          Menu
        </button>
        <transition name="zoom">
          <div
            v-if="isNavOpen"
            class="absolute left-0 custom-card mt-2 w-28 z-50"
          >
            <router-link
              to="/"
              class="block px-4 py-2 text-sm cursor-pointer hover:underline"
              :class="{ underline: isActive('/') }"
              @click="toggleNav"
            >
              Home
            </router-link>
            <router-link
              to="/about"
              class="block px-4 py-2 text-sm cursor-pointer hover:underline"
              :class="{ underline: isActive('/about') }"
              @click="toggleNav"
            >
              About
            </router-link>
            <router-link
              to="/settings"
              class="block px-4 py-2 text-sm cursor-pointer hover:underline"
              :class="{ underline: isActive('/settings') }"
              @click="toggleNav"
            >
              Settings
            </router-link>
            <a
              @click="openTrash"
              class="block px-4 py-2 text-sm cursor-pointer hover:underline"
            >
              Trash
            </a>
          </div>
        </transition>
      </div>
      <div class="nav-links">
        <button v-if="deferredPrompt" @click="showInstallPrompt">
          <div v-if="loading" class="skeleton rounded-md w-20 h-6"></div>
          <div v-else>Install</div>
        </button>
      </div>
      <router-link
        v-if="!authStore.isLoggedIn"
        to="/sign-in"
        class="hover:underline"
        active-class="underline"
      >
        <div>Sign in</div>
      </router-link>
      <div v-else class="relative">
        <button
          @click="toggleUserDropdown"
          class="flex items-center hover:underline nav-dropdown-trigger"
        >
          <img
            :src="avatarUrl"
            alt="User Avatar"
            class="w-8 h-8 custom-card-transparent-avatar rounded-full object-cover"
          />
        </button>
        <transition name="zoom">
          <div
            v-if="isUserDropdownOpen"
            class="absolute right-0 custom-card mt-2 w-28 z-50"
          >
            <a
              @click="navigateToSettings"
              class="block px-4 py-2 text-sm cursor-pointer hover:underline"
            >
              Settings
            </a>
            <a
              @click="confirmSignout"
              class="block px-4 py-2 text-sm cursor-pointer hover:underline"
            >
              Sign out
            </a>
          </div>
        </transition>
      </div>
    </div>
    <div class="bg-black dark:bg-white h-px transition-all duration-300"></div>
    <div
      v-if="showSignoutConfirmation || isTrashModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
    ></div>
    <AlertModal
      :is-open="showSignoutConfirmation"
      :message="`Are you sure you want to sign out? You won't be able to sync your notes.`"
      @cancel="showSignoutConfirmation = false"
      @confirm="signout"
    />
    <TrashModal :is-open="isTrashModalOpen" @close="closeTrashModal" />
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/store/authStore';
  import AlertModal from '@/components/modal/alertModal.vue';
  import TrashModal from '@/components/modal/trashModal.vue';

  const authStore = useAuthStore();
  const isNavOpen = ref(false);
  const isUserDropdownOpen = ref(false);
  const router = useRouter();
  const loading = ref(true);
  const showSignoutConfirmation = ref(false);

  const signout = async () => {
      await authStore.logout();
      showSignoutConfirmation.value = false;
      router.push('/');
  };

  const confirmSignout = () => {
    isNavOpen.value = false;
    isUserDropdownOpen.value = false;
    showSignoutConfirmation.value = true;
  };

  const toggleNav = () => {
    isUserDropdownOpen.value = false;
    isNavOpen.value = !isNavOpen.value;
  };

  const toggleUserDropdown = () => {
    isNavOpen.value = false;
    isUserDropdownOpen.value = !isUserDropdownOpen.value;
  };

  interface DeferredPromptEvent extends Event {
    prompt: () => void;
    userChoice: Promise<{ outcome: string }>;
  }

  const deferredPrompt = ref<DeferredPromptEvent | null>(null);

  const showInstallPrompt = () => {
    if (deferredPrompt.value) {
      deferredPrompt.value.prompt();
      deferredPrompt.value.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt.value = null;
      });
    }
  };

  const { avatarUrl } = storeToRefs(authStore);

  onMounted(() => {
    setTimeout(() => {
      loading.value = false;
    }, 500);

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredPrompt.value = e as DeferredPromptEvent;
    });
    document.addEventListener('click', handleClickOutside);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-dropdown-trigger')) {
      isNavOpen.value = false;
      isUserDropdownOpen.value = false;
    }
  };

  const navigateToSettings = () => {
    isUserDropdownOpen.value = false;
    router.push('/settings');
  };

  const isTrashModalOpen = ref(false);

  const openTrash = () => {
    isNavOpen.value = false;
    isTrashModalOpen.value = true;
  };

  const closeTrashModal = () => {
    isTrashModalOpen.value = false;
  };

  const isActive = (route: string) => {
    return router.currentRoute.value.path === route;
  };
</script>
