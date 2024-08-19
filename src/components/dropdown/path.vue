<template>
  <Dropdown
    dropdownId="path"
    contentWidth="9rem"
    direction="down"
    position="left"
  >
    <template #label>
      <button
        class="flex items-center px-2 py-1.5 custom-card hover:bg-[#d9c698] dark:hover:bg-gray-700"
      >
        <component :is="currentIcon" :size="20" />
        <span class="flex ites-center ml-2 text-sm">
          {{ currentPath }}
        </span>
      </button>
    </template>
    <div class="px-1 space-y-1">
      <router-link
        v-for="route in availableRoutes"
        :key="route.path"
        :to="route.path"
        class="block w-full text-left text-sm p-2 rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200"
        :class="{
          'bg-[#ebdfc0] dark:bg-gray-700': currentPath === route.name,
        }"
      >
        <component
          :is="getIconForRoute(route.name as string)"
          :size="20"
          class="mr-2 inline-block"
        />
        {{ route.name }}
      </router-link>
    </div>
  </Dropdown>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { authStore } from '@/store/stores';
  import { PhTrash, PhHouse, PhGear, PhSignIn } from '@phosphor-icons/vue';
  import Dropdown from '@/components/dropdown/dropdown.vue';

  const route = useRoute();
  const router = useRouter();

  const currentPath = computed(() => route.name as string);

  const currentIcon = computed(() => {
    switch (currentPath.value) {
      case 'Home':
        return PhHouse;
      case 'Settings':
        return PhGear;
      case 'Trash':
        return PhTrash;
      case 'Sign In':
        return PhSignIn;
      default:
        return PhHouse;
    }
  });

  const availableRoutes = computed(() =>
    router.options.routes.filter(
      (route) =>
        route.name &&
        route.path !== '/:publicId' &&
        route.path !== '/about' &&
        !(route.name === 'Sign In' && authStore.isLoggedIn)
    )
  );

  const getIconForRoute = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return PhHouse;
      case 'Settings':
        return PhGear;
      case 'Trash':
        return PhTrash;
      case 'Sign In':
        return PhSignIn;
      default:
        return PhHouse;
    }
  };
</script>
