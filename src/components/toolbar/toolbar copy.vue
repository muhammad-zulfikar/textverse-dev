<template>
  <transition name="slide-fade" mode="in-out">
    <div
      v-if="!isLoading"
      class="hidden md:flex justify-center mt-12 w-11/12 mx-auto font-serif text-sm md:text-base transition-all duration-300"
    >
      <div class="flex items-center select-none">
        <Create />
        <span class="mx-2 md:mx-4"></span>
        <Folder />
        <span class="mx-2 md:mx-4"></span>
        <View />
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
  import Folder from '@/components/dropdown/path.vue';
  import Create from '@/components/dropdown/create.vue';
  import View from '@/components/dropdown/view.vue';
  import { ref, onMounted } from 'vue';
  import { notesStore } from '@/store/stores';

  const isLoading = ref(true);

  const loadNotes = async () => {
    isLoading.value = true;
    await notesStore.loadNotes();
    setTimeout(() => {
      isLoading.value = false;
    }, 200);
  };

  onMounted(async () => {
    await loadNotes();
  });
</script>

<style scoped>
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.3s ease;
  }
  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }
</style>
