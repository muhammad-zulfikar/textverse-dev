<!-- navbar.vue -->

<template>
  <div>
    <div
      class="flex justify-between items-center p-4 h-[52px] bg-transparent shadow-lg hover:shadow-xl transition-all duration-300 font-serif text-sm md:text-base select-none"
    >
      <div class="relative">
        <Dropdown
          label="Menu"
          dropdownId="menu"
          contentWidth="6.4rem"
          showArrow="true"
          direction="down"
        >
          <template #label>Menu</template>
          <div class="px-[3px]">
            <router-link
              to="/"
              class="text-sm px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              Home
            </router-link>
            <router-link
              to="/about"
              class="text-sm px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              About
            </router-link>
            <router-link
              to="/settings"
              class="text-sm px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              Settings
            </router-link>
            <a
              @click="openTrash"
              class="text-sm px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              Trash
            </a>
          </div>
        </Dropdown>
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
        <Dropdown
          label="User"
          dropdownId="user"
          contentWidth="6.4rem"
          contentMarginLeft="-68px"
          direction="down"
        >
          <template #label>
            <img
              :src="avatarUrl"
              alt="User Avatar"
              class="w-8 h-8 mt-1 md:mt-2 custom-card-transparent-avatar rounded-full object-cover"
            />
          </template>
          <div class="px-[3px]">
            <a
              @click="navigateToSettings"
              class="text-sm px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              Settings
            </a>
            <a
              @click="confirmSignout"
              class="text-sm px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              Sign out
            </a>
          </div>
        </Dropdown>
      </div>
    </div>
    <div
      class="bg-black dark:bg-gray-400 h-px transition-all duration-300"
    ></div>
    <AlertModal
      :is-open="showSignoutConfirmation"
      :message="`Are you sure you want to sign out? You won't be able to sync your notes.`"
      @cancel="showSignoutConfirmation = false"
      @confirm="signout"
    />
    <TrashModal v-model:isOpen="isTrashModalOpen" />
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { authStore } from '@/store/stores';
  import Dropdown from '@/components/dropdown.vue';
  import AlertModal from '@/components/modal/alertModal.vue';
  import TrashModal from '@/components/modal/trashModal.vue';

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
    showSignoutConfirmation.value = true;
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
  });

  const navigateToSettings = () => {
    isUserDropdownOpen.value = false;
    router.push('/settings');
  };

  const isTrashModalOpen = ref(false);

  const openTrash = () => {
    isTrashModalOpen.value = true;
  };

  // const isActive = (route: string) => {
  //   return router.currentRoute.value.path === route;
  // };
</script>
