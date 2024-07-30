<!-- inputModal.vue -->
<template>
  <transition name="zoom">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 flex items-center justify-center"
    >
      <div
        @click="closeModal"
        class="absolute inset-0"
      ></div>
      <form
        @submit.prevent="handleSubmit"
        @click.stop
        class="z-50 font-serif custom-card p-5 relative flex flex-col w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3"
      >
        <h1 class="text-xl font-bold mb-4">{{ modalTitle }}</h1>
        <input
          v-model="inputValue"
          @focus="handleFocus"
          @blur="handleBlur"
          :placeholder="placeholder"
          class="w-full p-1 bg-transparent border-0 border-b-2 border-black dark:border-white outline-none placeholder-black dark:placeholder-white placeholder-opacity-50"
        />
        <span
          v-if="showCharCount"
          :class="[
            'flex justify-end font-normal text-gray-500 text-sm mt-1',
            { 'text-red-500': inputValue.length > maxLength },
          ]"
        >
          {{ inputValue.length }} / {{ maxLength }}
        </span>
        <div class="flex justify-end mt-6">
          <button
            @click.prevent="closeModal"
            class="hover:underline hover:bg-transparent dark:hover:bg-transparent outline-none mr-6 cursor-pointer"
          >
            <span class="text-sm">Cancel</span>
          </button>
          <button
            :disabled="!isValid"
            type="submit"
            :class="[
              'dark:hover:bg-transparent outline-none text-sm',
              {
                'hover:underline cursor-pointer': isValid,
                'text-gray-500': !isValid,
              },
            ]"
          >
            <span class="text-sm">Save</span>
          </button>
        </div>
      </form>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';

  const props = defineProps<{
    isOpen: boolean;
    mode: 'username' | 'folder';
    currentValue?: string;
    maxLength?: number;
  }>();

  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'update', value: string): void;
  }>();

  const inputValue = ref(props.currentValue || '');
  const placeholder = ref('Enter name');

  const modalTitle = computed(() => {
    if (props.mode === 'username') return 'Rename';
    return props.currentValue ? 'Rename Folder' : 'Create New Folder';
  });

  const showCharCount = computed(() => props.mode === 'folder');
  const maxLength = computed(() => props.maxLength || 30);

  const isValid = computed(() => {
    const trimmedLength = inputValue.value.trim().length;
    return trimmedLength > 0 && trimmedLength <= maxLength.value;
  });

  const handleSubmit = () => {
    if (isValid.value) {
      emit('update', inputValue.value);
      closeModal();
    }
  };

  const closeModal = () => {
    inputValue.value = '';
    emit('close');
  };

  const handleFocus = () => {
    placeholder.value = '';
  };

  const handleBlur = () => {
    if (inputValue.value.trim() === '') {
      placeholder.value =
        props.mode === 'username' ? 'Enter your username' : 'Enter folder name';
    }
  };

  watch(
    () => props.currentValue,
    (newValue) => {
      inputValue.value = newValue || '';
    }
  );

  watch(
    () => props.isOpen,
    (newValue) => {
      if (newValue) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    }
  );
</script>
