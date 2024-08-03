<!-- LeftSidebar.vue -->
<template>
  <transition name="slide-left">
    <div
      v-if="isOpen"
      class="fixed inset-y-0 left-0 z-50 w-64 shadow-lg overflow-y-auto left-sidebar rounded-lg font-serif text-sm"
      :class="{
        'custom-card-blur': uiStore.blurEnabled,
        'custom-card': !uiStore.blurEnabled
      }"
      @mouseleave="handleMouseLeave"
    >
      <div class="flex justify-between items-center px-4 py-[1.5px] bg-[#f7f4e4] dark:bg-gray-700">
        <img
          src="/dark/android-chrome-512x512.png"
          class="size-12 hidden dark:block cursor-pointer"
          @click="toggleSidebar"
        />
        <img
          src="/light/android-chrome-512x512.png"
          class="size-12 dark:hidden cursor-pointer"
          @click="toggleSidebar"
        />
        <button @click="togglePin" class="focus:outline-none">
          <Icon :icon="isPinned ? 'mdi:pin-off' : 'mdi:pin'" class="size-6 rotate-45" />
        </button>
      </div>
      <div class="bg-black dark:bg-gray-400 h-px transition-all duration-300"></div>

      <div class="p-2">
        <h2 class="font-bold mb-2 px-2 mt-2">Menu</h2>
        <router-link
          v-for="(item, index) in menuItems"
          :key="index"
          :to="item.path"
          class="flex p-2 items-center hover:bg-[#ebdfc0] dark:hover:bg-gray-700 rounded transition-colors duration-200"
          @click="handleMenuItemClick(item)"
        >
          <Icon :icon="item.icon" class="size-5 mr-2 inline-block" />
          {{ item.label }}
        </router-link>
      </div>

      <div class="p-2">
        <h2 class="font-bold mb-2 px-2">Recent Notes</h2>
        <div
          v-for="note in recentNotes"
          :key="note.id"
          @click="openNote(note.id)"
          class="p-2 hover:bg-[#ebdfc0] dark:hover:bg-gray-700 rounded cursor-pointer transition-colors duration-200"
        >
          {{ note.title }}
        </div>
      </div>

      <div v-if="authStore.isLoggedIn" class="p-4 relative">
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
          <Icon
            :icon="isUserDropupOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
            class="size-5"
          />
        </button>

        <transition name="fade">
          <div
            v-if="isUserDropupOpen"
            class="custom-card mt-2 p-2 bg-cream dark:bg-gray-700 rounded shadow-lg z-60"
          >
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {{ authStore.user?.email }}
            </p>
            <div class="border-t border-gray-200 dark:border-gray-600 pt-2">
              <button
                @click="navigateToSettings"
                class="w-full text-left p-2 hover:bg-[#ebdfc0] dark:hover:bg-gray-600 rounded transition-colors duration-200"
              >
                Settings
              </button>
              <button
                @click="confirmSignout"
                class="w-full text-left p-2 hover:bg-[#ebdfc0] dark:hover:bg-gray-600 rounded transition-colors duration-200"
              >
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { authStore, notesStore, uiStore } from "@/store/stores";
import { Icon } from "@iconify/vue";
import AlertModal from "@/components/modal/alertModal.vue";
import TrashModal from "@/components/modal/trashModal.vue";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close", "toggle", "mouseleave"]);

const router = useRouter();
const isPinned = ref(false);
const isUserDropupOpen = ref(false);
const showSignoutConfirmation = ref(false);
const isTrashModalOpen = ref(false);

const openTrash = () => {
  isTrashModalOpen.value = true;
};

const menuItems = [
  { label: "Home", path: "/", icon: "codicon:home" },
  { label: "About", path: "/about", icon: "codicon:info" },
  { label: "Settings", path: "/settings", icon: "codicon:settings" },
  { label: "Trash", path: "#", icon: "codicon:trash", action: openTrash },
];

const recentNotes = computed(() => {
  return notesStore.notes.slice(0, 5);
});

const signout = async () => {
  await authStore.logout();
  showSignoutConfirmation.value = false;
  router.push("/");
};

const togglePin = () => {
  isPinned.value = !isPinned.value;
};

const toggleSidebar = () => {
  emit("toggle");
};

const toggleUserDropup = () => {
  isUserDropupOpen.value = !isUserDropupOpen.value;
};

const openNote = (noteId: number) => {
  uiStore.openNote(noteId);
  if (!isPinned.value) {
    emit("close");
  }
};

const navigateToSettings = () => {
  router.push("/settings");
  if (!isPinned.value) {
    emit("close");
  }
};

const confirmSignout = () => {
  showSignoutConfirmation.value = true;
};

const handleMenuItemClick = (item: any) => {
  if (item.action) {
    item.action();
  } else if (!isPinned.value) {
    emit("close");
  }
};

const handleMouseLeave = () => {
  if (!isPinned.value) {
    emit("close");
  }
};

watch(
  () => props.isOpen,
  (newValue) => {
    if (!newValue && !isPinned.value) {
      emit("close");
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

.z-60 {
  z-index: 60;
}
</style>
