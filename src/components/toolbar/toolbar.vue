<!-- toolbar.vue -->

<template>
  <div
    class="flex justify-center w-11/12 mx-auto font-serif text-sm md:text-base transition-all duration-300"
  >
    <div class="flex items-center select-none">
      <CreateModal />
      <span class="mx-2 md:mx-4 cursor-default">|</span>
      <FolderModal />
      <span class="mx-2 md:mx-4 cursor-default">|</span>
      <ViewModal />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import FolderModal from './dropdown/folderModal.vue';
  import CreateModal from './dropdown/createModal.vue';
  import ViewModal from './dropdown/viewModal.vue';
</script>
