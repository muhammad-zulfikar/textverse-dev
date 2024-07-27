<!-- toolbar.vue -->

<template>
  <div
    class="flex justify-center w-11/12 mx-auto font-serif text-sm md:text-base transition-all duration-300"
  >
    <div class="flex items-center select-none">
      <Create />
      <span class="mr-4 md:mr-8 md:ml-4 cursor-default">|</span>
      <Folder />
      <span class="mr-4 md:mr-8 md:ml-4 cursor-default">|</span>
      <ViewDropdown />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import Folder from './dropdown/folder.vue';
  import Create from './dropdown/create.vue';
  import ViewDropdown from './dropdown/view.vue';
</script>
