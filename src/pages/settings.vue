<!-- settings.vue -->

<template>
  <Navbar />
  <div
    class="md:custom-card max-w-xl md:max-w-2xl p-8 m-8 flex flex-col mx-auto gap-8 overflow-y-auto font-serif"
  >
    <div class="flex-grow flex flex-col gap-8">
      <div class="custom-card p-4">
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
                  <span class="underline">{{ username }}</span>
                  . Your notes are being synced across devices
                </span>
                .
              </p>
            </div>
            <button
              v-if="authStore.isLoggedIn"
              @click="confirmSignout"
              class="w-full md:w-auto text-sm md:text-base custom-card py-2 px-4 mt-4 md:mt-0"
            >
              Sign out
            </button>
          </div>
          <div
            v-if="!authStore.isLoggedIn"
            class="flex gap-2 text-sm md:text-base justify-center w-full mb-3"
          >
            <button
              @click="signInWithGoogle"
              class="custom-card py-2 px-4 rounded flex items-center justify-center w-1/2"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
                class="w-5 h-5 mr-2"
              />
              <span class="hidden md:inline">Sign in with&nbsp;</span>
              Google
            </button>
            <button
              @click="signInWithGitHub"
              class="custom-card py-2 px-4 rounded flex items-center justify-center w-1/2"
            >
              <img
                src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                alt="GitHub logo"
                class="w-5 h-5 mr-2"
              />
              <span class="hidden md:inline">Sign in with&nbsp;</span>
              GitHub
            </button>
          </div>
          <div
            class="flex flex-col md:flex-row items-start md:items-center md:justify-between"
          >
            <div class="flex-grow">
              <h4 class="text-lg font-semibold mb-1">
                Import locally stored notes
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Import any local notes that don't already exist in your account.
              </p>
            </div>
            <button
              @click="importNotes"
              class="w-full md:w-auto text-sm md:text-base custom-card py-2 px-4 mt-4 md:mt-0"
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
              :class="{ 'z-50': dropdownOpen }"
              class="mt-2 md:mt-0 text-sm md:text-base custom-card px-4 py-2 flex items-center relative"
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
            <div
              v-if="dropdownOpen"
              class="mt-[-5px] md:mt-1 custom-card z-50 origin-top-right absolute w-[5.8rem] md:w-30 top-full right-0"
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
          </div>

          <div
            class="flex items-center justify-between relative"
            ref="columnsDropdownRef"
          >
            <div class="mr-6">
              <label for="columns" class="text-lg font-semibold mb-1">
                Columns
              </label>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Choose how your notes viewed.
              </p>
            </div>
            <button
              @click.stop="toggleColumnsDropdown"
              :class="{ 'z-50': columnsDropdownOpen }"
              class="mt-2 md:mt-0 text-sm md:text-base custom-card px-4 py-2 flex items-center relative whitespace-nowrap"
            >
              {{ columnsText }}
              <span class="ml-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    v-if="columnsDropdownOpen"
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
            <div
              v-if="columnsDropdownOpen"
              class="mt-[-5px] md:mt-1 custom-card z-50 origin-top-right absolute w-[6.4rem] md:w-30 top-full right-0"
            >
              <div class="py-1" role="menu" aria-orientation="vertical">
                <a
                  @click.stop="setColumns(1)"
                  class="block px-4 py-2 text-sm cursor-pointer hover:underline"
                  role="menuitem"
                >
                  1 Column
                </a>
                <a
                  @click.stop="setColumns(2)"
                  class="block px-4 py-2 text-sm cursor-pointer hover:underline"
                  role="menuitem"
                >
                  2 Columns
                </a>
                <template v-if="!isMobile">
                  <a
                    @click.stop="setColumns(3)"
                    class="block px-4 py-2 text-sm cursor-pointer hover:underline"
                    role="menuitem"
                  >
                    3 Columns
                  </a>
                  <a
                    @click.stop="setColumns(4)"
                    class="block px-4 py-2 text-sm cursor-pointer hover:underline"
                    role="menuitem"
                  >
                    4 Columns
                  </a>
                  <a
                    @click.stop="setColumns(5)"
                    class="block px-4 py-2 text-sm cursor-pointer hover:underline"
                    role="menuitem"
                  >
                    5 Columns
                  </a>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="custom-card p-4">
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
              class="w-full md:w-auto text-sm md:text-base custom-card py-2 px-4 mt-4 md:mt-0"
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
              class="w-full md:w-auto text-sm md:text-base text-red-600 dark:text-red-500 custom-card py-2 px-4 mt-4 md:mt-0"
            >
              Delete all notes
            </button>
          </div>
        </div>
      </div>

      <div v-if="authStore.isLoggedIn" class="custom-card p-4">
        <h2 class="text-2xl font-semibold mb-4">User Settings</h2>
        <div class="flex flex-col items-center">
          <img
            :src="userAvatar"
            alt="User Avatar"
            class="w-24 h-24 rounded-full mb-4 custom-card-transparent-avatar"
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
              class="custom-card py-2 px-4 text-sm md:text-base w-full sm:w-auto"
            >
              Change Avatar
            </button>
            <button
              @click="openNameEditor"
              class="custom-card py-2 px-4 text-sm md:text-base w-full sm:w-auto"
            >
              Rename
            </button>
            <button
              @click="confirmDeleteAccount"
              class="custom-card text-red-600 dark:text-red-500 py-2 px-4 text-sm md:text-base w-full sm:w-auto"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <AlertModal
    :is-open="showDeleteAccountConfirmation"
    :message="'Are you sure you want to delete your account? This action cannot be undone.'"
    @cancel="showDeleteAccountConfirmation = false"
    @confirm="deleteAccount"
  />

  <AlertModal
    :is-open="showDeleteAllNotesConfirmation"
    :message="'Are you sure you want to delete all notes? This action cannot be undone.'"
    @cancel="showDeleteAllNotesConfirmation = false"
    @confirm="deleteAllNotes"
  />

  <AlertModal
    :is-open="showSignoutConfirmation"
    :message="'Are you sure you want to sign out? You will be logged out of your account.'"
    @cancel="showSignoutConfirmation = false"
    @confirm="signout"
  />

  <AvatarPickerModal
    :is-open="showAvatarPicker"
    :initial-avatar-url="userAvatar"
    @select="updateAvatar"
    @close="showAvatarPicker = false"
  />

  <NameEditorModal
    :is-open="showNameEditor"
    :name="username"
    @update="updateName"
    @close="showNameEditor = false"
  />
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import Navbar from '@/components/navbar/navbar.vue';
  import { useNotesStore } from '@/store/store';
  import { useAuthStore } from '@/store/authStore';
  import AlertModal from '@/components/modal/alertModal.vue';
  import AvatarPickerModal from '@/components/modal/avatarPickerModal.vue';
  import NameEditorModal from '@/components/modal/nameEditorModal.vue';
  import router from '@/router';

  const authStore = useAuthStore();
  const store = useNotesStore();

  const dropdownOpen = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);
  const darkModeText = ref('System');
  const columnsDropdownOpen = ref(false);
  const columnsDropdownRef = ref<HTMLElement | null>(null);
  const isMobile = ref(window.innerWidth < 640);
  const columnsText = ref('Columns');

  const showDeleteAccountConfirmation = ref(false);
  const showDeleteAllNotesConfirmation = ref(false);
  const showSignoutConfirmation = ref(false);
  const showAvatarPicker = ref(false);
  const showNameEditor = ref(false);

  const userAvatar = computed(() => authStore.user?.photoURL || '');
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
      store.showToastMessage('Account succesfully deleted');
    } catch (error) {
      store.showToastMessage('Failed to delete account');
    }
  };

  const openAvatarPicker = () => {
    showAvatarPicker.value = true;
  };

  const updateAvatar = async (newAvatarUrl: string) => {
    try {
      await authStore.updateAvatar(newAvatarUrl);
      showAvatarPicker.value = false;
      store.showToastMessage('Avatar successfully updated');
    } catch (error) {
      store.showToastMessage('Failed to update avatar. Please try again.');
    }
  };

  const openNameEditor = () => {
    showNameEditor.value = true;
  };

  const updateName = async (newName: string) => {
    try {
      await authStore.updateName(newName);
      showNameEditor.value = false;
      store.showToastMessage('Username successfully updated');
    } catch (error) {
      store.showToastMessage('Failed to update username');
    }
  };

  const signInWithGoogle = () => authStore.signInWithGoogle();
  const signInWithGitHub = () => authStore.signInWithGitHub();

  const signout = async () => {
    try {
      await authStore.logout();
      showSignoutConfirmation.value = false;
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const confirmSignout = () => {
    showSignoutConfirmation.value = true;
  }

  const toggleDropdown = () => {
    dropdownOpen.value = !dropdownOpen.value;
  };

  const setTheme = (theme: string) => {
    store.setTheme(theme);
    darkModeText.value = theme.charAt(0).toUpperCase() + theme.slice(1);
    closeDropdown();
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
      store.currentTheme.charAt(0).toUpperCase() + store.currentTheme.slice(1);
  };

  const toggleColumnsDropdown = () => {
    columnsDropdownOpen.value = !columnsDropdownOpen.value;
  };

  const closeColumnsDropdown = () => {
    columnsDropdownOpen.value = false;
  };

  const setColumns = (columns: number) => {
    store.setColumns(columns);
    columnsText.value = `${columns} Column${columns > 1 ? 's' : ''}`;
    closeColumnsDropdown();
    store.showToastMessage('Columns view updated');
  };

  const handleClickOutsideColumns = (event: MouseEvent) => {
    if (
      columnsDropdownRef.value &&
      !columnsDropdownRef.value.contains(event.target as Node)
    ) {
      closeColumnsDropdown();
    }
  };

  const handleResize = () => {
    isMobile.value = window.innerWidth < 640;
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutsideColumns);
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutsideColumns);
    window.removeEventListener('resize', handleResize);
  });

  const importNotes = () => {
    store.importNotes();
  };

  const downloadBackup = () => {
    store.downloadBackup();
  };

  const confirmDeleteAllNotes = () => {
    showDeleteAllNotesConfirmation.value = true;
  };

  const deleteAllNotes = () => {
    store.deleteAllNotes();
    showDeleteAllNotesConfirmation.value = false;
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    getCurrentTheme();
  });

  onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>
