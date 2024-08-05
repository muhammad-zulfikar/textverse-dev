<template>
  <div>
    <div
      class="flex justify-between items-center p-4 h-[52px] bg-[#f7f4e4] dark:bg-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 font-serif text-sm md:text-base select-none"
    >
      <div class="relative items-center">
        <button
          @click.stop="toggleSidebar"
          @mouseenter="handleMouseEnter"
          class="outline-none navbar-logo"
        >
          <PhSidebarSimple :size="24" class="mt-1" />
        </button>
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
  import { useRouter } from 'vue-router';
  import { authStore } from '@/store/stores';
  import AlertModal from '@/components/modal/alertModal.vue';
  import LeftSidebar from '@/components/navbar/leftSidebar.vue';
  import { PhSidebarSimple } from '@phosphor-icons/vue';

  const router = useRouter();
  const showSignoutConfirmation = ref(false);
  const isSidebarOpen = ref(false);

  const signout = async () => {
    await authStore.logout();
    showSignoutConfirmation.value = false;
    router.push('/');
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

  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      openSidebar();
    }
  };

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
