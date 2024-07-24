<!-- nameEditorModal.vue -->

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-40 flex items-center justify-center"
  >
    <div
      @click="closeModal"
      class="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-[2px]"
    ></div>
    <form
      @submit.prevent="handleSubmit"
      @click.stop
      class="z-50 font-serif custom-card p-5 relative flex flex-col w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3"
    >
      <h1 class="text-xl font-bold mb-4">Rename</h1>
      <input
        v-model="name"
        @focus="handleFocus"
        @blur="handleBlur"
        :placeholder="placeholder"
        class="w-full p-1 bg-transparent border-0 border-b-2 border-black dark:border-white outline-none placeholder-black dark:placeholder-white placeholder-opacity-50"
      />
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
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';

  const props = defineProps<{
    isOpen: boolean;
    name: string; // Changed from currentName to name
  }>();

  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'update', name: string): void; // Changed from 'submit' to 'update'
  }>();

  const name = ref(props.name || '');
  const placeholder = ref('Enter your username');

  const isValid = computed(() => name.value.trim().length > 0);

  const handleSubmit = () => {
    if (isValid.value) {
      emit('update', name.value); // Changed from 'submit' to 'update'
      closeModal();
    }
  };

  const closeModal = () => {
    name.value = '';
    emit('close');
  };

  const handleFocus = () => {
    placeholder.value = '';
  };

  const handleBlur = () => {
    if (name.value.trim() === '') {
      placeholder.value = 'Enter name';
    }
  };

  watch(
    () => props.name,
    (newName) => {
      name.value = newName;
    }
  );
</script>
