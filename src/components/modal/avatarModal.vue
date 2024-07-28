<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-40 flex items-center justify-center"
  >
    <div
      @click="closeModal"
      class="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-[2px]"
    ></div>
    <div
      @click.stop
      class="z-50 font-serif custom-card p-5 relative flex flex-col w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3"
    >
      <h1 class="text-xl font-bold mb-4">Select Avatar</h1>
      <div class="flex flex-col items-center mb-4 relative">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          class="w-32 h-32 rounded-full custom-card-transparent-avatar mb-4"
          alt="Avatar"
        />
        <div
          @dragover.prevent
          @drop.prevent="handleDrop"
          class="custom-card-border-dashed w-full h-32 md:h-52 flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 cursor-pointer"
          @click="triggerFilePicker"
        >
          <p class="text-sm">Drag & Drop your image here</p>
          <p class="text-xs">or click to select a file</p>
        </div>
        <input
          type="file"
          @change="handleFileChange"
          class="hidden"
          ref="fileInput"
          accept="image/*"
        />
      </div>
      <div class="flex justify-end mt-6">
        <button
          @click.prevent="closeModal"
          class="hover:underline dark:hover:bg-transparent outline-none mr-6 cursor-pointer text-sm"
        >
          Cancel
        </button>
        <button
          :disabled="!avatarUrl"
          @click.prevent="confirmSelection"
          class="dark:hover:bg-transparent outline-none text-sm"
        >
          Select
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { uiStore } from '@/store/stores';
import { ref, watch } from 'vue';

  const props = defineProps<{
    isOpen: boolean;
    initialAvatarUrl?: string;
  }>();

  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'select', avatarUrl: string): void;
  }>();

  const avatarUrl = ref<string | null>(null); // Initialize as null
  const fileInput = ref<HTMLInputElement | null>(null);

  const handleFileChange = (event: Event) => {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        avatarUrl.value = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event: DragEvent) => {
    const file = event.dataTransfer?.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        avatarUrl.value = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFilePicker = () => {
    fileInput.value?.click();
  };

  const confirmSelection = () => {
    if (avatarUrl.value) {
      try {
        emit('select', avatarUrl.value);
        closeModal();
      } catch (error) {
        console.error('Failed to update avatar:', error);
        uiStore.showToastMessage('Failed to update avatar')
      }
    }
  };

  const closeModal = () => {
    avatarUrl.value = null; // Reset avatarUrl on close
    emit('close');
  };

  watch(
    () => props.isOpen,
    (isOpen) => {
      document.body.classList.toggle('modal-open', isOpen);
    }
  );
</script>
