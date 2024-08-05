<template>
  <transition name="slide-left">
    <div
      v-if="isOpen"
      class="fixed inset-y-0 left-0 z-50 w-64 shadow-lg overflow-y-auto left-sidebar rounded-lg font-serif text-sm"
      :class="{
        'custom-card-blur': uiStore.blurEnabled,
        'custom-card': !uiStore.blurEnabled,
      }"
      @mouseleave="handleMouseLeave"
    >
      <div
        class="flex justify-between items-center px-4 py-[1.7px] bg-[#f7f4e4] dark:bg-gray-700"
      >
        <img
          src="/dark/android-chrome-512x512.png"
          class="size-12 -ml-2 hidden dark:block cursor-pointer"
          @click="toggleSidebar"
        />
        <img
          src="/light/android-chrome-512x512.png"
          class="size-12 -ml-2 dark:hidden cursor-pointer"
          @click="toggleSidebar"
        />
        <button @click.stop="togglePin" class="outline-none">
          <component
            :is="isPinned ? PhPushPinSlash : PhPushPin"
            class="size-5"
          />
        </button>
      </div>

      <div
        class="bg-black dark:bg-gray-400 h-[0.9px] transition-all duration-300"
      ></div>

      <div class="p-2">
        <h2 class="font-bold mb-2 px-2 mt-2">Menu</h2>
        <router-link
          v-for="(item, index) in menuItems"
          :key="index"
          :to="item.path"
          class="flex p-2 items-center hover:bg-[#ebdfc0] dark:hover:bg-gray-700 rounded transition-colors duration-200"
          @click="handleMenuItemClick(item)"
        >
          <component :is="item.icon" class="size-5 mr-2 inline-block" />
          {{ item.label }}
        </router-link>
        <button
          v-if="deferredPrompt"
          @click="showInstallPrompt"
          class="flex w-full text-left p-2 hover:bg-[#ebdfc0] dark:hover:bg-gray-700 rounded transition-colors duration-200"
        >
          <PhDownload class="size-5 mr-2" />
          Install
        </button>
        <router-link
          v-if="!authStore.isLoggedIn"
          to="/sign-in"
          class="my-1"
          @click="handleSignInClick"
        >
          <div
            class="text-sm p-2 cursor-pointer w-full text-left rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
          >
            <PhSignIn class="size-5 mr-2" />
            Sign in
          </div>
        </router-link>
      </div>

      <div class="p-2">
        <h2 class="font-bold mb-2 px-2">Create</h2>
        <button
          @click.stop="openNoteForm"
          class="w-full text-left p-2 rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
        >
          <PhFile class="size-5 mr-2" />
          Note
        </button>
        <button
          @click.stop="openFolderForm"
          class="w-full text-left p-2 rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
        >
          <PhFolder class="size-5 mr-2" />
          Folder
        </button>
      </div>

      <div class="p-2">
        <h2 class="font-bold mb-2 px-2">Recent Notes</h2>
        <div
          v-for="note in recentNotes"
          :key="note.id"
          @click="openNote(note.id)"
          class="flex items-center p-2 hover:bg-[#ebdfc0] dark:hover:bg-gray-700 rounded cursor-pointer transition-colors duration-200"
        >
          <PhFile class="size-5 mr-2" />
          {{ note.title }}
        </div>
      </div>

      <div v-if="authStore.isLoggedIn" class="p-2 absolute bottom-0 w-full">
        <button
          @click="toggleUserDropup"
          class="w-full py-2 px-4 flex justify-between items-center custom-card transition-colors duration-200"
        >
          <div class="flex items-center">
            <img
              :src="authStore.avatarUrl"
              alt="User Avatar"
              class="size-8 rounded-full mr-2"
            />
            <span>{{ authStore.user?.displayName }}</span>
          </div>
          <div
            class="p-1 rounded-full hover:bg-[#d9c698] dark:hover:bg-gray-600 transition-transform duration-200"
            :class="{ 'rotate-180': isUserDropupOpen }"
          >
            <PhCaretUp class="size-4" />
          </div>
        </button>

        <transition name="fade">
          <div
            v-if="isUserDropupOpen"
            class="dropup custom-card mt-2 p-2 mx-2 rounded shadow-lg z-60"
          >
            <p
              class="text-sm text-center text-gray-600 dark:text-gray-400 mb-2"
            >
              {{ authStore.user?.email }}
            </p>
            <div class="border-t border-gray-500 dark:border-gray-600 pt-2">
              <button
                @click="navigateToSettings"
                class="flex w-full text-left p-2 hover:bg-[#ebdfc0] dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <PhGear class="size-5 mr-2" />
                Settings
              </button>
              <button
                @click="confirmSignout"
                class="flex w-full text-left p-2 hover:bg-[#ebdfc0] dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <PhSignOut class="size-5 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </transition>
  <AlertModal
    :is-open="showSignoutConfirmation"
    :message="`Are you sure you want to sign out? You won't be able to sync your notes.`"
    @cancel="showSignoutConfirmation = false"
    @confirm="signout"
  />
  <TrashModal v-model:isOpen="isTrashModalOpen" />
  <InputModal
    :is-open="isFolderFormOpen"
    mode="folder"
    :max-length="10"
    @update="handleFolderSubmit"
    @close="closeFolderForm"
  />
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { authStore, notesStore, uiStore, folderStore } from '@/store/stores';
  import {
    PhPushPin,
    PhPushPinSlash,
    PhHouse,
    PhInfo,
    PhGear,
    PhTrash,
    PhSignIn,
    PhSignOut,
    PhDownload,
    PhFile,
    PhFolder,
    PhCaretUp,
  } from '@phosphor-icons/vue';
  import AlertModal from '@/components/modal/alertModal.vue';
  import TrashModal from '@/components/modal/trashModal.vue';
  import InputModal from '@/components/modal/inputModal.vue';

  const props = defineProps<{
    isOpen: boolean;
  }>();

  const emit = defineEmits(['close', 'toggle', 'mouseleave']);

  const router = useRouter();
  const isPinned = ref(false);
  const isUserDropupOpen = ref(false);
  const showSignoutConfirmation = ref(false);
  const isTrashModalOpen = ref(false);

  const openTrash = () => {
    isTrashModalOpen.value = true;
    if (!isPinned.value) {
      emit('close');
    }
  };

  const menuItems = [
    { label: 'Home', path: '/', icon: PhHouse },
    { label: 'About', path: '/about', icon: PhInfo },
    { label: 'Settings', path: '/settings', icon: PhGear },
    { label: 'Trash', path: '#', icon: PhTrash, action: openTrash },
  ];

  const recentNotes = computed(() => {
    return notesStore.notes
      .filter((note) => !note.pinned)
      .sort((a, b) => {
        const dateA = new Date(a.last_edited || a.time_created).getTime();
        const dateB = new Date(b.last_edited || b.time_created).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  });

  const handleSignInClick = () => {
    if (!isPinned.value) {
      emit('close');
    }
  };

  const signout = async () => {
    await authStore.logout();
    showSignoutConfirmation.value = false;
    router.push('/');
  };

  const togglePin = () => {
    isPinned.value = !isPinned.value;
  };

  const toggleSidebar = () => {
    emit('toggle');
  };

  const toggleUserDropup = () => {
    isUserDropupOpen.value = !isUserDropupOpen.value;
  };

  const openNote = (noteId: number) => {
    router.push('/');
    uiStore.openNote(noteId);
    if (!isPinned.value) {
      emit('close');
    }
  };

  const navigateToSettings = () => {
    router.push('/settings');
    if (!isPinned.value) {
      emit('close');
    }
  };

  const confirmSignout = () => {
    if (!isPinned.value) {
      emit('close');
    }
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

  const handleMenuItemClick = (item: any) => {
    if (item.action) {
      item.action();
    } else if (!isPinned.value) {
      emit('close');
    }
  };

  const isFolderFormOpen = ref(false);

  const openNoteForm = () => {
    router.push('/');
    if (!isPinned.value) {
      emit('close');
    }
    uiStore.openNote(null);
  };

  const openFolderForm = () => {
    router.push('/');
    if (!isPinned.value) {
      emit('close');
    }
    isFolderFormOpen.value = true;
  };

  const closeFolderForm = () => {
    if (!isPinned.value) {
      emit('close');
    }
    isFolderFormOpen.value = false;
  };

  const handleFolderSubmit = (folderName: string) => {
    folderStore.addFolder(folderName);
    closeFolderForm();
  };

  const handleMouseLeave = () => {
    if (!isPinned.value) {
      emit('close');
    }
  };

  watch(
    () => props.isOpen,
    (newValue) => {
      if (!newValue && !isPinned.value) {
        emit('close');
      }
    }
  );
</script>

<style scoped>
  .slide-left-enter-active,
  .slide-left-leave-active {
    transition: transform 0.3s ease;
  }

  .slide-left-enter-from,
  .slide-left-leave-to {
    transform: translateX(-100%);
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .dropup {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
  }
</style>
