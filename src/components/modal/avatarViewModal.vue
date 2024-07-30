<template>
    <transition name="zoom">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 flex items-center justify-center"
      >
        <div @click="closeModal" class="absolute inset-0"></div>
        <div
          @click.stop
          class="z-50 font-serif custom-card p-5 relative flex flex-col items-center p-16"
        >
          <img
            :src="avatarUrl"
            class="w-64 h-64 rounded-full custom-card-transparent-avatar object-cover"
            alt="Avatar"
          />
        </div>
      </div>
    </transition>
  </template>
  
  <script setup lang="ts">
  import { watch } from 'vue';
  
  const props = defineProps<{
    isOpen: boolean;
    avatarUrl: string;
  }>();
  
  const emit = defineEmits<{
    (e: 'close'): void;
  }>();
  
  const closeModal = () => {
    emit('close');
  };
  
  watch(
    () => props.isOpen,
    (isOpen) => {
      document.body.classList.toggle('modal-open', isOpen);
    }
  );
  </script>