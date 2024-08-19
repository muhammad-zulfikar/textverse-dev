<!-- components/PageTitle.vue -->
<template>
  <h1 class="page-title font serif px-16 py-8">
    {{ pageTitle }}
    <span
      v-if="currentFolder && currentFolder !== 'All Notes'"
      class="folder-name"
    >
      : {{ currentFolder }}
    </span>
  </h1>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { folderStore } from '@/store/stores';

  const route = useRoute();

  const pageTitle = computed(() => {
    switch (route.name) {
      case 'Home':
        return 'Notes';
      case 'About':
        return 'About';
      case 'Settings':
        return 'Settings';
      case 'Trash':
        return 'Trash';
      case 'Sign In':
        return 'Sign In';
      default:
        return 'Notes';
    }
  });

  const currentFolder = computed(() => folderStore.currentFolder);
</script>

<style scoped>
  .page-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .folder-name {
    font-size: 18px;
    font-weight: normal;
    color: #666;
  }
</style>
