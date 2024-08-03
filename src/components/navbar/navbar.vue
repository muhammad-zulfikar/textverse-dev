<template>
  <div>
    <div
      class="flex justify-between items-center p-4 h-[52px] bg-[#f7f4e4] dark:bg-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 font-serif text-sm md:text-base select-none"
    >
      <div class="relative items-center">
        <button
          @click.stop="toggleSidebar"
          @mouseenter="handleMouseEnter"
          class="focus:outline-none navbar-logo"
        >
          <img
            src="/dark/android-chrome-512x512.png"
            class="size-12 hidden dark:block mt-1"
          />
          <img
            src="/light/android-chrome-512x512.png"
            class="size-12 dark:hidden mt-1"
          />
        </button>
      </div>
      <router-link
        v-if="!authStore.isLoggedIn"
        to="/sign-in"
        class="my-1"
      >
        <div
          class="text-sm px-3 py-[7px] custom-card cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
        >
          <Icon icon="codicon:sign-in" class="size-5 mr-2" />
          Sign in
        </div>
      </router-link>
      <div v-else class="relative">
        <Dropdown
          dropdownId="user"
          contentWidth="7rem"
          direction="down"
          position="right"
        >
          <template #label>
            <img
              :src="avatarUrl"
              alt="User Avatar"
              class="size-9 mt-[6px] md:mt-1 custom-card-transparent-avatar object-cover"
            />
          </template>
          <div class="px-[3px]">
            <a
              @click="navigateToSettings"
              class="text-sm px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              <Icon icon="codicon:settings" class="size-5 mr-2" />
              Settings
            </a>
            <a
              @click="confirmSignout"
              class="text-sm px-3 py-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              <Icon icon="codicon:sign-out" class="size-5 mr-2" />
              Sign out
            </a>
          </div>
        </Dropdown>
      </div>
    </div>
    <div
      class="bg-black dark:bg-gray-400 h-px transition-all duration-300"
    ></div>
    <LeftSidebar
      :is-open="isSidebarOpen"
      @close="closeSidebar"
      @toggle="toggleSidebar"
      @mouseleave="handleMouseLeave"
    />
    <AlertModal
      :is-open="showSignoutConfirmation"
      :message="`Are you sure you want to sign out? You won't be able to sync your notes.`"
      @cancel="showSignoutConfirmation = false"
      @confirm="signout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { authStore } from '@/store/stores';
import Dropdown from '@/components/dropdown.vue';
import AlertModal from '@/components/modal/alertModal.vue';
import LeftSidebar from '@/components/leftSidebar.vue';
import { Icon } from '@iconify/vue';

const router = useRouter();
const showSignoutConfirmation = ref(false);
const isSidebarOpen = ref(false);

const { avatarUrl } = storeToRefs(authStore);

const signout = async () => {
  await authStore.logout();
  showSignoutConfirmation.value = false;
  router.push('/');
};

const confirmSignout = () => {
  showSignoutConfirmation.value = true;
};

const navigateToSettings = () => {
  router.push('/settings');
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const openSidebar = () => {
  isSidebarOpen.value = true;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

// Function to handle mouse enter event on the logo
const handleMouseEnter = () => {
  if (window.innerWidth >= 768) {
    openSidebar();
  }
};

// Function to handle mouse leave event on the sidebar
const handleMouseLeave = () => {
  if (window.innerWidth >= 768) {
    closeSidebar();
  }
};

const handleOutsideClick = (event: MouseEvent) => {
  const sidebar = document.querySelector('.left-sidebar');
  const navbarLogo = document.querySelector('.navbar-logo');
  if (
    isSidebarOpen.value &&
    sidebar &&
    !sidebar.contains(event.target as Node) &&
    event.target !== navbarLogo &&
    !navbarLogo?.contains(event.target as Node)
  ) {
    closeSidebar();
  }
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>
