<!-- settings.vue -->

<template>
  <div>
    <div
      class="max-w-xl md:max-w-2xl p-8 m-8 flex flex-col mx-auto gap-8 overflow-y-auto font-serif"
    >
      <div class="flex-grow flex flex-col gap-8">
        <div class="p-4 custom-card">
          <h2 class="text-2xl font-semibold mb-4">Sync your notes</h2>
          <div class="flex flex-col gap-4">
            <div
              class="flex flex-col md:flex-row items-start md:items-center md:justify-between"
            >
              <div class="flex-grow">
                <h4 class="text-lg font-semibold mb-1">
                  Sync notes:
                  <span
                    :class="
                      authStore.isLoggedIn ? 'text-green-500' : 'text-red-500'
                    "
                  >
                    {{ authStore.isLoggedIn ? 'On' : 'Off' }}
                  </span>
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  <span v-if="!authStore.isLoggedIn">
                    Sign in to turn on notes sync
                  </span>
                  <span v-else>
                    Signed in as
                    <span class="underline">{{ username }}.</span>
                    Your notes are being synced across devices.
                  </span>
                </p>
              </div>
              <button
                v-if="authStore.isLoggedIn"
                @click="confirmSignout"
                class="w-full md:w-auto flex justify-center text-sm md:text-base py-2 px-4 mt-4 md:mt-0"
                :class="[
                  uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                ]"
              >
                Sign out
              </button>
              <router-link
                v-if="!authStore.isLoggedIn"
                to="/sign-in"
                class="w-full md:w-auto flex justify-center text-sm md:text-base py-2 px-4 mt-4 md:mt-0"
                :class="[
                  uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                ]"
              >
                Sign in
              </router-link>
            </div>
            <div
              class="flex flex-col md:flex-row items-start md:items-center md:justify-between"
            >
              <div class="flex-grow">
                <h4 class="text-lg font-semibold mb-1">
                  Import locally stored notes
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Import any local notes that don't already exist in your
                  account.
                </p>
              </div>
              <button
                @click="importNotes"
                class="w-full md:w-auto text-sm md:text-base py-2 px-4 mt-4 md:mt-0"
                :class="[
                  uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                ]"
              >
                Import notes
              </button>
            </div>
          </div>
        </div>

        <div class="p-4 custom-card">
          <h2 class="text-2xl font-semibold mb-4">Appearance</h2>
          <div class="flex flex-col gap-4">
            <div
              class="flex items-center justify-between relative md:mb-2"
              ref="dropdownRef"
            >
              <div class="mr-6">
                <label for="theme" class="text-lg font-semibold mb-1">
                  Theme
                </label>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Choose how textVerse looks to you.
                </p>
              </div>
              <button
                @click.stop="toggleDropdown"
                :class="[
                  'mt-2 md:mt-0 text-sm md:text-base px-4 py-2 flex items-center relative',
                  { 'z-50': dropdownOpen },
                  uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                ]"
              >
                {{ darkModeText }}
                <span class="ml-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      v-if="dropdownOpen"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 15l7-7 7 7"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </button>
              <Transition name="zoom">
                <div
                  v-if="dropdownOpen"
                  class="mt-[-5px] md:mt-1 z-50 origin-top-right absolute w-[5.8rem] md:w-30 top-full right-0"
                  :class="[
                    uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                  ]"
                >
                  <div class="py-1" role="menu" aria-orientation="vertical">
                    <a
                      @click.stop="setTheme('system')"
                      class="block px-4 py-2 text-sm md:text-base cursor-pointer hover:underline"
                      role="menuitem"
                    >
                      System
                    </a>
                    <a
                      @click.stop="setTheme('dark')"
                      class="block px-4 py-2 text-sm md:text-base cursor-pointer hover:underline"
                      role="menuitem"
                    >
                      Dark
                    </a>
                    <a
                      @click.stop="setTheme('light')"
                      class="block px-4 py-2 text-sm md:text-base cursor-pointer hover:underline"
                      role="menuitem"
                    >
                      Light
                    </a>
                  </div>
                </div>
              </Transition>
            </div>

            <div
              class="flex items-center justify-between relative"
              ref="viewTypeDropdownRef"
            >
              <div class="mr-6">
                <label for="viewType" class="text-lg font-semibold mb-1">
                  View Type
                </label>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Choose how your notes are displayed.
                </p>
              </div>
              <button
                @click.stop="toggleViewTypeDropdown"
                :class="[
                  'mt-2 md:mt-0 text-sm md:text-base px-4 py-2 flex items-center relative whitespace-nowrap',
                  { 'z-60': viewTypeDropdownOpen },
                  uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                ]"
              >
                {{ viewTypeText }}
                <span class="ml-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      v-if="viewTypeDropdownOpen"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 15l7-7 7 7"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </button>
              <Transition name="zoom">
                <div
                  v-if="viewTypeDropdownOpen"
                  class="mt-[-5px] md:mt-1 z-50 origin-top-right absolute w-[6.4rem] md:w-30 top-full right-0"
                  :class="[
                    uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                  ]"
                >
                  <div class="py-1" role="menu" aria-orientation="vertical">
                    <a
                      @click.stop="setViewType('card')"
                      class="block px-4 py-2 text-sm cursor-pointer hover:underline"
                      role="menuitem"
                    >
                      Card
                    </a>
                    <a
                      @click.stop="setViewType('table')"
                      class="block px-4 py-2 text-sm cursor-pointer hover:underline"
                      role="menuitem"
                    >
                      Table
                    </a>
                    <a
                      @click.stop="setViewType('mail')"
                      class="block px-4 py-2 text-sm cursor-pointer hover:underline"
                      role="menuitem"
                    >
                      Mail
                    </a>
                    <a
                      @click.stop="setViewType('folder')"
                      class="block px-4 py-2 text-sm cursor-pointer hover:underline"
                      role="menuitem"
                    >
                      Folder
                    </a>
                  </div>
                </div>
              </Transition>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label for="blur" class="text-lg font-semibold mb-1">
                  Blur Effect
                </label>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Enable blur effect for cards
                </p>
              </div>
              <div class="mt-2 md:mt-0 flex items-center">
                <input
                  type="checkbox"
                  id="blur"
                  v-model="uiStore.blurEnabled"
                  @click="toggleBlur"
                  class="hidden"
                />
                <label
                  for="blur"
                  :class="{
                    'bg-cream dark:bg-gray-700': !uiStore.blurEnabled,
                    'bg-[#ebdfc0] dark:bg-gray-800': uiStore.blurEnabled,
                  }"
                  class="relative inline-block custom-card-switch w-16 h-9 cursor-pointer transition-colors duration-300"
                >
                  <span
                    :class="{
                      'translate-x-0': !uiStore.blurEnabled,
                      'translate-x-[30px]': uiStore.blurEnabled,
                    }"
                    class="absolute left-0 top-0 bottom-0 w-8 h-[34px] custom-card shadow-md transform transition-transform duration-300"
                  ></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 custom-card">
          <h2 class="text-2xl font-semibold mb-4">Manage your data</h2>
          <div class="flex flex-col gap-4">
            <div
              class="flex flex-col md:flex-row items-start md:items-center md:justify-between mb-1"
            >
              <div class="flex-grow">
                <h4 class="text-lg font-semibold mb-1">Backup your data</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Download a JSON file of your data.
                </p>
              </div>
              <button
                @click="downloadBackup"
                class="w-full md:w-auto text-sm md:text-base py-2 px-4 mt-4 md:mt-0"
                :class="[
                  uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                ]"
              >
                Download a backup
              </button>
            </div>
            <div
              class="flex flex-col md:flex-row items-start md:items-center md:justify-between"
            >
              <div class="flex-grow">
                <h4 class="text-lg font-semibold mb-1">Delete your data</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
              <button
                @click="confirmDeleteAllNotes"
                class="w-full md:w-auto text-sm md:text-base text-red-600 dark:text-red-500 py-2 px-4 mt-4 md:mt-0"
                :class="[
                  uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                ]"
              >
                Delete all data
              </button>
            </div>
          </div>
        </div>

        <div v-if="authStore.isLoggedIn" class="p-4 custom-card">
          <h2 class="text-2xl font-semibold mb-4">User Settings</h2>
          <div class="flex flex-col items-center">
            <img
              :src="userAvatar"
              alt="User Avatar"
              class="w-24 h-24 rounded-full mb-4 custom-card-transparent-avatar object-cover cursor-pointer"
              @click="openAvatarViewer"
            />
            <h3 class="text-xl font-semibold">{{ username }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Joined: {{ joinedSince }}
            </p>
            <div
              class="flex flex-col gap-4 mt-6 w-full sm:flex-row sm:justify-center sm:gap-4"
            >
              <button
                @click="openAvatarPicker"
                class="py-2 px-4 text-sm md:text-base w-full sm:w-auto"
                :class="[
                  uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                ]"
              >
                Change Avatar
              </button>
              <button
                @click="openNameEditor"
                class="py-2 px-4 text-sm md:text-base w-full sm:w-auto"
                :class="[
                  uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                ]"
              >
                Rename
              </button>
              <button
                @click="confirmDeleteAccount"
                class="text-red-600 dark:text-red-500 py-2 px-4 text-sm md:text-base w-full sm:w-auto"
                :class="[
                  uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card',
                ]"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="
        showDeleteAccountConfirmation ||
        showDeleteAllNotesConfirmation ||
        showSignoutConfirmation ||
        showAvatarPicker ||
        showAvatarViewer ||
        showNameEditor
      "
      class="fixed inset-0 bg-black bg-opacity-40 z-40"
      :class="{ 'backdrop-blur-[2px]': uiStore.blurEnabled }"
    ></div>

    <AlertModal
      :is-open="showDeleteAccountConfirmation"
      :message="'Are you sure you want to delete your account? This action cannot be undone.'"
      @cancel="showDeleteAccountConfirmation = false"
      @confirm="deleteAccount"
    />

    <AlertModal
      :is-open="showDeleteAllNotesConfirmation"
      :message="'Are you sure you want to delete all of your data? This action cannot be undone.'"
      @cancel="showDeleteAllNotesConfirmation = false"
      @confirm="deleteAllNotes"
    />

    <AlertModal
      :is-open="showSignoutConfirmation"
      :message="'Are you sure you want to sign out? You will be logged out of your account.'"
      @cancel="showSignoutConfirmation = false"
      @confirm="signout"
    />

    <AvatarModal
      :is-open="showAvatarPicker"
      :initial-avatar-url="userAvatar"
      @select="updateAvatar"
      @remove="removeAvatar"
      @close="showAvatarPicker = false"
    />

    <AvatarViewModal
      :is-open="showAvatarViewer"
      :avatar-url="userAvatar"
      @close="showAvatarViewer = false"
    />

    <InputModal
      :is-open="showNameEditor"
      mode="username"
      :current-value="username"
      @update="updateName"
      @close="showNameEditor = false"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { authStore, notesStore, uiStore } from '@/store/stores';
  import AlertModal from '@/components/modal/alertModal.vue';
  import AvatarModal from '@/components/modal/avatarModal.vue';
  import AvatarViewModal from '@/components/modal/avatarViewModal.vue';
  import InputModal from '@/components/modal/inputModal.vue';
  import router from '@/router';

  const dropdownOpen = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);
  const darkModeText = ref('System');
  const isMobile = ref(window.innerWidth < 640);

  const showDeleteAccountConfirmation = ref(false);
  const showDeleteAllNotesConfirmation = ref(false);
  const showSignoutConfirmation = ref(false);
  const showAvatarPicker = ref(false);
  const showNameEditor = ref(false);
  const showAvatarViewer = ref(false);
  const userAvatar = computed(() => authStore.avatarUrl);
  const username = computed(() => authStore.user?.displayName || 'User');
  const joinedSince = computed(() => {
    const joinedDate = authStore.user?.metadata?.creationTime;
    return joinedDate ? new Date(joinedDate).toLocaleDateString() : 'Unknown';
  });

  const confirmDeleteAccount = () => {
    showDeleteAccountConfirmation.value = true;
  };

  const deleteAccount = async () => {
    try {
      await authStore.deleteAccount();
      showDeleteAccountConfirmation.value = false;
      router.push('/');
      uiStore.showToastMessage('Account succesfully deleted');
    } catch (error) {
      uiStore.showToastMessage('Failed to delete account');
    }
  };

  const openAvatarPicker = () => {
    showAvatarPicker.value = true;
  };

  const openAvatarViewer = () => {
    showAvatarViewer.value = true;
  };

  const updateAvatar = async (newAvatarUrl: string) => {
    try {
      await authStore.updateAvatar(newAvatarUrl);
      showAvatarPicker.value = false;
      uiStore.showToastMessage('Avatar successfully updated');
    } catch (error) {
      uiStore.showToastMessage('Failed to update avatar. Please try again.');
    }
  };

  const removeAvatar = async () => {
    try {
      await authStore.updateAvatar('/avatar.png');
      showAvatarPicker.value = false;
      uiStore.showToastMessage('Avatar removed successfully');
    } catch (error) {
      uiStore.showToastMessage('Failed to remove avatar. Please try again.');
    }
  };

  const openNameEditor = () => {
    showNameEditor.value = true;
  };

  const updateName = async (newName: string) => {
    try {
      await authStore.updateName(newName);
      showNameEditor.value = false;
      uiStore.showToastMessage('Username successfully updated');
    } catch (error) {
      uiStore.showToastMessage('Failed to update username');
    }
  };

  const signout = async () => {
    try {
      await authStore.logout();
      showSignoutConfirmation.value = false;
      router.push('/');
    } catch (error) {
      uiStore.showToastMessage('Error logging out, please try again later');
    }
  };

  const confirmSignout = () => {
    showSignoutConfirmation.value = true;
  };

  const toggleDropdown = () => {
    closeViewTypeDropdown();
    dropdownOpen.value = !dropdownOpen.value;
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    uiStore.setTheme(theme);
    darkModeText.value = theme.charAt(0).toUpperCase() + theme.slice(1);
    closeDropdown();
  };

  const toggleBlur = () => {
    uiStore.setBlurEnabled(!uiStore.blurEnabled);
  };

  const closeDropdown = () => {
    dropdownOpen.value = false;
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      closeDropdown();
    }
  };

  const getCurrentTheme = () => {
    darkModeText.value =
      uiStore.currentTheme.charAt(0).toUpperCase() +
      uiStore.currentTheme.slice(1);
  };

  const viewTypeDropdownOpen = ref(false);
  const viewTypeDropdownRef = ref<HTMLElement | null>(null);
  const viewTypeText = ref(
    uiStore.viewType.charAt(0).toUpperCase() + uiStore.viewType.slice(1)
  );

  const toggleViewTypeDropdown = () => {
    viewTypeDropdownOpen.value = !viewTypeDropdownOpen.value;
  };

  const setViewType = (viewType: 'card' | 'table' | 'mail' | 'folder') => {
    uiStore.setViewType(viewType);
    viewTypeText.value = viewType.charAt(0).toUpperCase() + viewType.slice(1);
    closeViewTypeDropdown();
    uiStore.showToastMessage('View type updated');
  };

  const closeViewTypeDropdown = () => {
    viewTypeDropdownOpen.value = false;
  };

  const handleClickOutsideViewType = (event: MouseEvent) => {
    if (
      viewTypeDropdownRef.value &&
      !viewTypeDropdownRef.value.contains(event.target as Node)
    ) {
      closeViewTypeDropdown();
    }
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutsideViewType);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutsideViewType);
  });

  const handleResize = () => {
    isMobile.value = window.innerWidth < 640;
  };

  onMounted(() => {
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  const importNotes = () => {
    notesStore.importNotes();
  };

  const downloadBackup = () => {
    notesStore.downloadBackup();
  };

  const confirmDeleteAllNotes = () => {
    showDeleteAllNotesConfirmation.value = true;
  };

  const deleteAllNotes = () => {
    notesStore.deleteAllNotes();
    showDeleteAllNotesConfirmation.value = false;
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    getCurrentTheme();
  });

  onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>
