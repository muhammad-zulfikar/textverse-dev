<!-- toolbar.vue -->

<template>
  <div
    class="flex justify-center w-11/12 mx-auto font-serif text-sm md:text-base transition-all duration-300"
  >
    <div class="flex items-center select-none">
      <Create />
      <span class="mx-2 md:mx-4"></span>
      <Folder />
      <span class="mx-2 md:mx-4"></span>
      <View />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import Folder from './dropdown/folder.vue';
  import Create from './dropdown/create.vue';
  import View from './dropdown/view.vue';
</script>
